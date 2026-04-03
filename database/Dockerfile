FROM mariadb:11.2-jammy

# Configuración de zona horaria
ENV TZ=UTC
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Configuración de charset
ENV MYSQL_CHARSET=utf8mb4
ENV MYSQL_COLLATION=utf8mb4_unicode_ci

# Copiar configuración personalizada
COPY my.cnf /etc/mysql/conf.d/

# Asegurar permisos correctos
RUN chmod 644 /etc/mysql/conf.d/my.cnf

# Puerto de MariaDB
EXPOSE 3306

# Healthcheck
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
    CMD mariadb-admin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD || exit 1
