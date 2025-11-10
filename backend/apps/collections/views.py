from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters

from .models import Collection, CollectionItem
from .serializers import CollectionSerializer, CollectionCreateSerializer, CollectionItemSerializer


class CollectionViewSet(viewsets.ModelViewSet):
    """ViewSet para gerenciar coletas"""
    
    queryset = Collection.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'route', 'vehicle', 'scheduled_date']
    search_fields = ['driver_name', 'route__name', 'vehicle__license_plate']
    ordering_fields = ['scheduled_date', 'scheduled_time', 'created_at']
    ordering = ['-scheduled_date', '-scheduled_time']
    
    def get_serializer_class(self):
        """Retorna o serializer apropriado"""
        if self.action == 'create':
            return CollectionCreateSerializer
        return CollectionSerializer
    
    def perform_create(self, serializer):
        """Criar coleta e seus itens"""
        collection = serializer.save()
        
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
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Iniciar uma coleta"""
        collection = self.get_object()
        
        if collection.status != 'pending':
            return Response(
                {'error': 'Apenas coletas pendentes podem ser iniciadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        collection.status = 'in_progress'
        collection.start_time = timezone.now()
        collection.save()
        
        serializer = self.get_serializer(collection)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Finalizar uma coleta"""
        collection = self.get_object()
        
        if collection.status != 'in_progress':
            return Response(
                {'error': 'Apenas coletas em andamento podem ser finalizadas.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        collection.status = 'completed'
        collection.end_time = timezone.now()
        
        # Calcular métricas totais
        total_weight = sum(
            item.weight for item in collection.collection_items.all()
        )
        collection.total_weight = total_weight
        
        collection.save()
        
        serializer = self.get_serializer(collection)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancelar uma coleta"""
        collection = self.get_object()
        
        if collection.status == 'completed':
            return Response(
                {'error': 'Coletas finalizadas não podem ser canceladas.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        collection.status = 'cancelled'
        collection.save()
        
        serializer = self.get_serializer(collection)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'post'])
    def items(self, request, pk=None):
        """Gerenciar itens de coleta"""
        collection = self.get_object()
        
        if request.method == 'GET':
            items = collection.collection_items.all()
            serializer = CollectionItemSerializer(items, many=True)
            return Response(serializer.data)
        
        # POST - atualizar item
        item_id = request.data.get('item_id')
        try:
            item = collection.collection_items.get(id=item_id)
        except CollectionItem.DoesNotExist:
            return Response(
                {'error': 'Item não encontrado.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Atualizar item
        item.collected = request.data.get('collected', item.collected)
        item.weight = request.data.get('weight', item.weight)
        item.notes = request.data.get('notes', item.notes)
        
        if item.collected and not item.collected_at:
            item.collected_at = timezone.now()
        
        item.save()
        
        serializer = CollectionItemSerializer(item)
        return Response(serializer.data)
