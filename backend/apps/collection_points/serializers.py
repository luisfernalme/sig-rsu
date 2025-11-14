from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    CollectionPoint, CollectionPointRoute, CollectionRecord, 
    WasteType, CollectionPointWasteType, CollectionPointPhoto
)

User = get_user_model()


class WasteTypeSerializer(serializers.ModelSerializer):
    """
    Serializer para tipos de resíduos
    """
    class Meta:
        model = WasteType
        fields = ['id', 'name', 'description', 'color', 'is_recyclable']
        read_only_fields = ['id']


class CollectionPointSerializer(serializers.ModelSerializer):
    """
    Serializer para pontos de coleta
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    type_display = serializers.CharField(source='get_point_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    frequency_display = serializers.CharField(source='get_collection_frequency_display', read_only=True)
    days_since_collection = serializers.SerializerMethodField()
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)
    
    # Campos de leitura para coordenadas
    latitude_read = serializers.SerializerMethodField()
    longitude_read = serializers.SerializerMethodField()
    # aliases legíveis
    latitude_out = serializers.SerializerMethodField()
    longitude_out = serializers.SerializerMethodField()
    
    class Meta:
        model = CollectionPoint
        fields = [
            'id', 'name', 'code', 'point_type', 'type_display', 'location',
            'latitude', 'longitude', 'latitude_read', 'longitude_read', 'latitude_out', 'longitude_out', 'address', 'neighborhood', 'capacity_volume', 
            'capacity_weight', 'status', 'status_display',
            'collection_frequency', 'frequency_display', 
            'last_collection', 'next_collection', 'days_since_collection', 
            'created_by', 'created_by_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']
        extra_kwargs = {
            'address': {'required': False, 'allow_blank': True},
            'neighborhood': {'required': False, 'allow_blank': True},
            'capacity_volume': {'required': False},
            'capacity_weight': {'required': False},
            'collection_frequency': {'required': False},
            'location': {'required': False}
        }
    
    def get_days_since_collection(self, obj):
        """
        Dias desde a última coleta
        """
        if obj.last_collection:
            from datetime import date
            delta = date.today() - obj.last_collection.date()
            return delta.days
        return None
    
    def get_latitude_read(self, obj):
        """
        Latitude do ponto
        """
        if obj.location:
            return obj.location.y
        return None
    
    def get_longitude_read(self, obj):
        """
        Longitude do ponto
        """
        if obj.location:
            return obj.location.x
        return None

    def get_latitude_out(self, obj):
        return self.get_latitude_read(obj)

    def get_longitude_out(self, obj):
        return self.get_longitude_read(obj)
    
    def validate_code(self, value):
        """
        Validar código único
        """
        instance = getattr(self, 'instance', None)
        if CollectionPoint.objects.filter(code=value).exclude(
            id=instance.id if instance else None
        ).exists():
            raise serializers.ValidationError("Já existe um ponto com este código.")
        return value.upper()
    
    def create(self, validated_data):
        """
        Criar ponto de coleta com latitude e longitude
        """
        from django.contrib.gis.geos import Point
        
        # Extrair latitude e longitude se presentes
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        
        # Se latitude e longitude foram fornecidas, criar Point
        if latitude is not None and longitude is not None:
            validated_data['location'] = Point(float(longitude), float(latitude))
        else:
            # Localização padrão se não informada
            validated_data['location'] = Point(-49.273251, -25.426954)  # Curitiba
        
        # Fornecer valores padrão para campos obrigatórios se não informados
        if 'capacity_volume' not in validated_data or validated_data['capacity_volume'] is None:
            validated_data['capacity_volume'] = 1.0
        
        if 'capacity_weight' not in validated_data or validated_data['capacity_weight'] is None:
            validated_data['capacity_weight'] = 100.0
            
        if 'address' not in validated_data or not validated_data['address']:
            validated_data['address'] = 'Endereço não informado'
            
        if 'neighborhood' not in validated_data or not validated_data['neighborhood']:
            validated_data['neighborhood'] = 'Bairro não informado'
            
        if 'collection_frequency' not in validated_data:
            validated_data['collection_frequency'] = 'daily'
        
        # Definir o usuário que criou o ponto
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """
        Atualizar ponto de coleta com latitude e longitude
        """
        from django.contrib.gis.geos import Point
        
        # Extrair latitude e longitude se presentes
        latitude = validated_data.pop('latitude', None)
        longitude = validated_data.pop('longitude', None)
        
        # Se latitude e longitude foram fornecidas, atualizar Point
        if latitude is not None and longitude is not None:
            validated_data['location'] = Point(float(longitude), float(latitude))

        # Converter GeoJSON/dict para Point, se necessário
        loc = validated_data.get('location')
        if isinstance(loc, dict):
            try:
                if loc.get('type') == 'Point' and isinstance(loc.get('coordinates'), (list, tuple)):
                    lon, lat = loc['coordinates'][0], loc['coordinates'][1]
                    validated_data['location'] = Point(float(lon), float(lat))
            except Exception:
                # Se algo vier inválido, apenas ignore e deixe validação padrão tratar
                validated_data.pop('location', None)
        
        return super().update(instance, validated_data)
    
    def to_internal_value(self, data):
        """
        Converter dados de entrada incluindo latitude e longitude
        """
        # Fazer uma cópia dos dados para não modificar o original
        data = data.copy()
        
        # Converter strings vazias para valores padrão para campos numéricos obrigatórios
        for field in ['capacity_volume', 'capacity_weight']:
            if field in data and (data[field] == '' or data[field] is None):
                if field == 'capacity_volume':
                    data[field] = 1.0  # Volume padrão: 1m³
                elif field == 'capacity_weight':
                    data[field] = 100.0  # Peso padrão: 100kg
        
        # Converter strings vazias para valores padrão para campos de texto obrigatórios
        for field in ['address', 'neighborhood']:
            if field in data and (data[field] == '' or data[field] is None):
                if field == 'address':
                    data[field] = 'Endereço não informado'
                elif field == 'neighborhood':
                    data[field] = 'Bairro não informado'
        
        return super().to_internal_value(data)

    def to_representation(self, instance):
        """
        Incluir latitude/longitude no output para compatibilidade com o frontend
        """
        rep = super().to_representation(instance)
        rep['latitude'] = self.get_latitude_read(instance)
        rep['longitude'] = self.get_longitude_read(instance)
        return rep


class CollectionPointRouteSerializer(serializers.ModelSerializer):
    """
    Serializer para associação ponto-rota
    """
    collection_point_name = serializers.CharField(source='collection_point.name', read_only=True)
    collection_point_code = serializers.CharField(source='collection_point.code', read_only=True)
    route_name = serializers.CharField(source='route.name', read_only=True)
    
    class Meta:
        model = CollectionPointRoute
        fields = [
            'id', 'collection_point', 'collection_point_name', 'collection_point_code',
            'route', 'route_name', 'sequence_order', 'estimated_collection_time'
        ]
        read_only_fields = ['id']
    
    def validate_sequence_order(self, value):
        """
        Validar ordem na sequência
        """
        if value <= 0:
            raise serializers.ValidationError("Ordem deve ser maior que zero.")
        return value


class CollectionRecordSerializer(serializers.ModelSerializer):
    """
    Serializer para registros de coleta
    """
    collection_point_name = serializers.CharField(source='collection_point.name', read_only=True)
    collection_point_code = serializers.CharField(source='collection_point.code', read_only=True)
    collected_by_name = serializers.CharField(source='collected_by.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    route_execution_info = serializers.SerializerMethodField()
    
    class Meta:
        model = CollectionRecord
        fields = [
            'id', 'collection_point', 'collection_point_name', 'collection_point_code',
            'route_execution', 'route_execution_info', 'collection_date', 'status',
            'status_display', 'weight_collected', 'volume_collected', 'fill_level_before',
            'fill_level_after', 'notes', 'photo', 'collection_location',
            'collected_by', 'collected_by_name', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'collected_by': {'read_only': True}
        }
    
    def get_route_execution_info(self, obj):
        """
        Informações da execução da rota (RouteExecution ou Collection)
        """
        try:
            # Tentar buscar de RouteExecution primeiro (sistema antigo)
            if hasattr(obj, 'route_execution') and obj.route_execution:
                return {
                    'id': obj.route_execution.id,
                    'route_name': obj.route_execution.route.name,
                    'vehicle_plate': obj.route_execution.vehicle.license_plate,
                    'driver_name': obj.route_execution.driver.get_full_name()
                }
            
            # Buscar de Collection (sistema novo) através de CollectionItem
            from apps.collections.models import CollectionItem
            collection_item = CollectionItem.objects.filter(
                collection_point=obj.collection_point,
                collection__scheduled_date=obj.collection_date.date(),
                collected=True
            ).select_related('collection__route', 'collection__vehicle', 'collection__driver').first()
            
            if collection_item and collection_item.collection:
                coll = collection_item.collection
                driver_name = coll.driver.name if coll.driver else coll.driver_name
                return {
                    'id': coll.id,
                    'route_name': coll.route.name if coll.route else '—',
                    'vehicle_plate': coll.vehicle.license_plate if coll.vehicle else '—',
                    'driver_name': driver_name or '—'
                }
        except Exception as e:
            pass
        return None
    
    def validate(self, attrs):
        """
        Validações para registro de coleta
        """
        weight = attrs.get('weight_collected')
        if weight and weight < 0:
            raise serializers.ValidationError("Peso não pode ser negativo.")
        
        volume = attrs.get('volume_collected')
        if volume and volume < 0:
            raise serializers.ValidationError("Volume não pode ser negativo.")
        
        fill_before = attrs.get('fill_level_before')
        if fill_before and (fill_before < 0 or fill_before > 100):
            raise serializers.ValidationError("Nível antes deve estar entre 0 e 100%.")
        
        fill_after = attrs.get('fill_level_after')
        if fill_after and (fill_after < 0 or fill_after > 100):
            raise serializers.ValidationError("Nível depois deve estar entre 0 e 100%.")
        
        return attrs

    def create(self, validated_data, **kwargs):
        """
        Preenche collected_by automaticamente e converte collection_location se vier como GeoJSON.
        """
        from django.contrib.gis.geos import Point

        # Definir usuário coletor se não informado
        request = self.context.get('request')
        if request and hasattr(request, 'user') and 'collected_by' not in validated_data:
            validated_data['collected_by'] = request.user

        # Converter localização da coleta caso venha como dict GeoJSON
        loc = validated_data.get('collection_location')
        if isinstance(loc, dict):
            try:
                if loc.get('type') == 'Point' and isinstance(loc.get('coordinates'), (list, tuple)):
                    lon, lat = loc['coordinates'][0], loc['coordinates'][1]
                    validated_data['collection_location'] = Point(float(lon), float(lat))
            except Exception:
                validated_data.pop('collection_location', None)

        # Incorporar quaisquer kwargs passados via serializer.save()
        if kwargs:
            validated_data.update(kwargs)

        return super().create(validated_data)

    def to_representation(self, instance):
        """
        Formata campos numéricos conforme expectativa dos testes.
        """
        rep = super().to_representation(instance)
        # Formatar peso e volume com duas casas decimais como string
        if rep.get('weight_collected') is not None:
            try:
                rep['weight_collected'] = f"{float(rep['weight_collected']):.2f}"
            except Exception:
                pass
        if rep.get('volume_collected') is not None:
            try:
                rep['volume_collected'] = f"{float(rep['volume_collected']):.2f}"
            except Exception:
                pass
        return rep


class CollectionPointWasteTypeSerializer(serializers.ModelSerializer):
    """
    Serializer para tipos de resíduos aceitos
    """
    waste_type_name = serializers.CharField(source='waste_type.name', read_only=True)
    collection_point_name = serializers.CharField(source='collection_point.name', read_only=True)
    
    class Meta:
        model = CollectionPointWasteType
        fields = [
            'id', 'collection_point', 'collection_point_name',
            'waste_type', 'waste_type_name', 'is_primary'
        ]
        read_only_fields = ['id']


class CollectionPointPhotoSerializer(serializers.ModelSerializer):
    """
    Serializer para fotos dos pontos de coleta
    """
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    photo_type_display = serializers.CharField(source='get_photo_type_display', read_only=True)
    photo_url = serializers.SerializerMethodField()
    collection_point_name = serializers.CharField(source='collection_point.name', read_only=True)
    
    class Meta:
        model = CollectionPointPhoto
        fields = [
            'id', 'collection_point', 'collection_point_name', 'collection_record',
            'photo', 'photo_url', 'photo_type', 'photo_type_display',
            'title', 'description', 'photo_location', 'uploaded_by',
            'uploaded_by_name', 'uploaded_at', 'is_primary'
        ]
        read_only_fields = ['id', 'uploaded_at', 'uploaded_by']
        extra_kwargs = {
            'collection_record': {'required': False, 'allow_null': True},
            'title': {'required': False, 'allow_blank': True},
            'description': {'required': False, 'allow_blank': True},
            'photo_location': {'required': False, 'allow_null': True},
        }
    
    def get_photo_url(self, obj):
        """
        URL completa da foto
        """
        request = self.context.get('request')
        if obj.photo and hasattr(obj.photo, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def create(self, validated_data):
        """
        Criar foto associando o usuário
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['uploaded_by'] = request.user
        return super().create(validated_data)


