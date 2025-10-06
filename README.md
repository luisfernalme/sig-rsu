# 🚮 Sistema de Coleta de Resíduos Sólidos Urbanos

Sistema web completo para gerenciamento e controle da coleta de resíduos sólidos urbanos, desenvolvido com Django (backend) e React (frontend), totalmente containerizado com Docker.

## 🚀 Início Rápido com Docker

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) instalado

### Instalação e Execução

1. **Clone o repositório** (se necessário):
   ```bash
   git clone <url-do-repositorio>
   cd sistema-coleta-rsu
   ```

2. **Execute o script de inicialização**:
   
   **Windows:**
   ```cmd
   start.bat
   ```
   
   **Linux/Mac:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **Acesse o sistema**:
   - 🌐 **Frontend**: http://localhost:3000
   - 🔧 **Backend API**: http://localhost:8000
   - 📊 **Admin Django**: http://localhost:8000/admin

### Comandos Docker Úteis

```bash
# Iniciar o sistema
docker-compose up -d

# Parar o sistema
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar serviços
docker-compose restart

# Executar comandos no backend
docker-compose exec backend python manage.py <comando>

# Executar comandos no frontend
docker-compose exec frontend npm <comando>

# Limpar tudo (cuidado: remove dados!)
docker-compose down -v
docker system prune -a
```

## 📁 Estrutura do Projeto

```
├── backend/                 # Django Backend
│   ├── config/             # Configurações Django
│   ├── apps/               # Aplicações Django
│   │   ├── authentication/  # Sistema de autenticação
│   │   ├── routes/         # Gestão de rotas
│   │   ├── vehicles/       # Gestão de veículos
│   │   ├── collection_points/ # Pontos de coleta
│   │   ├── reports/        # Relatórios
│   │   └── public_api/     # API pública
│   └── requirements.txt    # Dependências Python
│
├── frontend/               # React Frontend
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   └── services/       # Serviços API
│   └── package.json        # Dependências Node.js
│
├── database/               # Configurações do banco
├── docker/                 # Configurações Docker
├── docs/                   # Documentação
├── docker-compose.yml      # Orquestração dos containers
├── Dockerfile.backend      # Container do Django
├── Dockerfile.frontend     # Container do React
└── start.bat / start.sh    # Scripts de inicialização
```

## 🐳 Arquitetura Docker

O sistema é composto por 6 containers:

1. **PostgreSQL + PostGIS** - Banco de dados geoespacial
2. **Redis** - Cache e broker para Celery
3. **Django Backend** - API REST
4. **React Frontend** - Interface web
5. **Celery Worker** - Processamento de tarefas
6. **Celery Beat** - Agendador de tarefas

## 🌟 Funcionalidades

### 🔐 Autenticação e Autorização
- Login/logout de usuários
- Controle de acesso baseado em roles
- JWT tokens para API

### 🗺️ Gestão de Rotas
- Criação e edição de rotas de coleta
- Otimização automática de rotas
- Visualização em mapa interativo
- Geolocalização com PostGIS

### 🚛 Gestão de Veículos
- Cadastro de frota
- Rastreamento GPS
- Monitoramento de combustível
- Histórico de manutenção

### 📍 Pontos de Coleta
- Mapeamento de pontos
- Categorização por tipo
- Agendamento de coletas
- Status em tempo real

### 📊 Relatórios e Análises
- Dashboard com métricas
- Relatórios de eficiência
- Gráficos interativos
- Exportação em PDF/Excel

### 🌐 API Pública
- Consulta de horários
- Informações de rotas
- Dados abertos

## ⚙️ Configuração

### Variáveis de Ambiente

O arquivo `.env` é criado automaticamente baseado no `.env.example`. Principais configurações:

```env
# Django
DEBUG=1
SECRET_KEY=sua-chave-secreta
ALLOWED_HOSTS=localhost,127.0.0.1

# Banco de Dados
DATABASE_URL=postgres://residuos_user:residuos_password@db:5432/residuos_db

# Redis
REDIS_URL=redis://redis:6379/0

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
```

### Banco de Dados

O PostgreSQL com PostGIS é configurado automaticamente com:
- Database: `residuos_db`
- User: `residuos_user`
- Password: `residuos_password`
- Extensões PostGIS habilitadas

## 🔧 Desenvolvimento

### Backend (Django)

```bash
# Executar migrações
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Criar superusuário
docker-compose exec backend python manage.py createsuperuser

# Executar testes
docker-compose exec backend python manage.py test

# Shell Django
docker-compose exec backend python manage.py shell
```

### Frontend (React)

```bash
# Instalar dependências
docker-compose exec frontend npm install

# Executar testes
docker-compose exec frontend npm test

# Build para produção
docker-compose exec frontend npm run build
```

## 📖 Documentação da API

Com o sistema rodando, acesse:
- Swagger UI (preferido): http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- Schema JSON: http://localhost:8000/api/schema/
- Compatibilidade: http://localhost:8000/api/schema/swagger-ui/ e http://localhost:8000/api/schema/redoc/

## 🎯 Uso do Sistema

1. **Acesse** http://localhost:3000
2. **Faça login** com as credenciais criadas
3. **Configure** veículos na seção "Veículos"
4. **Cadastre** pontos de coleta em "Pontos de Coleta"
5. **Crie rotas** otimizadas em "Rotas"
6. **Monitore** o progresso no "Dashboard"
7. **Gere relatórios** na seção "Relatórios"

## 🚨 Problemas Comuns

### Porta ocupada
```bash
# Verificar portas em uso
netstat -an | grep :3000
netstat -an | grep :8000

# Parar containers
docker-compose down
```

### Banco não conecta
```bash
# Verificar logs do banco
docker-compose logs db

# Recriar containers
docker-compose down
docker-compose up -d
```

### Erros de permissão
```bash
# Linux/Mac - ajustar permissões
sudo chown -R $USER:$USER .
```

## 📝 Logs

```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## 🛡️ Segurança

Para produção, altere:
- `SECRET_KEY` no Django
- Senhas do banco de dados
- Configure HTTPS
- Use volumes externos para dados
- Configure backup automático

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para detalhes.

---

**Desenvolvido para TCC - Sistema de Coleta de Resíduos Sólidos Urbanos** 🎓