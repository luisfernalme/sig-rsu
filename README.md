## Sistema Web de Coleta de Resíduos Sólidos Urbanos

Sistema completo para gestão da coleta de resíduos sólidos urbanos, com backend em **Django + Django REST Framework + PostGIS**, frontend em **React** e infraestrutura **dockerizada** com PostgreSQL/PostGIS, Redis e Celery.

Este sistema foi desenvolvido como parte de um **Trabalho de Conclusão de Curso (TCC)** do curso de **Sistemas de Informação** da **Universidade Federal de Viçosa - Campus Rio Paranaíba (UFV‑CRP)**.


## Visão geral

Principais funcionalidades:

- Autenticação com usuário customizado (papéis: administrador, operador, visualizador)
- Gestão de rotas de coleta (cadastro, agendamento, execuções, otimização básica)
- Gestão de pontos de coleta com georreferenciamento (PostGIS)
- Registro de coletas, tipos de resíduos e fotos dos pontos
- Gestão de veículos e vinculação às rotas/coletas
- API pública/documentada com **drf-spectacular** (OpenAPI)
- Execução de tarefas assíncronas e agendadas via **Celery + Redis**
- Frontend React com dashboards, mapas (Leaflet) e gráficos (Chart.js)

Arquitetura em alto nível:

