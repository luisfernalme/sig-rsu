"""Popula o banco com dados realistas para testes de desempenho.

Uso:
    docker compose exec -T backend python manage.py seed_data
    docker compose exec -T backend python manage.py seed_data --points 2000 --routes 400 --records 50000
    docker compose exec -T backend python manage.py seed_data --reset   # apaga os dados e recria

O comando roda em uma única transação: se falhar, nada é gravado. Se já
houver dados de uma execução anterior, ele aborta; use --reset para
apagar os dados de domínio (pontos, rotas, coletas, veículos, motoristas)
e popular novamente.

Padrão: 1.000 pontos, 200 rotas, 100 veículos, 50 motoristas e 10.000 registros de coleta.
"""
from datetime import date, datetime, time, timedelta
from random import Random

from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString, Point
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from apps.collection_points.models import (
    CollectionPoint,
    CollectionPointWasteType,
    CollectionRecord,
    WasteType,
)
from apps.collections.models import Collection, CollectionItem
from apps.routes.models import Route, RouteExecution, RouteOptimization, RouteSchedule
from apps.vehicles.models import Driver, Vehicle, VehicleMaintenance

User = get_user_model()

NEIGHBORHOODS = [
    'Centro', 'Jardim Esperanca', 'Jardim Canada', 'Bairro Santa Maria',
    'Bairro Sao Jose', 'Vila Nova', 'Bairro Alvorada', 'Bairro Floresta',
    'Bairro Industrial', 'Conjunto Habitacional I', 'Conjunto Habitacional II',
    'Residencial Parque', 'Bairro Panorama', 'Bairro Primavera',
]

STREETS = [
    'Rua das Flores', 'Rua dos Ipes', 'Av. Rio Paranaiba', 'Rua Minas Gerais',
    'Av. dos Pioneiros', 'Rua Bahia', 'Rua Goias', 'Rua Sao Paulo',
    'Av. do Campus', 'Rua da Matriz', 'Rua Joao XXIII', 'Av. Central',
    'Rua Pedro Paulo', 'Rua Antonio Carlos', 'Rua Sebastiao Lemos',
]

POINT_NAMES = [
    'Continer', 'Lixeira', 'Cacamba', 'Ecoponto', 'Ponto de Descarte',
    'Coleta Residencial', 'Ponto Comercial', 'Cisterna de Residuos',
]

WASTE_TYPES = [
    {'name': 'Residuo Organico', 'color': '#654321', 'is_recyclable': False, 'is_hazardous': False},
    {'name': 'Papel e Papelao', 'color': '#1E90FF', 'is_recyclable': True, 'is_hazardous': False},
    {'name': 'Plastico', 'color': '#FFD700', 'is_recyclable': True, 'is_hazardous': False},
    {'name': 'Vidro', 'color': '#32CD32', 'is_recyclable': True, 'is_hazardous': False},
    {'name': 'Metal', 'color': '#A9A9A9', 'is_recyclable': True, 'is_hazardous': False},
    {'name': 'Eletronicos', 'color': '#8B0000', 'is_recyclable': True, 'is_hazardous': True},
    {'name': 'Pilhas e Baterias', 'color': '#FF4500', 'is_recyclable': False, 'is_hazardous': True},
    {'name': 'Residuos de Saude', 'color': '#DC143C', 'is_recyclable': False, 'is_hazardous': True},
    {'name': 'Oleo de Cozinha', 'color': '#DAA520', 'is_recyclable': True, 'is_hazardous': False},
    {'name': 'Residuo de Construcao', 'color': '#CD853F', 'is_recyclable': False, 'is_hazardous': False},
    {'name': 'Residuo Textil', 'color': '#FF69B4', 'is_recyclable': True, 'is_hazardous': False},
    {'name': 'Residuo de Poda', 'color': '#228B22', 'is_recyclable': False, 'is_hazardous': False},
]

