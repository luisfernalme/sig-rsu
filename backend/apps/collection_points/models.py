from django.contrib.gis.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class CollectionPoint(models.Model):
    """
    Pontos de coleta de resíduos
    """
    TYPE_CHOICES = [
        ('container', 'Contêiner'),
        ('bin', 'Lixeira'),
        ('dumpster', 'Caçamba'),
        ('residential', 'Residencial'),
        ('commercial', 'Comercial'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('inactive', 'Inativo'),
        ('maintenance', 'Em Manutenção'),
        ('full', 'Cheio'),
    ]
    
    # Informações básicas
    name = models.CharField(max_length=100, verbose_name='Nome')
    code = models.CharField(max_length=20, unique=True, verbose_name='Código')
    point_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='Tipo')
    
    # Localização
    location = models.PointField(verbose_name='Localização')
    address = models.CharField(max_length=200, verbose_name='Endereço')
    neighborhood = models.CharField(max_length=100, verbose_name='Bairro')
    
    # Capacidade
    capacity_volume = models.FloatField(verbose_name='Capacidade de Volume (m³)')
    capacity_weight = models.FloatField(verbose_name='Capacidade de Peso (kg)')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Status')
    
    # Cronograma de coleta
    collection_frequency = models.CharField(max_length=20, choices=[
        ('daily', 'Diária'),
        ('weekly', 'Semanal'),
        ('biweekly', 'Quinzenal'),
        ('monthly', 'Mensal'),
    ], verbose_name='Frequência de Coleta')
    
    last_collection = models.DateTimeField(null=True, blank=True, verbose_name='Última Coleta')
    next_collection = models.DateTimeField(null=True, blank=True, verbose_name='Próxima Coleta')
    
    # Metadados
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_points')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'collection_points'
        verbose_name = 'Ponto de Coleta'
        verbose_name_plural = 'Pontos de Coleta'
        ordering = ['code']
    
    def __str__(self):
        return f"{self.code} - {self.name}"


class CollectionPointRoute(models.Model):
    """
    Associação entre pontos de coleta e rotas
    """
    collection_point = models.ForeignKey(CollectionPoint, on_delete=models.CASCADE, related_name='routes')
    route = models.ForeignKey('routes.Route', on_delete=models.CASCADE, related_name='collection_points')
    sequence_order = models.IntegerField(verbose_name='Ordem na Sequência')
    estimated_collection_time = models.DurationField(verbose_name='Tempo Estimado de Coleta')
    
    class Meta:
        db_table = 'collection_point_routes'
        verbose_name = 'Ponto na Rota'
        verbose_name_plural = 'Pontos nas Rotas'
        unique_together = ['collection_point', 'route']
        ordering = ['route', 'sequence_order']
    
    def __str__(self):
        return f"{self.collection_point.code} - {self.route.name} (#{self.sequence_order})"


class CollectionRecord(models.Model):
    """
    Registro de coletas realizadas
    """
    STATUS_CHOICES = [
        ('collected', 'Coletado'),
        ('partially_collected', 'Parcialmente Coletado'),
        ('not_collected', 'Não Coletado'),
        ('inaccessible', 'Inacessível'),
    ]
    
    collection_point = models.ForeignKey(CollectionPoint, on_delete=models.CASCADE, related_name='collections')
    route_execution = models.ForeignKey('routes.RouteExecution', on_delete=models.CASCADE, related_name='collections', null=True, blank=True)
    
    collection_date = models.DateTimeField(verbose_name='Data/Hora da Coleta')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, verbose_name='Status')
    
    # Dados coletados
    weight_collected = models.FloatField(null=True, blank=True, verbose_name='Peso Coletado (kg)')
    volume_collected = models.FloatField(null=True, blank=True, verbose_name='Volume Coletado (m³)')
    fill_level_before = models.FloatField(null=True, blank=True, verbose_name='Nível Antes (%)')
    fill_level_after = models.FloatField(null=True, blank=True, verbose_name='Nível Depois (%)')
    
    # Observações
    notes = models.TextField(blank=True, verbose_name='Observações')
    photo = models.ImageField(upload_to='collection_photos/', blank=True, null=True, verbose_name='Foto')
    
    # GPS da coleta
    collection_location = models.PointField(null=True, blank=True, verbose_name='Localização da Coleta')
    
    # Metadados
    collected_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='collections')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'collection_records'
        verbose_name = 'Registro de Coleta'
        verbose_name_plural = 'Registros de Coletas'
        ordering = ['-collection_date']
    
    def __str__(self):
        return f"{self.collection_point.code} - {self.collection_date.strftime('%d/%m/%Y %H:%M')}"


