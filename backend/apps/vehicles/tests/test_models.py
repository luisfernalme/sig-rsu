"""
Testes unitários para modelos de Vehicles
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from decimal import Decimal
from apps.vehicles.models import Vehicle, VehicleMaintenance, Driver

User = get_user_model()


class DriverModelTest(TestCase):
    """Testes para o modelo Driver"""
    
    def setUp(self):
        """Configuração inicial"""
        self.driver = Driver.objects.create(
            name='João da Silva',
            cpf='123.456.789-00',
            phone='(11) 98765-4321',
            email='joao@example.com',
            birth_date=date(1985, 5, 15),
            license_number='12345678900',
            license_category='D',
            license_expiration=date.today() + timedelta(days=365),
            hire_date=date(2020, 1, 15),
            status='active',
            address='Rua Teste, 123',
            city='São Paulo',
            state='SP',
            zip_code='01234-567'
        )
    
    def test_driver_creation(self):
        """Testa criação de motorista"""
        self.assertEqual(self.driver.name, 'João da Silva')
        self.assertEqual(self.driver.cpf, '123.456.789-00')
        self.assertEqual(self.driver.license_category, 'D')
        self.assertEqual(self.driver.status, 'active')
    
    def test_driver_str(self):
        """Testa representação em string"""
        expected = 'João da Silva - CNH: 12345678900'
        self.assertEqual(str(self.driver), expected)
    
    def test_unique_cpf_constraint(self):
        """Testa constraint de CPF único"""
        from django.db import IntegrityError
        
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                name='Maria Silva',
                cpf='123.456.789-00',  # CPF duplicado
                license_number='98765432100',
                license_category='C',
                license_expiration=date.today() + timedelta(days=365),
                hire_date=date(2021, 1, 1),
                status='active'
            )
    
    def test_unique_license_number_constraint(self):
        """Testa constraint de CNH única"""
        from django.db import IntegrityError
        
        with self.assertRaises(IntegrityError):
            Driver.objects.create(
                name='Pedro Santos',
                cpf='987.654.321-00',
                license_number='12345678900',  # CNH duplicada
                license_category='C',
                license_expiration=date.today() + timedelta(days=365),
                hire_date=date(2021, 1, 1),
                status='active'
            )
    
    def test_license_validity_check(self):
        """Testa verificação de validade da CNH"""
        # CNH válida
        self.assertTrue(self.driver.is_license_valid)
        
        # CNH expirada
        self.driver.license_expiration = date.today() - timedelta(days=1)
        self.driver.save()
        self.assertFalse(self.driver.is_license_valid)
    
    def test_driver_status_choices(self):
        """Testa valores válidos de status"""
        valid_statuses = ['active', 'on_leave', 'inactive']
        
        for status_value in valid_statuses:
            self.driver.status = status_value
            self.driver.save()
            self.assertEqual(self.driver.status, status_value)
    
    def test_license_category_choices(self):
        """Testa categorias válidas de CNH"""
        valid_categories = ['B', 'C', 'D', 'E']
        
        for category in valid_categories:
            self.driver.license_category = category
            self.driver.save()
            self.assertEqual(self.driver.license_category, category)


class VehicleModelTest(TestCase):
    """Testes para o modelo Vehicle"""
    
    def setUp(self):
        """Configuração inicial"""
        self.vehicle = Vehicle.objects.create(
            license_plate='ABC-1234',
            model='Caminhão Compactador',
            brand='Mercedes-Benz',
            year=2020,
            vehicle_type='compactor',
            status='active',
            capacity_weight=5000.0,
            capacity_volume=15.0,
            fuel_capacity=200.0,
            current_odometer=50000.0,
            purchase_value=Decimal('350000.00')
        )
    
    def test_vehicle_creation(self):
        """Testa criação de veículo"""
        self.assertEqual(self.vehicle.license_plate, 'ABC-1234')
        self.assertEqual(self.vehicle.brand, 'Mercedes-Benz')
        self.assertEqual(self.vehicle.vehicle_type, 'compactor')
        self.assertEqual(self.vehicle.status, 'active')
    
    def test_vehicle_str(self):
        """Testa representação em string"""
        expected = 'ABC-1234 - Mercedes-Benz Caminhão Compactador'
        self.assertEqual(str(self.vehicle), expected)
    
    def test_unique_license_plate_constraint(self):
        """Testa constraint de placa única"""
        from django.db import IntegrityError
        
        with self.assertRaises(IntegrityError):
            Vehicle.objects.create(
                license_plate='ABC-1234',  # Placa duplicada
                model='Caminhão',
                brand='Volvo',
                year=2021,
                vehicle_type='truck',
                status='active'
            )
    
    def test_vehicle_type_choices(self):
        """Testa tipos válidos de veículo"""
        valid_types = ['truck', 'compactor', 'pickup', 'other']
        
        for vehicle_type in valid_types:
            self.vehicle.vehicle_type = vehicle_type
            self.vehicle.save()
            self.assertEqual(self.vehicle.vehicle_type, vehicle_type)
    
    def test_vehicle_status_choices(self):
        """Testa valores válidos de status"""
        valid_statuses = ['active', 'maintenance', 'inactive']
        
        for status_value in valid_statuses:
            self.vehicle.status = status_value
            self.vehicle.save()
            self.assertEqual(self.vehicle.status, status_value)
    
    def test_vehicle_capacities(self):
        """Testa capacidades do veículo"""
        self.assertEqual(self.vehicle.capacity_weight, 5000.0)
        self.assertEqual(self.vehicle.capacity_volume, 15.0)
        self.assertEqual(self.vehicle.fuel_capacity, 200.0)
    
    def test_odometer_update(self):
        """Testa atualização do hodômetro"""
        initial_odometer = self.vehicle.current_odometer
        self.vehicle.current_odometer += 100.0
        self.vehicle.save()
        
        self.assertEqual(self.vehicle.current_odometer, initial_odometer + 100.0)
    
    def test_maintenance_scheduling(self):
        """Testa agendamento de manutenção"""
        self.vehicle.last_maintenance = date.today() - timedelta(days=90)
        self.vehicle.next_maintenance = date.today() + timedelta(days=90)
        self.vehicle.save()
        
        self.assertIsNotNone(self.vehicle.last_maintenance)
        self.assertIsNotNone(self.vehicle.next_maintenance)
        self.assertGreater(
            self.vehicle.next_maintenance,
            self.vehicle.last_maintenance
        )
    
    def test_current_driver_assignment(self):
        """Testa atribuição de motorista atual"""
        user = User.objects.create_user(
            username='driver1',
            password='testpass123'
        )
        
        self.vehicle.current_driver = user
        self.vehicle.save()
        
        self.assertEqual(self.vehicle.current_driver, user)


class VehicleMaintenanceModelTest(TestCase):
    """Testes para o modelo VehicleMaintenance"""
    
    def setUp(self):
        """Configuração inicial"""
        self.vehicle = Vehicle.objects.create(
            license_plate='XYZ-5678',
            model='Caminhão',
            brand='Volvo',
            year=2019,
            vehicle_type='truck',
            status='active',
            current_odometer=75000.0
        )
        
        self.maintenance = VehicleMaintenance.objects.create(
            vehicle=self.vehicle,
            maintenance_type='preventive',
            description='Troca de óleo e filtros',
            cost=Decimal('500.00'),
            scheduled_date=date.today() + timedelta(days=7),
            odometer_reading=75000.0,
            technician='Carlos Mecânico',
            workshop='Oficina Central',
            is_completed=False
        )
    
    def test_maintenance_creation(self):
        """Testa criação de registro de manutenção"""
        self.assertEqual(self.maintenance.vehicle, self.vehicle)
        self.assertEqual(self.maintenance.maintenance_type, 'preventive')
        self.assertEqual(self.maintenance.cost, Decimal('500.00'))
        self.assertFalse(self.maintenance.is_completed)
    
    def test_maintenance_str(self):
        """Testa representação em string"""
        result = str(self.maintenance)
        self.assertIn('XYZ-5678', result)
        self.assertIn('Preventiva', result)
    
    def test_maintenance_type_choices(self):
        """Testa tipos válidos de manutenção"""
        valid_types = ['preventive', 'corrective', 'emergency']
        
        for maint_type in valid_types:
            self.maintenance.maintenance_type = maint_type
            self.maintenance.save()
            self.assertEqual(self.maintenance.maintenance_type, maint_type)
    
    def test_complete_maintenance(self):
        """Testa conclusão de manutenção"""
        self.maintenance.is_completed = True
        self.maintenance.actual_date = date.today()
        self.maintenance.notes = 'Manutenção concluída sem problemas'
        self.maintenance.save()
        
        self.assertTrue(self.maintenance.is_completed)
        self.assertIsNotNone(self.maintenance.actual_date)
    
    def test_maintenance_cost_tracking(self):
        """Testa rastreamento de custos"""
        # Criar várias manutenções
        VehicleMaintenance.objects.create(
            vehicle=self.vehicle,
            maintenance_type='corrective',
            description='Reparo de suspensão',
            cost=Decimal('1500.00'),
            scheduled_date=date.today(),
            odometer_reading=75500.0,
            technician='José Mecânico',
            is_completed=True
        )
        
        total_cost = sum(
            m.cost for m in self.vehicle.maintenances.all()
        )
        
        self.assertEqual(total_cost, Decimal('2000.00'))
    
    def test_overdue_maintenance(self):
        """Testa manutenção atrasada"""
        self.maintenance.scheduled_date = date.today() - timedelta(days=7)
        self.maintenance.save()
        
        self.assertLess(self.maintenance.scheduled_date, date.today())
        self.assertFalse(self.maintenance.is_completed)


class VehicleIntegrationTest(TestCase):
    """Testes de integração entre veículos, motoristas e manutenções"""
    
    def setUp(self):
        """Configuração inicial"""
        self.driver = Driver.objects.create(
            name='Motorista Teste',
            cpf='111.222.333-44',
            license_number='11122233344',
            license_category='D',
            license_expiration=date.today() + timedelta(days=365),
            hire_date=date.today(),
            status='active'
        )
        
        self.user = User.objects.create_user(
            username='testdriver',
            password='testpass123'
        )
        
        self.vehicle = Vehicle.objects.create(
            license_plate='TEST-123',
            model='Teste',
            brand='Teste',
            year=2021,
            vehicle_type='truck',
            status='active',
            current_driver=self.user
        )
    
    def test_vehicle_driver_relationship(self):
        """Testa relacionamento entre veículo e motorista"""
        self.assertEqual(self.vehicle.current_driver, self.user)
        self.assertIn(self.vehicle, self.user.current_vehicle.all())
    
    def test_vehicle_maintenance_history(self):
        """Testa histórico de manutenções do veículo"""
        # Criar várias manutenções
        for i in range(3):
            VehicleMaintenance.objects.create(
                vehicle=self.vehicle,
                maintenance_type='preventive',
                description=f'Manutenção {i+1}',
                cost=Decimal('500.00'),
                scheduled_date=date.today() - timedelta(days=30*i),
                odometer_reading=50000.0 + (1000 * i),
                technician='Técnico',
                is_completed=True
            )
        
        maintenance_count = self.vehicle.maintenances.count()
        self.assertEqual(maintenance_count, 3)
    
    def test_vehicle_status_during_maintenance(self):
        """Testa mudança de status durante manutenção"""
        # Criar manutenção
        VehicleMaintenance.objects.create(
            vehicle=self.vehicle,
            maintenance_type='corrective',
            description='Reparo urgente',
            cost=Decimal('2000.00'),
            scheduled_date=date.today(),
            odometer_reading=50000.0,
            technician='Técnico',
            is_completed=False
        )
        
        # Mudar status do veículo
        self.vehicle.status = 'maintenance'
        self.vehicle.save()
        
        self.assertEqual(self.vehicle.status, 'maintenance')
