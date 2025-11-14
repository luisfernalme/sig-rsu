from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.db.models import Count, Avg, Sum, Q
from datetime import date, datetime, timedelta
from django.utils import timezone
from .models import (
    CollectionPoint, CollectionPointRoute, CollectionRecord, 
    WasteType, CollectionPointWasteType, CollectionPointPhoto
)
from .serializers import (
    CollectionPointSerializer, CollectionPointDetailSerializer, CollectionPointRouteSerializer,
    CollectionRecordSerializer, WasteTypeSerializer, CollectionPointWasteTypeSerializer,
    CollectionPointStatsSerializer, BulkCollectionSerializer, CollectionPointPhotoSerializer
)


class CollectionPointViewSet(viewsets.ModelViewSet):
    """
    ViewSet completo para pontos de coleta
    """
    queryset = CollectionPoint.objects.all()
    serializer_class = CollectionPointSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'point_type', 'collection_frequency', 'neighborhood']
    search_fields = ['name', 'code', 'address', 'neighborhood']
    ordering_fields = ['name', 'code', 'last_collection', 'created_at']
    ordering = ['code']
    
    def get_serializer_class(self):
        """
        Usar serializer detalhado para retrieve
        """
        if self.action == 'retrieve':
            return CollectionPointDetailSerializer
        return CollectionPointSerializer
    
    def create(self, request, *args, **kwargs):
        """
        Criação de ponto com validação padrão
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    def perform_create(self, serializer):
        """
        Definir usuário criador
        """
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas dos pontos de coleta
        """
        points = CollectionPoint.objects.all()
        collections = CollectionRecord.objects.all()
        
        stats = {
            'total_points': points.count(),
            'active_points': points.filter(status='active').count(),
            'full_points': points.filter(status='full').count(),
            'maintenance_points': points.filter(status='maintenance').count(),
            'total_collections': collections.count(),
            'total_waste_collected': collections.aggregate(
                total=Sum('weight_collected')
            )['total'] or 0,
            'by_type': dict(points.values_list('point_type').annotate(
                count=Count('id')
            )),
            'by_status': dict(points.values_list('status').annotate(
                count=Count('id')
            )),
            'by_neighborhood': dict(points.values_list('neighborhood').annotate(
                count=Count('id')
            ))
        }
        
        serializer = CollectionPointStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def full_points(self, request):
        """
        Pontos marcados como cheios
        """
        points = CollectionPoint.objects.filter(status='full')
        serializer = self.get_serializer(points, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def needs_collection(self, request):
        """
        Pontos que precisam de coleta
        """
        days_threshold = int(request.query_params.get('days', 7))
        # Usar datetime ciente de timezone para evitar warnings
        threshold_dt = timezone.now() - timedelta(days=days_threshold)
        
        points = CollectionPoint.objects.filter(
            Q(last_collection__lt=threshold_dt) |
            Q(last_collection__isnull=True) |
            Q(status='full')
        ).filter(status__in=['active', 'full'])
        
        serializer = self.get_serializer(points, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_neighborhood(self, request):
        """
        Pontos agrupados por bairro
        """
        neighborhood = request.query_params.get('neighborhood')
        if neighborhood:
            points = CollectionPoint.objects.filter(neighborhood__icontains=neighborhood)
        else:
            points = CollectionPoint.objects.all()
        
        # Agrupar por bairro
        by_neighborhood = {}
        for point in points:
            if point.neighborhood not in by_neighborhood:
                by_neighborhood[point.neighborhood] = []
            by_neighborhood[point.neighborhood].append(
                CollectionPointSerializer(point).data
            )
        
        return Response(by_neighborhood)
    
    @action(detail=True, methods=['post'])
    def collect(self, request, pk=None):
        """
        Registrar coleta no ponto
        """
        collection_point = self.get_object()
        
        # Criar registro de coleta
        collection_data = request.data.copy()
        collection_data['collection_point'] = collection_point.id
        collection_data['collection_date'] = timezone.now()
        
        serializer = CollectionRecordSerializer(data=collection_data, context={'request': request})
        if serializer.is_valid():
            collection = serializer.save()
            
            # Atualizar ponto de coleta
            collection_point.last_collection = collection.collection_date
            
            # Calcular próxima coleta baseada na frequência
            if collection_point.collection_frequency == 'daily':
                collection_point.next_collection = collection.collection_date + timedelta(days=1)
            elif collection_point.collection_frequency == 'weekly':
                collection_point.next_collection = collection.collection_date + timedelta(weeks=1)
            elif collection_point.collection_frequency == 'biweekly':
                collection_point.next_collection = collection.collection_date + timedelta(weeks=2)
            elif collection_point.collection_frequency == 'monthly':
                collection_point.next_collection = collection.collection_date + timedelta(days=30)
            
            collection_point.save()
            
            return Response({
                'message': 'Coleta registrada com sucesso!',
                'collection': CollectionRecordSerializer(collection).data,
                'collection_point': CollectionPointSerializer(collection_point).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def collection_history(self, request, pk=None):
        """
        Histórico de coletas do ponto
        """
        collection_point = self.get_object()
        days = int(request.query_params.get('days', 30))
        since_date = date.today() - timedelta(days=days)
        
        collections = collection_point.collections.filter(
            collection_date__date__gte=since_date
        ).order_by('-collection_date')
        
        serializer = CollectionRecordSerializer(collections, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def photos(self, request, pk=None):
        """
        Listar ou adicionar fotos do ponto
        """
        collection_point = self.get_object()
        
        if request.method == 'GET':
            photos = collection_point.photos.all()
            serializer = CollectionPointPhotoSerializer(photos, many=True, context={'request': request})
            return Response(serializer.data)
        
        elif request.method == 'POST':
            data = request.data.copy()
            data['collection_point'] = collection_point.id

            serializer = CollectionPointPhotoSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                photo = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CollectionRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet para registros de coleta
    """
    queryset = CollectionRecord.objects.all()
    serializer_class = CollectionRecordSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['collection_point', 'route_execution', 'status', 'collected_by']
    search_fields = ['collection_point__name', 'collection_point__code', 'notes']
    ordering_fields = ['collection_date', 'weight_collected', 'created_at']
    ordering = ['-collection_date']
    
    def perform_create(self, serializer):
        """
        Definir usuário que coletou
        """
        serializer.save(collected_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """
        Coletas realizadas hoje
        """
        today = date.today()
        collections = CollectionRecord.objects.filter(collection_date__date=today)
        serializer = self.get_serializer(collections, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_route(self, request):
        """
        Coletas por execução de rota
        """
        route_execution_id = request.query_params.get('route_execution')
        if not route_execution_id:
            return Response({
                'error': 'ID da execução da rota é obrigatório.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        collections = CollectionRecord.objects.filter(
            route_execution_id=route_execution_id
        )
        serializer = self.get_serializer(collections, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def bulk_collect(self, request):
        """
        Registrar múltiplas coletas
        """
        serializer = BulkCollectionSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            collections = serializer.save()
            return Response({
                'message': f'{len(collections)} coletas registradas com sucesso!',
                'collections': CollectionRecordSerializer(collections, many=True).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas das coletas
        """
        collections = CollectionRecord.objects.all()
        
        stats = {
            'total_collections': collections.count(),
            'total_weight': collections.aggregate(
                total=Sum('weight_collected')
            )['total'] or 0,
            'total_volume': collections.aggregate(
                total=Sum('volume_collected')
            )['total'] or 0,
            'by_status': dict(collections.values_list('status').annotate(
                count=Count('id')
            )),
            'collections_today': collections.filter(
                collection_date__date=date.today()
            ).count(),
            'collections_week': collections.filter(
                collection_date__date__gte=date.today() - timedelta(days=7)
            ).count()
        }
        
        return Response(stats)


class WasteTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de resíduos
    """
    queryset = WasteType.objects.all()
    serializer_class = WasteTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name']
    ordering = ['name']
    
    @action(detail=False, methods=['get'])
    def recyclable(self, request):
        """
        Tipos de resíduos recicláveis
        """
        waste_types = WasteType.objects.filter(is_recyclable=True)
        serializer = self.get_serializer(waste_types, many=True)
        return Response(serializer.data)


class CollectionPointWasteTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para tipos de resíduos aceitos por ponto
    """
    queryset = CollectionPointWasteType.objects.all()
    serializer_class = CollectionPointWasteTypeSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['collection_point', 'waste_type', 'is_primary']


class CollectionPointPhotoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para fotos dos pontos de coleta
    """
    queryset = CollectionPointPhoto.objects.all()
    serializer_class = CollectionPointPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['collection_point', 'photo_type', 'is_primary', 'uploaded_by']
    ordering_fields = ['uploaded_at', 'photo_type']
    ordering = ['-uploaded_at']
    
    def perform_create(self, serializer):
        """
        Definir usuário que fez upload
        """
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def set_primary(self, request, pk=None):
        """
        Definir como foto principal
        """
        photo = self.get_object()
        
        # Remover flag de foto principal das outras fotos do mesmo ponto
        CollectionPointPhoto.objects.filter(
            collection_point=photo.collection_point,
            is_primary=True
        ).update(is_primary=False)
        
        # Definir esta como principal
        photo.is_primary = True
        photo.save()
        
        serializer = self.get_serializer(photo)
        return Response({
            'message': 'Foto definida como principal!',
            'photo': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def by_point(self, request):
        """
        Fotos de um ponto específico
        """
        point_id = request.query_params.get('point_id')
        if not point_id:
            return Response({
                'error': 'ID do ponto é obrigatório.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        photos = CollectionPointPhoto.objects.filter(collection_point_id=point_id)
        serializer = self.get_serializer(photos, many=True)
        return Response(serializer.data)