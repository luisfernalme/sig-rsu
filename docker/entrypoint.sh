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
# Mesma regra do settings.py: true/1/yes, sem diferenciar maiúsculas
DEBUG_NORMALIZED=$(echo "${DEBUG:-true}" | tr '[:upper:]' '[:lower:]')
case "$DEBUG_NORMALIZED" in
  true|1|yes) IS_DEBUG=1 ;;
  *) IS_DEBUG=0 ;;
esac

if [ "$IS_DEBUG" = "1" ]; then
  echo "Iniciando servidor de desenvolvimento Django..."
  exec python manage.py runserver 0.0.0.0:8000
else
  echo "Iniciando servidor Gunicorn (produção)..."
  exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --threads 4 \
    --timeout 120 \
    --access-logfile -
fi
