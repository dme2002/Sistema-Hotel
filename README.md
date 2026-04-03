# 🏨 Sistema de Gestión Hotelera

Sistema completo de gestión hotelera con arquitectura de microservicios, contenerizado con Docker y listo para producción.

## 📋 Características

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **API Gateway**: FastAPI con autenticación JWT
- **Backend**: Django + Django REST Framework
- **Base de Datos**: MariaDB con stored procedures
- **Reverse Proxy**: Nginx
- **Seguridad**: JWT, bcrypt, protección XSS/SQL Injection/CSRF

## 🏗️ Arquitectura

```
┌─────────────┐
│   Nginx     │ ← Reverse Proxy (Puerto 80)
│  (nginx)    │
└──────┬──────┘
       │
   ┌───┴───┐
   │       │
┌──▼───┐ ┌─▼────┐
│React │ │FastAPI│
│(5173)│ │(8001) │
└──────┘ └──┬───┘
            │
       ┌────┴────┐
       │         │
    ┌──▼───┐  ┌─▼──────┐
    │Django│  │MariaDB │
    │(8000)│  │(3306)  │
    └──────┘  └────────┘
```

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker Engine 20.10+
- Docker Compose 2.0+
- Git

### Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd hotel-management-system
```

2. **Configurar variables de entorno**

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

3. **Iniciar los servicios**

```bash
docker-compose up -d
```

4. **Verificar que todo está funcionando**

```bash
docker-compose ps
```

### Acceso a la aplicación

- **Frontend**: http://localhost
- **API Docs**: http://localhost/api/docs (solo desarrollo)
- **Django Admin**: http://localhost/admin

### Credenciales por defecto

- **Admin**: `admin` / `admin123`

## 📁 Estructura del Proyecto

```
hotel-management-system/
├── docker-compose.yml      # Configuración de Docker Compose
├── .env                    # Variables de entorno
├── .env.example            # Ejemplo de variables de entorno
├── README.md               # Este archivo
│
├── frontend/               # React + Vite + TypeScript
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── src/
│       ├── components/     # Componentes reutilizables
│       ├── pages/          # Páginas de la aplicación
│       ├── services/       # Servicios API
│       ├── store/          # Estado global (Zustand)
│       └── types/          # TypeScript types
│
├── api/                    # FastAPI Gateway
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py             # Punto de entrada
│   ├── config.py           # Configuración
│   ├── database.py         # Conexión a BD
│   ├── models/             # Modelos Pydantic
│   ├── routers/            # Endpoints
│   ├── middleware/         # Middlewares
│   └── utils/              # Utilidades
│
├── backend/                # Django Backend
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   ├── hotel_management/   # Configuración Django
│   └── apps/
│       ├── users/          # Gestión de usuarios
│       ├── rooms/          # Gestión de habitaciones
│       └── reservations/   # Gestión de reservas
│
├── nginx/                  # Nginx Reverse Proxy
│   ├── Dockerfile
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
│
└── database/               # MariaDB
    ├── Dockerfile
    ├── my.cnf              # Configuración MySQL
    └── init/
        └── 01_schema.sql   # Script de inicialización
```

## 🔧 Comandos Útiles

### Docker Compose

```bash
# Iniciar todos los servicios
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Ver logs
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f api

# Reconstruir imágenes
docker-compose up -d --build

# Reiniciar un servicio
docker-compose restart api

# Escalar un servicio
docker-compose up -d --scale api=3
```

### Base de Datos

```bash
# Acceder a MariaDB
docker-compose exec db mysql -u hotel_user -p hotel_management

# Backup de la base de datos
docker-compose exec db mysqldump -u root -p hotel_management > backup.sql

# Restaurar backup
docker-compose exec -T db mysql -u root -p hotel_management < backup.sql
```

### Django

```bash
# Crear superusuario
docker-compose exec backend python manage.py createsuperuser

# Ejecutar migraciones
docker-compose exec backend python manage.py migrate

