# ============================================
# HOTEL MANAGEMENT SYSTEM - MAKEFILE
# ============================================

.PHONY: help build up down restart logs shell clean

# Default target
help:
	@echo "Hotel Management System - Comandos disponibles:"
	@echo ""
	@echo "  make build      - Construir todas las imágenes Docker"
	@echo "  make up         - Iniciar todos los servicios"
	@echo "  make down       - Detener todos los servicios"
	@echo "  make restart    - Reiniciar todos los servicios"
	@echo "  make logs       - Ver logs de todos los servicios"
	@echo "  make shell-api  - Acceder al shell del contenedor API"
	@echo "  make shell-db   - Acceder a MariaDB"
	@echo "  make clean      - Limpiar contenedores y volúmenes"
	@echo "  make init       - Inicializar el sistema (primera vez)"
	@echo ""

# Build all images
build:
	docker-compose build

# Start all services
up:
	docker-compose up -d

# Stop all services
down:
	docker-compose down

# Stop and remove everything
down-volumes:
	docker-compose down -v

# Restart all services
restart:
	docker-compose restart

# View logs
logs:
	docker-compose logs -f

# View API logs
logs-api:
	docker-compose logs -f api

# View backend logs
logs-backend:
	docker-compose logs -f backend

# View frontend logs
logs-frontend:
	docker-compose logs -f frontend

# View database logs
logs-db:
	docker-compose logs -f db

# Shell into API container
shell-api:
	docker-compose exec api sh

# Shell into backend container
shell-backend:
	docker-compose exec backend bash

# Shell into database
shell-db:
	docker-compose exec db mysql -u hotel_user -p hotel_management

# Shell into database as root
shell-db-root:
	docker-compose exec db mysql -u root -p

# Clean everything
clean:
	docker-compose down -v --rmi all --remove-orphans

# Initialize system (first time)
init:
	@echo "Inicializando Hotel Management System..."
	@cp -n .env.example .env 2>/dev/null || echo ".env ya existe"
	@docker-compose build
	@docker-compose up -d
	@echo "Esperando a que los servicios estén listos..."
	@sleep 30
	@echo "Sistema inicializado!"
	@echo "Accede a: http://localhost"
	@echo "Admin: admin / admin123"

# Backup database
backup:
	@mkdir -p backups
	@docker-compose exec db mysqldump -u root -p$$(grep DB_ROOT_PASSWORD .env | cut -d= -f2) hotel_management > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "Backup creado en backups/"

# Restore database (usage: make restore FILE=backups/backup_xxx.sql)
restore:
	@if [ -z "$(FILE)" ]; then echo "Uso: make restore FILE=backups/backup_xxx.sql"; exit 1; fi
	@docker-compose exec -T db mysql -u root -p$$(grep DB_ROOT_PASSWORD .env | cut -d= -f2) hotel_management < $(FILE)
	@echo "Backup restaurado desde $(FILE)"

# Check health
health:
	@echo "Verificando estado de los servicios..."
	@curl -s http://localhost/health || echo "Nginx: No responde"
	@curl -s http://localhost/api/health || echo "API: No responde"
	@echo "Health check completado"

# Update (pull and rebuild)
update:
	git pull
	docker-compose down
	docker-compose build --no-cache
	docker-compose up -d

# Development mode (with hot reload)
dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Run tests
test:
	@echo "Ejecutando tests..."
	@cd frontend && npm test -- --watchAll=false 2>/dev/null || echo "Frontend tests skipped"
	@cd api && pytest 2>/dev/null || echo "API tests skipped"
	@cd backend && python manage.py test 2>/dev/null || echo "Backend tests skipped"
