from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Driver, Vehicle, VehicleMaintenance

User = get_user_model()


class DriverSerializer(serializers.ModelSerializer):
    """
    Serializer para motoristas
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    license_category_display = serializers.CharField(source='get_license_category_display', read_only=True)
    is_license_valid = serializers.ReadOnlyField()
    
    class Meta:
        model = Driver
        fields = [
            'id', 'name', 'cpf', 'phone', 'email', 'birth_date',
            'license_number', 'license_category', 'license_category_display',
            'license_expiration', 'is_license_valid', 'hire_date', 'status',
            'status_display', 'address', 'city', 'state', 'zip_code',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_cpf(self, value):
        """Validação de CPF"""
        instance = getattr(self, 'instance', None)
        if Driver.objects.filter(cpf=value).exclude(
            id=instance.id if instance else None
        ).exists():
            raise serializers.ValidationError("Já existe um motorista com este CPF.")
        return value
    
    def validate_license_number(self, value):
        """Validação de CNH"""
        instance = getattr(self, 'instance', None)
        if Driver.objects.filter(license_number=value).exclude(
            id=instance.id if instance else None
        ).exists():
            raise serializers.ValidationError("Já existe um motorista com este número de CNH.")
        return value
    
    def validate_license_expiration(self, value):
        """Validação de validade da CNH"""
        from datetime import date
        # Permitir CNH vencida ao cadastrar, mas avisar no frontend
        # if value < date.today():
        #     raise serializers.ValidationError("A CNH não pode estar vencida.")
        return value


class VehicleSerializer(serializers.ModelSerializer):
    """
    Serializer para veículos
    """
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    vehicle_type_display = serializers.CharField(source='get_vehicle_type_display', read_only=True)
    maintenance_due = serializers.SerializerMethodField()
    
    class Meta:
        model = Vehicle
        fields = [
            'id', 'license_plate', 'brand', 'model', 'year', 'vehicle_type',
            'vehicle_type_display', 'capacity_weight', 'capacity_volume', 
            'fuel_capacity', 'status', 'status_display',
            'last_maintenance', 'next_maintenance',
            'purchase_value', 'current_odometer', 'maintenance_due',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_maintenance_due(self, obj):
        """
        Verifica se a manutenção está vencida
        """
        if obj.next_maintenance:
            from datetime import date
            return obj.next_maintenance <= date.today()
        return False
    
    def validate_license_plate(self, value):
        """
        Validação personalizada para placa
        """
        if not value:
            raise serializers.ValidationError("Placa é obrigatória.")
        
        # Verificar se já existe (exceto para update)
        instance = getattr(self, 'instance', None)
        if Vehicle.objects.filter(license_plate=value).exclude(
            id=instance.id if instance else None
        ).exists():
            raise serializers.ValidationError("Já existe um veículo com esta placa.")
        
        return value.upper()


class VehicleMaintenanceSerializer(serializers.ModelSerializer):
    """
    Serializer para manutenção de veículos
    """
    vehicle_plate = serializers.CharField(source='vehicle.license_plate', read_only=True)
    maintenance_type_display = serializers.CharField(source='get_maintenance_type_display', read_only=True)
    
    class Meta:
        model = VehicleMaintenance
        fields = [
            'id', 'vehicle', 'vehicle_plate', 'maintenance_type',
            'maintenance_type_display', 'description', 'scheduled_date',
            'actual_date', 'cost', 'technician', 'workshop', 'odometer_reading',
            'is_completed', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate(self, attrs):
        """
        Validações para manutenção
        """
        scheduled_date = attrs.get('scheduled_date')
        actual_date = attrs.get('actual_date')
        
        if actual_date and scheduled_date and actual_date < scheduled_date:
            raise serializers.ValidationError(
                "Data de conclusão não pode ser anterior à data agendada."
            )
        
        cost = attrs.get('cost')
        if cost and cost < 0:
            raise serializers.ValidationError("Custo não pode ser negativo.")
        
        return attrs


class VehicleDetailSerializer(VehicleSerializer):
    """
    Serializer detalhado para veículos (inclui relacionamentos)
    """
    maintenances = VehicleMaintenanceSerializer(many=True, read_only=True)
    next_maintenance_info = serializers.SerializerMethodField()
    
    class Meta(VehicleSerializer.Meta):
        fields = VehicleSerializer.Meta.fields + [
            'maintenances', 'next_maintenance_info'
        ]
    
    def get_next_maintenance_info(self, obj):
        """
        Informações da próxima manutenção
        """
        next_maintenance = obj.maintenances.filter(
            is_completed=False
        ).order_by('scheduled_date').first()
        
        if next_maintenance:
            return VehicleMaintenanceSerializer(next_maintenance).data
        return None


class VehicleStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas de veículos
    """
    total_vehicles = serializers.IntegerField()
    active_vehicles = serializers.IntegerField()
    maintenance_due = serializers.IntegerField()
    in_maintenance = serializers.IntegerField()
    available_vehicles = serializers.IntegerField()
    by_type = serializers.DictField()
    by_status = serializers.DictField()