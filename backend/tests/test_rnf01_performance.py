"""
Testes do requisito não funcional RNF-01 - Desempenho.

RNF-01: O sistema deve ter um desempenho com percentil 95 (P95) de resposta
das APIs principais abaixo de 300 ms, e a consulta geoespacial (cálculo de
rota) abaixo de 2 segundos.

Cobertura (alinhada à Tabela 5 do relatório):
- APIs principais (listagem) com P95 < 300 ms:
    GET /api/routes/, /api/collection-points/, /api/vehicles/,
    /api/drivers/, /api/collections/;
- Processamento geoespacial com P95 < 2 s:
    - criação de rota com 200 pontos de coleta (POST /api/routes/);
    - round-trip OSRM + criação da rota (consulta ao serviço OSRM para
      obter a geometria e posterior criação via POST /api/routes/).

O teste de round-trip OSRM depende do serviço público do OSRM; se ele não
estiver acessível, o teste é ignorado (skip) para não quebrar a suíte.

Limites e configurações por variáveis de ambiente:
- RNF_P95_API_MS      -> limite das APIs principais (default 300)
- RNF_P95_GEO_MS      -> limite do processamento geoespacial (default 2000)
- RNF_P95_SAMPLES     -> quantidade de amostras por medição (default 15)
- RNF_P95_WARMUP      -> requisições de aquecimento (default 1)
- RNF_API_POINTS      -> pontos de coleta no dataset das APIs (default 1000)
- RNF_API_ROUTES      -> rotas (e coletas) no dataset das APIs (default 200)
- RNF_ROUTE_POINTS    -> quantidade de pontos na criação de rota (default 200)
- RNF_OSRM_URL        -> URL base do servidor OSRM (default router.project-osrm.org)
- RNF_OSRM_TIMEOUT    -> timeout (s) das requisições ao OSRM (default 20)

O dataset das APIs principais segue a ordem de grandeza do comando
``seed_data`` usado nos testes de carga com k6 (1.000 pontos, 200 rotas),
para que o teste reflita o crescimento das consultas e não só o pipeline.

Observação: com poucas amostras (ex.: n=15) o P95 calculado corresponde à
maior amostra, o que torna a verificação conservadora.
"""
import os
import json
import time

import pytest
import requests
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString, Point
from rest_framework.test import APIClient
from datetime import date, time as dtime, timedelta

from apps.routes.models import Route
from apps.vehicles.models import Vehicle, Driver
from apps.collection_points.models import CollectionPoint, CollectionPointRoute
from apps.collections.models import Collection, CollectionItem

User = get_user_model()

# Limites do RNF-01 (ms)
API_P95_MS = float(os.environ.get('RNF_P95_API_MS', '300'))
GEO_P95_MS = float(os.environ.get('RNF_P95_GEO_MS', '2000'))
P95_SAMPLES = int(os.environ.get('RNF_P95_SAMPLES', '15'))
P95_WARMUP = int(os.environ.get('RNF_P95_WARMUP', '1'))

# Dataset das APIs principais
API_POINTS = int(os.environ.get('RNF_API_POINTS', '1000'))
API_ROUTES = int(os.environ.get('RNF_API_ROUTES', '200'))
ITEMS_PER_COLLECTION = 10

# Cenário geoespacial
ROUTE_POINTS = int(os.environ.get('RNF_ROUTE_POINTS', '200'))
OSRM_URL = os.environ.get('RNF_OSRM_URL', 'https://router.project-osrm.org').rstrip('/')
OSRM_TIMEOUT = float(os.environ.get('RNF_OSRM_TIMEOUT', '20'))


def _percentile(values, p):
    """Retorna o percentil ``p`` (0-100) de uma lista de valores."""
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = min(len(ordered) - 1, int((p / 100.0) * len(ordered)))
    return ordered[index]


def _report(label, p95, times, threshold_ms):
    """Imprime as métricas de tempo de um endpoint (visível com pytest -s)."""
    mean_ms = sum(times) / len(times) if times else 0.0
    print(
        f'  {label:<42} P95={p95:8.1f} ms | média={mean_ms:8.1f} ms | '
        f'máx={max(times):8.1f} ms | n={len(times)} | limite={threshold_ms:.0f} ms'
    )


