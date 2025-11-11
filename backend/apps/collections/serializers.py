from rest_framework import serializers
from .models import Collection, CollectionItem
from apps.routes.models import Route
from apps.vehicles.models import Vehicle, Driver
from django.utils import timezone
from datetime import datetime, time


class CollectionItemSerializer(serializers.ModelSerializer):
    collection_point_name = serializers.CharField(source='collection_point.name', read_only=True)
    collection_point_address = serializers.CharField(source='collection_point.address', read_only=True)
    
    class Meta:
        model = CollectionItem
        fields = [
            'id', 'collection', 'collection_point', 'collection_point_name',
            'collection_point_address', 'collected', 'collected_at', 'weight',
            'notes', 'order'
        ]
        read_only_fields = ['id', 'collected_at']


class CollectionSerializer(serializers.ModelSerializer):
    route_name = serializers.CharField(source='route.name', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    driver_name_display = serializers.SerializerMethodField(read_only=True)
    duration = serializers.ReadOnlyField()
    points_completed = serializers.ReadOnlyField()
    total_points = serializers.ReadOnlyField()
    collection_items = CollectionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Collection
        fields = [
            'id', 'route', 'route_name', 'vehicle', 'vehicle_plate',
            'driver', 'driver_name', 'driver_name_display', 'status',
            'scheduled_date', 'scheduled_time', 'start_time', 'end_time',
            'actual_start_time', 'actual_end_time',
            'total_weight', 'waste_collected_weight', 'waste_collected_volume',
            'distance_traveled', 'fuel_consumed', 'notes', 'duration',
            'points_completed', 'total_points', 'collection_items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'start_time', 'end_time', 'created_at', 'updated_at']
    
    def get_driver_name_display(self, obj):
        """Retorna o nome do motorista do FK ou do campo legado"""
        if obj.driver:
            return obj.driver.name
        return obj.driver_name or "—"
    
    def validate(self, data):
        """Validações customizadas"""
        # Validar se a rota está ativa
        route = data.get('route')
        if route and route.status != 'active':
            raise serializers.ValidationError({
                'route': 'A rota selecionada não está ativa.'
            })
        
        # Validar se o veículo está disponível
        vehicle = data.get('vehicle')
        if vehicle and vehicle.status != 'active':
            raise serializers.ValidationError({
                'vehicle': 'O veículo selecionado não está disponível.'
            })
        
        # Validar motorista se fornecido
        driver = data.get('driver')
        if driver and driver.status != 'active':
            raise serializers.ValidationError({
                'driver': 'O motorista selecionado não está ativo.'
            })
        
        return data
    
    def create(self, validated_data):
        """Criar coleta e itens associados"""
        collection = Collection.objects.create(**validated_data)
        
        # Criar itens de coleta para cada ponto da rota
        route = collection.route
        # Buscar pontos através da tabela intermediária CollectionPointRoute
        from apps.collection_points.models import CollectionPointRoute
        route_points = CollectionPointRoute.objects.filter(route=route).select_related('collection_point').order_by('sequence_order')
        
        for rp in route_points:
            CollectionItem.objects.create(
                collection=collection,
                collection_point=rp.collection_point,
                order=rp.sequence_order
            )
        
        return collection


class CollectionCreateSerializer(serializers.ModelSerializer):
    """Serializer simplificado para criação de coletas"""
    collection_items = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Collection
        fields = [
            'route', 'vehicle', 'driver', 'driver_name', 'scheduled_date',
            'scheduled_time', 'actual_start_time', 'actual_end_time',
            'waste_collected_weight', 'waste_collected_volume',
            'status', 'notes', 'collection_items'
        ]
    
    def validate(self, data):
        """Validações customizadas"""
        # Validar se a rota está ativa
        route = data.get('route')
        if route and route.status != 'active':
            raise serializers.ValidationError({
                'route': 'A rota selecionada não está ativa.'
            })
        
        # Validar se o veículo está disponível
        vehicle = data.get('vehicle')
        if vehicle and vehicle.status != 'active':
            raise serializers.ValidationError({
                'vehicle': 'O veículo selecionado não está disponível.'
            })
        
        # Validar motorista se fornecido
        driver = data.get('driver')
        if driver and driver.status != 'active':
            raise serializers.ValidationError({
                'driver': 'O motorista selecionado não está ativo.'
            })
        
        return data
    
    def create(self, validated_data):
        """Criar coleta e itens associados"""
        from apps.collection_points.models import CollectionRecord
        
        collection_items_data = validated_data.pop('collection_items', None)
        
        collection = Collection.objects.create(**validated_data)
        
        # Se foram enviados dados de itens, criar com base neles
        if collection_items_data:
            total_weight = 0
            for order, item_data in enumerate(collection_items_data, start=1):
                item_weight = float(item_data.get('weight', 0))
                total_weight += item_weight
                collected = item_data.get('collected', True)
                notes = item_data.get('notes', '')
                collection_point_id = item_data.get('collection_point')
                
                # Criar CollectionItem
                CollectionItem.objects.create(
                    collection=collection,
                    collection_point_id=collection_point_id,
                    weight=item_weight,
                    collected=collected,
                    notes=notes,
                    order=order
                )
                
                # Criar CollectionRecord para histórico do ponto (apenas se foi coletado)
                if collected and collection.status == 'completed':
                    # Determinar data/hora da coleta
                    collection_datetime = None
                    if collection.actual_start_time:
                        # Combinar data agendada com hora real de início
                        collection_datetime = datetime.combine(
                            collection.scheduled_date,
                            collection.actual_start_time
                        )
                    elif collection.scheduled_time:
                        # Usar data e hora agendadas
                        collection_datetime = datetime.combine(
                            collection.scheduled_date,
                            collection.scheduled_time
                        )
                    else:
                        # Usar data agendada com horário atual
                        collection_datetime = datetime.combine(
                            collection.scheduled_date,
                            datetime.now().time()
                        )
                    
                    # Tornar timezone-aware
                    if timezone.is_naive(collection_datetime):
                        collection_datetime = timezone.make_aware(collection_datetime)
                    
                    CollectionRecord.objects.create(
                        collection_point_id=collection_point_id,
                        collection_date=collection_datetime,
                        status='collected',
                        weight_collected=item_weight,
                        notes=notes,
                        collected_by=self.context['request'].user,
                        route_execution=None  # Pode vincular RouteExecution se existir
                    )
            
            # Atualizar o peso total da coleta se não foi fornecido
            if not validated_data.get('waste_collected_weight'):
                collection.waste_collected_weight = total_weight
                collection.save(update_fields=['waste_collected_weight'])
        else:
            # Criar itens de coleta vazios para cada ponto da rota
            route = collection.route
            from apps.collection_points.models import CollectionPointRoute
            route_points = CollectionPointRoute.objects.filter(route=route).select_related('collection_point').order_by('sequence_order')
            
            for rp in route_points:
                CollectionItem.objects.create(
                    collection=collection,
                    collection_point=rp.collection_point,
                    order=rp.sequence_order
                )
        
        return collection
