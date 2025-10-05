from rest_framework import serializers
from datetime import date, timedelta
from apps.collection_points.models import CollectionPoint
from apps.routes.models import Route, RouteExecution


class PublicCollectionPointSerializer(serializers.ModelSerializer):
    """
    Serializer público para pontos de coleta (dados limitados)
    """
    type_display = serializers.CharField(source='get_point_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    next_collection_date = serializers.SerializerMethodField()
    
    class Meta:
        model = CollectionPoint
        fields = [
            'id', 'name', 'code', 'point_type', 'type_display',
            'address', 'neighborhood', 'status', 'status_display',
            'collection_frequency', 'last_collection', 'next_collection_date'
        ]
    
    def get_next_collection_date(self, obj):
        """
        Próxima data estimada de coleta
        """
        if obj.next_collection:
            return obj.next_collection.strftime('%d/%m/%Y')
        return 'A definir'


class PublicRouteSerializer(serializers.ModelSerializer):
    """
    Serializer público para rotas (dados limitados)
    """
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    collection_points_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Route
        fields = [
            'id', 'name', 'description', 'frequency', 'frequency_display',
            'estimated_distance', 'collection_points_count'
        ]
    
    def get_collection_points_count(self, obj):
        """
        Número de pontos na rota
        """
        return obj.collection_points.count()


class CollectionScheduleSerializer(serializers.Serializer):
    """
    Serializer para consulta de horários de coleta
    """
    address = serializers.CharField()
    neighborhood = serializers.CharField(read_only=True)
    collection_points = PublicCollectionPointSerializer(many=True, read_only=True)
    next_collections = serializers.ListField(read_only=True)
    
    def validate_address(self, value):
        """
        Validar endereço
        """
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError(
                "Endereço deve ter pelo menos 5 caracteres."
            )
        return value.strip()


class PublicStatsSerializer(serializers.Serializer):
    """
    Serializer para estatísticas públicas
    """
    total_collection_points = serializers.IntegerField()
    collections_this_month = serializers.IntegerField()
    waste_collected_this_month = serializers.FloatField()
    recycling_rate = serializers.FloatField()
    active_routes = serializers.IntegerField()
    neighborhoods_served = serializers.IntegerField()
    last_updated = serializers.DateTimeField()


class ServiceStatusSerializer(serializers.Serializer):
    """
    Serializer para status do serviço
    """
    service_status = serializers.CharField()
    next_collection_day = serializers.CharField()
    estimated_time = serializers.CharField()
    special_notices = serializers.ListField(child=serializers.CharField())
    contact_info = serializers.DictField()


class WasteDisposalGuideSerializer(serializers.Serializer):
    """
    Serializer para guia de descarte
    """
    waste_type = serializers.CharField()
    description = serializers.CharField()
    disposal_instructions = serializers.CharField()
    collection_points = PublicCollectionPointSerializer(many=True, read_only=True)
    tips = serializers.ListField(child=serializers.CharField())


class CollectionAlertSerializer(serializers.Serializer):
    """
    Serializer para alertas de coleta
    """
    email = serializers.EmailField()
    phone = serializers.CharField(required=False)
    address = serializers.CharField()
    notification_preferences = serializers.MultipleChoiceField(
        choices=[
            ('email', 'Email'),
            ('sms', 'SMS'),
            ('whatsapp', 'WhatsApp')
        ]
    )
    
    def validate_phone(self, value):
        """
        Validar telefone se fornecido
        """
        if value and len(value.replace(' ', '').replace('-', '').replace('(', '').replace(')', '')) < 10:
            raise serializers.ValidationError("Telefone deve ter pelo menos 10 dígitos.")
        return value


class FeedbackSerializer(serializers.Serializer):
    """
    Serializer para feedback público
    """
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, max_length=20)
    category = serializers.ChoiceField(choices=[
        ('collection_missed', 'Coleta não realizada'),
        ('schedule_info', 'Informação sobre horários'),
        ('waste_disposal', 'Dúvida sobre descarte'),
        ('service_quality', 'Qualidade do serviço'),
        ('suggestion', 'Sugestão'),
        ('complaint', 'Reclamação'),
        ('compliment', 'Elogio'),
        ('other', 'Outro')
    ])
    subject = serializers.CharField(max_length=200)
    message = serializers.CharField()
    address = serializers.CharField(required=False, max_length=300)
    priority = serializers.ChoiceField(
        choices=[
            ('low', 'Baixa'),
            ('medium', 'Média'),
            ('high', 'Alta'),
            ('urgent', 'Urgente')
        ],
        default='medium'
    )
    
    def validate_message(self, value):
        """
        Validar mensagem
        """
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Mensagem deve ter pelo menos 10 caracteres."
            )
        return value.strip()


class EmergencyReportSerializer(serializers.Serializer):
    """
    Serializer para relatos de emergência
    """
    reporter_name = serializers.CharField(max_length=100)
    reporter_phone = serializers.CharField(max_length=20)
    reporter_email = serializers.EmailField(required=False)
    location = serializers.CharField(max_length=300)
    emergency_type = serializers.ChoiceField(choices=[
        ('overflow', 'Transbordamento de lixo'),
        ('illegal_dump', 'Descarte irregular'),
        ('blocked_access', 'Acesso bloqueado'),
        ('contamination', 'Contaminação'),
        ('animal_attack', 'Ataque de animais'),
        ('fire', 'Incêndio'),
        ('other', 'Outro')
    ])
    description = serializers.CharField()
    severity = serializers.ChoiceField(choices=[
        ('low', 'Baixa'),
        ('medium', 'Média'),
        ('high', 'Alta'),
        ('critical', 'Crítica')
    ])
    photos = serializers.ListField(
        child=serializers.ImageField(),
        required=False,
        max_length=5
    )
    
    def validate_description(self, value):
        """
        Validar descrição
        """
        if len(value.strip()) < 20:
            raise serializers.ValidationError(
                "Descrição deve ter pelo menos 20 caracteres."
            )
        return value.strip()


class NewsletterSubscriptionSerializer(serializers.Serializer):
    """
    Serializer para inscrição em newsletter
    """
    email = serializers.EmailField()
    name = serializers.CharField(max_length=100, required=False)
    neighborhood = serializers.CharField(max_length=100, required=False)
    interests = serializers.MultipleChoiceField(
        choices=[
            ('schedule_changes', 'Mudanças de horário'),
            ('environmental_tips', 'Dicas ambientais'),
            ('recycling_info', 'Informações sobre reciclagem'),
            ('service_updates', 'Atualizações do serviço'),
            ('special_collections', 'Coletas especiais')
        ],
        required=False
    )
    
    def validate_email(self, value):
        """
        Validar se o email já não está cadastrado
        """
        # Aqui seria verificado se o email já existe
        # Por enquanto, apenas validação básica
        return value.lower()