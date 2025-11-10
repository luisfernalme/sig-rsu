from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Count, Q, Sum
from datetime import date, timedelta
from .models import Driver, Vehicle, VehicleGPSTracker, VehicleMaintenance
from .serializers import (
    DriverSerializer, VehicleSerializer, VehicleDetailSerializer, VehicleGPSTrackerSerializer,
    VehicleMaintenanceSerializer, VehicleStatsSerializer
)


class DriverViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para motoristas
    """
    queryset = Driver.objects.all()
    serializer_class = DriverSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'license_category']
    search_fields = ['name', 'cpf', 'license_number', 'phone']
    ordering_fields = ['name', 'hire_date', 'created_at']
    ordering = ['name']
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Retorna apenas motoristas ativos"""
        active_drivers = self.queryset.filter(status='active')
        serializer = self.get_serializer(active_drivers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def expired_licenses(self, request):
        """Retorna motoristas com CNH vencida ou próxima do vencimento"""
        thirty_days = date.today() + timedelta(days=30)
        drivers = self.queryset.filter(
            Q(license_expiration__lte=thirty_days) &
            Q(status='active')
        ).order_by('license_expiration')
        serializer = self.get_serializer(drivers, many=True)
        return Response(serializer.data)


class VehicleViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para veículos
    """
    queryset = Vehicle.objects.all()
    serializer_class = VehicleSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'vehicle_type']
    search_fields = ['license_plate', 'brand', 'model']
    ordering_fields = ['license_plate', 'brand', 'model', 'year', 'created_at']
    ordering = ['license_plate']
    
    def get_serializer_class(self):
        """
        Usar serializer detalhado para retrieve
        """
        if self.action == 'retrieve':
            return VehicleDetailSerializer
        return VehicleSerializer
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas dos veículos
        """
        vehicles = Vehicle.objects.all()
        
        stats = {
            'total_vehicles': vehicles.count(),
            'active_vehicles': vehicles.filter(status='active').count(),
            'maintenance_due': vehicles.filter(
                next_maintenance__lte=date.today()
            ).count(),
            'in_maintenance': vehicles.filter(status='maintenance').count(),
            'available_vehicles': vehicles.filter(
                status='active',
                current_driver__isnull=True
            ).count(),
            'by_type': dict(vehicles.values_list('vehicle_type').annotate(
                count=Count('id')
            )),
            'by_status': dict(vehicles.values_list('status').annotate(
                count=Count('id')
            ))
        }
        
        serializer = VehicleStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """
        Veículos disponíveis para alocação
        """
        vehicles = Vehicle.objects.filter(
            status='active',
            current_driver__isnull=True
        )
        serializer = self.get_serializer(vehicles, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def maintenance_due(self, request):
        """
        Veículos com manutenção vencida
        """
        vehicles = Vehicle.objects.filter(
            Q(next_maintenance__lte=date.today()) |
            Q(status='maintenance')
        )
        serializer = self.get_serializer(vehicles, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def assign_driver(self, request, pk=None):
        """
        Atribuir motorista ao veículo
        """
        vehicle = self.get_object()
        driver_id = request.data.get('driver_id')
        
        if not driver_id:
            return Response({
                'error': 'ID do motorista é obrigatório.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            driver = User.objects.get(id=driver_id)
            
            vehicle.current_driver = driver
            vehicle.save()
            
            return Response({
                'message': f'Motorista {driver.get_full_name()} atribuído ao veículo {vehicle.license_plate}',
                'vehicle': VehicleSerializer(vehicle).data
            })
        except User.DoesNotExist:
            return Response({
                'error': 'Motorista não encontrado.'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def remove_driver(self, request, pk=None):
        """
        Remover motorista do veículo
        """
        vehicle = self.get_object()
        vehicle.current_driver = None
        vehicle.save()
        
        return Response({
            'message': f'Motorista removido do veículo {vehicle.license_plate}',
            'vehicle': VehicleSerializer(vehicle).data
        })
    
    @action(detail=True, methods=['get'])
    def gps_history(self, request, pk=None):
        """
        Histórico GPS do veículo
        """
        vehicle = self.get_object()
        days = int(request.query_params.get('days', 7))
        
        since_date = date.today() - timedelta(days=days)
        gps_tracks = vehicle.gps_tracks.filter(
            timestamp__date__gte=since_date
        ).order_by('-timestamp')
        
        serializer = VehicleGPSTrackerSerializer(gps_tracks, many=True)
        return Response(serializer.data)

    # Alias compatível com frontend: /vehicles/{id}/tracking/
    @action(detail=True, methods=['get'], url_path='tracking')
    def tracking(self, request, pk=None):
        return self.gps_history(request, pk)
    
    @action(detail=True, methods=['get'])
    def maintenance_history(self, request, pk=None):
        """
        Histórico de manutenções do veículo
        """
        vehicle = self.get_object()
        maintenances = vehicle.maintenances.all().order_by('-created_at')
        
        serializer = VehicleMaintenanceSerializer(maintenances, many=True)
        return Response(serializer.data)


class VehicleGPSTrackerViewSet(viewsets.ModelViewSet):
    """
    ViewSet para rastreamento GPS
    """
    queryset = VehicleGPSTracker.objects.all()
    serializer_class = VehicleGPSTrackerSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['vehicle']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    
    @action(detail=False, methods=['get'])
    def current_positions(self, request):
        """
        Posições atuais de todos os veículos
        """
        from django.db.models import Max
        
        # Buscar a posição mais recente de cada veículo
        latest_positions = VehicleGPSTracker.objects.values('vehicle').annotate(
            latest_timestamp=Max('timestamp')
        )
        
        current_positions = []
        for pos in latest_positions:
            try:
                gps_track = VehicleGPSTracker.objects.get(
                    vehicle=pos['vehicle'],
                    timestamp=pos['latest_timestamp']
                )
                current_positions.append(gps_track)
            except VehicleGPSTracker.DoesNotExist:
                continue
        
        serializer = self.get_serializer(current_positions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """
        Atualização em lote de posições GPS
        """
        gps_data = request.data.get('gps_tracks', [])
        
        if not gps_data:
            return Response({
                'error': 'Dados GPS são obrigatórios.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        created_tracks = []
        errors = []
        
        for track_data in gps_data:
            serializer = self.get_serializer(data=track_data)
            if serializer.is_valid():
                track = serializer.save()
                created_tracks.append(track)
            else:
                errors.append({
                    'data': track_data,
                    'errors': serializer.errors
                })
        
        return Response({
            'created': len(created_tracks),
            'errors': errors,
            'tracks': VehicleGPSTrackerSerializer(created_tracks, many=True).data
        })


class VehicleMaintenanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para manutenção de veículos
    """
    queryset = VehicleMaintenance.objects.all()
    serializer_class = VehicleMaintenanceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vehicle', 'maintenance_type', 'is_completed']
    search_fields = ['description', 'technician', 'workshop']
    ordering_fields = ['scheduled_date', 'actual_date', 'cost', 'created_at']
    ordering = ['-created_at']
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Manutenções pendentes
        """
        pending = self.queryset.filter(is_completed=False)
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Manutenções atrasadas
        """
        overdue = self.queryset.filter(
            is_completed=False,
            scheduled_date__lt=date.today()
        )
        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Marcar manutenção como concluída
        """
        maintenance = self.get_object()
        
        if maintenance.is_completed:
            return Response({
                'error': 'Manutenção já foi concluída.'
            }, status=status.HTTP_400_BAD_REQUEST)

        maintenance.is_completed = True
        maintenance.actual_date = request.data.get('completed_date', date.today())
        maintenance.cost = request.data.get('cost', maintenance.cost)
        maintenance.notes = request.data.get('notes', maintenance.notes)
        maintenance.save()

        # Atualizar data da última manutenção no veículo
        vehicle = maintenance.vehicle
        vehicle.last_maintenance = maintenance.actual_date
        vehicle.save()
        
        return Response({
            'message': 'Manutenção marcada como concluída.',
            'maintenance': VehicleMaintenanceSerializer(maintenance).data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas de manutenção
        """
        maintenances = self.queryset
        
        stats = {
            'total': maintenances.count(),
            'pending': maintenances.filter(is_completed=False).count(),
            'completed': maintenances.filter(is_completed=True).count(),
            'overdue': maintenances.filter(
                is_completed=False,
                scheduled_date__lt=date.today()
            ).count(),
            'by_type': dict(maintenances.values_list('maintenance_type').annotate(
                count=Count('id')
            )),
            'total_cost': maintenances.filter(
                is_completed=True,
                cost__isnull=False
            ).aggregate(
                total=Sum('cost')
            )['total'] or 0
        }
        
        return Response(stats)