VEHICLE_MODELS = [
    ('Mercedes-Benz', 'Accelo 1017', 'truck'),
    ('Mercedes-Benz', 'Actros 2044', 'truck'),
    ('Volvo', 'FH 540', 'truck'),
    ('Ford', 'Cargo 1723', 'truck'),
    ('Volkswagen', 'Delivery 9.150', 'pickup'),
    ('Fiat', 'Fiorino', 'pickup'),
    ('Iveco', 'Tector 170E28', 'compactor'),
    ('Scania', 'R440', 'compactor'),
    ('MAN', 'TGX 28.460', 'truck'),
    ('Toyota', 'Hilux', 'pickup'),
]

FIRST_NAMES = [
    'Joao', 'Maria', 'Jose', 'Ana', 'Carlos', 'Paula', 'Pedro', 'Lucas',
    'Fernanda', 'Rafael', 'Juliana', 'Marcos', 'Camila', 'Bruno', 'Larissa',
    'Eduardo', 'Patricia', 'Gustavo', 'Aline', 'Felipe',
]

LAST_NAMES = [
    'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa',
    'Almeida', 'Ferreira', 'Rodrigues', 'Gomes', 'Martins', 'Rocha',
    'Carvalho', 'Ribeiro', 'Araujo', 'Barbosa', 'Dias', 'Nunes', 'Moraes',
]


