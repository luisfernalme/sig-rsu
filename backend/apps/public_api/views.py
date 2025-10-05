from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.db.models import Count, Sum, Q
from django.core.mail import send_mail
from django.conf import settings
from datetime import date, datetime, timedelta
import logging

from apps.collection_points.models import CollectionPoint, CollectionRecord
from apps.routes.models import Route, RouteExecution
from .serializers import (
    PublicCollectionPointSerializer, PublicRouteSerializer, CollectionScheduleSerializer,
    PublicStatsSerializer, ServiceStatusSerializer, WasteDisposalGuideSerializer,
    CollectionAlertSerializer, FeedbackSerializer, EmergencyReportSerializer,
    NewsletterSubscriptionSerializer
)

logger = logging.getLogger(__name__)


class PublicAPIViewSet(viewsets.ViewSet):
    """
    API pública para consultas da população
    """
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def collection_schedule(self, request):
        """
        Consultar horários de coleta por endereço
        """
        address = request.query_params.get('address', '').strip()
        
        if not address:
            return Response({
                'error': 'Endereço é obrigatório.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Buscar pontos de coleta próximos ao endereço
        # Por simplicidade, buscaremos por similaridade no campo address
        nearby_points = CollectionPoint.objects.filter(
            address__icontains=address,
            status='active'
        )[:5]
        
        if not nearby_points.exists():
            # Tentar buscar por bairro
            words = address.split()
            for word in words:
                if len(word) > 3:  # Evitar palavras muito pequenas
                    nearby_points = CollectionPoint.objects.filter(
                        Q(neighborhood__icontains=word) | Q(address__icontains=word),
                        status='active'
                    )[:5]
                    if nearby_points.exists():
                        break
        
        # Buscar próximas coletas programadas
        next_collections = []
        today = date.today()
        for i in range(7):  # Próximos 7 dias
            check_date = today + timedelta(days=i)
            executions = RouteExecution.objects.filter(
                scheduled_date=check_date,
                status__in=['scheduled', 'in_progress']
            ).select_related('route')
            
            for execution in executions:
                # Verificar se algum ponto próximo está na rota
                route_points = execution.route.collection_points.filter(
                    collection_point__in=nearby_points
                )
                if route_points.exists():
                    next_collections.append({
                        'date': check_date.strftime('%d/%m/%Y'),
                        'day_of_week': check_date.strftime('%A'),
                        'estimated_time': execution.scheduled_time.strftime('%H:%M'),
                        'route_name': execution.route.name
                    })
        
        # Determinar bairro mais provável
        neighborhood = 'Não identificado'
        if nearby_points.exists():
            neighborhood = nearby_points.first().neighborhood
        
        data = {
            'address': address,
            'neighborhood': neighborhood,
            'collection_points': PublicCollectionPointSerializer(nearby_points, many=True).data,
            'next_collections': next_collections[:5]  # Limitar a 5 próximas coletas
        }
        
        serializer = CollectionScheduleSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas públicas do serviço
        """
        today = date.today()
        current_month_start = today.replace(day=1)
        
        total_collection_points = CollectionPoint.objects.filter(status='active').count()
        collections_this_month = CollectionRecord.objects.filter(
            collection_date__date__gte=current_month_start
        ).count()
        waste_collected_this_month = CollectionRecord.objects.filter(
            collection_date__date__gte=current_month_start
        ).aggregate(total=Sum('weight_collected'))['total'] or 0
        
        # Taxa de reciclagem simulada (seria calculada com base nos tipos de resíduo)
        recycling_rate = 35.5  # Valor simulado
        
        active_routes = Route.objects.filter(status='active').count()
        neighborhoods_served = CollectionPoint.objects.values(
            'neighborhood'
        ).distinct().count()
        
        stats = {
            'total_collection_points': total_collection_points,
            'collections_this_month': collections_this_month,
            'waste_collected_this_month': float(waste_collected_this_month),
            'recycling_rate': recycling_rate,
            'active_routes': active_routes,
            'neighborhoods_served': neighborhoods_served,
            'last_updated': datetime.now()
        }
        
        serializer = PublicStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def service_status(self, request):
        """
        Status atual do serviço
        """
        today = date.today()
        
        # Determinar próximo dia de coleta (simulado)
        weekday = today.weekday()
        if weekday < 4:  # Segunda a quinta
            next_day = 'amanhã'
        elif weekday == 4:  # Sexta
            next_day = 'segunda-feira'
        else:  # Final de semana
            next_day = 'segunda-feira'
        
        data = {
            'service_status': 'normal',
            'next_collection_day': next_day,
            'estimated_time': '06:00 - 18:00',
            'special_notices': [
                'Coleta normal em funcionamento',
                'Deixe o lixo na calçada até às 06:00'
            ],
            'contact_info': {
                'phone': '(11) 3456-7890',
                'email': 'contato@coletarsu.gov.br',
                'hours': 'Segunda a sexta, 8h às 17h'
            }
        }
        
        serializer = ServiceStatusSerializer(data)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def waste_disposal_guide(self, request):
        """
        Guia de descarte de resíduos
        """
        waste_type = request.query_params.get('type', 'all')
        
        guides = [
            {
                'waste_type': 'orgânico',
                'description': 'Restos de comida, cascas, folhas',
                'disposal_instructions': 'Embale em saco plástico fechado. Coleta diária.',
                'collection_points': [],
                'tips': [
                    'Evite líquidos em excesso',
                    'Pode ser usado para compostagem doméstica'
                ]
            },
            {
                'waste_type': 'reciclável',
                'description': 'Papel, plástico, vidro, metal',
                'disposal_instructions': 'Limpe antes de descartar. Coleta seletiva.',
                'collection_points': [],
                'tips': [
                    'Lave embalagens antes de descartar',
                    'Separe por tipo de material'
                ]
            },
            {
                'waste_type': 'eletrônico',
                'description': 'Celulares, computadores, pilhas',
                'disposal_instructions': 'Leve aos pontos de coleta especializados.',
                'collection_points': CollectionPoint.objects.filter(
                    point_type='container',
                    status='active'
                )[:3],
                'tips': [
                    'Nunca descarte no lixo comum',
                    'Apague dados pessoais antes do descarte'
                ]
            }
        ]
        
        if waste_type != 'all':
            guides = [g for g in guides if g['waste_type'] == waste_type]
        
        # Serializar pontos de coleta
        for guide in guides:
            guide['collection_points'] = PublicCollectionPointSerializer(
                guide['collection_points'], many=True
            ).data
        
        serializer = WasteDisposalGuideSerializer(guides, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def collection_alert(self, request):
        """
        Cadastrar alerta de coleta
        """
        serializer = CollectionAlertSerializer(data=request.data)
        if serializer.is_valid():
            # Aqui seria salvo no banco de dados
            # Por enquanto, apenas simular o cadastro
            
            logger.info(f"Novo alerta de coleta cadastrado: {serializer.validated_data['email']}")
            
            return Response({
                'message': 'Alerta cadastrado com sucesso! Você receberá notificações sobre a coleta no seu endereço.',
                'email': serializer.validated_data['email']
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def feedback(self, request):
        """
        Enviar feedback sobre o serviço
        """
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Enviar email para a equipe (simulado)
            try:
                subject = f"[{data['category']}] {data['subject']}"
                message = f"""
                Nome: {data['name']}
                Email: {data['email']}
                Telefone: {data.get('phone', 'Não informado')}
                Endereço: {data.get('address', 'Não informado')}
                Prioridade: {data['priority']}
                
                Mensagem:
                {data['message']}
                """
                
                # Em produção, enviaria email real
                logger.info(f"Feedback recebido: {subject}")
                
                return Response({
                    'message': 'Feedback enviado com sucesso! Retornaremos em até 48 horas.',
                    'protocol': f"FB{datetime.now().strftime('%Y%m%d%H%M%S')}"
                })
            
            except Exception as e:
                logger.error(f"Erro ao processar feedback: {e}")
                return Response({
                    'error': 'Erro interno. Tente novamente mais tarde.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def emergency_report(self, request):
        """
        Relatar emergência relacionada ao lixo
        """
        serializer = EmergencyReportSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            
            # Processar relato de emergência
            protocol = f"EM{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            logger.warning(f"Relato de emergência recebido: {protocol} - {data['emergency_type']}")
            
            # Em caso de emergência crítica, alertar equipe imediatamente
            if data['severity'] == 'critical':
                logger.critical(f"EMERGÊNCIA CRÍTICA: {protocol} - {data['location']}")
            
            return Response({
                'message': 'Relato de emergência recebido! Nossa equipe foi notificada.',
                'protocol': protocol,
                'estimated_response_time': '2-4 horas' if data['severity'] in ['high', 'critical'] else '24-48 horas'
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def newsletter_subscription(self, request):
        """
        Inscrever-se na newsletter
        """
        serializer = NewsletterSubscriptionSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            # Salvar inscrição (simulado)
            logger.info(f"Nova inscrição na newsletter: {email}")
            
            return Response({
                'message': f'Inscrição realizada com sucesso! Você receberá nossas atualizações em {email}',
                'subscription_id': f"NL{datetime.now().strftime('%Y%m%d%H%M%S')}"
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def collection_points_map(request):
    """
    Pontos de coleta para exibição em mapa
    """
    points = CollectionPoint.objects.filter(status='active').values(
        'id', 'name', 'code', 'point_type', 'address', 'neighborhood',
        'location', 'current_fill_level'
    )
    
    # Converter para formato adequado para mapas
    map_points = []
    for point in points:
        if point['location']:
            map_points.append({
                'id': point['id'],
                'name': point['name'],
                'code': point['code'],
                'type': point['point_type'],
                'address': point['address'],
                'neighborhood': point['neighborhood'],
                'lat': point['location'].y if hasattr(point['location'], 'y') else 0,
                'lng': point['location'].x if hasattr(point['location'], 'x') else 0,
                'fill_level': point['current_fill_level'],
                'status': 'full' if point['current_fill_level'] >= 80 else 'normal'
            })
    
    return Response({
        'points': map_points,
        'total': len(map_points)
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def routes_map(request):
    """
    Rotas ativas para exibição em mapa
    """
    routes = Route.objects.filter(status='active').select_related().values(
        'id', 'name', 'description', 'frequency', 'geometry'
    )
    
    map_routes = []
    for route in routes:
        if route['geometry']:
            map_routes.append({
                'id': route['id'],
                'name': route['name'],
                'description': route['description'],
                'frequency': route['frequency'],
                'geometry': route['geometry']  # GeoJSON será processado pelo frontend
            })
    
    return Response({
        'routes': map_routes,
        'total': len(map_routes)
    })