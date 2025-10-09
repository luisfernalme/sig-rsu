# Generated migration for CollectionPointPhoto model

from django.conf import settings
from django.db import migrations, models
import django.contrib.gis.db.models.fields
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('collection_points', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='CollectionPointPhoto',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('photo', models.ImageField(upload_to='collection_point_photos/%Y/%m/', verbose_name='Foto')),
                ('photo_type', models.CharField(choices=[('location', 'Localização'), ('container', 'Contêiner'), ('before_collection', 'Antes da Coleta'), ('after_collection', 'Depois da Coleta'), ('maintenance', 'Manutenção'), ('damage', 'Dano/Problema'), ('other', 'Outro')], default='other', max_length=20, verbose_name='Tipo de Foto')),
                ('title', models.CharField(blank=True, max_length=100, verbose_name='Título')),
                ('description', models.TextField(blank=True, verbose_name='Descrição')),
                ('photo_location', django.contrib.gis.db.models.fields.PointField(blank=True, null=True, srid=4326, verbose_name='Localização da Foto')),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('is_primary', models.BooleanField(default=False, verbose_name='Foto Principal')),
                ('collection_point', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='collection_points.collectionpoint')),
                ('collection_record', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='photos', to='collection_points.collectionrecord')),
                ('uploaded_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='uploaded_photos', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Foto do Ponto de Coleta',
                'verbose_name_plural': 'Fotos dos Pontos de Coleta',
                'db_table': 'collection_point_photos',
                'ordering': ['-uploaded_at'],
            },
        ),
    ]
