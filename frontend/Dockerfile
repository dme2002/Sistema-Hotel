# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package.json
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Build de producción
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Copiar build al directorio de nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuracion de nginx para SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
