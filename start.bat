@echo off
REM Script de inicialização do projeto com Docker para Windows
REM Execute este script para configurar e iniciar o sistema completo

echo 🚀 Iniciando Sistema de Coleta de Resíduos Sólidos Urbanos
echo =================================================

REM Verificar se o Docker está instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker não está instalado. Por favor, instale o Docker primeiro.
    echo    Visite: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Verificar se o Docker Compose está instalado
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro.
    echo    Visite: https://docs.docker.com/compose/install/
    pause
    exit /b 1
)

REM Criar arquivo .env se não existir
if not exist .env (
    echo 📝 Criando arquivo .env...
    copy .env.example .env
    echo ✅ Arquivo .env criado! Você pode editá-lo conforme necessário.
)

REM Parar containers existentes
echo 🛑 Parando containers existentes...
docker-compose down

REM Construir e iniciar containers
echo 🔨 Construindo containers...
docker-compose build

echo 🚀 Iniciando containers...
docker-compose up -d

REM Aguardar o banco de dados estar pronto
echo ⏳ Aguardando banco de dados estar pronto...
timeout /t 15 /nobreak

REM Aguardar os containers estarem prontos
echo ⏳ Aguardando containers estarem prontos...
timeout /t 10 /nobreak

REM Criar superusuário (opcional)
echo.
set /p create_superuser=👤 Deseja criar um superusuário? (y/n): 
if /i "%create_superuser%"=="y" (
    docker-compose exec backend python manage.py createsuperuser
)

echo.
echo 🎉 Sistema iniciado com sucesso!
echo =================================================
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:8000
echo 📊 Admin Django: http://localhost:8000/admin
echo 🐘 PostgreSQL: localhost:5432
echo 📮 Redis: localhost:6379
echo.
echo 📋 Para ver os logs:
echo    docker-compose logs -f
echo.
echo 🛑 Para parar o sistema:
echo    docker-compose down
echo.
echo 🔄 Para reiniciar:
echo    docker-compose restart
echo.
echo =================================================
pause