# Shell de Django
docker-compose exec backend python manage.py shell
```

## 🔐 Seguridad

### Variables de Entorno Importantes

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `DJANGO_SECRET_KEY` | Clave secreta de Django | Sí |
| `FASTAPI_SECRET_KEY` | Clave secreta de FastAPI | Sí |
| `DB_ROOT_PASSWORD` | Password root de MariaDB | Sí |
| `DB_PASSWORD` | Password de la app en BD | Sí |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Expiración del token JWT | No (30) |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Expiración del refresh token | No (7) |

### Generar claves seguras

```bash
# Django
openssl rand -base64 50

# FastAPI
openssl rand -hex 32
```

## 🧪 Testing

### Frontend

```bash
cd frontend
npm install
npm run test
```

### API

```bash
cd api
pip install -r requirements.txt
pytest
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py test
```

## 📊 Monitoreo

### Health Checks

- **Nginx**: http://localhost/health
- **API**: http://localhost/api/health
- **Django**: http://localhost/admin/login/

### Logs

```bash
# Ver todos los logs
docker-compose logs -f

# Ver logs con timestamp
docker-compose logs -f -t

# Ver últimas 100 líneas
docker-compose logs --tail=100
```

## 🚀 Despliegue en Producción

### Checklist

1. [ ] Cambiar todas las contraseñas por defecto
2. [ ] Generar nuevas claves secretas
3. [ ] Configurar SSL/TLS
4. [ ] Deshabilitar modo debug
5. [ ] Configurar backups automáticos
6. [ ] Configurar monitoreo
7. [ ] Configurar firewall

### SSL con Let's Encrypt

```bash
# Instalar certbot
docker run -it --rm \
  -v "$(pwd)/certbot-data:/etc/letsencrypt" \
  -v "$(pwd)/nginx/html:/usr/share/nginx/html" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/usr/share/nginx/html \
  -d tu-dominio.com
```

## 🐛 Troubleshooting

### Problemas comunes

#### Los contenedores no inician

```bash
# Verificar logs
docker-compose logs

# Verificar puertos en uso
netstat -tlnp | grep -E '80|8000|8001|3306'
```

#### Error de conexión a la base de datos

```bash
# Verificar que MariaDB está corriendo
docker-compose ps db

# Verificar logs de MariaDB
docker-compose logs db

# Reiniciar MariaDB
docker-compose restart db
```

#### Error de permisos

```bash
# Fix permisos en Linux
sudo chown -R $USER:$USER .
```

## 📚 API Endpoints

### Autenticación

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/login` | Iniciar sesión |
| POST | `/api/auth/register` | Registrar usuario |
| POST | `/api/auth/refresh` | Refrescar token |
| POST | `/api/auth/logout` | Cerrar sesión |
| GET | `/api/auth/me` | Obtener usuario actual |

### Usuarios

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/{id}` | Obtener usuario |
| POST | `/api/users` | Crear usuario |
| PATCH | `/api/users/{id}` | Actualizar usuario |
| DELETE | `/api/users/{id}` | Eliminar usuario |

### Habitaciones

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/rooms` | Listar habitaciones |
| GET | `/api/rooms/{id}` | Obtener habitación |
| POST | `/api/rooms` | Crear habitación |
| PATCH | `/api/rooms/{id}` | Actualizar habitación |
| DELETE | `/api/rooms/{id}` | Eliminar habitación |
| POST | `/api/rooms/disponibles` | Buscar disponibles |

### Reservas

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/reservations` | Listar reservas |
| GET | `/api/reservations/{id}` | Obtener reserva |
| POST | `/api/reservations` | Crear reserva |
| PATCH | `/api/reservations/{id}` | Actualizar reserva |
| POST | `/api/reservations/{id}/estado` | Cambiar estado |
| POST | `/api/reservations/{id}/cancelar` | Cancelar reserva |

## 🤝 Contribuir

1. Fork el repositorio
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT.

## 👥 Autores

- **Desarrollador Principal** - Arquitectura y desarrollo

## 🙏 Agradecimientos

- React Team
- FastAPI Team
- Django Team
- Docker Team

---

## 📞 Soporte

Para soporte, enviar un email a soporte@hotel-management.com o crear un issue en el repositorio.

**¡Gracias por usar nuestro Sistema de Gestión Hotelera! 🏨**
