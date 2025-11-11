from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import RegexValidator

User = get_user_model()


class Driver(models.Model):
    """
    Modelo para motoristas
    """
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('on_leave', 'Afastado'),
        ('inactive', 'Inativo'),
    ]
    
    LICENSE_CATEGORY_CHOICES = [
        ('B', 'Categoria B'),
        ('C', 'Categoria C'),
        ('D', 'Categoria D'),
        ('E', 'Categoria E'),
    ]
    
    # Informações pessoais
    name = models.CharField(max_length=200, verbose_name='Nome Completo')
    cpf = models.CharField(
        max_length=14,
        unique=True,
        verbose_name='CPF',
        validators=[RegexValidator(regex=r'^\d{3}\.\d{3}\.\d{3}-\d{2}$', message='CPF deve estar no formato: 000.000.000-00')]
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='Telefone')
    email = models.EmailField(blank=True, verbose_name='Email')
    birth_date = models.DateField(null=True, blank=True, verbose_name='Data de Nascimento')
    
    # Habilitação
    license_number = models.CharField(max_length=20, unique=True, verbose_name='Número da CNH')
    license_category = models.CharField(max_length=2, choices=LICENSE_CATEGORY_CHOICES, verbose_name='Categoria da CNH')
    license_expiration = models.DateField(verbose_name='Validade da CNH')
    
    # Informações profissionais
    hire_date = models.DateField(verbose_name='Data de Contratação')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Status')
    
    # Endereço
    address = models.CharField(max_length=200, blank=True, verbose_name='Endereço')
    city = models.CharField(max_length=100, blank=True, verbose_name='Cidade')
    state = models.CharField(max_length=2, blank=True, verbose_name='Estado')
    zip_code = models.CharField(max_length=9, blank=True, verbose_name='CEP')
    
    # Observações
    notes = models.TextField(blank=True, verbose_name='Observações')
    
    # Metadados
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'drivers'
        verbose_name = 'Motorista'
        verbose_name_plural = 'Motoristas'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} - CNH: {self.license_number}"
    
    @property
    def is_license_valid(self):
        """Verifica se a CNH está válida"""
        from datetime import date
        return self.license_expiration > date.today()


class Vehicle(models.Model):
    """
    Modelo para veículos de coleta
    """
    TYPE_CHOICES = [
        ('truck', 'Caminhão'),
        ('compactor', 'Compactador'),
        ('pickup', 'Caminhonete'),
        ('other', 'Outro'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('maintenance', 'Em Manutenção'),
        ('inactive', 'Inativo'),
    ]
    
    # Informações básicas
    license_plate = models.CharField(max_length=10, unique=True, verbose_name='Placa')
    model = models.CharField(max_length=50, verbose_name='Modelo')
    brand = models.CharField(max_length=50, verbose_name='Marca')
    year = models.IntegerField(verbose_name='Ano')
    vehicle_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Tipo')
    
    # Capacidades
    capacity_weight = models.FloatField(verbose_name='Capacidade de Peso (kg)')
    capacity_volume = models.FloatField(verbose_name='Capacidade de Volume (m³)')
    fuel_capacity = models.FloatField(verbose_name='Capacidade do Tanque (L)')
    
    # Status e manutenção
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Status')
    last_maintenance = models.DateField(null=True, blank=True, verbose_name='Última Manutenção')
    next_maintenance = models.DateField(null=True, blank=True, verbose_name='Próxima Manutenção')
    
    # Custos
    purchase_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='Valor de Compra')
    current_odometer = models.FloatField(default=0, verbose_name='Odômetro Atual (km)')
    # Alocação atual (opcional)
    current_driver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='current_vehicle',
        verbose_name='Motorista Atual'
    )
    
    # Metadados
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vehicles'
        verbose_name = 'Veículo'
        verbose_name_plural = 'Veículos'
        ordering = ['license_plate']
    
    def __str__(self):
        return f"{self.license_plate} - {self.brand} {self.model}"


class VehicleMaintenance(models.Model):
    """
    Registro de manutenções dos veículos
    """
    TYPE_CHOICES = [
        ('preventive', 'Preventiva'),
        ('corrective', 'Corretiva'),
        ('emergency', 'Emergencial'),
    ]
    
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name='maintenances')
    maintenance_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Tipo')
    description = models.TextField(verbose_name='Descrição')
    cost = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Custo')
    
    scheduled_date = models.DateField(verbose_name='Data Agendada')
    actual_date = models.DateField(null=True, blank=True, verbose_name='Data Realizada')
    
    odometer_reading = models.FloatField(verbose_name='Leitura do Odômetro')
    technician = models.CharField(max_length=100, verbose_name='Técnico')
    workshop = models.CharField(max_length=100, blank=True, verbose_name='Oficina')
    
    is_completed = models.BooleanField(default=False, verbose_name='Concluída')
    notes = models.TextField(blank=True, verbose_name='Observações')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'vehicle_maintenances'
        verbose_name = 'Manutenção de Veículo'
        verbose_name_plural = 'Manutenções de Veículos'
        ordering = ['-scheduled_date']
    
    def __str__(self):
        return f"{self.vehicle.license_plate} - {self.get_maintenance_type_display()} - {self.scheduled_date}"