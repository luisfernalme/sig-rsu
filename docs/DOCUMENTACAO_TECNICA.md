# Documentação Técnica - Sistema de Coleta de Resíduos Sólidos Urbanos

## 📋 Sumário

1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Modelo de Dados](#modelo-de-dados)
4. [Stack Tecnológica](#stack-tecnológica)
5. [Estrutura do Projeto](#estrutura-do-projeto)
6. [Instalação e Configuração](#instalação-e-configuração)
7. [APIs e Endpoints](#apis-e-endpoints)
8. [Autenticação e Autorização](#autenticação-e-autorização)
9. [Testes](#testes)
10. [Deploy e Produção](#deploy-e-produção)
11. [Guia para Desenvolvedores](#guia-para-desenvolvedores)

---

## 1. Visão Geral do Sistema

### 1.1 Propósito

O Sistema de Coleta de Resíduos Sólidos Urbanos é uma plataforma web desenvolvida para gerenciar e otimizar a coleta de resíduos urbanos. O sistema permite o planejamento de rotas, acompanhamento em tempo real das coletas, gestão de veículos e motoristas, e geração de relatórios gerenciais.

### 1.2 Principais Funcionalidades

- **Gestão de Rotas**: Criação, edição e otimização de rotas de coleta com suporte geoespacial
- **Pontos de Coleta**: Cadastro e monitoramento de pontos de coleta com localização GPS
- **Gestão de Veículos**: Controle de frota incluindo manutenções e histórico operacional
- **Gestão de Motoristas**: Cadastro e controle de motoristas com validação de CNH
- **Execução de Coletas**: Registro em tempo real das coletas realizadas
- **Relatórios**: Dashboards e relatórios analíticos sobre operações
- **API Pública**: Endpoints públicos para integração com aplicativos móveis

### 1.3 Usuários do Sistema

- **Administradores**: Acesso completo ao sistema
- **Operadores**: Gestão de coletas, rotas e pontos
- **Visualizadores**: Acesso somente leitura aos dados e relatórios
- **Motoristas**: Acesso via aplicativo móvel para registrar coletas

---

## 2. Arquitetura do Sistema

### 2.1 Arquitetura Geral

O sistema utiliza uma arquitetura **cliente-servidor** com separação clara entre frontend e backend:

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────────┐
│   React SPA     │ ◄─────► │  Django REST API │ ◄─────► │  PostgreSQL +    │
│   (Frontend)    │  HTTPS  │    (Backend)     │   SQL   │    PostGIS       │
└─────────────────┘         └──────────────────┘         └──────────────────┘
                                      │
                                      ▼
                            ┌──────────────────┐
                            │   Redis + Celery │
                            │  (Task Queue)    │
                            └──────────────────┘
```

### 2.2 Componentes Principais

#### 2.2.1 Frontend (React)
- **Framework**: React 18.2.0
- **Roteamento**: React Router v6
- **UI**: Bootstrap 5 + React Bootstrap
- **Mapas**: Leaflet + React Leaflet
- **Gráficos**: Chart.js + React Chartjs 2
- **Requisições HTTP**: Axios
- **Gerenciamento de Estado**: React Query

#### 2.2.2 Backend (Django)
- **Framework**: Django 4.2.7
- **API REST**: Django REST Framework 3.14.0
- **Autenticação**: JWT (Simple JWT)
- **Banco de Dados ORM**: Django ORM com suporte GIS
- **Documentação API**: DRF Spectacular (OpenAPI 3.0)
- **Tarefas Assíncronas**: Celery 5.3.4

#### 2.2.3 Banco de Dados
- **SGBD**: PostgreSQL 15
- **Extensão GIS**: PostGIS 3.3
- **Propósito**: Armazenamento de dados relacionais e geoespaciais

#### 2.2.4 Infraestrutura
- **Containerização**: Docker + Docker Compose
- **Message Broker**: Redis 7
- **Task Scheduler**: Celery Beat

### 2.3 Padrões Arquiteturais

#### 2.3.1 Backend - Padrão MVT (Model-View-Template)
Django implementa uma variação do padrão MVC:
- **Model**: Representação dos dados (models.py)
- **View**: Lógica de negócio (views.py)
- **Template**: Substituído por API REST para frontend SPA

#### 2.3.2 Frontend - Component-Based Architecture
- Componentes reutilizáveis e modulares
- Separação de responsabilidades (apresentação vs lógica)
- Estrutura de pastas por feature

#### 2.3.3 RESTful API
- Recursos identificados por URIs
- Uso adequado de métodos HTTP (GET, POST, PUT, PATCH, DELETE)
- Respostas em JSON
- Versionamento via URL

---

## 3. Modelo de Dados

### 3.1 Diagrama Entidade-Relacionamento

```
┌──────────────┐         ┌──────────────┐         ┌──────────────────┐
│     User     │────────►│    Route     │◄────────│  RouteSchedule   │
└──────────────┘         └──────────────┘         └──────────────────┘
       │                        │                           │
       │                        │                           │
       ▼                        ▼                           ▼
┌──────────────┐         ┌──────────────────┐     ┌──────────────────┐
│UserProfile   │         │ RouteExecution   │────►│   Collection     │
└──────────────┘         └──────────────────┘     └──────────────────┘
                                  │                         │
                                  │                         │
                                  ▼                         ▼
                         ┌──────────────┐         ┌──────────────────┐
                         │   Vehicle    │         │ CollectionItem   │
                         └──────────────┘         └──────────────────┘
                                  │                         │
                                  │                         │
                                  ▼                         ▼
                         ┌──────────────┐         ┌──────────────────┐
                         │    Driver    │         │ CollectionPoint  │
                         └──────────────┘         └──────────────────┘
                                  │                         │
                                  │                         │
                                  ▼                         ▼
                         ┌──────────────┐         ┌──────────────────┐
                         │VehicleMaint. │         │CollectionRecord  │
                         └──────────────┘         └──────────────────┘
```

### 3.2 Entidades Principais

#### 3.2.1 User (Autenticação)
```python
# apps/authentication/models.py
class User(AbstractUser):
    email: EmailField (unique)
    phone: CharField
    role: CharField (choices: admin, operator, viewer)
    is_active: BooleanField
    created_at: DateTimeField
    updated_at: DateTimeField
```

**Relacionamentos:**
- 1:1 com `UserProfile`
- 1:N com `Route` (criador)
- 1:N com `RouteExecution` (motorista)
- 1:N com `CollectionPoint` (criador)

#### 3.2.2 Route (Rotas)
```python
# apps/routes/models.py
class Route(models.Model):
    name: CharField
    description: TextField
    frequency: CharField (daily, weekly, biweekly, monthly)
    status: CharField (active, inactive, maintenance)
    geometry: LineStringField  # PostGIS
    estimated_duration: DurationField
    estimated_distance: FloatField
    created_by: ForeignKey(User)
```

**Recursos Geoespaciais:**
- Armazena trajetória da rota como LineString (PostGIS)
- Suporta consultas espaciais (interseção, proximidade, etc.)

#### 3.2.3 CollectionPoint (Pontos de Coleta)
```python
# apps/collection_points/models.py
class CollectionPoint(models.Model):
    name: CharField
    code: CharField (unique)
    point_type: CharField (container, bin, dumpster, etc.)
    location: PointField  # PostGIS
    address: CharField
    neighborhood: CharField
    capacity_volume: FloatField
    capacity_weight: FloatField
    status: CharField
    collection_frequency: CharField
    last_collection: DateTimeField
    next_collection: DateTimeField
```

**Recursos Geoespaciais:**
- Armazena coordenadas GPS como Point (PostGIS)
- Permite cálculo de distâncias e proximidade

#### 3.2.4 Vehicle (Veículos)
```python
# apps/vehicles/models.py
class Vehicle(models.Model):
    license_plate: CharField (unique)
    model: CharField
    brand: CharField
    year: IntegerField
    vehicle_type: CharField (truck, compactor, pickup, other)
    capacity_weight: FloatField
    capacity_volume: FloatField
    status: CharField (active, maintenance, inactive)
    current_odometer: FloatField
```

#### 3.2.5 Collection (Coletas)
```python
# apps/collections/models.py
class Collection(models.Model):
    route: ForeignKey(Route)
    vehicle: ForeignKey(Vehicle)
    driver: ForeignKey(Driver)
    status: CharField (pending, in_progress, completed, cancelled)
    scheduled_date: DateField
    scheduled_time: TimeField
    start_time: DateTimeField
    end_time: DateTimeField
    total_weight: DecimalField
    distance_traveled: DecimalField
    fuel_consumed: DecimalField
```

### 3.3 Tipos de Dados Geoespaciais

O sistema utiliza **PostGIS** para armazenamento e consulta de dados geoespaciais:

| Tipo | Uso no Sistema | Exemplo |
|------|----------------|---------|
| `Point` | Localização de pontos de coleta | `POINT(-43.9378 -19.9208)` |
| `LineString` | Trajetória de rotas | `LINESTRING(-43.9 -19.9, -43.8 -19.8)` |
| `Polygon` | Áreas de cobertura (futuro) | `POLYGON((0 0, 0 1, 1 1, 1 0, 0 0))` |

**Operações Geoespaciais Disponíveis:**
- Cálculo de distância entre pontos
- Verificação de pontos dentro de raio
- Otimização de rotas por proximidade
- Consulta de pontos próximos a rotas

---

## 4. Stack Tecnológica

### 4.1 Backend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Python** | 3.11 | Linguagem de programação |
| **Django** | 4.2.7 | Framework web |
| **Django REST Framework** | 3.14.0 | Criação de APIs REST |
| **PostgreSQL** | 15 | Banco de dados relacional |
| **PostGIS** | 3.3 | Extensão geoespacial |
| **Redis** | 7 | Cache e message broker |
| **Celery** | 5.3.4 | Processamento assíncrono |
| **JWT** | 5.3.0 | Autenticação stateless |
| **drf-spectacular** | 0.26.5 | Documentação OpenAPI |
| **Pytest** | 7.4.3 | Framework de testes |

### 4.2 Frontend

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **React** | 18.2.0 | Biblioteca UI |
| **React Router** | 6.16.0 | Roteamento SPA |
| **Bootstrap** | 5.3.2 | Framework CSS |
| **Leaflet** | 1.9.4 | Biblioteca de mapas |
| **Axios** | 1.5.1 | Cliente HTTP |
| **Chart.js** | 4.4.0 | Visualização de dados |
| **React Query** | 3.39.3 | Gerenciamento de estado servidor |

### 4.3 DevOps e Infraestrutura

| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| **Docker** | Latest | Containerização |
| **Docker Compose** | Latest | Orquestração de containers |
| **Nginx** | Latest (opcional) | Servidor web reverso |

### 4.4 Dependências Python Principais

```
# Core
Django==4.2.7
djangorestframework==4.2.7
psycopg2-binary==2.9.7
django-cors-headers==4.3.1

# GIS
gdal==3.7.3
Pillow==10.0.1

# Autenticação
djangorestframework-simplejwt==5.3.0

# Background Tasks
celery==5.3.4
redis==5.0.1
django-celery-beat==2.5.0

# Documentação
drf-spectacular==0.26.5

# Testes
pytest==7.4.3
pytest-django==4.5.2
pytest-cov==4.1.0
```

### 4.5 Dependências JavaScript Principais

```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.16.0",
  "axios": "^1.5.1",
  "bootstrap": "^5.3.2",
  "leaflet": "^1.9.4",
  "chart.js": "^4.4.0"
}
```

---

## 5. Estrutura do Projeto

### 5.1 Estrutura de Diretórios

```
sistema-coleta-rsu/
│
├── backend/                          # Backend Django
│   ├── apps/                         # Aplicações Django
│   │   ├── authentication/           # Autenticação e usuários
│   │   │   ├── models.py            # User, UserProfile
│   │   │   ├── serializers.py       # Serializadores DRF
│   │   │   ├── views.py             # ViewSets e views
│   │   │   └── urls.py              # Rotas da API
│   │   │
│   │   ├── routes/                   # Gestão de rotas
│   │   │   ├── models.py            # Route, RouteExecution
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── vehicles/                 # Gestão de veículos
│   │   │   ├── models.py            # Vehicle, Driver
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── collection_points/        # Pontos de coleta
│   │   │   ├── models.py            # CollectionPoint
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── collections/              # Execução de coletas
│   │   │   ├── models.py            # Collection, CollectionItem
│   │   │   ├── serializers.py
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   ├── reports/                  # Relatórios e analytics
│   │   │   ├── views.py
│   │   │   └── urls.py
│   │   │
│   │   └── public_api/               # API pública
│   │       ├── views.py
│   │       └── urls.py
│   │
│   ├── config/                       # Configurações Django
│   │   ├── settings.py              # Configurações do projeto
│   │   ├── urls.py                  # URLs raiz
│   │   ├── celery.py                # Configuração Celery
│   │   └── wsgi.py                  # WSGI config
│   │
│   ├── media/                        # Arquivos de mídia
│   ├── static/                       # Arquivos estáticos
│   ├── logs/                         # Logs da aplicação
│   ├── manage.py                     # CLI Django
│   ├── requirements.txt              # Dependências Python
│   └── pytest.ini                    # Configuração Pytest
│
├── frontend/                         # Frontend React
│   ├── public/                       # Arquivos públicos
│   │   ├── index.html
│   │   └── manifest.json
│   │
│   ├── src/
│   │   ├── components/              # Componentes reutilizáveis
│   │   │   ├── Navigation.js
│   │   │   ├── MapComponent.js
│   │   │   ├── RouteModal.js
│   │   │   ├── CollectionModal.js
│   │   │   └── ...
│   │   │
│   │   ├── pages/                   # Páginas principais
│   │   │   ├── Dashboard.js
│   │   │   ├── Routes.js
│   │   │   ├── Vehicles.js
│   │   │   ├── CollectionPoints.js
│   │   │   └── Reports.js
│   │   │
│   │   ├── services/                # Serviços API
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── routeService.js
│   │   │   └── ...
│   │   │
│   │   ├── App.js                   # Componente raiz
│   │   ├── index.js                 # Entry point
│   │   └── index.css                # Estilos globais
│   │
│   └── package.json                  # Dependências Node.js
│
├── database/                         # Scripts de banco de dados
│   └── init.sql                     # Inicialização PostGIS
│
├── docker/                           # Configurações Docker
│   └── entrypoint.sh                # Script de inicialização
│
├── docs/                             # Documentação adicional
│
├── .env.example                      # Exemplo de variáveis de ambiente
├── docker-compose.yml                # Orquestração de containers
├── Dockerfile.backend                # Imagem Docker do backend
├── Dockerfile.frontend               # Imagem Docker do frontend
├── LICENSE                           # Licença do projeto
└── README.md                         # Documentação principal
```

### 5.2 Organização de Apps Django

Cada aplicação Django segue o padrão de organização:

```
app_name/
├── __init__.py
├── apps.py              # Configuração da app
├── models.py            # Modelos de dados
├── serializers.py       # Serializadores DRF
├── views.py             # Lógica de views/viewsets
├── urls.py              # Rotas da API
├── admin.py             # Interface admin Django
├── migrations/          # Migrações de banco de dados
├── tests/               # Testes unitários
│   ├── __init__.py
│   ├── test_models.py
│   ├── test_views.py
│   └── test_serializers.py
└── management/          # Comandos customizados
    └── commands/
```

### 5.3 Organização Frontend React

```
src/
├── components/          # Componentes reutilizáveis
│   ├── common/         # Componentes genéricos
│   ├── layout/         # Componentes de layout
│   └── modals/         # Modais
│
├── pages/              # Páginas/rotas principais
├── services/           # Lógica de negócio e API
├── utils/              # Funções utilitárias
├── hooks/              # Custom hooks
└── assets/             # Imagens, ícones, etc.
```

---

## 6. Instalação e Configuração

### 6.1 Pré-requisitos

- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **Git**: >= 2.30

*Opcional para desenvolvimento sem Docker:*
- **Python**: 3.11
- **Node.js**: 18.x
- **PostgreSQL**: 15 com PostGIS 3.3
- **Redis**: 7.x

### 6.2 Instalação com Docker (Recomendado)

#### 6.2.1 Clone o Repositório

```bash
git clone https://github.com/luissaster/sistema-coleta-rsu.git
cd sistema-coleta-rsu
```

#### 6.2.2 Configure Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Django
DEBUG=1
SECRET_KEY=django-insecure-change-this-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# Database
POSTGRES_DB=residuos_db
POSTGRES_USER=residuos_user
POSTGRES_PASSWORD=residuos_password
DB_HOST=db
DB_PORT=5432

# Redis
REDIS_URL=redis://redis:6379/0

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
```

#### 6.2.3 Build e Execute os Containers

```bash
# Build das imagens
docker-compose build

# Subir todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

#### 6.2.4 Execute Migrações do Banco de Dados

```bash
# Criar migrações
docker-compose exec backend python manage.py makemigrations

# Aplicar migrações
docker-compose exec backend python manage.py migrate

# Criar superusuário
docker-compose exec backend python manage.py createsuperuser
```

#### 6.2.5 Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Django**: http://localhost:8000/admin
- **API Docs (Swagger)**: http://localhost:8000/api/docs/
- **API Docs (ReDoc)**: http://localhost:8000/api/redoc/

### 6.3 Instalação Manual (Desenvolvimento)

#### 6.3.1 Backend

```bash
cd backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar banco de dados PostgreSQL com PostGIS
# Editar config/settings.py com suas credenciais

# Executar migrações
python manage.py makemigrations
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Coletar arquivos estáticos
python manage.py collectstatic

# Iniciar servidor
python manage.py runserver
```

#### 6.3.2 Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Configurar API URL
# Editar src/services/api.js

# Iniciar servidor de desenvolvimento
npm start
```

#### 6.3.3 Celery (Tarefas Assíncronas)

```bash
# Terminal 1 - Worker
celery -A config worker -l info

# Terminal 2 - Beat (agendador)
celery -A config beat -l info
```

### 6.4 Configurações Importantes

#### 6.4.1 settings.py - Django

```python
# Configurações de segurança para produção
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')
ALLOWED_HOSTS = ['seu-dominio.com']

# CORS
CORS_ALLOWED_ORIGINS = [
    'https://seu-frontend.com',
]

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ.get('POSTGRES_DB'),
        'USER': os.environ.get('POSTGRES_USER'),
        'PASSWORD': os.environ.get('POSTGRES_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# Static files
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_ROOT = BASE_DIR / 'media'
```

#### 6.4.2 api.js - Frontend

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## 7. APIs e Endpoints

### 7.1 Documentação Interativa

A API possui documentação interativa gerada automaticamente:

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **Schema OpenAPI**: http://localhost:8000/api/schema/

### 7.2 Autenticação

#### 7.2.1 Login (Obter Token JWT)

```http
POST /api/auth/token/obtain/
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}

Response 200:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### 7.2.2 Refresh Token

```http
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response 200:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

#### 7.2.3 Logout

```http
POST /api/auth/logout/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}

Response 204 No Content
```

### 7.3 Rotas (Routes)

#### 7.3.1 Listar Rotas

```http
GET /api/routes/
Authorization: Bearer {access_token}

Query Parameters:
- page: número da página
- page_size: itens por página
- status: filtrar por status (active, inactive, maintenance)
- search: buscar por nome

Response 200:
{
  "count": 50,
  "next": "http://localhost:8000/api/routes/?page=2",
  "previous": null,
  "results": [
    {
      "id": 1,
      "name": "Rota Centro",
      "description": "Coleta no centro da cidade",
      "frequency": "daily",
      "status": "active",
      "geometry": {
        "type": "LineString",
        "coordinates": [[-43.9378, -19.9208], ...]
      },
      "estimated_duration": "02:30:00",
      "estimated_distance": 15.5,
      "created_by": 1,
      "created_at": "2025-01-01T10:00:00Z"
    }
  ]
}
```

#### 7.3.2 Criar Rota

```http
POST /api/routes/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Rota Zona Sul",
  "description": "Coleta residencial zona sul",
  "frequency": "weekly",
  "status": "active",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [-43.9378, -19.9208],
      [-43.9350, -19.9220]
    ]
  },
  "estimated_duration": "01:30:00",
  "estimated_distance": 8.2
}

Response 201 Created
```

#### 7.3.3 Atualizar Rota

```http
PATCH /api/routes/{id}/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "status": "maintenance",
  "description": "Rota em manutenção temporária"
}

Response 200 OK
```

#### 7.3.4 Excluir Rota

```http
DELETE /api/routes/{id}/
Authorization: Bearer {access_token}

Response 204 No Content
```

### 7.4 Pontos de Coleta (Collection Points)

#### 7.4.1 Listar Pontos

```http
GET /api/collection-points/
Authorization: Bearer {access_token}

Query Parameters:
- status: filtrar por status
- point_type: filtrar por tipo
- search: buscar por nome ou código
- lat, lng, radius: buscar por proximidade

Response 200:
{
  "count": 100,
  "results": [
    {
      "id": 1,
      "name": "Ponto Centro 01",
      "code": "PC-001",
      "point_type": "container",
      "location": {
        "type": "Point",
        "coordinates": [-43.9378, -19.9208]
      },
      "address": "Rua Principal, 100",
      "neighborhood": "Centro",
      "capacity_volume": 10.0,
      "capacity_weight": 500.0,
      "status": "active",
      "collection_frequency": "daily",
      "last_collection": "2025-01-10T08:30:00Z",
      "next_collection": "2025-01-11T08:30:00Z"
    }
  ]
}
```

#### 7.4.2 Criar Ponto de Coleta

```http
POST /api/collection-points/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "Ponto Zona Norte 05",
  "code": "PZN-005",
  "point_type": "container",
  "location": {
    "type": "Point",
    "coordinates": [-43.9350, -19.9150]
  },
  "address": "Avenida Norte, 500",
  "neighborhood": "Zona Norte",
  "capacity_volume": 15.0,
  "capacity_weight": 750.0,
  "collection_frequency": "weekly"
}

Response 201 Created
```

#### 7.4.3 Upload de Foto

```http
POST /api/collection-points/{id}/upload-photo/
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

photo: [arquivo]
photo_type: "location"
title: "Vista frontal do container"
description: "Foto tirada em 10/01/2025"

Response 201 Created
```

### 7.5 Veículos (Vehicles)

#### 7.5.1 Listar Veículos

```http
GET /api/vehicles/
Authorization: Bearer {access_token}

Response 200:
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "license_plate": "ABC-1234",
      "model": "Cargo 2428",
      "brand": "Ford",
      "year": 2020,
      "vehicle_type": "compactor",
      "capacity_weight": 10000.0,
      "capacity_volume": 30.0,
      "status": "active",
      "current_odometer": 45000.0,
      "last_maintenance": "2025-01-01",
      "next_maintenance": "2025-04-01"
    }
  ]
}
```

### 7.6 Coletas (Collections)

#### 7.6.1 Criar Coleta

```http
POST /api/collections/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "route": 1,
  "vehicle": 1,
  "driver": 5,
  "scheduled_date": "2025-01-15",
  "scheduled_time": "08:00:00",
  "status": "pending"
}

Response 201 Created
```

#### 7.6.2 Iniciar Coleta

```http
POST /api/collections/{id}/start/
Authorization: Bearer {access_token}

Response 200:
{
  "id": 1,
  "status": "in_progress",
  "start_time": "2025-01-15T08:05:00Z"
}
```

#### 7.6.3 Finalizar Coleta

```http
POST /api/collections/{id}/complete/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "total_weight": 1250.5,
  "distance_traveled": 15.8,
  "fuel_consumed": 12.3,
  "notes": "Coleta realizada sem intercorrências"
}

Response 200:
{
  "id": 1,
  "status": "completed",
  "end_time": "2025-01-15T10:35:00Z"
}
```

### 7.7 Relatórios (Reports)

#### 7.7.1 Dashboard

```http
GET /api/reports/dashboard/
Authorization: Bearer {access_token}

Query Parameters:
- start_date: data inicial
- end_date: data final

Response 200:
{
  "total_collections": 150,
  "total_weight": 45000.5,
  "active_routes": 12,
  "active_vehicles": 8,
  "collections_by_status": {
    "completed": 120,
    "in_progress": 5,
    "pending": 20,
    "cancelled": 5
  },
  "collections_by_route": [...],
  "weight_by_date": [...]
}
```

#### 7.7.2 Relatório de Coletas

```http
GET /api/reports/collections/
Authorization: Bearer {access_token}

Query Parameters:
- start_date, end_date: período
- route: filtrar por rota
- vehicle: filtrar por veículo
- driver: filtrar por motorista

Response 200:
{
  "summary": {
    "total_collections": 50,
    "total_weight": 15000.0,
    "avg_duration": "02:15:00",
    "total_distance": 450.5
  },
  "collections": [...]
}
```

### 7.8 API Pública

Endpoints acessíveis sem autenticação para aplicativos móveis:

#### 7.8.1 Listar Rotas Ativas

```http
GET /api/public/routes/
Response 200
```

#### 7.8.2 Pontos de Coleta Próximos

```http
GET /api/public/collection-points/nearby/
Query Parameters:
- lat: latitude
- lng: longitude
- radius: raio em metros (padrão: 1000)

Response 200:
{
  "results": [
    {
      "id": 1,
      "name": "Ponto Centro 01",
      "code": "PC-001",
      "location": {...},
      "address": "Rua Principal, 100",
      "distance": 250.5
    }
  ]
}
```

---

## 8. Autenticação e Autorização

### 8.1 Sistema de Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação stateless:

- **Access Token**: Válido por 1 hora
- **Refresh Token**: Válido por 7 dias
- **Rotação de Tokens**: Tokens de refresh são rotacionados após uso
- **Blacklist**: Tokens invalidados são adicionados à blacklist

### 8.2 Níveis de Acesso

#### 8.2.1 Administrador (admin)
- Acesso completo ao sistema
- Gerenciamento de usuários
- Configurações do sistema
- Todos os relatórios

#### 8.2.2 Operador (operator)
- Criação e edição de rotas
- Gestão de pontos de coleta
- Agendamento de coletas
- Gestão de veículos e motoristas
- Relatórios operacionais

#### 8.2.3 Visualizador (viewer)
- Visualização de rotas e pontos
- Acompanhamento de coletas
- Relatórios básicos
- Sem permissão de edição

### 8.3 Implementação de Permissões

#### 8.3.1 Backend - DRF Permissions

```python
# apps/authentication/permissions.py
from rest_framework import permissions

class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'admin'

class IsOperatorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['admin', 'operator']

class IsAuthenticatedReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.role in ['admin', 'operator']
```

#### 8.3.2 Frontend - Protected Routes

```javascript
// Exemplo de proteção de rotas
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const user = getCurrentUser();
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}
```

### 8.4 Fluxo de Autenticação

```
1. Usuário faz login com email/senha
   ↓
2. Backend valida credenciais
   ↓
3. Backend gera access_token e refresh_token
   ↓
4. Frontend armazena tokens no localStorage
   ↓
5. Frontend inclui access_token em todas as requisições
   ↓
6. Quando access_token expira:
   - Frontend detecta erro 401
   - Solicita novo access_token com refresh_token
   - Atualiza token armazenado
   ↓
7. Logout:
   - Frontend envia refresh_token para blacklist
   - Remove tokens do localStorage
```

---

## 9. Testes

### 9.1 Estratégia de Testes

O projeto implementa três níveis de testes:

1. **Testes Unitários**: Testam componentes isolados
2. **Testes de Integração**: Testam interação entre componentes
3. **Testes End-to-End**: Testam fluxos completos (futuro)

### 9.2 Backend - Pytest

#### 9.2.1 Configuração

```ini
# backend/pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = tests.py test_*.py *_tests.py
addopts = -v --tb=short --strict-markers
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
```

#### 9.2.2 Executar Testes

```bash
# Todos os testes
docker-compose exec backend python manage.py test

# ou com pytest
docker-compose exec backend pytest

# Com cobertura
docker-compose exec backend pytest --cov=apps --cov-report=html

# Teste específico
docker-compose exec backend pytest apps/routes/tests/test_models.py

# Por marcador
docker-compose exec backend pytest -m unit
```

#### 9.2.3 Estrutura de Testes

```python
# apps/routes/tests/test_models.py
import pytest
from django.contrib.gis.geos import LineString
from apps.routes.models import Route
from apps.authentication.models import User

@pytest.mark.django_db
class TestRouteModel:
    def test_create_route(self):
        """Testa criação de rota"""
        user = User.objects.create_user(
            email='test@test.com',
            username='testuser',
            password='testpass123'
        )
        
        route = Route.objects.create(
            name='Rota Teste',
            description='Descrição teste',
            frequency='daily',
            geometry=LineString([(-43.9, -19.9), (-43.8, -19.8)]),
            estimated_duration='01:30:00',
            estimated_distance=10.5,
            created_by=user
        )
        
        assert route.id is not None
        assert route.name == 'Rota Teste'
        assert route.status == 'active'
    
    def test_route_str_representation(self):
        """Testa representação em string"""
        # ... test code
```

### 9.3 Frontend - Jest & React Testing Library

#### 9.3.1 Executar Testes

```bash
cd frontend

# Todos os testes
npm test

# Com cobertura
npm test -- --coverage

# Modo watch
npm test -- --watch
```

#### 9.3.2 Exemplo de Teste

```javascript
// src/components/__tests__/Navigation.test.js
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navigation from '../Navigation';

describe('Navigation Component', () => {
  test('renders navigation links', () => {
    render(
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Rotas')).toBeInTheDocument();
    expect(screen.getByText('Veículos')).toBeInTheDocument();
  });
  
  test('highlights active link', () => {
    // ... test code
  });
});
```

### 9.4 Cobertura de Testes

Metas de cobertura:
- **Backend**: >= 80%
- **Frontend**: >= 70%

Gerar relatório de cobertura:

```bash
# Backend
docker-compose exec backend pytest --cov=apps --cov-report=html
# Relatório em: backend/htmlcov/index.html

# Frontend
cd frontend && npm test -- --coverage
# Relatório em: frontend/coverage/lcov-report/index.html
```

---

## 10. Deploy e Produção

### 10.1 Checklist de Produção

#### 10.1.1 Backend

```python
# config/settings.py

# Segurança
DEBUG = False
SECRET_KEY = os.environ.get('SECRET_KEY')  # Strong random key
ALLOWED_HOSTS = ['api.seudominio.com']

# HTTPS
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000

# CORS
CORS_ALLOWED_ORIGINS = ['https://app.seudominio.com']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': os.environ.get('DB_NAME'),
        'USER': os.environ.get('DB_USER'),
        'PASSWORD': os.environ.get('DB_PASSWORD'),
        'HOST': os.environ.get('DB_HOST'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'require',
        }
    }
}

# Static/Media files
AWS_ACCESS_KEY_ID = os.environ.get('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.environ.get('AWS_SECRET_ACCESS_KEY')
AWS_STORAGE_BUCKET_NAME = os.environ.get('AWS_STORAGE_BUCKET_NAME')
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
```

#### 10.1.2 Frontend

```javascript
// .env.production
REACT_APP_API_URL=https://api.seudominio.com/api
REACT_APP_ENABLE_ANALYTICS=true
```

### 10.2 Docker Compose - Produção

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgis/postgis:15-3.3
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=${POSTGRES_DB}
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
    restart: always
    networks:
      - backend

  redis:
    image: redis:7-alpine
    restart: always
    networks:
      - backend

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    command: gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    environment:
      - DEBUG=0
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis
    restart: always
    networks:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - static_volume:/static
      - media_volume:/media
      - ./certbot/conf:/etc/letsencrypt
      - ./certbot/www:/var/www/certbot
    depends_on:
      - backend
    restart: always
    networks:
      - backend

  celery:
    build:
      context: .
      dockerfile: Dockerfile.backend
    command: celery -A config worker -l info
    environment:
      - DEBUG=0
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis
    restart: always
    networks:
      - backend

volumes:
  postgres_data:
  static_volume:
  media_volume:

networks:
  backend:
    driver: bridge
```

### 10.3 Deploy em Cloud

#### 10.3.1 AWS (Exemplo)

**Serviços Utilizados:**
- **EC2**: Aplicação Django e Celery
- **RDS PostgreSQL**: Banco de dados com PostGIS
- **ElastiCache Redis**: Cache e message broker
- **S3**: Arquivos estáticos e media
- **CloudFront**: CDN para frontend
- **Route53**: DNS
- **Certificate Manager**: SSL/TLS

**Passos:**
1. Criar instância RDS PostgreSQL com extensão PostGIS
2. Criar instância ElastiCache Redis
3. Criar bucket S3 para static e media
4. Configurar EC2 com Docker
5. Deploy da aplicação
6. Configurar CloudFront + S3 para frontend
7. Configurar Route53 e certificados SSL

#### 10.3.2 Heroku (Alternativa Simples)

```bash
# Instalar Heroku CLI
heroku login

# Criar app
heroku create sistema-coleta-rsu

# Adicionar PostgreSQL com PostGIS
heroku addons:create heroku-postgresql:standard-0
heroku pg:psql -c "CREATE EXTENSION postgis;"

# Adicionar Redis
heroku addons:create heroku-redis:premium-0

# Deploy
git push heroku main

# Executar migrações
heroku run python backend/manage.py migrate

# Criar superuser
heroku run python backend/manage.py createsuperuser
```

### 10.4 Monitoramento

#### 10.4.1 Logs

```bash
# Docker logs
docker-compose logs -f backend
docker-compose logs -f celery

# Django logs
tail -f backend/logs/django.log
```

#### 10.4.2 Ferramentas Recomendadas

- **Sentry**: Rastreamento de erros
- **New Relic**: Monitoramento de performance
- **Prometheus + Grafana**: Métricas e dashboards
- **ELK Stack**: Análise de logs

---

## 11. Guia para Desenvolvedores

### 11.1 Padrões de Código

#### 11.1.1 Python (Backend)

```python
# Seguir PEP 8
# Usar formatador: black
black backend/

# Verificar qualidade: flake8
flake8 backend/

# Ordenar imports: isort
isort backend/
```

**Convenções:**
- Classes em PascalCase: `CollectionPoint`
- Funções/métodos em snake_case: `calculate_distance`
- Constantes em UPPER_SNAKE_CASE: `MAX_CAPACITY`
- Variáveis em snake_case: `total_weight`

#### 11.1.2 JavaScript (Frontend)

```bash
# Formatação com Prettier
npm run format

# Linting com ESLint
npm run lint
```

**Convenções:**
- Componentes em PascalCase: `RouteModal.js`
- Funções em camelCase: `fetchRoutes`
- Constantes em UPPER_SNAKE_CASE: `API_URL`

### 11.2 Git Workflow

#### 11.2.1 Branches

```
main (ou master)    - Produção
├── dev             - Desenvolvimento
    ├── feature/xxx - Features
    ├── bugfix/xxx  - Correções
    └── hotfix/xxx  - Correções urgentes
```

#### 11.2.2 Commits

Seguir **Conventional Commits**:

```bash
feat: adiciona filtro por status em coletas
fix: corrige cálculo de distância em rotas
docs: atualiza documentação de API
refactor: refatora serviço de autenticação
test: adiciona testes para modelo Vehicle
chore: atualiza dependências
```

### 11.3 Adicionando Novas Features

#### 11.3.1 Backend - Nova App Django

```bash
# Criar nova app
cd backend
python manage.py startapp nome_da_app apps/nome_da_app

# Adicionar em INSTALLED_APPS (config/settings.py)
LOCAL_APPS = [
    # ...
    'apps.nome_da_app',
]

# Criar modelo
# apps/nome_da_app/models.py

# Criar serializer
# apps/nome_da_app/serializers.py

# Criar viewset
# apps/nome_da_app/views.py

# Criar URLs
# apps/nome_da_app/urls.py

# Incluir URLs no projeto
# config/urls.py
path('api/', include('apps.nome_da_app.urls')),

# Criar e aplicar migrações
python manage.py makemigrations
python manage.py migrate

# Criar testes
# apps/nome_da_app/tests/
```

#### 11.3.2 Frontend - Novo Componente

```bash
cd frontend/src

# Criar componente
mkdir components/NomeComponente
touch components/NomeComponente/NomeComponente.js
touch components/NomeComponente/NomeComponente.css

# Criar serviço (se necessário)
touch services/nomeService.js

# Criar testes
mkdir components/NomeComponente/__tests__
touch components/NomeComponente/__tests__/NomeComponente.test.js
```

### 11.4 Debugging

#### 11.4.1 Backend

```python
# Usar Django Debug Toolbar (apenas em desenvolvimento)
# Já configurado em settings.py

# Prints e logs
import logging
logger = logging.getLogger(__name__)
logger.info('Mensagem informativa')
logger.error('Mensagem de erro')

# Breakpoints com pdb
import pdb; pdb.set_trace()

# Ou ipdb (mais amigável)
import ipdb; ipdb.set_trace()
```

#### 11.4.2 Frontend

```javascript
// Console logs
console.log('Valor:', valor);
console.error('Erro:', erro);
console.table(arrayDeObjetos);

// React DevTools
// Instalar extensão do navegador

// Debugger
debugger;

// Verificar network no navegador (F12)
```

### 11.5 Boas Práticas

#### 11.5.1 Backend

- ✅ Sempre criar migrações após alterar models
- ✅ Escrever docstrings em classes e funções
- ✅ Validar dados nos serializers
- ✅ Usar transactions para operações críticas
- ✅ Implementar paginação em listagens
- ✅ Adicionar índices em campos frequentemente consultados
- ✅ Escrever testes para novas funcionalidades
- ❌ Não armazenar senhas em plain text
- ❌ Não expor informações sensíveis em logs

#### 11.5.2 Frontend

- ✅ Componentizar UI reutilizável
- ✅ Usar React Hooks adequadamente
- ✅ Implementar loading states
- ✅ Tratar erros de API
- ✅ Validar formulários no cliente
- ✅ Otimizar performance (memo, useCallback)
- ❌ Não armazenar dados sensíveis em localStorage
- ❌ Não fazer requisições desnecessárias

### 11.6 Recursos Úteis

#### 11.6.1 Documentação Oficial

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Leaflet Documentation](https://leafletjs.com/)

#### 11.6.2 Ferramentas

- **Postman/Insomnia**: Testar APIs
- **pgAdmin**: Administrar PostgreSQL
- **Redis Commander**: Visualizar dados do Redis
- **React DevTools**: Debug React components
- **Django Debug Toolbar**: Profile queries

### 11.7 Troubleshooting

#### 11.7.1 Problemas Comuns

**Erro: PostGIS não instalado**
```bash
# Conectar ao banco
docker-compose exec db psql -U residuos_user -d residuos_db

# Instalar extensão
CREATE EXTENSION postgis;
```

**Erro: CORS bloqueando requisições**
```python
# Verificar CORS_ALLOWED_ORIGINS em settings.py
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
]
```

**Erro: Migrations conflitantes**
```bash
# Resolver conflitos
python manage.py makemigrations --merge

# Forçar recriar migrações (cuidado!)
# Deletar arquivos de migração
# Dropar e recriar banco de dados
python manage.py makemigrations
python manage.py migrate
```

**Erro: Celery não processando tasks**
```bash
# Verificar se Redis está rodando
docker-compose ps redis

# Verificar logs do Celery
docker-compose logs celery

# Reiniciar worker
docker-compose restart celery
```

---

## 12. Conclusão

Esta documentação técnica fornece uma visão abrangente do Sistema de Coleta de Resíduos Sólidos Urbanos, cobrindo desde a arquitetura e modelo de dados até instruções detalhadas de instalação, configuração e desenvolvimento.

### 12.1 Próximos Passos Sugeridos

1. **Performance**: Implementar cache com Redis
2. **Mobile**: Desenvolver app mobile (React Native/Flutter)
3. **IoT**: Integração com sensores em containers
4. **IA**: Otimização de rotas com Machine Learning
5. **Analytics**: Dashboards avançados com visualizações preditivas
6. **Notificações**: Push notifications para motoristas
7. **Gamificação**: Sistema de pontos para motoristas eficientes

### 12.2 Contribuindo

Para contribuir com o projeto:

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

### 12.3 Suporte

Para dúvidas ou suporte:
- **Issues**: https://github.com/luissaster/sistema-coleta-rsu/issues
- **Discussions**: https://github.com/luissaster/sistema-coleta-rsu/discussions
- **Email**: luisfernalme@gmail.com

### 12.4 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

**Desenvolvido como Trabalho de Conclusão de Curso (TCC)**

*Última atualização: Janeiro 2025*
