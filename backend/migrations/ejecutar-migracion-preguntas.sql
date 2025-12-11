-- ============================================================================
-- MIGRACIÓN: Agregar Tablas de Preguntas Genéricas
-- Fecha: 2025-10-16
-- Descripción: Agrega las tablas PREGUNTAS y CONFIGURACION_PREGUNTAS
--              para soportar preguntas genéricas en evaluaciones
-- ============================================================================

-- Seleccionar la base de datos (ajusta el nombre si es diferente)
USE sigedin_ies_v4;

-- ============================================================================
-- 1. CREAR TABLA DE PREGUNTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS PREGUNTAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    TEXTO TEXT NOT NULL COMMENT 'Texto de la pregunta',
    TIPO_PREGUNTA VARCHAR(50) NOT NULL COMMENT 'Tipo: texto_corto, texto_largo, opcion_multiple, etc.',
    ORDEN INT DEFAULT 1 COMMENT 'Orden de visualización de la pregunta',
    ACTIVO BOOLEAN DEFAULT TRUE COMMENT 'Indica si la pregunta está activa',
    OPCIONES TEXT DEFAULT NULL COMMENT 'Opciones en formato JSON para preguntas de opción múltiple',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. CREAR TABLA DE CONFIGURACIÓN DE PREGUNTAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS CONFIGURACION_PREGUNTAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CONFIGURACION_EVALUACION_ID INT NOT NULL COMMENT 'ID de la configuración de evaluación',
    PREGUNTA_ID INT NOT NULL COMMENT 'ID de la pregunta',
    ORDEN INT DEFAULT 1 COMMENT 'Orden de la pregunta en la evaluación',
    ACTIVO BOOLEAN DEFAULT TRUE COMMENT 'Indica si esta configuración está activa',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CONFIGURACION_EVALUACION_ID) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE,
    FOREIGN KEY (PREGUNTA_ID) REFERENCES PREGUNTAS(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================================

-- Verificar si los índices ya existen antes de crearlos
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'PREGUNTAS' 
               AND index_name = 'idx_preguntas_activo');
SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX idx_preguntas_activo ON PREGUNTAS(ACTIVO)', 'SELECT ''Index already exists''');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'PREGUNTAS' 
               AND index_name = 'idx_preguntas_orden');
SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX idx_preguntas_orden ON PREGUNTAS(ORDEN)', 'SELECT ''Index already exists''');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'CONFIGURACION_PREGUNTAS' 
               AND index_name = 'idx_config_preguntas_evaluacion');
SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX idx_config_preguntas_evaluacion ON CONFIGURACION_PREGUNTAS(CONFIGURACION_EVALUACION_ID)', 'SELECT ''Index already exists''');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'CONFIGURACION_PREGUNTAS' 
               AND index_name = 'idx_config_preguntas_pregunta');
SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX idx_config_preguntas_pregunta ON CONFIGURACION_PREGUNTAS(PREGUNTA_ID)', 'SELECT ''Index already exists''');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
               WHERE table_schema = DATABASE() 
               AND table_name = 'CONFIGURACION_PREGUNTAS' 
               AND index_name = 'idx_config_preguntas_activo');
SET @sqlstmt := IF(@exist = 0, 'CREATE INDEX idx_config_preguntas_activo ON CONFIGURACION_PREGUNTAS(ACTIVO)', 'SELECT ''Index already exists''');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================================================
-- 4. INSERTAR PREGUNTAS DE EJEMPLO (OPCIONAL)
-- ============================================================================

-- Solo insertar si la tabla está vacía
INSERT INTO PREGUNTAS (TEXTO, TIPO_PREGUNTA, ORDEN, ACTIVO, OPCIONES)
SELECT * FROM (
    SELECT 
        '¿Qué tan satisfecho está con la calidad de la enseñanza?' as TEXTO,
        'texto_largo' as TIPO_PREGUNTA,
        1 as ORDEN,
        TRUE as ACTIVO,
        NULL as OPCIONES
    UNION ALL
    SELECT 
        '¿Recomendaría este curso a otros estudiantes?',
        'opcion_multiple',
        2,
        TRUE,
        '["Sí, definitivamente", "Probablemente sí", "No estoy seguro", "Probablemente no", "Definitivamente no"]'
    UNION ALL
    SELECT 
        '¿Cuál aspecto del curso considera más valioso?',
        'opcion_multiple',
        3,
        TRUE,
        '["Contenido teórico", "Práctica aplicada", "Material de apoyo", "Metodología del docente"]'
    UNION ALL
    SELECT 
        'Comentarios o sugerencias adicionales (opcional)',
        'texto_largo',
        4,
        TRUE,
        NULL
) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM PREGUNTAS LIMIT 1);

-- ============================================================================
-- 5. VERIFICACIÓN DE LA MIGRACIÓN
-- ============================================================================

-- Mostrar las tablas creadas
SELECT 'Verificando tablas creadas...' as Status;

SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    UPDATE_TIME
FROM 
    INFORMATION_SCHEMA.TABLES
WHERE 
    TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME IN ('PREGUNTAS', 'CONFIGURACION_PREGUNTAS');

-- Mostrar preguntas insertadas
SELECT 'Preguntas disponibles:' as Status;
SELECT ID, TEXTO, TIPO_PREGUNTA, ACTIVO FROM PREGUNTAS;

-- Mostrar mensaje de éxito
SELECT '✅ MIGRACIÓN COMPLETADA EXITOSAMENTE' as Status;
SELECT 'Las tablas PREGUNTAS y CONFIGURACION_PREGUNTAS han sido creadas correctamente' as Mensaje;

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 1. Este script es IDEMPOTENTE: puede ejecutarse múltiples veces sin problemas
-- 2. Usa CREATE TABLE IF NOT EXISTS para evitar errores si las tablas ya existen
-- 3. Los índices se crean solo si no existen
-- 4. Las preguntas de ejemplo solo se insertan si la tabla está vacía
-- 5. Recuerda reiniciar el servidor backend después de ejecutar esta migración
-- ============================================================================
