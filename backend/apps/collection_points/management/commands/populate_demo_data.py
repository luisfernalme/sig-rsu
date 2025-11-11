from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point, LineString
from datetime import timedelta, datetime, date
import random

from apps.vehicles.models import Vehicle, VehicleMaintenance
from apps.routes.models import Route, RouteSchedule, RouteExecution
from apps.collection_points.models import (
    CollectionPoint, WasteType, CollectionRecord, 
    CollectionPointWasteType, CollectionPointRoute
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Popula o banco de dados com dados de demonstração'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Limpa os dados existentes antes de popular',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Limpando dados existentes...')
            self.clear_data()

        self.stdout.write('Criando dados de demonstração...')
        
        # Criar usuários
        admin_user = self.create_users()
        
        # Criar tipos de resíduos
        waste_types = self.create_waste_types()
        
        # Criar veículos
        vehicles = self.create_vehicles()
        
        # Criar pontos de coleta
        collection_points = self.create_collection_points(admin_user, waste_types)
        
        # Criar rotas
        routes = self.create_routes(admin_user, collection_points)
        
        # Criar manutenções
        self.create_maintenance_data(vehicles)
        
        # Criar execuções de rotas
        self.create_route_executions(routes, vehicles, admin_user)
        
        # Criar registros de coleta
        self.create_collection_records(collection_points, admin_user)

        self.stdout.write(
            self.style.SUCCESS('Dados de demonstração criados com sucesso!')
        )

    def clear_data(self):
        """Remove todos os dados existentes"""
        models_to_clear = [
            CollectionRecord, CollectionPointRoute, CollectionPointWasteType,
            RouteExecution, RouteSchedule, VehicleMaintenance,
            CollectionPoint, Route, Vehicle, WasteType
        ]
        
        for model in models_to_clear:
            model.objects.all().delete()

    def create_users(self):
        """Cria usuários de demonstração"""
        admin_user, created = User.objects.get_or_create(
            email='admin@residuos.com',
            defaults={
                'username': 'admin_residuos',
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'is_staff': True,
                'is_superuser': True,
                'role': 'admin'
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(f'Usuário admin criado: admin@residuos.com / admin123')

        # Criar motoristas
        drivers = []
        for i, (first, last) in enumerate([
            ('João', 'Silva'), ('Maria', 'Santos'), ('Pedro', 'Oliveira')
        ], 1):
            driver, created = User.objects.get_or_create(
                email=f'motorista{i}@residuos.com',
                defaults={
                    'username': f'motorista{i}',
                    'first_name': first,
                    'last_name': last,
                    'is_staff': False,
                    'role': 'operator'
                }
            )
            if created:
                driver.set_password('motorista123')
                driver.save()
            drivers.append(driver)

        return admin_user

    def create_waste_types(self):
        """Cria tipos de resíduos"""
        waste_types_data = [
            ('Orgânico', 'Resíduos orgânicos biodegradáveis', '#4CAF50', False, False),
            ('Reciclável', 'Materiais recicláveis (papel, plástico, metal)', '#2196F3', True, False),
            ('Vidro', 'Materiais de vidro', '#FF9800', True, False),
            ('Eletrônico', 'Equipamentos eletrônicos', '#9C27B0', True, True),
            ('Perigoso', 'Materiais perigosos e tóxicos', '#F44336', False, True),
        ]
        
        waste_types = []
        for name, desc, color, recyclable, hazardous in waste_types_data:
            waste_type, created = WasteType.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'color': color,
                    'is_recyclable': recyclable,
                    'is_hazardous': hazardous
                }
            )
            waste_types.append(waste_type)
        
        self.stdout.write(f'Criados {len(waste_types)} tipos de resíduos')
        return waste_types

    def create_vehicles(self):
        """Cria veículos de demonstração"""
        vehicles_data = [
            ('ABC-1234', 'Iveco', 'Daily', 2022, 'truck', 5000, 15, 80, 12500),
            ('DEF-5678', 'Mercedes', 'Sprinter', 2021, 'compactor', 3000, 10, 60, 8200),
            ('GHI-9012', 'Volkswagen', 'Delivery', 2023, 'truck', 4000, 12, 70, 5800),
            ('JKL-3456', 'Ford', 'Cargo', 2020, 'compactor', 3500, 11, 65, 15600),
        ]
        
        vehicles = []
        for plate, brand, model, year, v_type, cap_w, cap_v, fuel, odometer in vehicles_data:
            vehicle, created = Vehicle.objects.get_or_create(
                license_plate=plate,
                defaults={
                    'brand': brand,
                    'model': model,
                    'year': year,
                    'vehicle_type': v_type,
                    'capacity_weight': cap_w,
                    'capacity_volume': cap_v,
                    'fuel_capacity': fuel,
                    'status': 'active',
                    'current_odometer': odometer,
                    'last_maintenance': date.today() - timedelta(days=random.randint(10, 90)),
                    'next_maintenance': date.today() + timedelta(days=random.randint(30, 180)),
                }
            )
            vehicles.append(vehicle)
        
        self.stdout.write(f'Criados {len(vehicles)} veículos')
        return vehicles

    def create_collection_points(self, admin_user, waste_types):
        """Cria pontos de coleta"""
        # Coordenadas de São Paulo e região
        locations_data = [
            ('CP001', 'Centro Histórico', 'container', 'Praça da Sé, s/n', 'Centro', -46.6333, -23.5500),
            ('CP002', 'Vila Madalena', 'container', 'Rua Harmonia, 123', 'Vila Madalena', -46.6911, -23.5447),
            ('CP003', 'Ibirapuera', 'bin', 'Av. Paulista, 456', 'Bela Vista', -46.6564, -23.5629),
            ('CP004', 'Morumbi', 'dumpster', 'Av. Morumbi, 789', 'Morumbi', -46.7019, -23.6181),
            ('CP005', 'Santana', 'container', 'Rua Voluntários da Pátria, 321', 'Santana', -46.6253, -23.5033),
            ('CP006', 'Tatuapé', 'residential', 'Rua Tuiuti, 654', 'Tatuapé', -46.5764, -23.5394),
            ('CP007', 'Pinheiros', 'commercial', 'Rua dos Pinheiros, 987', 'Pinheiros', -46.6919, -23.5614),
            ('CP008', 'Butantã', 'container', 'Av. Vital Brasil, 147', 'Butantã', -46.7272, -23.5736),
        ]
        
        collection_points = []
        for code, name, p_type, address, neighborhood, lng, lat in locations_data:
            point, created = CollectionPoint.objects.get_or_create(
                code=code,
                defaults={
                    'name': name,
                    'point_type': p_type,
                    'address': address,
                    'neighborhood': neighborhood,
                    'location': Point(lng, lat),
                    'capacity_volume': random.uniform(3.0, 8.0),
                    'capacity_weight': random.randint(500, 1500),
                    'current_fill_level': random.uniform(10, 95),
                    'status': random.choice(['active', 'active', 'active', 'full']),
                    'collection_frequency': random.choice(['daily', 'daily', 'weekly']),
                    'created_by': admin_user
                }
            )
            collection_points.append(point)
            
            # Associar tipos de resíduos aos pontos
            selected_types = random.sample(waste_types, random.randint(1, 3))
            for i, waste_type in enumerate(selected_types):
                CollectionPointWasteType.objects.get_or_create(
                    collection_point=point,
                    waste_type=waste_type,
                    defaults={'is_primary': i == 0}
                )
        
        self.stdout.write(f'Criados {len(collection_points)} pontos de coleta')
        return collection_points

    def create_routes(self, admin_user, collection_points):
        """Cria rotas"""
        routes_data = [
            ('Rota Centro', 'Coleta no centro da cidade', 'daily', collection_points[:3]),
            ('Rota Zona Sul', 'Coleta na zona sul', 'daily', collection_points[3:6]),
            ('Rota Zona Norte', 'Coleta na zona norte', 'weekly', collection_points[6:]),
        ]
        
        routes = []
        for name, desc, freq, points in routes_data:
            # Criar geometria da rota conectando os pontos
            coordinates = [point.location.coords for point in points]
            geometry = LineString(coordinates)
            
            route, created = Route.objects.get_or_create(
                name=name,
                defaults={
                    'description': desc,
                    'frequency': freq,
                    'status': 'active',
                    'geometry': geometry,
                    'estimated_duration': timedelta(hours=random.randint(2, 6)),
                    'estimated_distance': random.uniform(10, 50),
                    'created_by': admin_user
                }
            )
            routes.append(route)
            
            # Associar pontos à rota
            for i, point in enumerate(points, 1):
                CollectionPointRoute.objects.get_or_create(
                    collection_point=point,
                    route=route,
                    defaults={
                        'sequence_order': i,
                        'estimated_collection_time': timedelta(minutes=random.randint(10, 30))
                    }
                )
        
        self.stdout.write(f'Criadas {len(routes)} rotas')
        return routes

    def create_maintenance_data(self, vehicles):
        """Cria registros de manutenção"""
        for vehicle in vehicles:
            # Manutenção passada
            VehicleMaintenance.objects.create(
                vehicle=vehicle,
                maintenance_type='preventive',
                description='Revisão preventiva completa',
                cost=random.uniform(300, 800),
                scheduled_date=date.today() - timedelta(days=random.randint(30, 90)),
                actual_date=date.today() - timedelta(days=random.randint(25, 85)),
                odometer_reading=vehicle.current_odometer - random.randint(1000, 5000),
                technician='João Mecânico',
                workshop='Oficina Central',
                is_completed=True,
                notes='Manutenção realizada conforme programado'
            )
        
        self.stdout.write('Dados de manutenção criados')

    def create_route_executions(self, routes, vehicles, admin_user):
        """Cria execuções de rotas"""
        drivers = User.objects.filter(email__startswith='motorista')
        
        for route in routes:
            for i in range(3):  # 3 execuções por rota
                RouteExecution.objects.create(
                    route=route,
                    vehicle=random.choice(vehicles),
                    driver=random.choice(drivers) if drivers else admin_user,
                    scheduled_date=date.today() - timedelta(days=i),
                    scheduled_time=datetime.now().time(),
                    actual_start_time=datetime.now() - timedelta(days=i, hours=2),
                    actual_end_time=datetime.now() - timedelta(days=i, hours=1),
                    status='completed',
                    actual_distance=random.uniform(15, 45),
                    fuel_consumed=random.uniform(20, 80),
                    waste_collected=random.uniform(500, 2000),
                    notes=f'Rota executada no dia {date.today() - timedelta(days=i)}'
                )
        
        self.stdout.write('Execuções de rotas criadas')

    def create_collection_records(self, collection_points, admin_user):
        """Cria registros de coleta"""
        route_executions = RouteExecution.objects.all()
        
        for execution in route_executions:
            # Pontos da rota
            route_points = execution.route.collection_points.all()
            
            for point_route in route_points:
                CollectionRecord.objects.create(
                    collection_point=point_route.collection_point,
                    route_execution=execution,
                    collection_date=execution.actual_start_time,
                    status=random.choice(['collected', 'collected', 'partially_collected']),
                    weight_collected=random.uniform(50, 300),
                    volume_collected=random.uniform(1, 5),
                    fill_level_before=random.uniform(60, 95),
                    fill_level_after=random.uniform(5, 20),
                    collected_by=execution.driver,
                    notes=f'Coleta realizada em {execution.actual_start_time.strftime("%d/%m/%Y")}'
                )
        
        self.stdout.write('Registros de coleta criados')