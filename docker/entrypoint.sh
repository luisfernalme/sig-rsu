#!/bin/bash

# Script de entrada do backend Django
echo "Iniciando Backend Django..."

# Aguardar o banco de dados estar disponível
echo "Aguardando banco de dados..."
while ! nc -z db 5432; do
  sleep 0.1
done
echo "Banco de dados conectado!"

# Executar migrações
echo "Executando migrações..."
python manage.py makemigrations --noinput
python manage.py migrate --noinput

# Coletar arquivos estáticos
echo "Coletando arquivos estáticos..."
python manage.py collectstatic --noinput

# Iniciar servidor Django
echo "Iniciando servidor Django..."
exec python manage.py runserver 0.0.0.0:8000