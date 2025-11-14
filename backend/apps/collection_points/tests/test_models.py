"""
Testes unitários para os modelos de Collection Points
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.contrib.gis.geos import Point
from datetime import datetime, timedelta
from django.utils import timezone
from apps.collection_points.models import (
    CollectionPoint, CollectionRecord, WasteType, 
    CollectionPointWasteType, CollectionPointPhoto
)

User = get_user_model()


class CollectionPointModelTest(TestCase):
    """Testes para o modelo CollectionPoint"""
    
    def setUp(self):
        """Configuração inicial para todos os testes"""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.collection_point = CollectionPoint.objects.create(
            name='Ponto Teste',
            code='PT-001',
            point_type='container',
            location=Point(-46.6333, -23.5505),  # São Paulo
            address='Rua Teste, 123',
            neighborhood='Bairro Teste',
            capacity_volume=10.0,
            capacity_weight=500.0,
            status='active',
            collection_frequency='weekly',
            created_by=self.user
        )
    
    def test_collection_point_creation(self):
        """Testa a criação de um ponto de coleta"""
        self.assertEqual(self.collection_point.name, 'Ponto Teste')
        self.assertEqual(self.collection_point.code, 'PT-001')
        self.assertEqual(self.collection_point.status, 'active')
        self.assertIsNotNone(self.collection_point.location)
    
    def test_collection_point_str(self):
        """Testa a representação em string do ponto"""
        expected = 'PT-001 - Ponto Teste'
        self.assertEqual(str(self.collection_point), expected)
    
    def test_unique_code_constraint(self):
        """Testa que o código do ponto deve ser único"""
        from django.db import IntegrityError
        
        with self.assertRaises(IntegrityError):
            CollectionPoint.objects.create(
                name='Outro Ponto',
                code='PT-001',  # Código duplicado
                point_type='bin',
                location=Point(-46.6333, -23.5505),
                address='Rua Teste, 456',
                neighborhood='Bairro Teste',
                capacity_volume=5.0,
                capacity_weight=250.0,
                status='active',
                collection_frequency='daily',
                created_by=self.user
            )
    
    def test_collection_point_status_choices(self):
        """Testa os valores válidos para status"""
        valid_statuses = ['active', 'inactive', 'maintenance', 'full']
        
        for status in valid_statuses:
            self.collection_point.status = status
            self.collection_point.save()
            self.assertEqual(self.collection_point.status, status)
    
    def test_collection_frequency_choices(self):
        """Testa os valores válidos para frequência de coleta"""
        valid_frequencies = ['daily', 'weekly', 'biweekly', 'monthly']
        
        for freq in valid_frequencies:
            self.collection_point.collection_frequency = freq
            self.collection_point.save()
            self.assertEqual(self.collection_point.collection_frequency, freq)
    
    def test_last_collection_update(self):
        """Testa atualização da última coleta"""
        now = timezone.now()
        self.collection_point.last_collection = now
        self.collection_point.save()
        
        self.assertEqual(self.collection_point.last_collection, now)
    
    def test_next_collection_calculation(self):
        """Testa cálculo da próxima coleta"""
        now = timezone.now()
        self.collection_point.last_collection = now
        self.collection_point.next_collection = now + timedelta(weeks=1)
        self.collection_point.save()
        
        self.assertIsNotNone(self.collection_point.next_collection)
        self.assertGreater(
            self.collection_point.next_collection,
            self.collection_point.last_collection
        )


class CollectionRecordModelTest(TestCase):
    """Testes para o modelo CollectionRecord"""
    
    def setUp(self):
        """Configuração inicial"""
        self.user = User.objects.create_user(
            username='collector',
            email='collector@example.com',
            password='testpass123'
        )
        
        self.collection_point = CollectionPoint.objects.create(
            name='Ponto Teste',
            code='PT-002',
            point_type='container',
            location=Point(-46.6333, -23.5505),
            address='Rua Teste, 123',
            neighborhood='Bairro Teste',
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
            fill_level_before=80.0,
            fill_level_after=20.0,
            notes='Coleta normal',
            collected_by=self.user
        )
    
    def test_collection_record_creation(self):
        """Testa criação de registro de coleta"""
        self.assertEqual(self.collection_record.status, 'collected')
        self.assertEqual(self.collection_record.weight_collected, 250.0)
        self.assertEqual(self.collection_record.collected_by, self.user)
    
    def test_collection_record_str(self):
        """Testa representação em string do registro"""
        result = str(self.collection_record)
        self.assertIn('PT-002', result)
    
    def test_collection_status_choices(self):
        """Testa valores válidos de status"""
        valid_statuses = ['collected', 'partially_collected', 'not_collected', 'inaccessible']
        
        for status in valid_statuses:
            self.collection_record.status = status
            self.collection_record.save()
            self.assertEqual(self.collection_record.status, status)
    
    def test_collection_with_location(self):
        """Testa registro com localização GPS"""
        location = Point(-46.6333, -23.5505)
        self.collection_record.collection_location = location
        self.collection_record.save()
        
        self.assertIsNotNone(self.collection_record.collection_location)
        self.assertEqual(self.collection_record.collection_location, location)
    
    def test_fill_levels_validation(self):
        """Testa níveis de preenchimento"""
        self.collection_record.fill_level_before = 90.0
        self.collection_record.fill_level_after = 10.0
        self.collection_record.save()
        
        self.assertLess(
            self.collection_record.fill_level_after,
            self.collection_record.fill_level_before
        )


class WasteTypeModelTest(TestCase):
    """Testes para o modelo WasteType"""
    
    def setUp(self):
        """Configuração inicial"""
        self.waste_type = WasteType.objects.create(
            name='Plástico',
            description='Resíduos plásticos recicláveis',
            color='#0000FF',
            is_recyclable=True,
            is_hazardous=False
        )
    
    def test_waste_type_creation(self):
        """Testa criação de tipo de resíduo"""
        self.assertEqual(self.waste_type.name, 'Plástico')
        self.assertTrue(self.waste_type.is_recyclable)
        self.assertFalse(self.waste_type.is_hazardous)
    
    def test_waste_type_str(self):
        """Testa representação em string"""
        self.assertEqual(str(self.waste_type), 'Plástico')
    
    def test_color_hex_format(self):
        """Testa formato da cor hexadecimal"""
        self.assertTrue(self.waste_type.color.startswith('#'))
        self.assertEqual(len(self.waste_type.color), 7)


class CollectionPointWasteTypeModelTest(TestCase):
    """Testes para associação entre pontos e tipos de resíduos"""
    
    def setUp(self):
        """Configuração inicial"""
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        self.collection_point = CollectionPoint.objects.create(
            name='Ponto Teste',
            code='PT-003',
            point_type='container',
            location=Point(-46.6333, -23.5505),
            address='Rua Teste, 123',
            neighborhood='Bairro Teste',
            capacity_volume=10.0,
            capacity_weight=500.0,
            status='active',
            collection_frequency='weekly',
            created_by=self.user
        )
        
        self.waste_type = WasteType.objects.create(
            name='Papel',
            color='#FFFF00',
            is_recyclable=True
        )
        
        self.association = CollectionPointWasteType.objects.create(
            collection_point=self.collection_point,
            waste_type=self.waste_type,
            is_primary=True
        )
    
    def test_association_creation(self):
        """Testa criação de associação"""
        self.assertEqual(self.association.collection_point, self.collection_point)
        self.assertEqual(self.association.waste_type, self.waste_type)
        self.assertTrue(self.association.is_primary)
    
    def test_unique_together_constraint(self):
        """Testa constraint de unicidade"""
        from django.db import IntegrityError
        
        with self.assertRaises(IntegrityError):
            CollectionPointWasteType.objects.create(
                collection_point=self.collection_point,
                waste_type=self.waste_type,
                is_primary=False
            )


class CollectionPointPhotoModelTest(TestCase):
    """Testes para fotos dos pontos de coleta"""
    
    def setUp(self):
        """Configuração inicial"""
        self.user = User.objects.create_user(
            username='photographer',
            password='testpass123'
        )
        
        self.collection_point = CollectionPoint.objects.create(
            name='Ponto Teste',
            code='PT-004',
            point_type='container',
            location=Point(-46.6333, -23.5505),
            address='Rua Teste, 123',
            neighborhood='Bairro Teste',
            capacity_volume=10.0,
            capacity_weight=500.0,
            status='active',
            collection_frequency='weekly',
            created_by=self.user
        )
    
    def test_photo_creation(self):
        """Testa criação de foto (sem arquivo real)"""
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        # Criar arquivo de teste
        photo_file = SimpleUploadedFile(
            name='test_photo.jpg',
            content=b'fake_image_content',
            content_type='image/jpeg'
        )
        
        photo = CollectionPointPhoto.objects.create(
            collection_point=self.collection_point,
            photo=photo_file,
            photo_type='location',
            title='Foto de teste',
            uploaded_by=self.user,
            is_primary=True
        )
        
        self.assertEqual(photo.photo_type, 'location')
        self.assertTrue(photo.is_primary)
        self.assertEqual(photo.uploaded_by, self.user)
    
    def test_photo_type_choices(self):
        """Testa tipos válidos de foto"""
        valid_types = [
            'location', 'container', 'before_collection',
            'after_collection', 'maintenance', 'damage', 'other'
        ]
        
        from django.core.files.uploadedfile import SimpleUploadedFile
        photo_file = SimpleUploadedFile(
            name='test.jpg',
            content=b'fake',
            content_type='image/jpeg'
        )
        
        for photo_type in valid_types:
            photo = CollectionPointPhoto.objects.create(
                collection_point=self.collection_point,
                photo=photo_file,
                photo_type=photo_type,
                uploaded_by=self.user
            )
            self.assertEqual(photo.photo_type, photo_type)