class Command(BaseCommand):
    help = 'Popula o banco com dados realistas para testes de desempenho.'

    def add_arguments(self, parser):
        parser.add_argument('--points', type=int, default=1000, help='Qtd de pontos de coleta')
        parser.add_argument('--routes', type=int, default=200, help='Qtd de rotas')
        parser.add_argument('--records', type=int, default=10000, help='Qtd de registros de coleta')
        parser.add_argument('--vehicles', type=int, default=100, help='Qtd de veiculos')
        parser.add_argument('--drivers', type=int, default=50, help='Qtd de motoristas')
        parser.add_argument(
            '--reset', action='store_true',
            help='Apaga os dados de domínio existentes antes de popular (destrutivo)',
        )

    def _reset(self):
        """Remove os dados de domínio na ordem inversa das dependências."""
        self.stdout.write(self.style.WARNING('Apagando dados existentes...'))
        for model in (
            CollectionItem, Collection, CollectionRecord, RouteOptimization,
            RouteExecution, RouteSchedule, Route, CollectionPointWasteType,
            CollectionPoint, VehicleMaintenance, Vehicle, Driver,
        ):
            model.objects.all().delete()

    def handle(self, *args, **options):
        with transaction.atomic():
            if options['reset']:
                self._reset()
            elif CollectionPoint.objects.filter(code__startswith='RP-').exists():
                raise CommandError(
                    'O banco já contém dados do seed (códigos RP-*). '
                    'Use --reset para apagar e popular novamente.'
                )
            self._seed(options)

    def _seed(self, options):
        rnd = Random(42)
        n_points = options['points']
        n_routes = options['routes']
        n_records = options['records']
        n_vehicles = options['vehicles']
        n_drivers = options['drivers']

        admin, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@example.com',
                'first_name': 'Admin',
                'last_name': 'Sistema',
                'role': 'admin',
            },
        )
        if not admin.password:
            admin.set_password('admin123')
            admin.save()

        self.stdout.write('Criando tipos de residuo...')
        waste_types = [
            WasteType.objects.get_or_create(name=w['name'], defaults=w)[0]
            for w in WASTE_TYPES
        ]

        self.stdout.write('Criando %d motoristas...' % n_drivers)
        drivers = []
        for i in range(n_drivers):
            full_name = '%s %s' % (rnd.choice(FIRST_NAMES), rnd.choice(LAST_NAMES))
            cpf = '%d%d%d.%d%d%d.%d%d%d-%d%d' % tuple(rnd.randint(0, 9) for _ in range(11))
            drivers.append(Driver(
                name=full_name,
                cpf=cpf,
                phone='(%d) 9%d-%d' % (rnd.randint(11, 99), rnd.randint(1000, 9999), rnd.randint(1000, 9999)),
                email='driver%d@example.com' % i,
                birth_date=date(rnd.randint(1970, 2000), rnd.randint(1, 12), rnd.randint(1, 28)),
                license_number=str(rnd.randint(1000000000, 9999999999)),
                license_category=rnd.choice(['B', 'C', 'D', 'E']),
                license_expiration=date.today() + timedelta(days=rnd.randint(30, 1500)),
                hire_date=date(rnd.randint(2010, 2024), rnd.randint(1, 12), rnd.randint(1, 28)),
                status=rnd.choice(['active', 'active', 'active', 'on_leave']),
                city='Rio Paranaiba',
                state='MG',
            ))
        Driver.objects.bulk_create(drivers)
        drivers = list(Driver.objects.all())

        self.stdout.write('Criando %d veiculos...' % n_vehicles)
        vehicles = []
        for i in range(n_vehicles):
            brand, model, vtype = rnd.choice(VEHICLE_MODELS)
            letters = ''.join(rnd.choice('ABCDEFGHIJKLMNOP') for _ in range(3))
            plate = '%s%dJ%02d' % (letters, rnd.randint(1, 9), rnd.randint(10, 99))
            vehicles.append(Vehicle(
                license_plate=plate,
                model=model,
                brand=brand,
                year=rnd.randint(2015, 2024),
                vehicle_type=vtype,
                capacity_weight=rnd.choice([6000, 9000, 12000, 16000]),
                capacity_volume=rnd.choice([8, 12, 16, 24]),
                fuel_capacity=rnd.choice([120, 180, 250, 300]),
                status=rnd.choice(['active', 'active', 'active', 'maintenance']),
                last_maintenance=date.today() - timedelta(days=rnd.randint(15, 400)),
                next_maintenance=date.today() + timedelta(days=rnd.randint(15, 180)),
                purchase_value=rnd.randint(180000, 850000),
                current_odometer=rnd.randint(10000, 350000),
            ))
        Vehicle.objects.bulk_create(vehicles)
        vehicles = list(Vehicle.objects.all())

        self.stdout.write('Criando %d pontos de coleta...' % n_points)
        base_lat, base_lon = -19.09, -46.25
        points = []
        for i in range(n_points):
            lat = base_lat + rnd.uniform(-0.05, 0.05)
            lon = base_lon + rnd.uniform(-0.05, 0.05)
            points.append(CollectionPoint(
                name='%s %d' % (rnd.choice(POINT_NAMES), i + 1),
                code='RP-%05d' % (i + 1),
                point_type=rnd.choice(['container', 'container', 'bin', 'dumpster', 'residential', 'commercial']),
                location=Point(lon, lat, srid=4326),
                address='%s, %d' % (rnd.choice(STREETS), rnd.randint(1, 2000)),
                neighborhood=rnd.choice(NEIGHBORHOODS),
                capacity_volume=rnd.choice([1.0, 1.5, 2.0, 3.0, 5.0]),
                capacity_weight=rnd.choice([200, 300, 500, 800, 1000]),
                status=rnd.choice(['active', 'active', 'active', 'active', 'full', 'maintenance', 'inactive']),
                collection_frequency=rnd.choice(['daily', 'weekly', 'biweekly', 'monthly']),
                last_collection=timezone.now() - timedelta(days=rnd.randint(0, 10), hours=rnd.randint(0, 23)),
                next_collection=datetime.now() + timedelta(days=rnd.randint(0, 10), hours=rnd.randint(0, 23)),
                created_by=admin,
            ))
        CollectionPoint.objects.bulk_create(points, batch_size=500)
        points = list(CollectionPoint.objects.all())

        self.stdout.write('Vinculando tipos de residuo aos pontos...')
        point_waste = []
        for p in points:
            for j, wt in enumerate(rnd.sample(waste_types, rnd.randint(1, 4))):
                point_waste.append(CollectionPointWasteType(
                    collection_point=p, waste_type=wt, is_primary=(j == 0),
                ))
        CollectionPointWasteType.objects.bulk_create(point_waste, ignore_conflicts=True, batch_size=1000)

        self.stdout.write('Criando %d rotas...' % n_routes)
        routes = []
        for i in range(n_routes):
            coords = [
                (base_lon + rnd.uniform(-0.05, 0.05), base_lat + rnd.uniform(-0.05, 0.05))
                for _ in range(rnd.randint(3, 8))
            ]
            routes.append(Route(
                name='Rota %03d - %s' % (i + 1, rnd.choice(NEIGHBORHOODS)),
                description='Rota de coleta %d' % (i + 1),
                frequency=rnd.choice(['daily', 'daily', 'weekly', 'biweekly']),
                status=rnd.choice(['active', 'active', 'active', 'inactive']),
                geometry=LineString(coords, srid=4326),
                estimated_duration=timedelta(minutes=rnd.randint(30, 180)),
                estimated_distance=round(rnd.uniform(3.0, 25.0), 2),
                created_by=admin,
            ))
        Route.objects.bulk_create(routes, batch_size=500)
        routes = list(Route.objects.all())

        self.stdout.write('Criando agendamentos de rotas...')
        schedules = []
        for r in routes:
            for dow in rnd.sample(range(7), rnd.randint(1, 3)):
                schedules.append(RouteSchedule(
                    route=r,
                    day_of_week=dow,
                    start_time=time(rnd.randint(5, 9), rnd.choice([0, 15, 30, 45])),
                    shift=rnd.choice(['morning', 'afternoon', 'night']),
                    is_active=rnd.random() > 0.1,
                ))
        RouteSchedule.objects.bulk_create(schedules, ignore_conflicts=True, batch_size=1000)

        self.stdout.write('Criando execucoes de rotas...')
        executions = []
        for r in routes:
            for _ in range(rnd.randint(3, 15)):
                sched_date = date.today() - timedelta(days=rnd.randint(0, 60))
                executions.append(RouteExecution(
                    route=r,
                    vehicle=rnd.choice(vehicles),
                    driver=admin,
                    scheduled_date=sched_date,
                    scheduled_time=time(rnd.randint(5, 9), rnd.choice([0, 15, 30])),
                    actual_start_time=timezone.make_aware(datetime.combine(sched_date, time(rnd.randint(5, 9), 0))),
                    actual_end_time=timezone.make_aware(datetime.combine(sched_date, time(rnd.randint(10, 14), 0))),
                    status=rnd.choice(['completed', 'completed', 'completed', 'in_progress', 'scheduled', 'cancelled']),
                    actual_distance=round(rnd.uniform(3, 30), 2),
                    fuel_consumed=round(rnd.uniform(10, 80), 2),
                    waste_collected=round(rnd.uniform(200, 3000), 2),
                ))
        RouteExecution.objects.bulk_create(executions, batch_size=1000)
        executions = list(RouteExecution.objects.all())

        self.stdout.write('Criando %d registros de coleta...' % n_records)
        records = []
        for i in range(n_records):
            p = points[i % len(points)]
            level_before = rnd.randint(0, 100)
            records.append(CollectionRecord(
                collection_point=p,
                route_execution=rnd.choice(executions),
                collection_date=timezone.now() - timedelta(days=rnd.randint(0, 90), hours=rnd.randint(0, 23)),
                status=rnd.choice(['collected', 'collected', 'collected', 'partially_collected', 'not_collected', 'inaccessible']),
                weight_collected=round(rnd.uniform(50, 800), 2),
                volume_collected=round(rnd.uniform(0.1, 3.0), 2),
                fill_level_before=level_before,
                fill_level_after=rnd.randint(0, level_before),
                notes=rnd.choice(['', '', 'Ponto cheio', 'Acesso dificultado', 'Coleta normal']),
                collection_location=Point(
                    p.location.x + rnd.uniform(-0.001, 0.001),
                    p.location.y + rnd.uniform(-0.001, 0.001),
                    srid=4326,
                ),
                collected_by=admin,
            ))
        CollectionRecord.objects.bulk_create(records, batch_size=1000)

        self.stdout.write('Criando coletas e itens de coleta...')
        collections = []
        for i in range(n_routes):
            r = routes[i]
            v = rnd.choice(vehicles)
            d = rnd.choice(drivers) if drivers else None
            sched_date = date.today() - timedelta(days=rnd.randint(0, 60))
            start = timezone.make_aware(datetime.combine(sched_date, time(rnd.randint(5, 9), 0)))
            collections.append(Collection(
                route=r,
                vehicle=v,
                driver=d,
                driver_name=d.name if d else '',
                status=rnd.choice(['completed', 'completed', 'in_progress', 'pending', 'cancelled']),
                scheduled_date=sched_date,
                scheduled_time=time(rnd.randint(5, 9), 0),
                start_time=start,
                end_time=start + timedelta(hours=rnd.randint(1, 6)),
                actual_start_time=time(rnd.randint(5, 9), 0),
                actual_end_time=time(rnd.randint(10, 14), 0),
                total_weight=round(rnd.uniform(200, 3000), 2),
                waste_collected_weight=round(rnd.uniform(200, 3000), 2),
                waste_collected_volume=round(rnd.uniform(1, 20), 2),
                distance_traveled=round(rnd.uniform(3, 30), 2),
                fuel_consumed=round(rnd.uniform(10, 60), 2),
            ))
        Collection.objects.bulk_create(collections, batch_size=500)
        collections = list(Collection.objects.all())

        items = []
        for c in collections:
            for idx, cp in enumerate(rnd.sample(points, min(rnd.randint(5, 15), len(points)))):
                collected = rnd.random() > 0.1
                items.append(CollectionItem(
                    collection=c,
                    collection_point=cp,
                    collected=collected,
                    collected_at=c.start_time if collected else None,
                    weight=round(rnd.uniform(10, 150), 2),
                    order=idx,
                ))
        CollectionItem.objects.bulk_create(items, batch_size=1000)

        self.stdout.write('Criando otimizacoes de rota...')
        optimizations = []
        for r in routes[:50]:
            orig_d = r.estimated_distance
            optimized_d = round(orig_d * rnd.uniform(0.7, 0.95), 2)
            optimizations.append(RouteOptimization(
                original_route=r,
                optimized_geometry=r.geometry,
                original_distance=orig_d,
                optimized_distance=optimized_d,
                distance_saved=round(orig_d - optimized_d, 2),
                original_duration=r.estimated_duration,
                optimized_duration=timedelta(seconds=int(r.estimated_duration.total_seconds() * rnd.uniform(0.7, 0.95))),
                algorithm_used=rnd.choice(['Nearest Neighbor', 'Savings Algorithm', 'Genetic Algorithm']),
                is_applied=rnd.random() > 0.7,
            ))
        RouteOptimization.objects.bulk_create(optimizations, batch_size=500)

        self.stdout.write('Criando manutencoes de veiculos...')
        maintenances = []
        for v in vehicles[:n_vehicles // 2]:
            for _ in range(rnd.randint(1, 3)):
                maintenances.append(VehicleMaintenance(
                    vehicle=v,
                    maintenance_type=rnd.choice(['preventive', 'preventive', 'corrective', 'emergency']),
                    description='Manutencao programada de rotina',
                    cost=rnd.randint(200, 5000),
                    scheduled_date=date.today() - timedelta(days=rnd.randint(0, 60)),
                    actual_date=date.today() - timedelta(days=rnd.randint(0, 30)),
                    odometer_reading=rnd.randint(10000, 350000),
                    technician='Oficina %d' % rnd.randint(1, 10),
                    is_completed=True,
                ))
        VehicleMaintenance.objects.bulk_create(maintenances, batch_size=500)

        self.stdout.write(self.style.SUCCESS('Dados criados com sucesso!'))
        self.stdout.write('Pontos: %d | Rotas: %d | Registros: %d | Veiculos: %d | Motoristas: %d'
                          % (len(points), len(routes), n_records, n_vehicles, n_drivers))
