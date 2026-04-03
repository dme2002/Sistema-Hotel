-- ============================================
-- SISTEMA DE GESTIÓN HOTELERA
-- Script de inicialización de base de datos
-- ============================================

USE hotel_management;

-- ============================================
-- TABLA: ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(255),
    permisos JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,
    last_login DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_rol (rol_id),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: SESIONES
-- ============================================
CREATE TABLE IF NOT EXISTS sesiones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ultima_actividad DATETIME DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_usuario (usuario_id),
    INDEX idx_token (token_jti),
    INDEX idx_expires (expires_at),
    INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: TIPOS_HABITACION
-- ============================================
CREATE TABLE IF NOT EXISTS tipos_habitacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    capacidad_maxima INT NOT NULL DEFAULT 2,
    precio_base DECIMAL(10, 2) NOT NULL,
    amenities JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: HABITACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS habitaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero VARCHAR(10) NOT NULL UNIQUE,
    tipo_id INT NOT NULL,
    piso INT NOT NULL DEFAULT 1,
    estado ENUM('disponible', 'ocupada', 'mantenimiento', 'limpieza') DEFAULT 'disponible',
    precio_actual DECIMAL(10, 2) NOT NULL,
    descripcion TEXT,
    caracteristicas JSON,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_id) REFERENCES tipos_habitacion(id) ON DELETE RESTRICT,
    INDEX idx_numero (numero),
    INDEX idx_tipo (tipo_id),
    INDEX idx_estado (estado),
    INDEX idx_activa (activa)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: RESERVAS
-- ============================================
CREATE TABLE IF NOT EXISTS reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_reserva VARCHAR(20) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    habitacion_id INT NOT NULL,
    fecha_entrada DATE NOT NULL,
    fecha_salida DATE NOT NULL,
    num_huespedes INT NOT NULL DEFAULT 1,
    precio_total DECIMAL(10, 2) NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'check_in', 'check_out', 'cancelada') DEFAULT 'pendiente',
    notas TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (habitacion_id) REFERENCES habitaciones(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_codigo (codigo_reserva),
    INDEX idx_usuario (usuario_id),
    INDEX idx_habitacion (habitacion_id),
    INDEX idx_estado (estado),
    INDEX idx_fechas (fecha_entrada, fecha_salida),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: HISTORIAL_RESERVAS
-- ============================================
CREATE TABLE IF NOT EXISTS historial_reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reserva_id INT NOT NULL,
    accion VARCHAR(50) NOT NULL,
    detalles JSON,
    usuario_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reserva_id) REFERENCES reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_reserva (reserva_id),
    INDEX idx_accion (accion),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

-- Roles predeterminados
INSERT INTO roles (nombre, descripcion, permisos) VALUES
('admin', 'Administrador del sistema con acceso total', 
 '["usuarios:all", "habitaciones:all", "reservas:all", "reportes:all", "config:all"]'),
('recepcionista', 'Personal de recepción para gestionar reservas', 
 '["usuarios:read", "habitaciones:read", "reservas:all", "reportes:read"]'),
('cliente', 'Cliente del hotel para hacer reservas', 
 '["reservas:own", "perfil:own"]');

-- Tipos de habitación
INSERT INTO tipos_habitacion (nombre, descripcion, capacidad_maxima, precio_base, amenities) VALUES
('Estándar', 'Habitación estándar con cama matrimonial', 2, 80.00, 
 '["WiFi", "TV", "Aire acondicionado", "Baño privado"]'),
('Doble', 'Habitación con dos camas individuales', 2, 100.00, 
 '["WiFi", "TV", "Aire acondicionado", "Baño privado", "Escritorio"]'),
('Suite', 'Suite junior con sala de estar', 3, 180.00, 
 '["WiFi", "TV", "Aire acondicionado", "Minibar", "Sala de estar", "Vista al mar"]'),
