#!/usr/bin/env bash

# Script de inicializacao do projeto com Docker
# Execute este script para configurar e iniciar o sistema completo

set -euo pipefail

echo "Iniciando Sistema de Coleta de Residuos Solidos Urbanos"
echo "================================================="

# Verificar se o Docker esta instalado
if ! command -v docker >/dev/null 2>&1; then
    echo "ERRO: Docker nao esta instalado. Instale o Docker e tente novamente."
    echo "Veja: https://docs.docker.com/get-docker/"
    exit 1
fi

# Detectar docker-compose (v1) ou docker compose (v2)
if command -v docker-compose >/dev/null 2>&1; then
    DC="docker-compose"
elif docker compose version >/dev/null 2>&1; then
    DC="docker compose"
else
    echo "ERRO: Docker Compose nao encontrado. Instale o Docker Compose e tente novamente."
    echo "Veja: https://docs.docker.com/compose/install/"
    exit 1
fi

# Criar arquivo .env se nao existir (a partir de .env.example se presente)
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "Criando arquivo .env a partir de .env.example..."
        cp .env.example .env
        echo "Arquivo .env criado. Ajuste valores conforme necessario."
    else
        echo "Aviso: .env nao existe e .env.example nao foi encontrado. Prosseguindo com variaveis padrao."
    fi
fi

# Parar containers existentes
echo "Parando containers existentes..."
$DC -f ./docker-compose.yml down

# Construir e iniciar containers
echo "Construindo e iniciando containers..."
$DC -f ./docker-compose.yml up -d --build

# Aguardar o banco de dados ficar pronto (pg_isready)
echo "Aguardando banco de dados ficar pronto..."
for i in $(seq 1 30); do
    if $DC -f ./docker-compose.yml exec -T db pg_isready -U residuos_user -d residuos_db >/dev/null 2>&1; then
        echo "Banco de dados pronto."
        break
    fi
    sleep 2
done

# Executar migracoes e coletar estaticos
echo "Executando migracoes do Django..."
$DC -f ./docker-compose.yml exec -T backend python manage.py makemigrations --noinput
$DC -f ./docker-compose.yml exec -T backend python manage.py migrate --noinput
echo "Coletando arquivos estaticos..."
$DC -f ./docker-compose.yml exec -T backend python manage.py collectstatic --noinput

# Criar superusuario (opcional)
read -r -p "Deseja criar um superusuario agora? (y/n): " CREATE_SU
if [[ "$CREATE_SU" =~ ^[Yy]$ ]]; then
    $DC -f ./docker-compose.yml exec backend python manage.py createsuperuser
fi

echo ""
echo "Sistema iniciado com sucesso."
echo "================================================="
echo "Frontend:       http://localhost:3000"
echo "Backend API:    http://localhost:8000"
echo "Admin Django:   http://localhost:8000/admin"
echo "PostgreSQL:     localhost:5432"
echo "Redis:          localhost:6379"
echo ""
echo "Ver logs:       $DC -f ./docker-compose.yml logs -f"
echo "Parar sistema:  $DC -f ./docker-compose.yml down"
echo "Reiniciar:      $DC -f ./docker-compose.yml restart"
echo ""
echo "================================================="
