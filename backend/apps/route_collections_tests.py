"""
Testes de integração para o fluxo completo de coletas
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString, Point
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, date, time, timedelta
from decimal import Decimal

from apps.routes.models import Route, RouteExecution
from apps.vehicles.models import Vehicle, Driver
from apps.collection_points.models import CollectionPoint
from apps.collections.models import Collection, CollectionItem

User = get_user_model()


class CollectionFlowTest(TestCase):
    """Testes de integração para o fluxo completo de coletas"""
    
    def setUp(self):
        """Configuração inicial completa"""
        # Criar usuário
        self.user = User.objects.create_user(
            username='driver',
            email='driver@example.com',
            password='testpass123'
        )
        
        # Criar motorista
        self.driver = Driver.objects.create(
            name='João Motorista',
            cpf='123.456.789-00',
            license_number='12345678900',
            license_category='D',
            license_expiration=date.today() + timedelta(days=365),
            hire_date=date(2020, 1, 1),
            status='active'
        )
        
        # Criar veículo
        self.vehicle = Vehicle.objects.create(
            license_plate='ABC-1234',
            model='Caminhão Compactador',
            brand='Mercedes',
            year=2020,
            vehicle_type='compactor',
            status='active',
            capacity_weight=5000.0,
            capacity_volume=15.0
        )
        
        # Criar rota
        route_geometry = LineString([
            (-46.6333, -23.5505),
            (-46.6400, -23.5600),
            (-46.6500, -23.5700)
        ])
        
        self.route = Route.objects.create(
            name='Rota Centro',
            frequency='daily',
            status='active',
            geometry=route_geometry,
            estimated_duration=timedelta(hours=2),
            estimated_distance=15.0,
            created_by=self.user
        )
        
        # Criar pontos de coleta
        self.point1 = CollectionPoint.objects.create(
            name='Ponto 1',
            code='P1',
            point_type='container',
            location=Point(-46.6333, -23.5505),
            address='Rua 1',
            neighborhood='Centro',
            capacity_volume=10.0,
            capacity_weight=500.0,
            status='active',
            collection_frequency='daily',
            created_by=self.user
        )
        
        self.point2 = CollectionPoint.objects.create(
            name='Ponto 2',
            code='P2',
            point_type='bin',
            location=Point(-46.6400, -23.5600),
            address='Rua 2',
            neighborhood='Centro',
            capacity_volume=5.0,
            capacity_weight=250.0,
            status='active',
            collection_frequency='daily',
            created_by=self.user
        )
        
        # Criar coleta
        self.collection = Collection.objects.create(
            route=self.route,
            vehicle=self.vehicle,
            driver=self.driver,
            scheduled_date=date.today(),
            scheduled_time=time(8, 0),
            status='pending'
        )
    
    def test_complete_collection_flow(self):
        """Testa o fluxo completo de uma coleta"""
        # 1. Iniciar coleta
        self.collection.status = 'in_progress'
        self.collection.start_time = datetime.now()
        self.collection.save()
        
        self.assertEqual(self.collection.status, 'in_progress')
        self.assertIsNotNone(self.collection.start_time)
        
        # 2. Adicionar itens de coleta
        item1 = CollectionItem.objects.create(
            collection=self.collection,
            collection_point=self.point1,
            order=1
        )
        
        item2 = CollectionItem.objects.create(
            collection=self.collection,
            collection_point=self.point2,
            order=2
        )
        
        self.assertEqual(self.collection.collection_items.count(), 2)
        
        # 3. Coletar pontos
        item1.collected = True
        item1.collected_at = datetime.now()
        item1.weight = Decimal('300.0')
        item1.save()
        
        item2.collected = True
        item2.collected_at = datetime.now()
        item2.weight = Decimal('150.0')
        item2.save()
        
        # 4. Calcular totais
        total_weight = sum(
            item.weight for item in self.collection.collection_items.all()
        )
        self.collection.total_weight = total_weight
        
        # 5. Finalizar coleta
        self.collection.status = 'completed'
        self.collection.end_time = datetime.now()
        self.collection.distance_traveled = Decimal('15.5')
        self.collection.fuel_consumed = Decimal('25.0')
        self.collection.save()
        
        self.assertEqual(self.collection.status, 'completed')
        self.assertEqual(self.collection.total_weight, Decimal('450.0'))
        self.assertEqual(self.collection.points_completed, 2)
    
    def test_partial_collection(self):
        """Testa coleta parcial (nem todos os pontos coletados)"""
        # Adicionar itens
        item1 = CollectionItem.objects.create(
            collection=self.collection,
            collection_point=self.point1,
            order=1
        )
        
        item2 = CollectionItem.objects.create(
            collection=self.collection,
            collection_point=self.point2,
            order=2
        )
        
        # Coletar apenas o primeiro ponto
        item1.collected = True
        item1.collected_at = datetime.now()
        item1.weight = Decimal('300.0')
        item1.save()
        
        # Segundo ponto não coletado (inacessível)
        item2.collected = False
        item2.notes = 'Ponto inacessível devido a obra'
        item2.save()
        
        # Verificar coleta parcial
        self.assertEqual(self.collection.points_completed, 1)
        self.assertEqual(self.collection.total_points, 2)
    
    def test_collection_metrics_calculation(self):
        """Testa cálculo de métricas da coleta"""
        self.collection.start_time = datetime.now() - timedelta(hours=2)
        self.collection.end_time = datetime.now()
        self.collection.distance_traveled = Decimal('15.5')
        self.collection.fuel_consumed = Decimal('25.0')
        self.collection.total_weight = Decimal('1500.0')
        self.collection.save()
        
        # Verificar duração
        duration = self.collection.duration
        self.assertIsNotNone(duration)
        self.assertIn('2h', duration)
        
        # Verificar métricas
        self.assertEqual(self.collection.distance_traveled, Decimal('15.5'))
        self.assertEqual(self.collection.fuel_consumed, Decimal('25.0'))
    
    def test_collection_cancellation(self):
        """Testa cancelamento de coleta"""
        self.collection.status = 'cancelled'
        self.collection.notes = 'Veículo quebrou antes da coleta'
        self.collection.save()
        
        self.assertEqual(self.collection.status, 'cancelled')
        self.assertIn('quebrou', self.collection.notes)


class CollectionAPITest(TestCase):
    """Testes de API para coletas"""
    
    def setUp(self):
        """Configuração inicial"""
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Criar dados básicos
        self.driver = Driver.objects.create(
            name='Motorista API',
            cpf='999.888.777-66',
            license_number='99988877766',
            license_category='D',
            license_expiration=date.today() + timedelta(days=365),
            hire_date=date.today(),
            status='active'
        )
        
        self.vehicle = Vehicle.objects.create(
            license_plate='API-0001',
            model='Caminhão',
            brand='Volvo',
            year=2021,
            vehicle_type='truck',
            status='active'
        )
        
        route_geometry = LineString([(-46.6, -23.5), (-46.7, -23.6)])
        self.route = Route.objects.create(
            name='Rota API',
            frequency='daily',
            status='active',
            geometry=route_geometry,
            estimated_duration=timedelta(hours=2),
            estimated_distance=10.0,
            created_by=self.user
        )
    
    def test_create_collection_via_api(self):
        """Testa criação de coleta via API"""
        data = {
            'route': self.route.id,
            'vehicle': self.vehicle.id,
            'driver': self.driver.id,
            'scheduled_date': date.today().isoformat(),
            'scheduled_time': '08:00:00',
            'status': 'pending'
        }
        
        response = self.client.post('/api/collections/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Collection.objects.count(), 1)
    
    def test_list_collections(self):
        """Testa listagem de coletas"""
        # Criar coletas
        for i in range(3):
            Collection.objects.create(
                route=self.route,
                vehicle=self.vehicle,
                driver=self.driver,
                scheduled_date=date.today() + timedelta(days=i),
                scheduled_time=time(8, 0),
                status='pending'
            )
        
        response = self.client.get('/api/collections/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)
    
    def test_filter_collections_by_status(self):
        """Testa filtro de coletas por status"""
        Collection.objects.create(
            route=self.route,
            vehicle=self.vehicle,
            driver=self.driver,
            scheduled_date=date.today(),
            scheduled_time=time(8, 0),
            status='completed'
        )
        
        Collection.objects.create(
            route=self.route,
            vehicle=self.vehicle,
            driver=self.driver,
            scheduled_date=date.today(),
            scheduled_time=time(14, 0),
            status='pending'
        )
        
        response = self.client.get('/api/collections/?status=completed')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)


class RouteExecutionTest(TestCase):
    """Testes para execução de rotas"""
    
    def setUp(self):
        """Configuração inicial"""
        self.user = User.objects.create_user(
            username='executor',
            password='testpass123'
        )
        
        self.vehicle = Vehicle.objects.create(
            license_plate='EXE-1234',
            model='Caminhão',
            brand='Scania',
            year=2022,
            vehicle_type='truck',
            status='active'
        )
        
        route_geometry = LineString([(-46.6, -23.5), (-46.7, -23.6)])
        self.route = Route.objects.create(
            name='Rota Execução',
            frequency='daily',
            status='active',
            geometry=route_geometry,
            estimated_duration=timedelta(hours=3),
            estimated_distance=20.0,
            created_by=self.user
        )
        
        self.execution = RouteExecution.objects.create(
            route=self.route,
            vehicle=self.vehicle,
            driver=self.user,
            scheduled_date=date.today(),
            scheduled_time=time(9, 0),
            status='scheduled'
        )
    
    def test_route_execution_lifecycle(self):
        """Testa ciclo de vida da execução de rota"""
        # 1. Iniciar execução
        self.execution.status = 'in_progress'
        self.execution.actual_start_time = datetime.now()
        self.execution.save()
        
        self.assertEqual(self.execution.status, 'in_progress')
        
        # 2. Atualizar métricas durante execução
        self.execution.actual_distance = 18.5
        self.execution.fuel_consumed = 35.0
        self.execution.waste_collected = 2800.0
        self.execution.save()
        
        # 3. Completar execução
        self.execution.status = 'completed'
        self.execution.actual_end_time = datetime.now()
        self.execution.save()
        
        self.assertEqual(self.execution.status, 'completed')
        self.assertIsNotNone(self.execution.actual_end_time)
    
    def test_route_execution_comparison(self):
        """Testa comparação entre estimado e real"""
        self.execution.actual_distance = 22.0  # 2km a mais que estimado
        self.execution.actual_start_time = datetime.now()
        self.execution.actual_end_time = datetime.now() + timedelta(hours=3, minutes=30)
        self.execution.save()
        
        # Distância real > distância estimada
        self.assertGreater(
            self.execution.actual_distance,
            self.route.estimated_distance
        )