('Suite Presidencial', 'Suite de lujo con dos habitaciones', 4, 350.00, 
 '["WiFi", "TV", "Aire acondicionado", "Minibar", "Sala de estar", "Jacuzzi", "Vista panorámica", "Servicio a la habitación"]'),
('Familiar', 'Habitación amplia para familias', 5, 150.00, 
 '["WiFi", "TV", "Aire acondicionado", "Baño privado", "Cuna disponible", "Zona de juegos"]');

-- Habitaciones de ejemplo
INSERT INTO habitaciones (numero, tipo_id, piso, estado, precio_actual, descripcion, caracteristicas) VALUES
('101', 1, 1, 'disponible', 80.00, 'Habitación estándar en planta baja', '{"vista": "interior", "balcon": false}'),
('102', 1, 1, 'disponible', 80.00, 'Habitación estándar en planta baja', '{"vista": "interior", "balcon": false}'),
('103', 2, 1, 'disponible', 100.00, 'Habitación doble con vista al jardín', '{"vista": "jardin", "balcon": true}'),
('201', 2, 2, 'disponible', 100.00, 'Habitación doble en segundo piso', '{"vista": "calle", "balcon": false}'),
('202', 3, 2, 'disponible', 180.00, 'Suite junior con vista al mar', '{"vista": "mar", "balcon": true}'),
('203', 1, 2, 'disponible', 80.00, 'Habitación estándar', '{"vista": "interior", "balcon": false}'),
('301', 3, 3, 'disponible', 180.00, 'Suite junior premium', '{"vista": "mar", "balcon": true}'),
('302', 4, 3, 'disponible', 350.00, 'Suite presidencial', '{"vista": "panoramica", "balcon": true, "jacuzzi": true}'),
('303', 5, 3, 'disponible', 150.00, 'Habitación familiar', '{"vista": "jardin", "balcon": true, "cuna": true}'),
('401', 4, 4, 'disponible', 350.00, 'Suite presidencial deluxe', '{"vista": "panoramica", "balcon": true, "jacuzzi": true}');

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Procedimiento: Verificar disponibilidad de habitación
CREATE PROCEDURE sp_verificar_disponibilidad(
    IN p_habitacion_id INT,
    IN p_fecha_entrada DATE,
    IN p_fecha_salida DATE,
    IN p_reserva_id INT
)
BEGIN
    DECLARE v_disponible BOOLEAN DEFAULT TRUE;
    
    SELECT COUNT(*) = 0 INTO v_disponible
    FROM reservas
    WHERE habitacion_id = p_habitacion_id
    AND estado NOT IN ('cancelada', 'check_out')
    AND (
        (p_fecha_entrada >= fecha_entrada AND p_fecha_entrada < fecha_salida)
        OR (p_fecha_salida > fecha_entrada AND p_fecha_salida <= fecha_salida)
        OR (p_fecha_entrada <= fecha_entrada AND p_fecha_salida >= fecha_salida)
    )
    AND (p_reserva_id IS NULL OR id != p_reserva_id);
    
    SELECT v_disponible AS disponible;
END //

-- Procedimiento: Obtener habitaciones disponibles
CREATE PROCEDURE sp_habitaciones_disponibles(
    IN p_fecha_entrada DATE,
    IN p_fecha_salida DATE,
    IN p_capacidad INT
)
BEGIN
    SELECT 
        h.id,
        h.numero,
        h.piso,
        h.precio_actual,
        h.descripcion,
        h.caracteristicas,
        th.nombre AS tipo_nombre,
        th.capacidad_maxima,
        th.amenities
    FROM habitaciones h
    INNER JOIN tipos_habitacion th ON h.tipo_id = th.id
    WHERE h.activa = TRUE
    AND h.estado = 'disponible'
    AND th.capacidad_maxima >= p_capacidad
    AND h.id NOT IN (
        SELECT habitacion_id 
        FROM reservas 
        WHERE estado NOT IN ('cancelada', 'check_out')
        AND (
            (p_fecha_entrada >= fecha_entrada AND p_fecha_entrada < fecha_salida)
            OR (p_fecha_salida > fecha_entrada AND p_fecha_salida <= fecha_salida)
            OR (p_fecha_entrada <= fecha_entrada AND p_fecha_salida >= fecha_salida)
        )
    )
    ORDER BY h.piso, h.numero;
