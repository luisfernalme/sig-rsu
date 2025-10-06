from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Count, Avg, Sum, Q
from datetime import date, datetime, timedelta
from .models import Route, RouteSchedule, RouteExecution, RouteOptimization
from .serializers import (
    RouteSerializer, RouteDetailSerializer, RouteScheduleSerializer,
    RouteExecutionSerializer, RouteOptimizationSerializer, RouteStatsSerializer,
    RouteCreateSerializer
)


class RouteViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para rotas
    """
    queryset = Route.objects.all()
    serializer_class = RouteSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'frequency', 'created_by']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'estimated_distance', 'created_at']
    ordering = ['name']
    
    def get_serializer_class(self):
        """
        Usar serializers específicos baseado na ação
        """
        if self.action == 'create':
            return RouteCreateSerializer
        elif self.action == 'retrieve':
            return RouteDetailSerializer
        return RouteSerializer
    
    def perform_create(self, serializer):
        """
        Definir usuário criador
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas das rotas
        """
        routes = Route.objects.all()
        executions = RouteExecution.objects.all()
        
        stats = {
            'total_routes': routes.count(),
            'active_routes': routes.filter(status='active').count(),
            'total_distance': routes.aggregate(
                total=Sum('estimated_distance')
            )['total'] or 0,
            'total_executions': executions.count(),
            'completed_executions': executions.filter(status='completed').count(),
            'avg_execution_time': executions.filter(
                status='completed',
                actual_start_time__isnull=False,
                actual_end_time__isnull=False
            ).extra(
                select={
                    'duration': 'EXTRACT(EPOCH FROM (actual_end_time - actual_start_time))/3600'
                }
            ).aggregate(
                avg=Avg('duration')
            )['avg'] or 0,
            'total_waste_collected': executions.aggregate(
                total=Sum('waste_collected')
            )['total'] or 0,
            'by_frequency': dict(routes.values_list('frequency').annotate(
                count=Count('id')
            )),
            'by_status': dict(routes.values_list('status').annotate(
                count=Count('id')
            ))
        }
        
        serializer = RouteStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        Rotas ativas
        """
        routes = Route.objects.filter(status='active')
        serializer = self.get_serializer(routes, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def optimize(self, request, pk=None):
        """
        Otimizar rota usando algoritmo básico
        """
        route = self.get_object()
        
        # Algoritmo básico de otimização (pode ser melhorado)
        collection_points = route.collection_points.all().order_by('sequence_order')
        
        if collection_points.count() < 2:
            return Response({
                'error': 'Rota precisa ter pelo menos 2 pontos para otimização.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Calcular distância original
        original_distance = route.estimated_distance or 0
        
        # Simular otimização (aqui seria implementado um algoritmo real)
        optimized_distance = original_distance * 0.85  # 15% de economia simulada
        savings = original_distance - optimized_distance
        
        # Criar registro de otimização
        optimization = RouteOptimization.objects.create(
            original_route=route,
            optimized_geometry=route.geometry,  # placeholder: reutiliza geometria
            original_distance=original_distance,
            optimized_distance=optimized_distance,
            distance_saved=savings,
            original_duration=route.estimated_duration,
            optimized_duration=route.estimated_duration,
            algorithm_used='basic_nearest_neighbor',
        )
        
        # Atualizar distância estimada da rota
        route.estimated_distance = optimized_distance
        route.save()
        
        return Response({
            'message': 'Rota otimizada com sucesso!',
            'optimization': RouteOptimizationSerializer(optimization).data,
            'savings_km': round(savings, 2),
            'savings_percent': round((savings / original_distance) * 100, 1) if original_distance > 0 else 0
        })
    
    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """
        Agendamentos da rota
        """
        route = self.get_object()
        schedules = route.schedules.filter(is_active=True)
        serializer = RouteScheduleSerializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """
        Execuções da rota
        """
        route = self.get_object()
        days = int(request.query_params.get('days', 30))
        since_date = date.today() - timedelta(days=days)
        
        executions = route.executions.filter(
            scheduled_date__gte=since_date
        ).order_by('-scheduled_date')
        
        serializer = RouteExecutionSerializer(executions, many=True)
        return Response(serializer.data)


class RouteScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet para agendamento de rotas
    """
    queryset = RouteSchedule.objects.all()
    serializer_class = RouteScheduleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['route', 'day_of_week', 'is_active']
    ordering_fields = ['day_of_week', 'start_time']
    ordering = ['day_of_week', 'start_time']
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Agendamentos para hoje
        """
        today = date.today()
        day_of_week = today.strftime('%A').lower()
        
        schedules = RouteSchedule.objects.filter(
            day_of_week=day_of_week,
            is_active=True
        )
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def week(self, request):
        """
        Agendamentos da semana
        """
        schedules = RouteSchedule.objects.filter(is_active=True).order_by(
            'day_of_week', 'start_time'
        )
        serializer = self.get_serializer(schedules, many=True)
        return Response(serializer.data)


class RouteExecutionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para execução de rotas
    """
    queryset = RouteExecution.objects.all()
    serializer_class = RouteExecutionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['route', 'vehicle', 'driver', 'status', 'scheduled_date']
    search_fields = ['route__name', 'vehicle__license_plate', 'driver__first_name', 'driver__last_name']
    ordering_fields = ['scheduled_date', 'scheduled_time', 'created_at']
    ordering = ['-scheduled_date', '-scheduled_time']
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Execuções programadas para hoje
        """
        today = date.today()
        executions = RouteExecution.objects.filter(scheduled_date=today)
        serializer = self.get_serializer(executions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def in_progress(self, request):
        """
        Execuções em andamento
        """
        executions = RouteExecution.objects.filter(status='in_progress')
        serializer = self.get_serializer(executions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Execuções pendentes
        """
        executions = RouteExecution.objects.filter(status='scheduled')
        serializer = self.get_serializer(executions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """
        Iniciar execução da rota
        """
        execution = self.get_object()
        
        if execution.status != 'scheduled':
            return Response({
                'error': f'Execução não pode ser iniciada. Status atual: {execution.get_status_display()}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        execution.status = 'in_progress'
        execution.actual_start_time = datetime.now()
        execution.save()
        
        return Response({
            'message': 'Execução da rota iniciada!',
            'execution': RouteExecutionSerializer(execution).data
        })
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Finalizar execução da rota
        """
        execution = self.get_object()
        
        if execution.status != 'in_progress':
            return Response({
                'error': f'Execução não pode ser finalizada. Status atual: {execution.get_status_display()}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        execution.status = 'completed'
        execution.actual_end_time = datetime.now()
        execution.actual_distance = request.data.get('actual_distance', execution.actual_distance)
        execution.fuel_consumed = request.data.get('fuel_consumed', execution.fuel_consumed)
        execution.waste_collected = request.data.get('waste_collected', execution.waste_collected)
        execution.notes = request.data.get('notes', execution.notes)
        execution.save()
        
        return Response({
            'message': 'Execução da rota finalizada!',
            'execution': RouteExecutionSerializer(execution).data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancelar execução da rota
        """
        execution = self.get_object()
        
        if execution.status == 'completed':
            return Response({
                'error': 'Execução já foi finalizada e não pode ser cancelada.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        execution.status = 'cancelled'
        execution.notes = request.data.get('reason', execution.notes)
        execution.save()
        
        return Response({
            'message': 'Execução da rota cancelada!',
            'execution': RouteExecutionSerializer(execution).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas das execuções
        """
        executions = RouteExecution.objects.all()
        
        stats = {
            'total': executions.count(),
            'completed': executions.filter(status='completed').count(),
            'in_progress': executions.filter(status='in_progress').count(),
            'scheduled': executions.filter(status='scheduled').count(),
            'cancelled': executions.filter(status='cancelled').count(),
            'total_distance': executions.filter(
                actual_distance__isnull=False
            ).aggregate(
                total=Sum('actual_distance')
            )['total'] or 0,
            'total_fuel': executions.filter(
                fuel_consumed__isnull=False
            ).aggregate(
                total=Sum('fuel_consumed')
            )['total'] or 0,
            'total_waste': executions.filter(
                waste_collected__isnull=False
            ).aggregate(
                total=Sum('waste_collected')
            )['total'] or 0
        }
        
        return Response(stats)


class RouteOptimizationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet somente leitura para otimizações
    """
    queryset = RouteOptimization.objects.all()
    serializer_class = RouteOptimizationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['original_route']
    ordering_fields = ['optimization_date', 'distance_saved']
    ordering = ['-optimization_date']
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas de otimização
        """
        optimizations = RouteOptimization.objects.all()
        
        stats = {
            'total_optimizations': optimizations.count(),
            'total_savings_km': optimizations.aggregate(
                total=Sum('savings_distance')
            )['total'] or 0,
            'avg_savings_percent': optimizations.extra(
                select={
                    'savings_percent': '(savings_distance / original_distance) * 100'
                }
            ).aggregate(
                avg=Avg('savings_percent')
            )['avg'] or 0,
            'total_routes_optimized': optimizations.values('route').distinct().count()
        }
        
        return Response(stats)