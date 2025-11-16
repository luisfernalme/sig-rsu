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
