"""
Testes de integração para as Views/APIs de Collection Points
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from rest_framework.test import APIClient
from rest_framework import status
from datetime import datetime, timedelta
from django.utils import timezone
from apps.collection_points.models import CollectionPoint, CollectionRecord, WasteType

User = get_user_model()


class CollectionPointViewSetTest(TestCase):
    """Testes para o ViewSet de pontos de coleta"""
    
    def setUp(self):
        """Configuração inicial para todos os testes"""
        self.client = APIClient()
        
        # Criar usuário e autenticar
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        # Criar pontos de coleta de teste
        self.collection_point1 = CollectionPoint.objects.create(
            name='Ponto Centro',
            code='PC-001',
            point_type='container',
            location=Point(-46.6333, -23.5505),
            address='Av. Paulista, 1000',
            neighborhood='Bela Vista',
            capacity_volume=10.0,
            capacity_weight=500.0,
            status='active',
            collection_frequency='daily',
            created_by=self.user
        )
        
        self.collection_point2 = CollectionPoint.objects.create(
            name='Ponto Zona Norte',
            code='PZN-001',
            point_type='bin',
            location=Point(-46.6100, -23.5200),
            address='Rua Norte, 500',
            neighborhood='Santana',
            capacity_volume=5.0,
            capacity_weight=250.0,
            status='full',
            collection_frequency='weekly',
            created_by=self.user
        )
    
    def test_list_collection_points(self):
        """Testa listagem de pontos de coleta"""
        response = self.client.get('/api/collection-points/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_collection_point(self):
        """Testa recuperação de um ponto específico"""
        response = self.client.get(f'/api/collection-points/{self.collection_point1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'PC-001')
        self.assertEqual(response.data['name'], 'Ponto Centro')
    
    def test_create_collection_point(self):
        """Testa criação de novo ponto de coleta"""
        data = {
            'name': 'Novo Ponto',
            'code': 'NP-001',
            'point_type': 'dumpster',
            'location': {
                'type': 'Point',
                'coordinates': [-46.6500, -23.5600]
            },
            'address': 'Rua Nova, 100',
            'neighborhood': 'Vila Mariana',
            'capacity_volume': 15.0,
            'capacity_weight': 750.0,
            'status': 'active',
            'collection_frequency': 'weekly'
        }
        
        response = self.client.post('/api/collection-points/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'NP-001')
        self.assertEqual(CollectionPoint.objects.count(), 3)
    
    def test_update_collection_point(self):
        """Testa atualização de ponto de coleta"""
        data = {
            'name': 'Ponto Centro Atualizado',
            'code': 'PC-001',
            'point_type': 'container',
            'location': {
                'type': 'Point',
                'coordinates': [-46.6333, -23.5505]
            },
            'address': 'Av. Paulista, 1000',
            'neighborhood': 'Bela Vista',
            'capacity_volume': 12.0,
            'capacity_weight': 600.0,
            'status': 'active',
            'collection_frequency': 'daily'
        }
        
        response = self.client.put(
            f'/api/collection-points/{self.collection_point1.id}/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Ponto Centro Atualizado')
        self.assertEqual(response.data['capacity_volume'], 12.0)
    
    def test_delete_collection_point(self):
        """Testa exclusão de ponto de coleta"""
        response = self.client.delete(f'/api/collection-points/{self.collection_point1.id}/')
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CollectionPoint.objects.count(), 1)
    
    def test_filter_by_status(self):
        """Testa filtro por status"""
        response = self.client.get('/api/collection-points/?status=full')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['code'], 'PZN-001')
    
    def test_filter_by_neighborhood(self):
        """Testa filtro por bairro"""
        response = self.client.get('/api/collection-points/?neighborhood=Santana')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
    
    def test_search_by_name(self):
        """Testa busca por nome"""
        response = self.client.get('/api/collection-points/?search=Centro')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Ponto Centro')
    
    def test_stats_endpoint(self):
        """Testa endpoint de estatísticas"""
        response = self.client.get('/api/collection-points/stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_points'], 2)
        self.assertEqual(response.data['active_points'], 1)
        self.assertEqual(response.data['full_points'], 1)
    
    def test_full_points_endpoint(self):
        """Testa endpoint de pontos cheios"""
        response = self.client.get('/api/collection-points/full_points/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['status'], 'full')
    
    def test_needs_collection_endpoint(self):
        """Testa endpoint de pontos que precisam coleta"""
        # Definir última coleta como antiga
        past_date = timezone.now() - timedelta(days=10)
        self.collection_point1.last_collection = past_date
        self.collection_point1.save()
        
        response = self.client.get('/api/collection-points/needs_collection/?days=7')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
    
    def test_collect_endpoint(self):
        """Testa endpoint de registro de coleta"""
        data = {
            'status': 'collected',
            'weight_collected': 300.0,
            'volume_collected': 6.0,
            'fill_level_before': 85.0,
            'fill_level_after': 15.0,
            'notes': 'Coleta realizada com sucesso'
        }
        
        response = self.client.post(
            f'/api/collection-points/{self.collection_point1.id}/collect/',
            data,
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)
        self.assertIn('collection', response.data)
        
        # Verificar se o ponto foi atualizado
        self.collection_point1.refresh_from_db()
        self.assertIsNotNone(self.collection_point1.last_collection)
    
    def test_collection_history_endpoint(self):
        """Testa endpoint de histórico de coletas"""
        # Criar algumas coletas
        for i in range(3):
            CollectionRecord.objects.create(
                collection_point=self.collection_point1,
                collection_date=timezone.now() - timedelta(days=i),
                status='collected',
                weight_collected=200.0 + i * 50,
                collected_by=self.user
            )
        
        response = self.client.get(
            f'/api/collection-points/{self.collection_point1.id}/collection_history/'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)
    
    def test_unauthorized_access(self):
        """Testa acesso não autorizado"""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/collection-points/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class CollectionRecordViewSetTest(TestCase):
    """Testes para o ViewSet de registros de coleta"""
    
    def setUp(self):
        """Configuração inicial"""
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username='collector',
            email='collector@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.collection_point = CollectionPoint.objects.create(
            name='Ponto Teste',
            code='PT-TEST',
            point_type='container',
            location=Point(-46.6333, -23.5505),
            address='Rua Teste, 123',
            neighborhood='Centro',
            capacity_volume=10.0,
            capacity_weight=500.0,
            status='active',
            collection_frequency='weekly',
            created_by=self.user
        )
        
        self.collection_record = CollectionRecord.objects.create(
            collection_point=self.collection_point,
            collection_date=timezone.now(),
            status='collected',
            weight_collected=250.0,
            volume_collected=5.0,
            collected_by=self.user
        )
    
    def test_list_collection_records(self):
        """Testa listagem de registros de coleta"""
        response = self.client.get('/api/collection-records/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_create_collection_record(self):
        """Testa criação de registro de coleta"""
        data = {
            'collection_point': self.collection_point.id,
            'collection_date': timezone.now().isoformat(),
            'status': 'collected',
            'weight_collected': 300.0,
            'volume_collected': 6.5,
            'fill_level_before': 90.0,
            'fill_level_after': 10.0,
            'notes': 'Nova coleta de teste'
        }
        
        response = self.client.post('/api/collection-records/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['weight_collected'], '300.00')
    
    def test_filter_by_status(self):
        """Testa filtro por status"""
        response = self.client.get('/api/collection-records/?status=collected')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 1)
    
    def test_today_collections_endpoint(self):
        """Testa endpoint de coletas de hoje"""
        response = self.client.get('/api/collection-records/today/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Deve incluir o registro criado no setUp (se for o mesmo dia)
        self.assertIsInstance(response.data, list)
    
    def test_stats_endpoint(self):
        """Testa endpoint de estatísticas"""
        response = self.client.get('/api/collection-records/stats/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total_collections', response.data)
        self.assertIn('total_weight', response.data)
        self.assertIn('total_volume', response.data)


class WasteTypeViewSetTest(TestCase):
    """Testes para o ViewSet de tipos de resíduos"""
    
    def setUp(self):
        """Configuração inicial"""
        self.client = APIClient()
        
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
        
        self.waste_type1 = WasteType.objects.create(
            name='Plástico',
            description='Resíduos plásticos',
            color='#0000FF',
            is_recyclable=True,
            is_hazardous=False
        )
        
        self.waste_type2 = WasteType.objects.create(
            name='Vidro',
            description='Resíduos de vidro',
            color='#00FF00',
            is_recyclable=True,
            is_hazardous=False
        )
    
    def test_list_waste_types(self):
        """Testa listagem de tipos de resíduos"""
        response = self.client.get('/api/waste-types/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_create_waste_type(self):
        """Testa criação de tipo de resíduo"""
        data = {
            'name': 'Metal',
            'description': 'Resíduos metálicos',
            'color': '#FF0000',
            'is_recyclable': True,
            'is_hazardous': False
        }
        
        response = self.client.post('/api/waste-types/', data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Metal')
    
    def test_recyclable_endpoint(self):
        """Testa endpoint de resíduos recicláveis"""
        response = self.client.get('/api/waste-types/recyclable/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        for waste_type in response.data:
            self.assertTrue(waste_type['is_recyclable'])
