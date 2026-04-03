#!/bin/bash

set -e

echo "Aplicando migraciones..."
python manage.py migrate --noinput

python manage.py shell << EOF
import os
from django.contrib.auth import get_user_model

User = get_user_model()

if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser(
        username='admin',
        email='admin@hotel.com',
        password='admin123',
        nombres='Administrador',
        apellidos='Sistema'
    )
    print('Superusuario creado: admin / admin123')
EOF

echo "Recolectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "Iniciando servidor..."
exec gunicorn --bind 0.0.0.0:8000 \
    --workers 4 \
    --worker-class sync \
    --worker-connections 1000 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --timeout 30 \
    --keep-alive 2 \
    --access-logfile - \
    --error-logfile - \
    hotel_management.wsgi:application