class CollectionPointDetailSerializer(CollectionPointSerializer):
    """
    Serializer detalhado para pontos de coleta
    """
    routes = CollectionPointRouteSerializer(many=True, read_only=True)
    collections = CollectionRecordSerializer(many=True, read_only=True)
    waste_types = serializers.SerializerMethodField()
    recent_collections = serializers.SerializerMethodField()
    photos = serializers.SerializerMethodField()
    primary_photo = serializers.SerializerMethodField()
    
    class Meta(CollectionPointSerializer.Meta):
        fields = CollectionPointSerializer.Meta.fields + [
            'routes', 'collections', 'waste_types', 'recent_collections',
            'photos', 'primary_photo'
        ]
    
    def get_waste_types(self, obj):
        """
        Tipos de resíduos aceitos
        """
        waste_types = obj.waste_types.all()
        return CollectionPointWasteTypeSerializer(waste_types, many=True).data
    
    def get_recent_collections(self, obj):
        """
        Últimas 10 coletas
        """
        recent = obj.collections.all()[:10]
        return CollectionRecordSerializer(recent, many=True, context=self.context).data
    
    def get_photos(self, obj):
        """
        Fotos do ponto de coleta
        """
        photos = obj.photos.all()[:20]  # Limitar a 20 fotos mais recentes
        return CollectionPointPhotoSerializer(photos, many=True, context=self.context).data
    
    def get_primary_photo(self, obj):
        """
        Foto principal do ponto
        """
        photo = obj.photos.filter(is_primary=True).first()
        if photo:
            return CollectionPointPhotoSerializer(photo, context=self.context).data
        # Se não houver foto principal, retornar a mais recente
        photo = obj.photos.first()
        if photo:
            return CollectionPointPhotoSerializer(photo, context=self.context).data
        return None


class CollectionPointStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de pontos de coleta
    """
    total_points = serializers.IntegerField()
    active_points = serializers.IntegerField()
    full_points = serializers.IntegerField()
    maintenance_points = serializers.IntegerField()
    total_collections = serializers.IntegerField()
    total_waste_collected = serializers.FloatField()
    by_type = serializers.DictField()
    by_status = serializers.DictField()
    by_neighborhood = serializers.DictField()



class BulkCollectionSerializer(serializers.Serializer):
    """
    Serializer para coleta em lote
    """
    collections = CollectionRecordSerializer(many=True)
    route_execution_id = serializers.IntegerField()
    
    def validate_collections(self, value):
        """
        Validar dados das coletas
        """
        if not value:
            raise serializers.ValidationError("Pelo menos uma coleta deve ser informada.")
        return value
    
    def create(self, validated_data):
        """
        Criar múltiplos registros de coleta
        """
        collections_data = validated_data['collections']
        route_execution_id = validated_data['route_execution_id']
        
        created_collections = []
        for collection_data in collections_data:
            collection_data['route_execution_id'] = route_execution_id
            collection_data['collected_by'] = self.context['request'].user
            
            serializer = CollectionRecordSerializer(data=collection_data)
            if serializer.is_valid():
                collection = serializer.save()
                created_collections.append(collection)
        
        return created_collections