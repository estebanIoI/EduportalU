-- ===================================================================================
-- MIGRACIÓN: Agregar tablas ROLES y users_roles
-- Fecha: 2025-12-16
-- Descripción: Tablas necesarias para el sistema de roles y permisos
-- ===================================================================================

-- Verificar y crear tabla ROLES si no existe
CREATE TABLE IF NOT EXISTS ROLES (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    NOMBRE_ROL VARCHAR(20) UNIQUE NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar roles base si no existen
INSERT IGNORE INTO ROLES (NOMBRE_ROL) VALUES 
('Admin'), 
('Director Programa');

-- Verificar y crear tabla users_roles si no existe
CREATE TABLE IF NOT EXISTS users_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rol_id INT NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES ROLES(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar usuarios administradores si no existen
INSERT IGNORE INTO users_roles (user_id, rol_id) VALUES
(14609, 1), -- HENRY 
(14610, 1), -- HENRY 
(2191, 1),  -- MAICOL
(1934, 1),  -- ESTEBAN
(20670, 1); -- ESTEBAN

-- ===================================================================================
-- FIN DE LA MIGRACIÓN
-- ===================================================================================
