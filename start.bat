@echo off
REM Script de inicializacao do projeto com Docker para Windows
REM Execute este script para configurar e iniciar o sistema completo

setlocal EnableExtensions EnableDelayedExpansion

echo Iniciando Sistema de Coleta de Residuos Solidos Urbanos
echo ========================================================

REM Verificar se o Docker esta instalado
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Docker nao esta instalado. Instale o Docker e tente novamente.
    echo Veja: https://docs.docker.com/get-docker/
    pause
    exit /b 1
)

REM Detectar comando do Docker Compose (docker-compose ou docker compose)
set "DOCKER_COMPOSE_CMD=docker-compose"
%DOCKER_COMPOSE_CMD% --version >nul 2>&1
if %errorlevel% neq 0 (
    docker compose version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERRO: Docker Compose nao encontrado. Instale o Docker Compose e tente novamente.
        echo Veja: https://docs.docker.com/compose/install/
        pause
        exit /b 1
    ) else (
        set "DOCKER_COMPOSE_CMD=docker compose"
    )
)

REM Criar arquivo .env se nao existir (a partir de .env.example se presente)
if not exist .env (
    if exist .env.example (
        echo Criando arquivo .env a partir de .env.example...
        copy /Y .env.example .env >nul
        echo Arquivo .env criado. Ajuste valores conforme necessario.
    ) else (
        echo Aviso: .env nao existe e .env.example nao foi encontrado. Prosseguindo com variaveis padrao.
    )
)

REM Parar containers existentes
echo Parando containers existentes...
%DOCKER_COMPOSE_CMD% -f ./docker-compose.yml down

REM Construir e iniciar containers
echo Construindo e iniciando containers...
%DOCKER_COMPOSE_CMD% -f ./docker-compose.yml up -d --build

REM Aguardar banco de dados ficar pronto (pg_isready)
echo Aguardando banco de dados ficar pronto...
set /a WAIT_OK=0
for /L %%I in (1,1,30) do (
    %DOCKER_COMPOSE_CMD% -f ./docker-compose.yml exec -T db pg_isready -U residuos_user -d residuos_db >nul 2>&1
    if !errorlevel! == 0 (
        set /a WAIT_OK=1
        echo Banco de dados pronto.
        goto :DB_READY
    )
    timeout /t 2 /nobreak >nul
)
echo Aviso: Tempo esgotado aguardando o banco. Prosseguindo mesmo assim.
:DB_READY

REM Executar migracoes e coletar estaticos
echo Executando migracoes do Django...
%DOCKER_COMPOSE_CMD% -f ./docker-compose.yml exec -T backend python manage.py makemigrations --noinput
%DOCKER_COMPOSE_CMD% -f ./docker-compose.yml exec -T backend python manage.py migrate --noinput
echo Coletando arquivos estaticos...
%DOCKER_COMPOSE_CMD% -f ./docker-compose.yml exec -T backend python manage.py collectstatic --noinput

REM Criar superusuario (opcional)
echo.
set /p create_superuser=Deseja criar um superusuario agora? (y/n): 
if /i "%create_superuser%"=="y" (
    %DOCKER_COMPOSE_CMD% -f ./docker-compose.yml exec backend python manage.py createsuperuser
)

echo.
echo Sistema iniciado com sucesso.
echo ========================================================
echo Frontend:       http://localhost:3000
echo Backend API:    http://localhost:8000
echo Admin Django:   http://localhost:8000/admin
echo PostgreSQL:     localhost:5432
echo Redis:          localhost:6379
echo.
echo Ver logs:       %DOCKER_COMPOSE_CMD% -f ./docker-compose.yml logs -f
echo Parar sistema:  %DOCKER_COMPOSE_CMD% -f ./docker-compose.yml down
echo Reiniciar:      %DOCKER_COMPOSE_CMD% -f ./docker-compose.yml restart
echo ========================================================
pause