- **backend/**: projeto Django com apps `authentication`, `routes`, `vehicles`, `collection_points`, `collections`, `reports`, `public_api`
- **frontend/**: aplicação React (Create React App) consumindo a API em `/api`
- **docker-compose.yml**: orquestra `db` (PostGIS), `backend`, `frontend`, `redis`, `celery`, `celery-beat`



## Tecnologias principais

- **Backend**: Python 3.11, Django, Django REST Framework, Django GIS (PostGIS), SimpleJWT, django-filters, drf-spectacular, Celery, django-celery-beat
- **Banco de dados**: PostgreSQL + PostGIS
- **Mensageria**: Redis
- **Frontend**: React 18, React Router, Axios, React-Query, React Bootstrap, Leaflet/React-Leaflet, Chart.js
- **Infraestrutura**: Docker, docker-compose



## Estrutura do repositório

- `backend/`
  - `config/` – configurações Django (`settings.py`, `urls.py`, `celery.py` etc.)
  - `apps/`
    - `authentication/` – usuário customizado, perfis e autenticação JWT
    - `routes/` – rotas, agendamentos, execuções e otimizações
    - `vehicles/` – cadastro de veículos
    - `collection_points/` – pontos de coleta, tipos de resíduos, fotos
    - `collections/` – operações de coleta e itens de coleta por rota
    - `reports/` – relatórios e métricas
    - `public_api/` – endpoints públicos/externos
  - `tests/` – testes automatizados (pytest)
- `frontend/`
  - `src/` – aplicação React (páginas de Dashboard, Rotas, Veículos, Pontos de Coleta, Relatórios, etc.)
- `docker-compose.yml` – definição dos serviços (db, backend, frontend, redis, celery, celery-beat)
- `Dockerfile.backend` – imagem do backend Django
- `Dockerfile.frontend` – imagem do frontend React
- `database/init.sql` – inicialização do banco Postgres/PostGIS
- `docker/entrypoint.sh` – script de inicialização do backend


## Pré‑requisitos

- **Docker** e **Docker Compose** instalados

Todo o ambiente (PostgreSQL/PostGIS, Redis, backend e frontend) é iniciado via Docker; não é necessário instalar Python/Node localmente para rodar o sistema.


## Como executar o projeto (Docker)

Na raiz do repositório `sistema-coleta-rsu`:

1. Construir e subir os contêineres (primeira vez pode demorar):

   ```powershell
   docker-compose up --build
   ```

   Após a primeira execução, você pode usar apenas:

   ```powershell
   docker-compose up
   ```

2. Em outro terminal, aplicar migrações do backend (se ainda não foram aplicadas):

   ```powershell
   # tarefa já configurada no VS Code (shell: docker-migrate-backend)
   docker-compose exec -T backend python manage.py makemigrations --noinput
   docker-compose exec -T backend python manage.py migrate --noinput
   ```

3. (Opcional) Criar um superusuário para acesso ao Django Admin e ao sistema:

   ```powershell
   docker-compose exec -T backend python manage.py createsuperuser
   ```

4. Acessar as interfaces:

   - API/backend: http://localhost:8000/
   - Documentação OpenAPI (drf-spectacular, se configurada em `urls.py`): normalmente em `/api/schema/` ou `/api/docs/`
   - Frontend React: http://localhost:3000/

Os serviços configurados em `docker-compose.yml` são:

- `db` – PostgreSQL com PostGIS, usando `database/init.sql` na inicialização
- `redis` – broker/result backend para Celery
- `backend` – aplicação Django, exposta em `8000:8000`
- `frontend` – aplicação React, exposta em `3000:3000`
- `celery` – worker de tarefas assíncronas
- `celery-beat` – agendador de tarefas

## Configuração de ambiente

As principais variáveis de ambiente são definidas via `docker-compose.yml` usando valores padrão. Você pode sobrescrever via `.env` ou variáveis de ambiente do seu sistema.

Backend (`backend`/`celery`/`celery-beat`):

- `DEBUG` – `1`/`0` (default: `1`)
- `SECRET_KEY` – chave secreta Django (mude em produção)
- `DATABASE_URL` – URL de conexão (padrão: `postgres://residuos_user:residuos_password@db:5432/residuos_db`)
- `REDIS_URL` – URL do Redis (padrão: `redis://redis:6379/0`)
- `ALLOWED_HOSTS` – hosts permitidos, separados por vírgula
- `CORS_ALLOWED_ORIGINS` – origens permitidas para o frontend

Banco (`db`):

- `POSTGRES_DB` – nome do banco (default: `residuos_db`)
- `POSTGRES_USER` – usuário (default: `residuos_user`)
- `POSTGRES_PASSWORD` – senha (default: `residuos_password`)

Frontend (`frontend`):

- `REACT_APP_API_URL` – URL base da API (default: `http://localhost:8000/api`)

## Principais módulos do backend

Alguns destaques dos apps Django:

- `apps.authentication`

  - Modelo `User` customizado (login por e‑mail, papéis, telefone, perfil com avatar)
  - Integração com **Simple JWT** para autenticação via tokens

- `apps.routes`

  - Modelagem de rotas de coleta, agendamentos (`RouteSchedule`) e execuções (`RouteExecution`)

- `apps.collection_points`

  - Pontos de coleta com localização geográfica, tipo, frequência, status (ativo, cheio, manutenção etc.)
  - Registro de coletas (
    `CollectionRecord`), tipos de resíduos, fotos e métricas agregadas
  - Ações úteis como `needs_collection`, `full_points`, `by_neighborhood`, histórico de coletas

- `apps.collections`

  - Agrupa execuções de coleta (`Collection`) e itens por ponto (`CollectionItem`)
  - Ações `start`, `complete`, `cancel` e gerenciamento de itens (peso coletado, marcação de coletado etc.)

- `apps.vehicles`

  - Cadastro de veículos de coleta e vinculação às rotas/coleções (detalhes nos models/serializers)

- `apps.reports` / `apps.public_api`
  - Relatórios agregados, estatísticas e possíveis endpoints externos

Todos os endpoints seguem o padrão REST via Django REST Framework, com filtros, busca e ordenação configurados através de `django-filter` e filtros DRF.

## Frontend (React)

O frontend, localizado em `frontend/`, foi construído com **Create React App** e utiliza:

- React Router para navegação entre páginas (Dashboard, Rotas, Veículos, Pontos de Coleta, Relatórios, etc.)
- React Bootstrap + Bootstrap para layout responsivo
- Leaflet / React-Leaflet para exibição de mapas e pontos de coleta
- Axios + React Query para chamadas de API e cache de dados
- React Hook Form para formulários
- Chart.js / react-chartjs-2 para gráficos e indicadores

Em desenvolvimento local sem Docker, você pode rodar o frontend isolado (se tiver Node instalado):

```powershell
cd frontend
npm install
npm start
```

O `package.json` define um `proxy` para `http://localhost:8000`, permitindo consumir a API de desenvolvimento do backend.