# Sistema de Coleta de Resíduos Sólidos Urbanos

Sistema web para gerenciamento da coleta de resíduos sólidos urbanos, com backend em Django + PostGIS e frontend em React. O ambiente de desenvolvimento e produção é totalmente containerizado com Docker.

## Instalação e Execução (Docker)

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Procedimento

1.  **Clone o repositório:**

    ```bash
    git clone https://github.com/luissaster/sistema-coleta-rsu.git
    cd sistema-coleta-rsu
    ```

2.  **Execute o script de inicialização:**

    - **Windows:**

      ```cmd
      start.bat
      ```

    - **Linux/Mac:**
      ```bash
      chmod +x start.sh
      ./start.sh
      ```

3.  **Acesse os serviços:**

    - **Frontend:** `http://localhost:3000`
    - **Backend API:** `http://localhost:8000`
    - **Admin Django:** `http://localhost:8000/admin`

4.  **Primeiro Acesso:**
    - Acesse `http://localhost:3000/register` para criar sua conta
    - Ou crie um superuser: `docker-compose exec backend python manage.py createsuperuser`

## Comandos Docker

```bash
# Iniciar os serviços em background
docker-compose up -d

# Parar os serviços
docker-compose down

# Visualizar logs em tempo real
docker-compose logs -f

# Acessar o shell de um serviço (ex: backend)
docker-compose exec backend /bin/bash

# Executar um comando de manage.py
docker-compose exec backend python manage.py <comando>

# Remover containers e volumes (atenção: apaga os dados do banco)
docker-compose down -v
```

## Estrutura do Projeto

```
.
├── backend/            # Projeto Django (API)
├── database/           # Script de inicialização do banco
├── docker/             # Scripts de entrypoint dos containers
├── docs/               # Documentação técnica e de implementação
├── frontend/           # Projeto React (Interface do usuário)
├── docker-compose.yml  # Orquestração dos containers
├── Dockerfile.backend  # Definição do container do Django
├── Dockerfile.frontend # Definição do container do React
└── start.sh / start.bat # Scripts para automação da inicialização
```

## Arquitetura

O ambiente é composto por seis containers Docker:

1.  **`db`**: Banco de dados PostgreSQL com a extensão PostGIS.
2.  **`redis`**: Broker de mensagens para tarefas assíncronas.
3.  **`backend`**: Aplicação Django que serve a API REST.
4.  **`frontend`**: Aplicação React para a interface do usuário.
5.  **`worker`**: Processo do Celery para executar tarefas em background.
6.  **`beat`**: Processo do Celery para agendar tarefas periódicas.

## Funcionalidades Principais

- **Autenticação:** Sistema completo de login/registro com tokens JWT e controle de acesso baseado em permissões (Visualizador, Operador, Administrador).
- **Registro de Usuários:** Novos usuários podem se cadastrar diretamente pela interface web (`/register`).
- **Gestão de Rotas:** Criação, edição e visualização de rotas de coleta em um mapa interativo (Leaflet), com otimização de percurso.
- **Gestão de Veículos:** Cadastro e acompanhamento da frota de veículos.
- **Pontos de Coleta:** Mapeamento e gerenciamento dos pontos de coleta com upload de fotos.
- **Histórico de Coletas:** Registro completo de todas as coletas realizadas.
- **Relatórios:** Geração de relatórios e dashboards para análise de eficiência.
- **API Pública:** Endpoints para consulta pública de informações, como horários de coleta.

## Desenvolvimento

### Backend (Django)

```bash
# Aplicar migrações do banco de dados
docker-compose exec backend python manage.py migrate

# Criar um superusuário para o admin
docker-compose exec backend python manage.py createsuperuser

# Executar testes
docker-compose exec backend python manage.py test
```

### Frontend (React)

```bash
# Instalar novas dependências
docker-compose exec frontend npm install <pacote>

# Executar testes
docker-compose exec frontend npm test
```

## Documentação da API

Após iniciar o sistema, a documentação da API estará disponível nos seguintes endpoints:

- **Swagger UI:** `http://localhost:8000/api/docs/`
- **ReDoc:** `http://localhost:8000/api/redoc/`

## Licença

Este projeto está sob a licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
