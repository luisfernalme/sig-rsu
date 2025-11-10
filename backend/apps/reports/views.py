from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from django.db.models import Count, Sum, Avg, Q, F
from django.http import HttpResponse
from datetime import date, datetime, timedelta
import json
import csv
import io

from apps.vehicles.models import Vehicle, VehicleMaintenance
from apps.routes.models import Route, RouteExecution
from apps.collection_points.models import CollectionPoint, CollectionRecord
from .serializers import (
    DashboardStatsSerializer, CollectionReportSerializer, EfficiencyReportSerializer,
    CostReportSerializer, VehiclePerformanceSerializer, RoutePerformanceSerializer,
    CollectionPointPerformanceSerializer, WasteAnalysisSerializer, EnvironmentalImpactSerializer,
    ExportReportSerializer, ReportFilterSerializer
)


class ReportsViewSet(viewsets.ViewSet):
    """
    ViewSet para relatórios e estatísticas
    """
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Estatísticas para o dashboard
        """
        today = date.today()
        week_ago = today - timedelta(days=7)
        
        # Estatísticas gerais
        total_vehicles = Vehicle.objects.count()
        active_vehicles = Vehicle.objects.filter(status='active').count()
        total_routes = Route.objects.count()
        active_routes = Route.objects.filter(status='active').count()
        total_collection_points = CollectionPoint.objects.count()
        full_collection_points = CollectionPoint.objects.filter(current_fill_level__gte=80).count()
        
        # Estatísticas do dia
        collections_today = CollectionRecord.objects.filter(collection_date__date=today).count()
        executions_today = RouteExecution.objects.filter(scheduled_date=today).count()
        waste_collected_today = CollectionRecord.objects.filter(
            collection_date__date=today
        ).aggregate(
            total=Sum('weight_collected')
        )['total'] or 0
        
        # Estatísticas da semana
        collections_week = CollectionRecord.objects.filter(
            collection_date__date__gte=week_ago
        ).count()
        waste_collected_week = CollectionRecord.objects.filter(
            collection_date__date__gte=week_ago
        ).aggregate(
            total=Sum('weight_collected')
        )['total'] or 0
        distance_traveled_week = RouteExecution.objects.filter(
            scheduled_date__gte=week_ago,
            actual_distance__isnull=False
        ).aggregate(
            total=Sum('actual_distance')
        )['total'] or 0
        
        # Alertas
        vehicles_maintenance_due = Vehicle.objects.filter(
            next_maintenance__lte=today
        ).count()
        points_need_collection = CollectionPoint.objects.filter(
            Q(current_fill_level__gte=70) |
            Q(last_collection__lt=week_ago) |
            Q(last_collection__isnull=True)
        ).count()
        overdue_executions = RouteExecution.objects.filter(
            scheduled_date__lt=today,
            status='scheduled'
        ).count()
        
        stats = {
            'total_vehicles': total_vehicles,
            'active_vehicles': active_vehicles,
            'total_routes': total_routes,
            'active_routes': active_routes,
            'total_collection_points': total_collection_points,
            'full_collection_points': full_collection_points,
            'collections_today': collections_today,
            'executions_today': executions_today,
            'waste_collected_today': float(waste_collected_today),
            'collections_week': collections_week,
            'waste_collected_week': float(waste_collected_week),
            'distance_traveled_week': float(distance_traveled_week),
            'vehicles_maintenance_due': vehicles_maintenance_due,
            'points_need_collection': points_need_collection,
            'overdue_executions': overdue_executions
        }
        
        serializer = DashboardStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'post'])
    def collections(self, request):
        """
        Relatório de coletas
        """
        # Processar filtros
        if request.method == 'POST':
            filter_serializer = ReportFilterSerializer(data=request.data)
            if not filter_serializer.is_valid():
                return Response(filter_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            filters = filter_serializer.validated_data
        else:
            filters = {
                'start_date': date.today() - timedelta(days=30),
                'end_date': date.today()
            }
        
        start_date = filters['start_date']
        end_date = filters['end_date']
        
        # Query base
        collections = CollectionRecord.objects.filter(
            collection_date__date__gte=start_date,
            collection_date__date__lte=end_date
        )
        
        # Aplicar filtros adicionais
        if filters.get('collection_point_ids'):
            collections = collections.filter(
                collection_point_id__in=filters['collection_point_ids']
            )
        
        if filters.get('neighborhoods'):
            collections = collections.filter(
                collection_point__neighborhood__in=filters['neighborhoods']
            )
        
        # Estatísticas
        total_collections = collections.count()
        total_weight = collections.aggregate(total=Sum('weight_collected'))['total'] or 0
        total_volume = collections.aggregate(total=Sum('volume_collected'))['total'] or 0
        avg_weight = total_weight / total_collections if total_collections > 0 else 0
        
        # Agrupamentos
        collections_by_status = dict(collections.values_list('status').annotate(count=Count('id')))
        collections_by_type = dict(
            collections.values_list('collection_point__point_type').annotate(count=Count('id'))
        )
        collections_by_neighborhood = dict(
            collections.values_list('collection_point__neighborhood').annotate(count=Count('id'))
        )
        
        # Coletas diárias
        daily_collections = []
        current_date = start_date
        while current_date <= end_date:
            daily_count = collections.filter(collection_date__date=current_date).count()
            daily_collections.append({
                'date': current_date.isoformat(),
                'count': daily_count
            })
            current_date += timedelta(days=1)
        
        report_data = {
            'period': f"{start_date} - {end_date}",
            'total_collections': total_collections,
            'total_weight': float(total_weight),
            'total_volume': float(total_volume),
            'avg_weight_per_collection': float(avg_weight),
            'collections_by_status': collections_by_status,
            'collections_by_type': collections_by_type,
            'collections_by_neighborhood': collections_by_neighborhood,
            'daily_collections': daily_collections
        }
        
        serializer = CollectionReportSerializer(report_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get', 'post'])
    def efficiency(self, request):
        """
        Relatório de eficiência
        """
        # Processar filtros
        if request.method == 'POST':
            filter_serializer = ReportFilterSerializer(data=request.data)
            if not filter_serializer.is_valid():
                return Response(filter_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            filters = filter_serializer.validated_data
        else:
            filters = {
                'start_date': date.today() - timedelta(days=30),
                'end_date': date.today()
            }
        
        start_date = filters['start_date']
        end_date = filters['end_date']
        
        # Query base
        executions = RouteExecution.objects.filter(
            scheduled_date__gte=start_date,
            scheduled_date__lte=end_date
        )
        
        # Aplicar filtros
        if filters.get('route_ids'):
            executions = executions.filter(route_id__in=filters['route_ids'])
        
        if filters.get('vehicle_ids'):
            executions = executions.filter(vehicle_id__in=filters['vehicle_ids'])
        
        # Estatísticas
        total_executions = executions.count()
        completed_executions = executions.filter(status='completed').count()
        completion_rate = (completed_executions / total_executions * 100) if total_executions > 0 else 0
        
        # Tempo médio de execução (em horas)
        completed = executions.filter(
            status='completed',
            actual_start_time__isnull=False,
            actual_end_time__isnull=False
        )
        avg_execution_time = 0
        if completed.exists():
            durations = []
            for execution in completed:
                duration = execution.actual_end_time - execution.actual_start_time
                durations.append(duration.total_seconds() / 3600)
            avg_execution_time = sum(durations) / len(durations)
        
        # Distância e combustível
        total_distance = executions.aggregate(total=Sum('actual_distance'))['total'] or 0
        total_fuel = executions.aggregate(total=Sum('fuel_consumed'))['total'] or 0
        fuel_efficiency = total_distance / total_fuel if total_fuel > 0 else 0
        
        # Execuções por status
        executions_by_status = dict(executions.values_list('status').annotate(count=Count('id')))
        
        # Eficiência por rota
        efficiency_by_route = []
        routes = executions.values('route_id', 'route__name').distinct()
        for route in routes:
            route_executions = executions.filter(route_id=route['route_id'])
            route_completed = route_executions.filter(status='completed').count()
            route_total = route_executions.count()
            route_completion_rate = (route_completed / route_total * 100) if route_total > 0 else 0
            
            efficiency_by_route.append({
                'route_id': route['route_id'],
                'route_name': route['route__name'],
                'total_executions': route_total,
                'completed_executions': route_completed,
                'completion_rate': route_completion_rate
            })
        
        report_data = {
            'period': f"{start_date} - {end_date}",
            'total_executions': total_executions,
            'completed_executions': completed_executions,
            'completion_rate': float(completion_rate),
            'avg_execution_time': float(avg_execution_time),
            'total_distance': float(total_distance),
            'total_fuel_consumed': float(total_fuel),
            'fuel_efficiency': float(fuel_efficiency),
            'executions_by_status': executions_by_status,
            'efficiency_by_route': efficiency_by_route
        }
        
        serializer = EfficiencyReportSerializer(report_data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def vehicle_performance(self, request):
        """
        Performance dos veículos
        """
        days = int(request.query_params.get('days', 30))
        since_date = date.today() - timedelta(days=days)
        
        vehicles_data = []
        vehicles = Vehicle.objects.filter(status='active')
        
        for vehicle in vehicles:
            executions = vehicle.route_executions.filter(
                scheduled_date__gte=since_date,
                status='completed'
            )
            
            total_distance = executions.aggregate(total=Sum('actual_distance'))['total'] or 0
            total_fuel = executions.aggregate(total=Sum('fuel_consumed'))['total'] or 0
            fuel_efficiency = total_distance / total_fuel if total_fuel > 0 else 0
            
            # Contagem de coletas
            total_collections = CollectionRecord.objects.filter(
                route_execution__vehicle=vehicle,
                collection_date__date__gte=since_date
            ).count()
            
            # Custo de manutenção
            maintenance_cost = vehicle.maintenances.filter(
                is_completed=True,
                actual_date__gte=since_date
            ).aggregate(total=Sum('cost'))['total'] or 0
            
            # Taxa de utilização (dias trabalhados / dias no período)
            days_worked = executions.values('scheduled_date').distinct().count()
            utilization_rate = (days_worked / days * 100) if days > 0 else 0
            
            vehicles_data.append({
                'vehicle_id': vehicle.id,
                'license_plate': vehicle.license_plate,
                'total_distance': float(total_distance),
                'total_fuel': float(total_fuel),
                'fuel_efficiency': float(fuel_efficiency),
                'total_collections': total_collections,
                'maintenance_cost': float(maintenance_cost),
                'utilization_rate': float(utilization_rate)
            })
        
        serializer = VehiclePerformanceSerializer(vehicles_data, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def export(self, request):
        """
        Exportar relatórios
        """
        serializer = ExportReportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        report_type = data['report_type']
        format_type = data['format']
        start_date = data['start_date']
        end_date = data['end_date']
        
        # Gerar dados do relatório baseado no tipo
        if report_type == 'collections':
            # Buscar dados de coletas
            collections = CollectionRecord.objects.filter(
                collection_date__date__gte=start_date,
                collection_date__date__lte=end_date
            ).select_related('collection_point', 'collected_by')
            
            if format_type == 'csv':
                response = HttpResponse(content_type='text/csv')
                response['Content-Disposition'] = f'attachment; filename=\"coletas_{start_date}_{end_date}.csv\"'
                
                writer = csv.writer(response)
                writer.writerow([
                    'Data', 'Ponto', 'Código', 'Peso (kg)', 'Volume (m³)', 
                    'Status', 'Coletado por'
                ])
                
                for collection in collections:
                    writer.writerow([
                        collection.collection_date.strftime('%d/%m/%Y %H:%M'),
                        collection.collection_point.name,
                        collection.collection_point.code,
                        collection.weight_collected or 0,
                        collection.volume_collected or 0,
                        collection.get_status_display(),
                        collection.collected_by.get_full_name()
                    ])
                
                return response
        
        return Response({
            'message': 'Relatório exportado com sucesso!',
            'format': format_type,
            'type': report_type
        })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def quick_stats(request):
    """
    Estatísticas rápidas para widgets
    """
    today = date.today()
    
    stats = {
        'collections_today': CollectionRecord.objects.filter(
            collection_date__date=today
        ).count(),
        'executions_in_progress': RouteExecution.objects.filter(
            status='in_progress'
        ).count(),
        'vehicles_available': Vehicle.objects.filter(
            status='active',
            current_driver__isnull=True
        ).count(),
        'points_need_attention': CollectionPoint.objects.filter(
            current_fill_level__gte=80
        ).count()
    }
    
    return Response(stats)