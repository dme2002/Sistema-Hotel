FROM nginx:1.25-alpine

# Instalar herramientas útiles
RUN apk add --no-cache curl

# Eliminar configuración por defecto
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada
COPY nginx.conf /etc/nginx/nginx.conf
COPY conf.d/ /etc/nginx/conf.d/

# Crear directorios para archivos estáticos
RUN mkdir -p /var/www/static /var/www/media

# Puerto HTTP
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
