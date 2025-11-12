# Generated migration to remove current_fill_level field

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('collection_points', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='collectionpoint',
            name='current_fill_level',
        ),
    ]
