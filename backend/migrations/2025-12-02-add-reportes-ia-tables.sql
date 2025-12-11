-- ===================================================================================
-- MIGRACIÓN: Tablas para Módulo de Reportes con IA
-- Fecha: 2025-12-02
-- Descripción: Crear tablas necesarias para reportes por programa, facultad e institucional
--              con soporte para análisis de IA (embeddings y resúmenes)
-- ===================================================================================

USE sigedin_ies_v4;

-- ===================================================================================
-- TABLAS DE ESTRUCTURA ORGANIZACIONAL
-- ===================================================================================

-- Tabla de Facultades
CREATE TABLE IF NOT EXISTS FACULTADES (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CODIGO VARCHAR(20) UNIQUE NOT NULL,
    NOMBRE VARCHAR(200) NOT NULL,
    DESCRIPCION TEXT,
    DECANO_DOCUMENTO VARCHAR(15) NULL COMMENT 'Documento del decano responsable',
    ACTIVO BOOLEAN DEFAULT TRUE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_facultad_codigo (CODIGO),
    INDEX idx_facultad_activo (ACTIVO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Programas Académicos
CREATE TABLE IF NOT EXISTS PROGRAMAS_ACADEMICOS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CODIGO VARCHAR(20) UNIQUE NOT NULL,
    NOMBRE VARCHAR(200) NOT NULL,
    DESCRIPCION TEXT,
    FACULTAD_ID INT NOT NULL,
    DIRECTOR_DOCUMENTO VARCHAR(15) NULL COMMENT 'Documento del director de programa',
    NIVEL VARCHAR(50) DEFAULT 'PREGRADO' COMMENT 'PREGRADO, POSGRADO, MAESTRIA, DOCTORADO',
    MODALIDAD VARCHAR(50) DEFAULT 'PRESENCIAL' COMMENT 'PRESENCIAL, VIRTUAL, HIBRIDO',
    ACTIVO BOOLEAN DEFAULT TRUE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (FACULTAD_ID) REFERENCES FACULTADES(ID) ON DELETE RESTRICT,
    INDEX idx_programa_codigo (CODIGO),
    INDEX idx_programa_facultad (FACULTAD_ID),
    INDEX idx_programa_activo (ACTIVO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Relación Docentes-Programas (un docente puede pertenecer a múltiples programas)
CREATE TABLE IF NOT EXISTS DOCENTES_PROGRAMAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    DOCUMENTO_DOCENTE VARCHAR(15) NOT NULL,
    PROGRAMA_ID INT NOT NULL,
    ES_TITULAR BOOLEAN DEFAULT FALSE COMMENT 'Si es docente titular del programa',
    FECHA_VINCULACION DATE NULL,
    ACTIVO BOOLEAN DEFAULT TRUE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PROGRAMA_ID) REFERENCES PROGRAMAS_ACADEMICOS(ID) ON DELETE CASCADE,
    UNIQUE KEY unique_docente_programa (DOCUMENTO_DOCENTE, PROGRAMA_ID),
    INDEX idx_docente_programa_docente (DOCUMENTO_DOCENTE),
    INDEX idx_docente_programa_programa (PROGRAMA_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================================
-- TABLAS PARA ANÁLISIS DE IA
-- ===================================================================================

-- Tabla para almacenar embeddings de comentarios
CREATE TABLE IF NOT EXISTS COMENTARIOS_EMBEDDINGS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EVALUACION_ID INT NOT NULL,
    EVALUACION_DETALLE_ID INT NULL,
    TIPO_COMENTARIO ENUM('GENERAL', 'ASPECTO') NOT NULL,
    TEXTO_ORIGINAL TEXT NOT NULL,
    EMBEDDING JSON NULL COMMENT 'Vector de embedding generado por nomic-embed-text',
    POLARIDAD ENUM('POSITIVO', 'NEGATIVO', 'NEUTRO') NULL,
    PUNTAJE_POLARIDAD DECIMAL(5,4) NULL COMMENT 'Confianza de la clasificación (0-1)',
    CLUSTER_ID INT NULL COMMENT 'ID del cluster al que pertenece',
    PROCESADO BOOLEAN DEFAULT FALSE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (EVALUACION_ID) REFERENCES EVALUACIONES(ID) ON DELETE CASCADE,
    FOREIGN KEY (EVALUACION_DETALLE_ID) REFERENCES EVALUACION_DETALLE(ID) ON DELETE CASCADE,
    INDEX idx_embedding_evaluacion (EVALUACION_ID),
    INDEX idx_embedding_polaridad (POLARIDAD),
    INDEX idx_embedding_cluster (CLUSTER_ID),
    INDEX idx_embedding_procesado (PROCESADO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para almacenar resúmenes generados por IA
CREATE TABLE IF NOT EXISTS RESUMENES_IA (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    TIPO_RESUMEN ENUM('DOCENTE_MATERIA', 'DOCENTE', 'PROGRAMA', 'FACULTAD', 'INSTITUCIONAL') NOT NULL,
    -- Referencias flexibles según el tipo de resumen
    DOCUMENTO_DOCENTE VARCHAR(15) NULL,
    CODIGO_MATERIA VARCHAR(10) NULL,
    PROGRAMA_ID INT NULL,
    FACULTAD_ID INT NULL,
    CONFIGURACION_ID INT NOT NULL,
    -- Contenido del resumen
    FORTALEZAS JSON NULL COMMENT 'Array de fortalezas identificadas',
    ASPECTOS_MEJORA JSON NULL COMMENT 'Array de aspectos a mejorar',
    FRASES_REPRESENTATIVAS_POSITIVAS JSON NULL COMMENT 'Top 5 frases positivas',
    FRASES_REPRESENTATIVAS_NEGATIVAS JSON NULL COMMENT 'Top 5 frases negativas',
    TENDENCIAS JSON NULL COMMENT 'Tendencias detectadas',
    RESUMEN_EJECUTIVO TEXT NULL COMMENT 'Resumen en texto generado por IA',
    -- Métricas del análisis
    TOTAL_COMENTARIOS_ANALIZADOS INT DEFAULT 0,
    TOTAL_POSITIVOS INT DEFAULT 0,
    TOTAL_NEGATIVOS INT DEFAULT 0,
    TOTAL_NEUTROS INT DEFAULT 0,
    -- Control de versión
    VERSION INT DEFAULT 1,
    MODELO_IA VARCHAR(100) DEFAULT 'phi3.1:mini',
    FECHA_GENERACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    VALIDO_HASTA TIMESTAMP NULL COMMENT 'Fecha de expiración del resumen',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PROGRAMA_ID) REFERENCES PROGRAMAS_ACADEMICOS(ID) ON DELETE CASCADE,
    FOREIGN KEY (FACULTAD_ID) REFERENCES FACULTADES(ID) ON DELETE CASCADE,
    FOREIGN KEY (CONFIGURACION_ID) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE,
    INDEX idx_resumen_tipo (TIPO_RESUMEN),
    INDEX idx_resumen_docente (DOCUMENTO_DOCENTE),
    INDEX idx_resumen_programa (PROGRAMA_ID),
    INDEX idx_resumen_facultad (FACULTAD_ID),
    INDEX idx_resumen_config (CONFIGURACION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de caché de rankings
CREATE TABLE IF NOT EXISTS RANKINGS_CACHE (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    TIPO_RANKING ENUM('POSITIVOS_PROGRAMA', 'MEJORA_PROGRAMA', 'POSITIVOS_FACULTAD', 'MEJORA_FACULTAD', 'POSITIVOS_INSTITUCIONAL', 'MEJORA_INSTITUCIONAL') NOT NULL,
    PROGRAMA_ID INT NULL,
    FACULTAD_ID INT NULL,
    CONFIGURACION_ID INT NOT NULL,
    -- Ranking data
    RANKING_DATA JSON NOT NULL COMMENT 'Array de docentes con sus puntajes',
    TOP_LIMIT INT DEFAULT 5,
    -- Metadata
    TOTAL_DOCENTES_ANALIZADOS INT DEFAULT 0,
    FECHA_CALCULO TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    VALIDO_HASTA TIMESTAMP NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PROGRAMA_ID) REFERENCES PROGRAMAS_ACADEMICOS(ID) ON DELETE CASCADE,
    FOREIGN KEY (FACULTAD_ID) REFERENCES FACULTADES(ID) ON DELETE CASCADE,
    FOREIGN KEY (CONFIGURACION_ID) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE,
    INDEX idx_ranking_tipo (TIPO_RANKING),
    INDEX idx_ranking_programa (PROGRAMA_ID),
    INDEX idx_ranking_facultad (FACULTAD_ID),
    INDEX idx_ranking_config (CONFIGURACION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================================================================
-- DATOS DE EJEMPLO
-- ===================================================================================

-- Insertar facultades de ejemplo
INSERT INTO FACULTADES (CODIGO, NOMBRE, DESCRIPCION) VALUES
('FAC-ING', 'Facultad de Ingeniería', 'Facultad de Ciencias de la Ingeniería y Tecnología'),
('FAC-ADM', 'Facultad de Ciencias Administrativas', 'Facultad de Administración, Economía y Contaduría'),
('FAC-SAL', 'Facultad de Ciencias de la Salud', 'Facultad de Medicina, Enfermería y Ciencias de la Salud'),
('FAC-EDU', 'Facultad de Educación', 'Facultad de Ciencias de la Educación y Pedagogía'),
('FAC-HUM', 'Facultad de Humanidades', 'Facultad de Ciencias Humanas y Sociales');

-- Insertar programas de ejemplo
INSERT INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, FACULTAD_ID, NIVEL, MODALIDAD) VALUES
-- Ingeniería
('ING-SIS', 'Ingeniería de Sistemas', 1, 'PREGRADO', 'PRESENCIAL'),
('ING-IND', 'Ingeniería Industrial', 1, 'PREGRADO', 'PRESENCIAL'),
('ING-CIV', 'Ingeniería Civil', 1, 'PREGRADO', 'PRESENCIAL'),
('ING-ELE', 'Ingeniería Electrónica', 1, 'PREGRADO', 'PRESENCIAL'),
-- Administrativas
('ADM-EMP', 'Administración de Empresas', 2, 'PREGRADO', 'PRESENCIAL'),
('CON-PUB', 'Contaduría Pública', 2, 'PREGRADO', 'PRESENCIAL'),
('ECO', 'Economía', 2, 'PREGRADO', 'PRESENCIAL'),
-- Salud
('MED', 'Medicina', 3, 'PREGRADO', 'PRESENCIAL'),
('ENF', 'Enfermería', 3, 'PREGRADO', 'PRESENCIAL'),
-- Educación
('LIC-MAT', 'Licenciatura en Matemáticas', 4, 'PREGRADO', 'PRESENCIAL'),
('LIC-LEN', 'Licenciatura en Lenguas', 4, 'PREGRADO', 'PRESENCIAL'),
-- Humanidades
('DER', 'Derecho', 5, 'PREGRADO', 'PRESENCIAL'),
('PSI', 'Psicología', 5, 'PREGRADO', 'PRESENCIAL');

-- ===================================================================================
-- VISTAS PARA REPORTES
-- ===================================================================================

-- Vista consolidada de evaluaciones por programa
CREATE OR REPLACE VIEW vista_evaluaciones_por_programa AS
SELECT 
    pa.ID as programa_id,
    pa.CODIGO as programa_codigo,
    pa.NOMBRE as programa_nombre,
    f.ID as facultad_id,
    f.CODIGO as facultad_codigo,
    f.NOMBRE as facultad_nombre,
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    e.ID as evaluacion_id,
    e.COMENTARIO_GENERAL,
    e.ID_CONFIGURACION,
    e.FECHA_CREACION as fecha_evaluacion,
    ed.ID as detalle_id,
    ed.ASPECTO_ID,
    ae.ETIQUETA as aspecto_nombre,
    cv.PUNTAJE as puntaje,
    ev.ETIQUETA as valoracion_nombre,
    ed.COMENTARIO as comentario_aspecto
FROM 
    EVALUACIONES e
    INNER JOIN DOCENTES_PROGRAMAS dp ON e.DOCUMENTO_DOCENTE = dp.DOCUMENTO_DOCENTE AND dp.ACTIVO = TRUE
    INNER JOIN PROGRAMAS_ACADEMICOS pa ON dp.PROGRAMA_ID = pa.ID AND pa.ACTIVO = TRUE
    INNER JOIN FACULTADES f ON pa.FACULTAD_ID = f.ID AND f.ACTIVO = TRUE
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    LEFT JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID;

-- Vista de estadísticas por docente y materia para reportes
CREATE OR REPLACE VIEW vista_estadisticas_docente_reporte AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    e.ID_CONFIGURACION,
    COUNT(DISTINCT e.ID) as total_evaluaciones,
    COUNT(DISTINCT e.DOCUMENTO_ESTUDIANTE) as total_estudiantes_evaluaron,
    AVG(cv.PUNTAJE) as promedio_general,
    MIN(cv.PUNTAJE) as puntaje_minimo,
    MAX(cv.PUNTAJE) as puntaje_maximo,
    STDDEV(cv.PUNTAJE) as desviacion_estandar,
    GROUP_CONCAT(DISTINCT CASE WHEN e.COMENTARIO_GENERAL != '' AND e.COMENTARIO_GENERAL IS NOT NULL THEN e.COMENTARIO_GENERAL END SEPARATOR '|||') as comentarios_generales,
    GROUP_CONCAT(DISTINCT CASE WHEN ed.COMENTARIO != '' AND ed.COMENTARIO IS NOT NULL THEN ed.COMENTARIO END SEPARATOR '|||') as comentarios_aspectos
FROM 
    EVALUACIONES e
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
GROUP BY 
    e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, e.ID_CONFIGURACION;

-- Vista de promedios por aspecto para reportes
CREATE OR REPLACE VIEW vista_promedios_aspecto_reporte AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    e.ID_CONFIGURACION,
    ca.ID as config_aspecto_id,
    ae.ID as aspecto_id,
    ae.ETIQUETA as aspecto_nombre,
    ae.DESCRIPCION as aspecto_descripcion,
    COUNT(*) as total_respuestas,
    AVG(cv.PUNTAJE) as promedio_aspecto,
    MIN(cv.PUNTAJE) as min_aspecto,
    MAX(cv.PUNTAJE) as max_aspecto,
    SUM(CASE WHEN ev.VALOR = 'E' THEN 1 ELSE 0 END) as total_excelente,
    SUM(CASE WHEN ev.VALOR = 'B' THEN 1 ELSE 0 END) as total_bueno,
    SUM(CASE WHEN ev.VALOR = 'A' THEN 1 ELSE 0 END) as total_aceptable,
    SUM(CASE WHEN ev.VALOR = 'D' THEN 1 ELSE 0 END) as total_deficiente
FROM 
    EVALUACIONES e
    INNER JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    INNER JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    INNER JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    INNER JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    INNER JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
WHERE 
    ca.ACTIVO = TRUE
GROUP BY 
    e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, e.ID_CONFIGURACION, ca.ID, ae.ID, ae.ETIQUETA, ae.DESCRIPCION;

-- Vista de ranking de docentes por cantidad de aspectos positivos
CREATE OR REPLACE VIEW vista_ranking_docentes_positivos AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.ID_CONFIGURACION,
    dp.PROGRAMA_ID,
    pa.FACULTAD_ID,
    COUNT(DISTINCT e.ID) as total_evaluaciones,
    SUM(CASE WHEN ev.VALOR = 'E' THEN 1 ELSE 0 END) as total_excelente,
    SUM(CASE WHEN ev.VALOR = 'B' THEN 1 ELSE 0 END) as total_bueno,
    SUM(CASE WHEN ev.VALOR IN ('E', 'B') THEN 1 ELSE 0 END) as total_positivos,
    AVG(cv.PUNTAJE) as promedio_general,
    (SUM(CASE WHEN ev.VALOR IN ('E', 'B') THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as porcentaje_positivos
FROM 
    EVALUACIONES e
    INNER JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    INNER JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    INNER JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
    LEFT JOIN DOCENTES_PROGRAMAS dp ON e.DOCUMENTO_DOCENTE = dp.DOCUMENTO_DOCENTE AND dp.ACTIVO = TRUE
    LEFT JOIN PROGRAMAS_ACADEMICOS pa ON dp.PROGRAMA_ID = pa.ID
GROUP BY 
    e.DOCUMENTO_DOCENTE, e.ID_CONFIGURACION, dp.PROGRAMA_ID, pa.FACULTAD_ID;

-- Vista de ranking de docentes por aspectos de mejora
CREATE OR REPLACE VIEW vista_ranking_docentes_mejora AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.ID_CONFIGURACION,
    dp.PROGRAMA_ID,
    pa.FACULTAD_ID,
    COUNT(DISTINCT e.ID) as total_evaluaciones,
    SUM(CASE WHEN ev.VALOR = 'D' THEN 1 ELSE 0 END) as total_deficiente,
    SUM(CASE WHEN ev.VALOR = 'A' THEN 1 ELSE 0 END) as total_aceptable,
    SUM(CASE WHEN ev.VALOR IN ('D', 'A') THEN 1 ELSE 0 END) as total_mejora,
    AVG(cv.PUNTAJE) as promedio_general,
    (SUM(CASE WHEN ev.VALOR IN ('D', 'A') THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as porcentaje_mejora
FROM 
    EVALUACIONES e
    INNER JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    INNER JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    INNER JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
    LEFT JOIN DOCENTES_PROGRAMAS dp ON e.DOCUMENTO_DOCENTE = dp.DOCUMENTO_DOCENTE AND dp.ACTIVO = TRUE
    LEFT JOIN PROGRAMAS_ACADEMICOS pa ON dp.PROGRAMA_ID = pa.ID
GROUP BY 
    e.DOCUMENTO_DOCENTE, e.ID_CONFIGURACION, dp.PROGRAMA_ID, pa.FACULTAD_ID;

-- ===================================================================================
-- ÍNDICES ADICIONALES PARA OPTIMIZACIÓN
-- ===================================================================================

-- Índices en tabla EVALUACIONES para reportes
CREATE INDEX IF NOT EXISTS idx_evaluaciones_docente_config ON EVALUACIONES(DOCUMENTO_DOCENTE, ID_CONFIGURACION);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_materia_config ON EVALUACIONES(CODIGO_MATERIA, ID_CONFIGURACION);
CREATE INDEX IF NOT EXISTS idx_evaluaciones_fecha ON EVALUACIONES(FECHA_CREACION);

-- Índices en tabla EVALUACION_DETALLE para reportes
CREATE INDEX IF NOT EXISTS idx_detalle_aspecto_valoracion ON EVALUACION_DETALLE(ASPECTO_ID, VALORACION_ID);

-- ===================================================================================
-- FIN DE LA MIGRACIÓN
-- ===================================================================================
