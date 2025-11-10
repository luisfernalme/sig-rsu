from rest_framework import serializers
from .models import Collection, CollectionItem
from apps.routes.models import Route
from apps.vehicles.models import Vehicle


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
    duration = serializers.ReadOnlyField()
    points_completed = serializers.ReadOnlyField()
    total_points = serializers.ReadOnlyField()
    collection_items = CollectionItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Collection
        fields = [
            'id', 'route', 'route_name', 'vehicle', 'vehicle_plate',
            'driver_name', 'status', 'scheduled_date', 'scheduled_time',
            'start_time', 'end_time', 'total_weight', 'distance_traveled',
            'fuel_consumed', 'notes', 'duration', 'points_completed',
            'total_points', 'collection_items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'start_time', 'end_time', 'created_at', 'updated_at']
    
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
    
    class Meta:
        model = Collection
        fields = [
            'route', 'vehicle', 'driver_name', 'scheduled_date',
            'scheduled_time', 'notes'
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
        
        return data
