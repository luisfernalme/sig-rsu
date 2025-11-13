"""
Testes unitários para modelos de Routes
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import LineString, Point
from datetime import datetime, timedelta, time
from apps.routes.models import Route, RouteSchedule, RouteExecution
from apps.vehicles.models import Vehicle

User = get_user_model()


class RouteModelTest(TestCase):
    """Testes para o modelo Route"""
    
    def setUp(self):
        """Configuração inicial"""
        self.user = User.objects.create_user(
            username='routemanager',
            email='manager@example.com',
            password='testpass123'
        )
        
        # Criar uma LineString para a geometria da rota
        self.route_geometry = LineString(
            [
                (-46.6333, -23.5505),
                (-46.6400, -23.5600),
                (-46.6500, -23.5700)
            ]
        )
        
        self.route = Route.objects.create(
            name='Rota Centro',
            description='Rota de coleta no centro da cidade',
            frequency='daily',
            status='active',
            geometry=self.route_geometry,
            estimated_duration=timedelta(hours=2, minutes=30),
            estimated_distance=15.5,
            created_by=self.user
        )
    
    def test_route_creation(self):
        """Testa criação de rota"""
        self.assertEqual(self.route.name, 'Rota Centro')
        self.assertEqual(self.route.frequency, 'daily')
        self.assertEqual(self.route.status, 'active')
        self.assertIsNotNone(self.route.geometry)
    
    def test_route_str(self):
        """Testa representação em string"""
        self.assertEqual(str(self.route), 'Rota Centro')
    
    def test_route_frequency_choices(self):
        """Testa valores válidos para frequência"""
        valid_frequencies = ['daily', 'weekly', 'biweekly', 'monthly']
        
        for freq in valid_frequencies:
            self.route.frequency = freq
            self.route.save()
            self.assertEqual(self.route.frequency, freq)
    
    def test_route_status_choices(self):
        """Testa valores válidos para status"""
        valid_statuses = ['active', 'inactive', 'maintenance']
        
        for status_value in valid_statuses:
            self.route.status = status_value
            self.route.save()
            self.assertEqual(self.route.status, status_value)
    
    def test_estimated_duration(self):
        """Testa duração estimada"""
        self.assertEqual(self.route.estimated_duration, timedelta(hours=2, minutes=30))
    
    def test_estimated_distance(self):
        """Testa distância estimada"""
        self.assertEqual(self.route.estimated_distance, 15.5)


class RouteScheduleModelTest(TestCase):
    """Testes para o modelo RouteSchedule"""
    
    def setUp(self):
        """Configuração inicial"""
        self.user = User.objects.create_user(
            username='scheduler',
            password='testpass123'
        )
        
        route_geometry = LineString([(-46.6, -23.5), (-46.7, -23.6)])
        
        self.route = Route.objects.create(
            name='Rota Teste',
            frequency='weekly',
            status='active',
            geometry=route_geometry,
            estimated_duration=timedelta(hours=2),
            estimated_distance=10.0,
            created_by=self.user
        )
        
        self.schedule = RouteSchedule.objects.create(
            route=self.route,
            day_of_week=0,  # Segunda-feira
            start_time=time(8, 0),
            shift='morning',
            is_active=True
        )
    
    def test_schedule_creation(self):
        """Testa criação de agendamento"""
        self.assertEqual(self.schedule.route, self.route)
        self.assertEqual(self.schedule.day_of_week, 0)
        self.assertEqual(self.schedule.shift, 'morning')
        self.assertTrue(self.schedule.is_active)
    
    def test_schedule_str(self):
        """Testa representação em string"""
        result = str(self.schedule)
        self.assertIn('Rota Teste', result)
        self.assertIn('08:00:00', result)
    
    def test_unique_together_constraint(self):
        """Testa constraint de unicidade"""
        from django.db import IntegrityError
        
        with self.assertRaises(IntegrityError):
            RouteSchedule.objects.create(
                route=self.route,
                day_of_week=0,  # Mesmo dia
                start_time=time(8, 0),  # Mesmo horário
                shift='morning'
            )
    
    def test_shift_choices(self):
        """Testa valores válidos para turno"""
        valid_shifts = ['morning', 'afternoon', 'night']
        
        for shift in valid_shifts:
            self.schedule.shift = shift
            self.schedule.save()
            self.assertEqual(self.schedule.shift, shift)


class RouteExecutionModelTest(TestCase):
    """Testes para o modelo RouteExecution"""
    
    def setUp(self):
        """Configuração inicial"""
        self.user = User.objects.create_user(
            username='driver',
            password='testpass123'
        )
        
        route_geometry = LineString([(-46.6, -23.5), (-46.7, -23.6)])
        
        self.route = Route.objects.create(
            name='Rota Execução',
            frequency='daily',
            status='active',
            geometry=route_geometry,
            estimated_duration=timedelta(hours=2),
            estimated_distance=10.0,
            created_by=self.user
        )
        
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
        
        self.execution = RouteExecution.objects.create(
            route=self.route,
            vehicle=self.vehicle,
            driver=self.user,
            scheduled_date=datetime.now().date(),
            scheduled_time=time(8, 0),
            status='scheduled'
        )
    
    def test_execution_creation(self):
        """Testa criação de execução"""
        self.assertEqual(self.execution.route, self.route)
        self.assertEqual(self.execution.vehicle, self.vehicle)
        self.assertEqual(self.execution.driver, self.user)
        self.assertEqual(self.execution.status, 'scheduled')
    
    def test_execution_str(self):
        """Testa representação em string"""
        result = str(self.execution)
        self.assertIn('Rota Execução', result)
    
    def test_execution_status_progression(self):
        """Testa progressão de status"""
        # Iniciar execução
        self.execution.status = 'in_progress'
        self.execution.actual_start_time = datetime.now()
        self.execution.save()
        
        self.assertEqual(self.execution.status, 'in_progress')
        self.assertIsNotNone(self.execution.actual_start_time)
        
        # Completar execução
        self.execution.status = 'completed'
        self.execution.actual_end_time = datetime.now()
        self.execution.actual_distance = 10.5
        self.execution.fuel_consumed = 25.0
        self.execution.waste_collected = 2500.0
        self.execution.save()
        
        self.assertEqual(self.execution.status, 'completed')
        self.assertIsNotNone(self.execution.actual_end_time)
    
    def test_execution_metrics(self):
        """Testa métricas da execução"""
        self.execution.actual_distance = 12.5
        self.execution.fuel_consumed = 30.0
        self.execution.waste_collected = 3000.0
        self.execution.save()
        
        self.assertEqual(self.execution.actual_distance, 12.5)
        self.assertEqual(self.execution.fuel_consumed, 30.0)
        self.assertEqual(self.execution.waste_collected, 3000.0)
    
    def test_cancel_execution(self):
        """Testa cancelamento de execução"""
        self.execution.status = 'cancelled'
        self.execution.notes = 'Veículo quebrado'
        self.execution.save()
        
        self.assertEqual(self.execution.status, 'cancelled')
        self.assertIn('quebrado', self.execution.notes)
