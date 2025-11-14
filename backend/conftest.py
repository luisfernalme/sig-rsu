"""
Configuração do pytest para o projeto Django
"""
import os
import sys
import django
from pathlib import Path
import warnings

# Silenciar DeprecationWarning do simplejwt/pkg_resources durante testes
warnings.filterwarnings(
	"ignore",
	message=".*pkg_resources is deprecated as an API.*",
	category=DeprecationWarning,
)

# Adicionar o diretório backend ao path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Configurar Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Inicializar Django
django.setup()