END //

-- Procedimiento: Calcular precio total de reserva
CREATE PROCEDURE sp_calcular_precio(
    IN p_habitacion_id INT,
    IN p_fecha_entrada DATE,
    IN p_fecha_salida DATE,
    OUT p_precio_total DECIMAL(10, 2)
)
BEGIN
    DECLARE v_precio_noche DECIMAL(10, 2);
    DECLARE v_num_noches INT;
    
    SELECT precio_actual INTO v_precio_noche
    FROM habitaciones WHERE id = p_habitacion_id;
    
    SET v_num_noches = DATEDIFF(p_fecha_salida, p_fecha_entrada);
    
    IF v_num_noches < 1 THEN
        SET v_num_noches = 1;
    END IF;
    
    SET p_precio_total = v_precio_noche * v_num_noches;
END //

-- Procedimiento: Registrar actividad en historial
CREATE PROCEDURE sp_registrar_historial(
    IN p_reserva_id INT,
    IN p_accion VARCHAR(50),
    IN p_detalles JSON,
    IN p_usuario_id INT
)
BEGIN
    INSERT INTO historial_reservas (reserva_id, accion, detalles, usuario_id)
    VALUES (p_reserva_id, p_accion, p_detalles, p_usuario_id);
END //

-- Procedimiento: Obtener estadísticas del dashboard
CREATE PROCEDURE sp_dashboard_stats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM habitaciones WHERE activa = TRUE) AS total_habitaciones,
        (SELECT COUNT(*) FROM habitaciones WHERE estado = 'disponible' AND activa = TRUE) AS habitaciones_disponibles,
        (SELECT COUNT(*) FROM habitaciones WHERE estado = 'ocupada' AND activa = TRUE) AS habitaciones_ocupadas,
        (SELECT COUNT(*) FROM habitaciones WHERE estado = 'mantenimiento' AND activa = TRUE) AS habitaciones_mantenimiento,
        (SELECT COUNT(*) FROM reservas WHERE estado IN ('confirmada', 'check_in')) AS reservas_activas,
        (SELECT COUNT(*) FROM reservas WHERE estado = 'pendiente') AS reservas_pendientes,
        (SELECT COALESCE(SUM(precio_total), 0) FROM reservas WHERE estado IN ('confirmada', 'check_in') AND MONTH(created_at) = MONTH(CURDATE())) AS ingresos_mes,
        (SELECT COUNT(*) FROM usuarios WHERE activo = TRUE) AS total_usuarios;
END //

-- Procedimiento: Cancelar reserva
CREATE PROCEDURE sp_cancelar_reserva(
    IN p_reserva_id INT,
    IN p_usuario_id INT,
    IN p_motivo TEXT
)
BEGIN
    DECLARE v_estado VARCHAR(20);
    
    SELECT estado INTO v_estado FROM reservas WHERE id = p_reserva_id;
    
    IF v_estado IN ('pendiente', 'confirmada') THEN
        UPDATE reservas 
        SET estado = 'cancelada', 
            updated_at = NOW()
        WHERE id = p_reserva_id;
        
        CALL sp_registrar_historial(p_reserva_id, 'cancelacion', JSON_OBJECT('motivo', p_motivo), p_usuario_id);
        
        SELECT TRUE AS success, 'Reserva cancelada exitosamente' AS message;
    ELSE
        SELECT FALSE AS success, 'No se puede cancelar una reserva en estado ' + v_estado AS message;
    END IF;
END //

DELIMITER ;
