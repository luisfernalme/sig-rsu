from django.db import models
from django.core.validators import MinValueValidator
from apps.routes.models import Route
from apps.vehicles.models import Vehicle, Driver
from apps.collection_points.models import CollectionPoint


class Collection(models.Model):
    """Modelo para registro de execução de coletas"""
    
    STATUS_CHOICES = [
        ('pending', 'Pendente'),
        ('in_progress', 'Em Andamento'),
        ('completed', 'Concluída'),
        ('cancelled', 'Cancelada'),
    ]
    
    # Relacionamentos
    route = models.ForeignKey(
        Route,
        on_delete=models.CASCADE,
        related_name='collections',
        verbose_name='Rota'
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='collections',
        verbose_name='Veículo'
    )
    driver = models.ForeignKey(
        Driver,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='collections',
        verbose_name='Motorista'
    )
    
    # Informações da coleta
    driver_name = models.CharField(max_length=200, blank=True, verbose_name='Nome do Motorista (legado)')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='Status'
    )
    
    # Datas e horários
    scheduled_date = models.DateField(verbose_name='Data Agendada')
    scheduled_time = models.TimeField(verbose_name='Horário Agendado')
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='Hora de Início')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='Hora de Término')
    
    # Horários reais (para coletas já realizadas)
    actual_start_time = models.TimeField(null=True, blank=True, verbose_name='Horário Real de Início')
    actual_end_time = models.TimeField(null=True, blank=True, verbose_name='Horário Real de Término')
    
    # Métricas
    total_weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Peso Total Coletado (kg)'
    )
    waste_collected_weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Peso Coletado Informado (kg)'
    )
    waste_collected_volume = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        verbose_name='Volume Coletado (m³)'
    )
    distance_traveled = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Distância Percorrida (km)'
    )
    fuel_consumed = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Combustível Consumido (L)'
    )
    
    # Observações
    notes = models.TextField(blank=True, verbose_name='Observações')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        db_table = 'route_collections'
        verbose_name = 'Coleta'
        verbose_name_plural = 'Coletas'
        ordering = ['-scheduled_date', '-scheduled_time']
    
    def __str__(self):
        return f"Coleta #{self.id} - {self.route.name} - {self.scheduled_date}"
    
    @property
    def duration(self):
        """Calcula a duração da coleta"""
        if self.start_time and self.end_time:
            delta = self.end_time - self.start_time
            hours = delta.seconds // 3600
            minutes = (delta.seconds % 3600) // 60
            return f"{hours}h {minutes}min"
        return None
    
    @property
    def points_completed(self):
        """Retorna o número de pontos coletados"""
        return self.collection_items.filter(collected=True).count()
    
    @property
    def total_points(self):
        """Retorna o número total de pontos na rota"""
        return self.collection_items.count()


class CollectionItem(models.Model):
    """Modelo para registro de coleta em pontos específicos"""
    
    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name='collection_items',
        verbose_name='Coleta'
    )
    collection_point = models.ForeignKey(
        CollectionPoint,
        on_delete=models.CASCADE,
        related_name='collection_items',
        verbose_name='Ponto de Coleta'
    )
    
    # Status da coleta no ponto
    collected = models.BooleanField(default=False, verbose_name='Coletado')
    collected_at = models.DateTimeField(null=True, blank=True, verbose_name='Coletado em')
    
    # Métricas do ponto
    weight = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name='Peso Coletado (kg)'
    )
    
    # Observações
    notes = models.TextField(blank=True, verbose_name='Observações')
    
    # Ordem na rota
    order = models.IntegerField(default=0, verbose_name='Ordem')
    
    class Meta:
        db_table = 'route_collection_items'
        verbose_name = 'Item de Coleta'
        verbose_name_plural = 'Itens de Coleta'
        ordering = ['order', 'id']
    
    def __str__(self):
        return f"{self.collection} - {self.collection_point.name}"