class WasteType(models.Model):
    """
    Tipos de resíduos
    """
    name = models.CharField(max_length=50, verbose_name='Nome')
    description = models.TextField(blank=True, verbose_name='Descrição')
    color = models.CharField(max_length=7, verbose_name='Cor (hex)', help_text='Ex: #FF0000')
    is_recyclable = models.BooleanField(default=False, verbose_name='Reciclável')
    is_hazardous = models.BooleanField(default=False, verbose_name='Perigoso')
    
    class Meta:
        db_table = 'waste_types'
        verbose_name = 'Tipo de Resíduo'
        verbose_name_plural = 'Tipos de Resíduos'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class CollectionPointWasteType(models.Model):
    """
    Tipos de resíduos aceitos por ponto de coleta
    """
    collection_point = models.ForeignKey(CollectionPoint, on_delete=models.CASCADE, related_name='waste_types')
    waste_type = models.ForeignKey(WasteType, on_delete=models.CASCADE, related_name='collection_points')
    is_primary = models.BooleanField(default=False, verbose_name='Tipo Principal')
    
    class Meta:
        db_table = 'collection_point_waste_types'
        verbose_name = 'Tipo de Resíduo do Ponto'
        verbose_name_plural = 'Tipos de Resíduos dos Pontos'
        unique_together = ['collection_point', 'waste_type']
    
    def __str__(self):
        return f"{self.collection_point.code} - {self.waste_type.name}"


class CollectionPointPhoto(models.Model):
    """
    Galeria de fotos dos pontos de coleta
    """
    PHOTO_TYPE_CHOICES = [
        ('location', 'Localização'),
        ('container', 'Contêiner'),
        ('before_collection', 'Antes da Coleta'),
        ('after_collection', 'Depois da Coleta'),
        ('maintenance', 'Manutenção'),
        ('damage', 'Dano/Problema'),
        ('other', 'Outro'),
    ]
    
    collection_point = models.ForeignKey(CollectionPoint, on_delete=models.CASCADE, related_name='photos')
    collection_record = models.ForeignKey(CollectionRecord, on_delete=models.CASCADE, null=True, blank=True, related_name='photos')
    
    photo = models.ImageField(upload_to='collection_point_photos/%Y/%m/', verbose_name='Foto')
    photo_type = models.CharField(max_length=20, choices=PHOTO_TYPE_CHOICES, default='other', verbose_name='Tipo de Foto')
    
    title = models.CharField(max_length=100, blank=True, verbose_name='Título')
    description = models.TextField(blank=True, verbose_name='Descrição')
    
    # Localização da foto (pode ser diferente do ponto)
    photo_location = models.PointField(null=True, blank=True, verbose_name='Localização da Foto')
    
    # Metadados
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='uploaded_photos')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_primary = models.BooleanField(default=False, verbose_name='Foto Principal')
    
    class Meta:
        db_table = 'collection_point_photos'
        verbose_name = 'Foto do Ponto de Coleta'
        verbose_name_plural = 'Fotos dos Pontos de Coleta'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.collection_point.code} - {self.photo_type} ({self.uploaded_at.strftime('%d/%m/%Y')})"