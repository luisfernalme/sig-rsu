from django.contrib.gis.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Route(models.Model):
    """
    Modelo para representar rotas de coleta
    """
    FREQUENCY_CHOICES = [
        ('daily', 'Diária'),
        ('weekly', 'Semanal'),
        ('biweekly', 'Quinzenal'),
        ('monthly', 'Mensal'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Ativa'),
        ('inactive', 'Inativa'),
        ('maintenance', 'Em Manutenção'),
    ]
    
    name = models.CharField(max_length=100, verbose_name='Nome da Rota')
    description = models.TextField(blank=True, verbose_name='Descrição')
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES, verbose_name='Frequência')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Status')
    
    # Geometria da rota (LineString)
    geometry = models.LineStringField(verbose_name='Geometria da Rota')
    
    # Informações operacionais
    estimated_duration = models.DurationField(verbose_name='Duração Estimada')
    estimated_distance = models.FloatField(verbose_name='Distância Estimada (km)')
    
    # Metadados
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_routes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'routes'
        verbose_name = 'Rota'
        verbose_name_plural = 'Rotas'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class RouteSchedule(models.Model):
    """
    Agendamento de rotas
    """
    SHIFT_CHOICES = [
        ('morning', 'Manhã'),
        ('afternoon', 'Tarde'),
        ('night', 'Noite'),
    ]
    
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=[
        (0, 'Segunda-feira'),
        (1, 'Terça-feira'),
        (2, 'Quarta-feira'),
        (3, 'Quinta-feira'),
        (4, 'Sexta-feira'),
        (5, 'Sábado'),
        (6, 'Domingo'),
    ], verbose_name='Dia da Semana')
    start_time = models.TimeField(verbose_name='Horário de Início')
    shift = models.CharField(max_length=20, choices=SHIFT_CHOICES, verbose_name='Turno')
    is_active = models.BooleanField(default=True, verbose_name='Ativo')
    
    class Meta:
        db_table = 'route_schedules'
        verbose_name = 'Agendamento de Rota'
        verbose_name_plural = 'Agendamentos de Rotas'
        unique_together = ['route', 'day_of_week', 'start_time']
    
    def __str__(self):
        return f"{self.route.name} - {self.get_day_of_week_display()} {self.start_time}"


class RouteExecution(models.Model):
    """
    Execução de rotas
    """
    STATUS_CHOICES = [
        ('scheduled', 'Agendada'),
        ('in_progress', 'Em Andamento'),
        ('completed', 'Concluída'),
        ('cancelled', 'Cancelada'),
    ]
    
    route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='executions')
    vehicle = models.ForeignKey('vehicles.Vehicle', on_delete=models.CASCADE, related_name='route_executions')
    driver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='driven_routes')
    
    scheduled_date = models.DateField(verbose_name='Data Agendada')
    scheduled_time = models.TimeField(verbose_name='Horário Agendado')
    
    actual_start_time = models.DateTimeField(null=True, blank=True, verbose_name='Início Real')
    actual_end_time = models.DateTimeField(null=True, blank=True, verbose_name='Fim Real')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled', verbose_name='Status')
    
    # Dados coletados durante a execução
    actual_distance = models.FloatField(null=True, blank=True, verbose_name='Distância Real (km)')
    fuel_consumed = models.FloatField(null=True, blank=True, verbose_name='Combustível Consumido (L)')
    waste_collected = models.FloatField(null=True, blank=True, verbose_name='Resíduos Coletados (kg)')
    
    notes = models.TextField(blank=True, verbose_name='Observações')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'route_executions'
        verbose_name = 'Execução de Rota'
        verbose_name_plural = 'Execuções de Rotas'
        ordering = ['-scheduled_date', '-scheduled_time']
    
    def __str__(self):
        return f"{self.route.name} - {self.scheduled_date}"


class RouteOptimization(models.Model):
    """
    Otimizações de rotas calculadas
    """
    original_route = models.ForeignKey(Route, on_delete=models.CASCADE, related_name='optimizations')
    optimized_geometry = models.LineStringField(verbose_name='Geometria Otimizada')
    
    original_distance = models.FloatField(verbose_name='Distância Original (km)')
    optimized_distance = models.FloatField(verbose_name='Distância Otimizada (km)')
    distance_saved = models.FloatField(verbose_name='Distância Economizada (km)')
    
    original_duration = models.DurationField(verbose_name='Duração Original')
    optimized_duration = models.DurationField(verbose_name='Duração Otimizada')
    
    algorithm_used = models.CharField(max_length=50, verbose_name='Algoritmo Utilizado')
    optimization_date = models.DateTimeField(auto_now_add=True)
    
    is_applied = models.BooleanField(default=False, verbose_name='Aplicada')
    applied_date = models.DateTimeField(null=True, blank=True, verbose_name='Data de Aplicação')
    
    class Meta:
        db_table = 'route_optimizations'
        verbose_name = 'Otimização de Rota'
        verbose_name_plural = 'Otimizações de Rotas'
        ordering = ['-optimization_date']
    
    def __str__(self):
        return f"Otimização de {self.original_route.name} - {self.optimization_date.strftime('%d/%m/%Y')}"