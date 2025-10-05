#!/bin/bash

# Script de inicialização do projeto com Docker
# Execute este script para configurar e iniciar o sistema completo

echo "🚀 Iniciando Sistema de Coleta de Resíduos Sólidos Urbanos"
echo "================================================="

# Verificar se o Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não está instalado. Por favor, instale o Docker primeiro."
    echo "   Visite: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se o Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não está instalado. Por favor, instale o Docker Compose primeiro."
    echo "   Visite: https://docs.docker.com/compose/install/"
    exit 1
fi

# Criar arquivo .env se não existir
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
    echo "✅ Arquivo .env criado! Você pode editá-lo conforme necessário."
fi

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker-compose down

# Remover volumes antigos (opcional - descomente se quiser limpar dados)
# echo "🗑️  Removendo volumes antigos..."
# docker-compose down -v

# Construir e iniciar containers
echo "🔨 Construindo containers..."
docker-compose build

echo "🚀 Iniciando containers..."
docker-compose up -d

# Aguardar o banco de dados estar pronto
echo "⏳ Aguardando banco de dados estar pronto..."
sleep 10

# Executar migrações
echo "📊 Executando migrações do banco de dados..."
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate

# Criar superusuário (opcional)
echo "👤 Deseja criar um superusuário? (y/n)"
read -r create_superuser
if [ "$create_superuser" = "y" ] || [ "$create_superuser" = "Y" ]; then
    docker-compose exec backend python manage.py createsuperuser
fi

# Coletar arquivos estáticos
echo "📁 Coletando arquivos estáticos..."
docker-compose exec backend python manage.py collectstatic --noinput

echo ""
echo "🎉 Sistema iniciado com sucesso!"
echo "================================================="
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📊 Admin Django: http://localhost:8000/admin"
echo "🐘 PostgreSQL: localhost:5432"
echo "📮 Redis: localhost:6379"
echo ""
echo "📋 Para ver os logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 Para parar o sistema:"
echo "   docker-compose down"
echo ""
echo "🔄 Para reiniciar:"
echo "   docker-compose restart"
echo ""
echo "================================================="