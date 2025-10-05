from rest_framework import serializers
from datetime import date, timedelta
from django.db.models import Count, Sum, Avg
from apps.vehicles.models import Vehicle
from apps.routes.models import Route, RouteExecution
from apps.collection_points.models import CollectionPoint, CollectionRecord


class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas do dashboard
    """
    # Estatísticas gerais
    total_vehicles = serializers.IntegerField()
    active_vehicles = serializers.IntegerField()
    total_routes = serializers.IntegerField()
    active_routes = serializers.IntegerField()
    total_collection_points = serializers.IntegerField()
    full_collection_points = serializers.IntegerField()
    
    # Estatísticas do dia
    collections_today = serializers.IntegerField()
    executions_today = serializers.IntegerField()
    waste_collected_today = serializers.FloatField()
    
    # Estatísticas da semana
    collections_week = serializers.IntegerField()
    waste_collected_week = serializers.FloatField()
    distance_traveled_week = serializers.FloatField()
    
    # Alertas
    vehicles_maintenance_due = serializers.IntegerField()
    points_need_collection = serializers.IntegerField()
    overdue_executions = serializers.IntegerField()


class CollectionReportSerializer(serializers.Serializer):
    """
    Serializer para relatório de coletas
    """
    period = serializers.CharField()
    total_collections = serializers.IntegerField()
    total_weight = serializers.FloatField()
    total_volume = serializers.FloatField()
    avg_weight_per_collection = serializers.FloatField()
    collections_by_status = serializers.DictField()
    collections_by_type = serializers.DictField()
    collections_by_neighborhood = serializers.DictField()
    daily_collections = serializers.ListField()


class EfficiencyReportSerializer(serializers.Serializer):
    """
    Serializer para relatório de eficiência
    """
    period = serializers.CharField()
    total_executions = serializers.IntegerField()
    completed_executions = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    avg_execution_time = serializers.FloatField()
    total_distance = serializers.FloatField()
    total_fuel_consumed = serializers.FloatField()
    fuel_efficiency = serializers.FloatField()
    executions_by_status = serializers.DictField()
    efficiency_by_route = serializers.ListField()


class CostReportSerializer(serializers.Serializer):
    """
    Serializer para relatório de custos
    """
    period = serializers.CharField()
    total_fuel_cost = serializers.FloatField()
    total_maintenance_cost = serializers.FloatField()
    total_operational_cost = serializers.FloatField()
    cost_per_km = serializers.FloatField()
    cost_per_kg_waste = serializers.FloatField()
    costs_by_category = serializers.DictField()
    monthly_costs = serializers.ListField()


class VehiclePerformanceSerializer(serializers.Serializer):
    """
    Serializer para performance de veículos
    """
    vehicle_id = serializers.IntegerField()
    license_plate = serializers.CharField()
    total_distance = serializers.FloatField()
    total_fuel = serializers.FloatField()
    fuel_efficiency = serializers.FloatField()
    total_collections = serializers.IntegerField()
    maintenance_cost = serializers.FloatField()
    utilization_rate = serializers.FloatField()


class RoutePerformanceSerializer(serializers.Serializer):
    """
    Serializer para performance de rotas
    """
    route_id = serializers.IntegerField()
    route_name = serializers.CharField()
    total_executions = serializers.IntegerField()
    completed_executions = serializers.IntegerField()
    completion_rate = serializers.FloatField()
    avg_execution_time = serializers.FloatField()
    total_waste_collected = serializers.FloatField()
    avg_distance = serializers.FloatField()


class CollectionPointPerformanceSerializer(serializers.Serializer):
    """
    Serializer para performance de pontos de coleta
    """
    point_id = serializers.IntegerField()
    name = serializers.CharField()
    code = serializers.CharField()
    total_collections = serializers.IntegerField()
    total_weight = serializers.FloatField()
    avg_fill_level = serializers.FloatField()
    collection_frequency_actual = serializers.FloatField()
    last_collection = serializers.DateTimeField()


class WasteAnalysisSerializer(serializers.Serializer):
    """
    Serializer para análise de resíduos
    """
    period = serializers.CharField()
    total_waste_collected = serializers.FloatField()
    recyclable_waste = serializers.FloatField()
    organic_waste = serializers.FloatField()
    other_waste = serializers.FloatField()
    recycling_rate = serializers.FloatField()
    waste_by_neighborhood = serializers.DictField()
    waste_by_type = serializers.DictField()
    monthly_trend = serializers.ListField()


class EnvironmentalImpactSerializer(serializers.Serializer):
    """
    Serializer para impacto ambiental
    """
    period = serializers.CharField()
    total_fuel_consumed = serializers.FloatField()
    co2_emissions = serializers.FloatField()
    waste_diverted_landfill = serializers.FloatField()
    recycling_impact = serializers.FloatField()
    fuel_savings_optimization = serializers.FloatField()
    environmental_score = serializers.FloatField()


class ExportReportSerializer(serializers.Serializer):
    """
    Serializer para exportação de relatórios
    """
    report_type = serializers.ChoiceField(choices=[
        ('collections', 'Coletas'),
        ('efficiency', 'Eficiência'),
        ('costs', 'Custos'),
        ('vehicles', 'Veículos'),
        ('routes', 'Rotas'),
        ('waste_analysis', 'Análise de Resíduos'),
        ('environmental', 'Impacto Ambiental')
    ])
    format = serializers.ChoiceField(choices=[
        ('pdf', 'PDF'),
        ('excel', 'Excel'),
        ('csv', 'CSV')
    ])
    start_date = serializers.DateField()
    end_date = serializers.DateField()
    filters = serializers.DictField(required=False)
    
    def validate(self, attrs):
        """
        Validar datas
        """
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                "Data inicial deve ser anterior à data final."
            )
        
        if end_date and end_date > date.today():
            raise serializers.ValidationError(
                "Data final não pode ser futura."
            )
        
        return attrs


class ReportFilterSerializer(serializers.Serializer):
    """
    Serializer para filtros de relatórios
    """
    start_date = serializers.DateField(required=False)
    end_date = serializers.DateField(required=False)
    vehicle_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    route_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    collection_point_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False
    )
    neighborhoods = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    status = serializers.ListField(
        child=serializers.CharField(),
        required=False
    )
    
    def validate(self, attrs):
        """
        Validar filtros
        """
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')
        
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                "Data inicial deve ser anterior à data final."
            )
        
        # Se não informar datas, usar últimos 30 dias
        if not start_date and not end_date:
            attrs['end_date'] = date.today()
            attrs['start_date'] = date.today() - timedelta(days=30)
        elif not start_date:
            attrs['start_date'] = attrs['end_date'] - timedelta(days=30)
        elif not end_date:
            attrs['end_date'] = date.today()
        
        return attrs