from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Route, RouteSchedule, RouteExecution, RouteOptimization

User = get_user_model()


class RouteSerializer(serializers.ModelSerializer):
    """
    Serializer para rotas
    """
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    collection_points_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Route
        fields = [
            'id', 'name', 'description', 'frequency', 'frequency_display',
            'status', 'status_display', 'geometry', 'estimated_duration',
            'estimated_distance', 'created_by', 'created_by_name',
            'collection_points_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_collection_points_count(self, obj):
        """
        Conta quantos pontos de coleta estão na rota
        """
        return obj.collection_points.count()
    
    def validate_estimated_distance(self, value):
        """
        Validar distância estimada
        """
        if value and value <= 0:
            raise serializers.ValidationError("Distância deve ser maior que zero.")
        return value


class RouteScheduleSerializer(serializers.ModelSerializer):
    """
    Serializer para agendamento de rotas
    """
    route_name = serializers.CharField(source='route.name', read_only=True)
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)
    
    class Meta:
        model = RouteSchedule
        fields = [
            'id', 'route', 'route_name', 'day_of_week', 'day_of_week_display',
            'start_time', 'shift', 'is_active'
        ]
        read_only_fields = ['id']
    
    def validate(self, attrs):
        """
        Validar horários
        """
        start_time = attrs.get('start_time')
        estimated_end_time = attrs.get('estimated_end_time')
        
        if start_time and estimated_end_time and start_time >= estimated_end_time:
            raise serializers.ValidationError(
                "Horário de início deve ser anterior ao horário de fim."
            )
        
        return attrs


class RouteExecutionSerializer(serializers.ModelSerializer):
    """
    Serializer para execução de rotas
    """
    route_name = serializers.CharField(source='route.name', read_only=True)
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    driver_name = serializers.CharField(source='driver.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    duration = serializers.SerializerMethodField()
    collections_count = serializers.SerializerMethodField()
    
    class Meta:
        model = RouteExecution
        fields = [
            'id', 'route', 'route_name', 'vehicle', 'vehicle_plate',
            'driver', 'driver_name', 'scheduled_date', 'scheduled_time',
            'actual_start_time', 'actual_end_time', 'status', 'status_display',
            'actual_distance', 'fuel_consumed', 'waste_collected', 'notes',
            'duration', 'collections_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_duration(self, obj):
        """
        Calcula duração da execução
        """
        if obj.actual_start_time and obj.actual_end_time:
            duration = obj.actual_end_time - obj.actual_start_time
            return str(duration)
        return None
    
    def get_collections_count(self, obj):
        """
        Conta número de coletas realizadas
        """
        return obj.collections.count()
    
    def validate(self, attrs):
        """
        Validações para execução
        """
        scheduled_date = attrs.get('scheduled_date')
        actual_start_time = attrs.get('actual_start_time')
        actual_end_time = attrs.get('actual_end_time')
        
        if actual_start_time and actual_end_time and actual_start_time >= actual_end_time:
            raise serializers.ValidationError(
                "Horário de início deve ser anterior ao horário de fim."
            )
        
        fuel_consumed = attrs.get('fuel_consumed')
        if fuel_consumed and fuel_consumed < 0:
            raise serializers.ValidationError("Combustível consumido não pode ser negativo.")
        
        waste_collected = attrs.get('waste_collected')
        if waste_collected and waste_collected < 0:
            raise serializers.ValidationError("Peso de resíduos não pode ser negativo.")
        
        return attrs


class RouteOptimizationSerializer(serializers.ModelSerializer):
    """
    Serializer para otimização de rotas
    """
    route_name = serializers.CharField(source='original_route.name', read_only=True)
    
    class Meta:
        model = RouteOptimization
        fields = [
            'id', 'original_route', 'route_name', 'optimized_geometry',
            'original_distance', 'optimized_distance', 'distance_saved',
            'original_duration', 'optimized_duration', 'algorithm_used',
            'optimization_date', 'is_applied', 'applied_date'
        ]
        read_only_fields = ['id', 'optimization_date']


class RouteDetailSerializer(RouteSerializer):
    """
    Serializer detalhado para rotas (inclui relacionamentos)
    """
    schedules = RouteScheduleSerializer(many=True, read_only=True)
    executions = RouteExecutionSerializer(many=True, read_only=True)
    optimizations = RouteOptimizationSerializer(many=True, read_only=True)
    collection_points = serializers.SerializerMethodField()
    
    class Meta(RouteSerializer.Meta):
        fields = RouteSerializer.Meta.fields + [
            'schedules', 'executions', 'optimizations', 'collection_points'
        ]
    
    def get_collection_points(self, obj):
        """
        Pontos de coleta da rota ordenados por sequência com dados completos
        """
        route_points = obj.collection_points.all().order_by('sequence_order')
        points_data = []
        
        for rp in route_points:
            point = rp.collection_point
            point_data = {
                'id': point.id,
                'name': point.name,
                'code': point.code,
                'address': point.address,
                'sequence_order': rp.sequence_order,
                'estimated_collection_time': str(rp.estimated_collection_time),
                'location': {
                    'type': 'Point',
                    'coordinates': [point.location.x, point.location.y] if point.location else None
                },
                'latitude': point.location.y if point.location else None,
                'longitude': point.location.x if point.location else None,
                'status': point.status,
                'status_display': point.get_status_display()
            }
            points_data.append(point_data)
        
        return points_data


class RouteStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de rotas
    """
    total_routes = serializers.IntegerField()
    active_routes = serializers.IntegerField()
    total_distance = serializers.FloatField()
    total_executions = serializers.IntegerField()
    completed_executions = serializers.IntegerField()
    avg_execution_time = serializers.FloatField()
    total_waste_collected = serializers.FloatField()
    by_frequency = serializers.DictField()
    by_status = serializers.DictField()


class RouteCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para criação de rotas com pontos de coleta
    """
    collection_points = serializers.ListField(
        child=serializers.DictField(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Route
        fields = [
            'name', 'description', 'frequency', 'status', 'geometry',
            'estimated_duration', 'estimated_distance', 'collection_points'
        ]
    
    def create(self, validated_data):
        """
        Criar rota com pontos de coleta associados
        """
        collection_points_data = validated_data.pop('collection_points', [])
        validated_data['created_by'] = self.context['request'].user
        
        route = Route.objects.create(**validated_data)
        
        # Associar pontos de coleta
        if collection_points_data:
            from apps.collection_points.models import CollectionPointRoute, CollectionPoint
            
            for point_data in collection_points_data:
                point_id = point_data.get('point_id')
                sequence_order = point_data.get('sequence_order', 1)
                estimated_time = point_data.get('estimated_collection_time', '00:15:00')
                
                try:
                    collection_point = CollectionPoint.objects.get(id=point_id)
                    CollectionPointRoute.objects.create(
                        collection_point=collection_point,
                        route=route,
                        sequence_order=sequence_order,
                        estimated_collection_time=estimated_time
                    )
                except CollectionPoint.DoesNotExist:
                    pass  # Ignorar pontos inválidos
        
        return route