def _measure(request_fn, samples=P95_SAMPLES, warmup=P95_WARMUP):
    """Mede o tempo de resposta de ``request_fn`` e retorna ``(p95_ms, tempos_ms)``."""
    times = []
    for i in range(warmup + samples):
        start = time.perf_counter()
        response = request_fn()
        elapsed_ms = (time.perf_counter() - start) * 1000.0
        assert response.status_code < 400, (
            f'Chamada falhou durante medição: HTTP {response.status_code}'
        )
        if i >= warmup:
            times.append(elapsed_ms)
    return _percentile(times, 95), times


def _osrm_fetch_geometry(coordinates):
    """
    Consulta o serviço OSRM e retorna a geometria GeoJSON da rota.

    ``coordinates`` deve estar no formato OSRM: "lng,lat;lng,lat;...".
    """
    url = f'{OSRM_URL}/route/v1/driving/{coordinates}?overview=full&geometries=geojson'
    response = requests.get(url, timeout=OSRM_TIMEOUT)
    response.raise_for_status()
    data = response.json()
    assert data.get('code') == 'Ok' and data.get('routes'), (
        f'OSRM não retornou rota válida: {data.get("code")}'
    )
    return data['routes'][0]['geometry']


@pytest.mark.django_db
@pytest.mark.performance
class TestMainAPIsP95:
    """APIs principais: P95 de resposta abaixo de 300 ms (RNF-01)."""

    def setup_method(self):
        """Cria um dataset representativo para as medições."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='perf_api', email='perf@example.com', password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        self.driver = Driver.objects.create(
            name='Motorista Perf',
            cpf='111.222.333-44',
            license_number='11122233344',
            license_category='D',
            license_expiration=date.today() + timedelta(days=365),
            hire_date=date(2021, 1, 1),
            status='active',
        )

        self.vehicle = Vehicle.objects.create(
            license_plate='PFX-1234',
            model='Caminhão Compactador',
            brand='Mercedes',
            year=2020,
            vehicle_type='compactor',
            status='active',
            capacity_weight=5000.0,
            capacity_volume=15.0,
        )

        points = CollectionPoint.objects.bulk_create([
            CollectionPoint(
                name=f'Ponto Perf {i}',
                code=f'PF-{i:05d}',
                point_type='container',
                location=Point(-46.6300 + (i % 50) * 0.001, -23.5500 + (i // 50) * 0.001),
                address=f'Rua {i}',
                neighborhood='Centro',
                capacity_volume=10.0,
                capacity_weight=500.0,
                status='active',
                collection_frequency='daily',
                created_by=self.user,
            )
            for i in range(API_POINTS)
        ], batch_size=500)

        routes = Route.objects.bulk_create([
            Route(
                name=f'Rota Perf {i}',
                frequency='daily',
                status='active',
                geometry=LineString([(-46.6333, -23.5505 - i * 0.0001), (-46.6500, -23.5700)]),
                estimated_duration=timedelta(hours=2),
                estimated_distance=15.0,
                created_by=self.user,
            )
            for i in range(API_ROUTES)
        ], batch_size=500)

        route_points = []
        for r_idx, route in enumerate(routes):
            for seq in range(ITEMS_PER_COLLECTION):
                point = points[(r_idx * ITEMS_PER_COLLECTION + seq) % len(points)]
                route_points.append(CollectionPointRoute(
                    collection_point=point,
                    route=route,
                    sequence_order=seq + 1,
                    estimated_collection_time=timedelta(minutes=10),
                ))
        CollectionPointRoute.objects.bulk_create(route_points, batch_size=1000)

        collections = Collection.objects.bulk_create([
            Collection(
                route=route,
                vehicle=self.vehicle,
                driver=self.driver,
                scheduled_date=date.today(),
                scheduled_time=dtime(8, 0),
                status='pending',
            )
            for route in routes
        ], batch_size=500)

        items = []
        for c_idx, collection in enumerate(collections):
            for order in range(ITEMS_PER_COLLECTION):
                point = points[(c_idx * ITEMS_PER_COLLECTION + order) % len(points)]
                items.append(CollectionItem(
                    collection=collection,
                    collection_point=point,
                    collected=order % 2 == 0,
                    order=order,
                ))
        CollectionItem.objects.bulk_create(items, batch_size=1000)

    def _assert_p95_below(self, url, threshold_ms, label):
        p95, times = _measure(lambda: self.client.get(url))
        _report(label, p95, times, threshold_ms)
        assert p95 <= threshold_ms, (
            f'{label} excedeu o limite de {threshold_ms:.0f} ms (P95={p95:.1f} ms)'
        )

    def test_routes_list_p95(self):
        self._assert_p95_below('/api/routes/', API_P95_MS, 'GET /api/routes/')

    def test_collection_points_list_p95(self):
        self._assert_p95_below(
            '/api/collection-points/', API_P95_MS, 'GET /api/collection-points/'
        )

    def test_vehicles_list_p95(self):
        self._assert_p95_below('/api/vehicles/', API_P95_MS, 'GET /api/vehicles/')

    def test_drivers_list_p95(self):
        self._assert_p95_below('/api/drivers/', API_P95_MS, 'GET /api/drivers/')

    def test_collections_list_p95(self):
        self._assert_p95_below('/api/collections/', API_P95_MS, 'GET /api/collections/')


@pytest.mark.django_db
@pytest.mark.performance
class TestGeoP95:
    """Processamento geoespacial com P95 abaixo de 2 s (RNF-01)."""

    def setup_method(self):
        """Cria um usuário e ``ROUTE_POINTS`` pontos de coleta."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='perf_geo', email='perf_geo@example.com', password='testpass123'
        )
        self.client.force_authenticate(user=self.user)

        self.points = []
        for i in range(ROUTE_POINTS):
            point = CollectionPoint.objects.create(
                name=f'Ponto Geo {i}',
                code=f'GEO-{i:04d}',
                point_type='container',
                location=Point(
                    -46.6300 + (i % 50) * 0.001,
                    -23.5500 + (i // 50) * 0.001,
                ),
                address=f'Rua Geo {i}',
                neighborhood='Centro',
                capacity_volume=10.0,
                capacity_weight=500.0,
                status='active',
                collection_frequency='daily',
                created_by=self.user,
            )
            self.points.append(point)

    def _route_payload(self, geometry):
        """Payload de criação de rota com todos os pontos de coleta."""
        points_data = [
            {
                'point_id': point.id,
                'sequence_order': i + 1,
                'estimated_collection_time': '00:15:00',
            }
            for i, point in enumerate(self.points)
        ]
        return {
            'name': 'Rota Perf Geo',
            'description': '',
            'frequency': 'daily',
            'status': 'active',
            'geometry': json.dumps(geometry),
            'estimated_duration': '02:00:00',
            'estimated_distance': 25.0,
            'collection_points': points_data,
        }

    def test_route_creation_200_points_p95(self):
        """Criação de rota com 200 pontos deve ter P95 abaixo de 2 s."""
        geometry = {
            'type': 'LineString',
            'coordinates': [[p.location.x, p.location.y] for p in self.points],
        }

        p95, times = _measure(
            lambda: self.client.post(
                '/api/routes/', self._route_payload(geometry), format='json'
            )
        )
        _report(f'Criação de rota ({ROUTE_POINTS} pontos)', p95, times, GEO_P95_MS)
        assert p95 <= GEO_P95_MS, (
            f'Criação de rota excedeu o limite de {GEO_P95_MS:.0f} ms '
            f'(P95={p95:.1f} ms)'
        )

    def test_osrm_round_trip_route_creation_p95(self):
        """Round-trip OSRM + criação da rota deve ter P95 abaixo de 2 s."""
        coordinates = ';'.join(f'{p.location.x},{p.location.y}' for p in self.points)

        def _round_trip():
            geometry = _osrm_fetch_geometry(coordinates)
            return self.client.post(
                '/api/routes/', self._route_payload(geometry), format='json'
            )

        # Verifica disponibilidade do OSRM antes de medir
        try:
            _osrm_fetch_geometry(coordinates)
        except (requests.RequestException, AssertionError):
            pytest.skip('Servidor OSRM indisponível; teste de round-trip ignorado.')

        p95, times = _measure(_round_trip)
        _report('Round-trip OSRM + criação da rota', p95, times, GEO_P95_MS)
        assert p95 <= GEO_P95_MS, (
            f'Round-trip OSRM excedeu o limite de {GEO_P95_MS:.0f} ms '
            f'(P95={p95:.1f} ms)'
        )
