DROP DATABASE IF EXISTS sigedin_ies_v4;
CREATE DATABASE sigedin_ies_v4 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE sigedin_ies_v4;

-- ------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE ROLES (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    NOMBRE_ROL VARCHAR(20) UNIQUE NOT NULL,
	  CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO ROLES (NOMBRE_ROL) VALUES 
('Admin'), 
('Director Programa');

CREATE TABLE users_roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    rol_id INT NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rol_id) REFERENCES ROLES(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO users_roles (user_id, rol_id) VALUES
(14609, 1), -- HENRY 
(14610, 1), -- HENRY 
(2191, 1), -- MAICOL
(1934, 1), -- ESTEBAN
(20670, 1); -- ESTEBAN
-- ------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE TIPOS_EVALUACIONES (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  NOMBRE VARCHAR(100) NOT NULL,
  DESCRIPCION TEXT,
  ACTIVO BOOLEAN DEFAULT TRUE,
  FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CONFIGURACION_EVALUACION (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  TIPO_EVALUACION_ID INT NOT NULL,
  FECHA_INICIO DATE NOT NULL,
  FECHA_FIN DATE NOT NULL,
  ACTIVO BOOLEAN DEFAULT FALSE,
  ES_EVALUACION_DOCENTE BOOLEAN DEFAULT TRUE COMMENT 'Indica si es una evaluación de docentes',
  TITULO VARCHAR(255) NULL COMMENT 'Título personalizado de la evaluación',
  INSTRUCCIONES TEXT NULL COMMENT 'Instrucciones específicas para esta evaluación',
  URL_FORMULARIO VARCHAR(500) NULL COMMENT 'URL de un formulario externo (ej: Google Forms)',
  FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (TIPO_EVALUACION_ID) REFERENCES TIPOS_EVALUACIONES(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ASPECTOS_EVALUACION (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  ETIQUETA VARCHAR(200) NOT NULL,
  DESCRIPCION TEXT,
  FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CONFIGURACION_ASPECTO (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  CONFIGURACION_EVALUACION_ID INT NOT NULL,
  ASPECTO_ID INT NOT NULL,
  ORDEN DECIMAL(5,2) NOT NULL,
  ACTIVO BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (CONFIGURACION_EVALUACION_ID) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE,
  FOREIGN KEY (ASPECTO_ID) REFERENCES ASPECTOS_EVALUACION(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ESCALA_VALORACION (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  VALOR CHAR(1) NOT NULL,
  ETIQUETA VARCHAR(50) NOT NULL,
  DESCRIPCION TEXT,
  FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE CONFIGURACION_VALORACION (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  CONFIGURACION_EVALUACION_ID INT NOT NULL,
  VALORACION_ID INT NOT NULL,
  PUNTAJE DECIMAL(3,2) NOT NULL,
  ORDEN DECIMAL(5,2) NOT NULL,
  ACTIVO BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (CONFIGURACION_EVALUACION_ID) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE,
  FOREIGN KEY (VALORACION_ID) REFERENCES ESCALA_VALORACION(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE EVALUACIONES (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  DOCUMENTO_ESTUDIANTE VARCHAR(10) NOT NULL,
  DOCUMENTO_DOCENTE VARCHAR(15) NOT NULL,
  CODIGO_MATERIA VARCHAR(10) NOT NULL,
  COMENTARIO_GENERAL TEXT,
  ID_CONFIGURACION INT NOT NULL,
  FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ID_CONFIGURACION) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE EVALUACION_DETALLE (
  ID INT AUTO_INCREMENT PRIMARY KEY,
  EVALUACION_ID INT NOT NULL,
  ASPECTO_ID INT NOT NULL,
  VALORACION_ID INT NOT NULL,
  COMENTARIO TEXT,
  FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (EVALUACION_ID) REFERENCES EVALUACIONES(ID) ON DELETE CASCADE,
  FOREIGN KEY (ASPECTO_ID) REFERENCES CONFIGURACION_ASPECTO(ID) ON DELETE CASCADE,
  FOREIGN KEY (VALORACION_ID) REFERENCES CONFIGURACION_VALORACION(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------------------------------------------------------------------
-- Tablas de Preguntas (Migración 2025-01-09)
-- ------------------------------------------------------------------------------------------------------------------------------------------

-- Crear tabla de preguntas
CREATE TABLE IF NOT EXISTS PREGUNTAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    TEXTO TEXT NOT NULL,
    TIPO_PREGUNTA VARCHAR(50) NOT NULL,
    ORDEN INT DEFAULT 1,
    ACTIVO BOOLEAN DEFAULT TRUE,
    OPCIONES TEXT DEFAULT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Crear tabla de configuración de preguntas
CREATE TABLE IF NOT EXISTS CONFIGURACION_PREGUNTAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CONFIGURACION_EVALUACION_ID INT NOT NULL,
    PREGUNTA_ID INT NOT NULL,
    ORDEN INT DEFAULT 1,
    ACTIVO BOOLEAN DEFAULT TRUE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CONFIGURACION_EVALUACION_ID) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE,
    FOREIGN KEY (PREGUNTA_ID) REFERENCES PREGUNTAS(ID) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para mejorar rendimiento
CREATE INDEX idx_preguntas_activo ON PREGUNTAS(ACTIVO);
CREATE INDEX idx_preguntas_orden ON PREGUNTAS(ORDEN);
CREATE INDEX idx_config_preguntas_evaluacion ON CONFIGURACION_PREGUNTAS(CONFIGURACION_EVALUACION_ID);
CREATE INDEX idx_config_preguntas_pregunta ON CONFIGURACION_PREGUNTAS(PREGUNTA_ID);
CREATE INDEX idx_config_preguntas_activo ON CONFIGURACION_PREGUNTAS(ACTIVO);

-- ------------------------------------------------------------------------------------------------------------------------------------------

INSERT INTO TIPOS_EVALUACIONES (NOMBRE, DESCRIPCION) VALUES 
('Insitu', 'Evaluacion Para Evaluar Rendimiento de Docentes'),
('satisfacción', 'Evaluación de Satisfacción General');

INSERT INTO CONFIGURACION_EVALUACION (TIPO_EVALUACION_ID, FECHA_INICIO, FECHA_FIN, ACTIVO, ES_EVALUACION_DOCENTE, TITULO, INSTRUCCIONES) VALUES 
(1, '2025-03-22', '2026-04-01', TRUE, TRUE, 'Evaluación de Docentes', 'Por favor evalúa el desempeño de tu docente'),
(2, '2025-10-14', '2025-10-22', TRUE, FALSE, 'Encuesta de Satisfacción', 'Por favor responde las siguientes preguntas sobre tu experiencia');

-- Actualizar registros existentes para ES_EVALUACION_DOCENTE
UPDATE CONFIGURACION_EVALUACION 
SET ES_EVALUACION_DOCENTE = TRUE 
WHERE ID > 0 AND ES_EVALUACION_DOCENTE IS NULL;

INSERT INTO ASPECTOS_EVALUACION (ETIQUETA, DESCRIPCION) VALUES
('Dominio del tema', 'Capacidad para dominar y explicar el contenido del tema con claridad y profundidad'),
('Cumplimiento', 'Cumplimiento con los objetivos y tareas establecidas en el curso'),
('Calidad', 'Nivel de excelencia en el trabajo realizado, incluyendo la precisión y profundidad'),
('Puntualidad', 'Cumplimiento con los horarios establecidos y entrega a tiempo de tareas'),
('Metodología y métodos en enseñanza', 'Uso efectivo de métodos de enseñanza para facilitar el aprendizaje'),
('Recursos usados para la enseñanza', 'Utilización adecuada de recursos didácticos para el proceso de enseñanza'),
('Proceso de evaluación', 'Claridad y efectividad del proceso de evaluación en el curso'),
('Aspectos motivacionales', 'Capacidad para motivar a los estudiantes y fomentar su participación'),
('Relaciones interpersonales', 'Capacidad para establecer y mantener relaciones positivas con los estudiantes');

INSERT INTO CONFIGURACION_ASPECTO (CONFIGURACION_EVALUACION_ID, ASPECTO_ID, ORDEN, ACTIVO) VALUES 
(1, 1, 1.00, TRUE),
(1, 2, 2.00, TRUE),
(1, 3, 3.00, FALSE),
(1, 4, 4.00, FALSE),
(1, 5, 5.00, FALSE),
(1, 6, 6.00, FALSE),
(1, 7, 7.00, FALSE),
(1, 8, 8.00, FALSE),
(1, 9, 9.00, FALSE);

INSERT INTO ESCALA_VALORACION (VALOR, ETIQUETA, DESCRIPCION) VALUES
('E', 'Excelente', 'Desempeño excepcional'),
('B', 'Bueno', 'Desempeño por encima del promedio'),
('A', 'Aceptable', 'Desempeño promedio'),
('D', 'Deficiente', 'Desempeño por debajo del promedio');

INSERT INTO CONFIGURACION_VALORACION (CONFIGURACION_EVALUACION_ID, VALORACION_ID, PUNTAJE, ORDEN, ACTIVO) VALUES 
(1, 1, 5.00, 1.00, TRUE),
(1, 2, 4.00, 2.00, TRUE),
(1, 3, 3.00, 3.00, TRUE),
(1, 4, 2.00, 4.00, TRUE);

-- Insertar preguntas de ejemplo (Migración 2025-01-09)
INSERT INTO PREGUNTAS (TEXTO, TIPO_PREGUNTA, ORDEN, ACTIVO, OPCIONES) VALUES
('¿Qué tan satisfecho está con la calidad de la enseñanza?', 'escala', 1, TRUE, NULL),
('¿Recomendaría este curso a otros estudiantes?', 'si_no', 2, TRUE, NULL),
('¿Cuál aspecto del curso considera más valioso?', 'seleccion_unica', 3, TRUE, 'Contenido teórico,Práctica aplicada,Material de apoyo,Metodología del docente'),
('Comentarios adicionales (opcional)', 'texto_largo', 4, TRUE, NULL),
('si o no?', 'texto', 5, TRUE, NULL);

-- Asociar preguntas a configuraciones de evaluación
INSERT INTO CONFIGURACION_PREGUNTAS (CONFIGURACION_EVALUACION_ID, PREGUNTA_ID, ORDEN, ACTIVO) VALUES
-- Configuración 1 (Evaluación de Docentes) - 3 preguntas
(1, 1, 1, TRUE),  -- ¿Qué tan satisfecho está con la calidad de la enseñanza?
(1, 2, 2, TRUE),  -- ¿Recomendaría este curso a otros estudiantes?
(1, 3, 3, TRUE),  -- ¿Cuál aspecto del curso considera más valioso?
-- Configuración 2 (Evaluación Genérica) - 2 preguntas
(2, 5, 1, TRUE),  -- si o no?
(2, 1, 2, TRUE);  -- ¿Qué tan satisfecho está con la calidad de la enseñanza?

-- ------------------------------------------------------------------------------------------------------------------------------------------
-- Tablas de Evaluaciones Genéricas (Migración 2025-10-16)
-- ------------------------------------------------------------------------------------------------------------------------------------------

-- Tabla para almacenar las respuestas de los estudiantes a las preguntas genéricas
CREATE TABLE IF NOT EXISTS RESPUESTAS_PREGUNTAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EVALUACION_ID INT NOT NULL,
    PREGUNTA_ID INT NOT NULL,
    RESPUESTA TEXT NOT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (PREGUNTA_ID) REFERENCES PREGUNTAS(ID) ON DELETE CASCADE,
    INDEX idx_respuestas_evaluacion (EVALUACION_ID),
    INDEX idx_respuestas_pregunta (PREGUNTA_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para almacenar evaluaciones genéricas (no relacionadas con docentes)
CREATE TABLE IF NOT EXISTS EVALUACIONES_GENERICAS (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    CONFIGURACION_ID INT NOT NULL,
    DOCUMENTO_ESTUDIANTE VARCHAR(50) NOT NULL,
    COMENTARIO_GENERAL TEXT NULL,
    FECHA_EVALUACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ESTADO VARCHAR(20) DEFAULT 'completada',
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (CONFIGURACION_ID) REFERENCES CONFIGURACION_EVALUACION(ID) ON DELETE CASCADE,
    INDEX idx_evaluaciones_genericas_config (CONFIGURACION_ID),
    INDEX idx_evaluaciones_genericas_estudiante (DOCUMENTO_ESTUDIANTE),
    UNIQUE KEY unique_evaluacion_generica (CONFIGURACION_ID, DOCUMENTO_ESTUDIANTE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla para almacenar respuestas a aspectos de evaluaciones genéricas
CREATE TABLE IF NOT EXISTS EVALUACIONES_GENERICAS_DETALLE (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    EVALUACION_GENERICA_ID INT NOT NULL,
    ASPECTO_ID INT NULL,
    VALORACION_ID INT NULL,
    COMENTARIO TEXT NULL,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (EVALUACION_GENERICA_ID) REFERENCES EVALUACIONES_GENERICAS(ID) ON DELETE CASCADE,
    FOREIGN KEY (ASPECTO_ID) REFERENCES ASPECTOS_EVALUACION(ID) ON DELETE CASCADE,
    FOREIGN KEY (VALORACION_ID) REFERENCES ESCALA_VALORACION(ID) ON DELETE CASCADE,
    INDEX idx_evaluaciones_genericas_detalle_evaluacion (EVALUACION_GENERICA_ID),
    INDEX idx_evaluaciones_genericas_detalle_aspecto (ASPECTO_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------------------------------------------------------------------

INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES
-- Estudiante: 1007548901
('1007548901', '18128952', '6647', '', 1),
('1007548901', '1094963626', '6650', '', 1),
('1007548901', '98381067', '6648', '', 1),
('1007548901', '18125603', '6649', '', 1),
('1007548901', '1053863419', '6645', '', 1),
('1007548901', '18126021', '6646', '', 1);

-- ------------------------------------------------------------------------------------------------------------------------------------------

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
-- Evaluación 1
(1, 1, 1, 'Excelente dominio del tema, con una explicación clara y profunda.'),
(1, 2, 1, 'Cumple de manera excelente con los objetivos y tareas del curso.'),

-- Evaluación 2
(2, 1, 1, 'Excelente dominio del tema, con una explicación clara y profunda.'),
(2, 2, 1, 'Cumple de manera excelente con los objetivos y tareas del curso.'),

-- Evaluación 3
(3, 1, 1, 'Excelente dominio del tema, con una explicación clara y profunda.'),
(3, 2, 1, 'Cumple de manera excelente con los objetivos y tareas del curso.'),

-- Evaluación 4
(4, 1, 1, 'Excelente dominio del tema, con una explicación clara y profunda.'),
(4, 2, 1, 'Cumple de manera excelente con los objetivos y tareas del curso.'),

-- Evaluación 5
(5, 1, 1, 'Excelente dominio del tema, con una explicación clara y profunda.'),
(5, 2, 1, 'Cumple de manera excelente con los objetivos y tareas del curso.'),

-- Evaluación 6
(6, 1, 1, 'Excelente dominio del tema, con una explicación clara y profunda.'),
(6, 2, 1, 'Cumple de manera excelente con los objetivos y tareas del curso.');

-- ------------------------------------------------------------------------------------------------------------------------------------------
-- VISTAS PARA MÓDULO DOCENTE
-- ------------------------------------------------------------------------------------------------------------------------------------------

-- Vista principal: Evaluaciones recibidas por docentes
CREATE OR REPLACE VIEW vista_evaluaciones_docente AS
SELECT 
    e.ID as evaluacion_id,
    e.DOCUMENTO_ESTUDIANTE,
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    e.COMENTARIO_GENERAL,
    e.FECHA_CREACION as fecha_evaluacion,
    te.NOMBRE as tipo_evaluacion,
    te.DESCRIPCION as descripcion_evaluacion,
    ce.FECHA_INICIO,
    ce.FECHA_FIN,
    ce.ACTIVO as evaluacion_activa,
    -- Detalles de cada aspecto evaluado
    GROUP_CONCAT(
        CONCAT(
            ae.ETIQUETA, ':', 
            ev.ETIQUETA, ' (', cv.PUNTAJE, ')',
            IF(ed.COMENTARIO IS NOT NULL AND ed.COMENTARIO != '', CONCAT(' - ', ed.COMENTARIO), '')
        ) 
        ORDER BY ca.ORDEN 
        SEPARATOR ' | '
    ) as detalles_evaluacion,
    -- Promedio de la evaluación
    AVG(cv.PUNTAJE) as promedio_evaluacion,
    COUNT(DISTINCT ed.ID) as total_aspectos_evaluados
FROM 
    EVALUACIONES e
    INNER JOIN CONFIGURACION_EVALUACION ce ON e.ID_CONFIGURACION = ce.ID
    INNER JOIN TIPOS_EVALUACIONES te ON ce.TIPO_EVALUACION_ID = te.ID
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    LEFT JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
GROUP BY 
    e.ID, e.DOCUMENTO_ESTUDIANTE, e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA,
    e.COMENTARIO_GENERAL, e.FECHA_CREACION, te.NOMBRE, te.DESCRIPCION,
    ce.FECHA_INICIO, ce.FECHA_FIN, ce.ACTIVO;

-- Vista de estadísticas por docente y materia
CREATE OR REPLACE VIEW vista_estadisticas_docente_materia AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    te.NOMBRE as tipo_evaluacion,
    COUNT(DISTINCT e.ID) as total_evaluaciones,
    AVG(cv.PUNTAJE) as promedio_general,
    MAX(cv.PUNTAJE) as mejor_calificacion,
    MIN(cv.PUNTAJE) as peor_calificacion,
    COUNT(DISTINCT e.DOCUMENTO_ESTUDIANTE) as total_estudiantes_evaluadores,
    ce.FECHA_INICIO,
    ce.FECHA_FIN,
    ce.ACTIVO as evaluacion_activa
FROM 
    EVALUACIONES e
    INNER JOIN CONFIGURACION_EVALUACION ce ON e.ID_CONFIGURACION = ce.ID
    INNER JOIN TIPOS_EVALUACIONES te ON ce.TIPO_EVALUACION_ID = te.ID
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
GROUP BY 
    e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, te.NOMBRE,
    ce.FECHA_INICIO, ce.FECHA_FIN, ce.ACTIVO;

-- Vista de rendimiento por aspecto evaluado
CREATE OR REPLACE VIEW vista_aspectos_por_docente AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    ae.ID as aspecto_id,
    ae.ETIQUETA as aspecto,
    ae.DESCRIPCION as descripcion_aspecto,
    ev.VALOR as valor_valoracion,
    ev.ETIQUETA as valoracion,
    cv.PUNTAJE,
    COUNT(*) as veces_recibido,
    AVG(cv.PUNTAJE) as promedio_aspecto,
    (COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, ae.ID)) as porcentaje
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
    e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, ae.ID, ae.ETIQUETA, 
    ae.DESCRIPCION, ev.VALOR, ev.ETIQUETA, cv.PUNTAJE;

-- Vista resumen de aspectos por docente (promedio general por aspecto)
CREATE OR REPLACE VIEW vista_resumen_aspectos_docente AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    ae.ID as aspecto_id,
    ae.ETIQUETA as aspecto,
    ae.DESCRIPCION as descripcion_aspecto,
    COUNT(DISTINCT e.ID) as total_evaluaciones,
    AVG(cv.PUNTAJE) as promedio_aspecto,
    MAX(cv.PUNTAJE) as mejor_calificacion,
    MIN(cv.PUNTAJE) as peor_calificacion,
    -- Distribución de valoraciones
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
    e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, ae.ID, ae.ETIQUETA, ae.DESCRIPCION;

-- Vista de materias evaluadas por docente
CREATE OR REPLACE VIEW vista_materias_docente AS
SELECT 
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    COUNT(DISTINCT e.ID) as total_evaluaciones,
    COUNT(DISTINCT e.DOCUMENTO_ESTUDIANTE) as total_estudiantes,
    AVG(cv.PUNTAJE) as promedio_general,
    MAX(e.FECHA_CREACION) as ultima_evaluacion,
    MIN(e.FECHA_CREACION) as primera_evaluacion
FROM 
    EVALUACIONES e
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
GROUP BY 
    e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA;

-- Vista de comentarios recibidos por docente
CREATE OR REPLACE VIEW vista_comentarios_docente AS
SELECT 
    e.ID as evaluacion_id,
    e.DOCUMENTO_DOCENTE,
    e.CODIGO_MATERIA,
    e.DOCUMENTO_ESTUDIANTE,
    e.COMENTARIO_GENERAL,
    e.FECHA_CREACION,
    ae.ETIQUETA as aspecto,
    ed.COMENTARIO as comentario_aspecto
FROM 
    EVALUACIONES e
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
WHERE 
    (e.COMENTARIO_GENERAL IS NOT NULL AND e.COMENTARIO_GENERAL != '')
    OR (ed.COMENTARIO IS NOT NULL AND ed.COMENTARIO != '')
ORDER BY 
    e.FECHA_CREACION DESC;

-- ------------------------------------------------------------------------------------------------------------------------------------------
-- VISTAS PARA EVALUACIONES GENÉRICAS
-- ------------------------------------------------------------------------------------------------------------------------------------------

-- Vista principal: Evaluaciones genéricas con sus respuestas
CREATE OR REPLACE VIEW vista_evaluaciones_genericas AS
SELECT 
    eg.ID as evaluacion_id,
    eg.DOCUMENTO_ESTUDIANTE,
    eg.CONFIGURACION_ID,
    ce.TITULO as titulo_evaluacion,
    te.NOMBRE as tipo_evaluacion,
    te.DESCRIPCION as descripcion_evaluacion,
    eg.COMENTARIO_GENERAL,
    eg.FECHA_EVALUACION,
    eg.ESTADO,
    ce.FECHA_INICIO,
    ce.FECHA_FIN,
    ce.ACTIVO as evaluacion_activa,
    COUNT(DISTINCT egd.ID) as total_aspectos_evaluados,
    COUNT(DISTINCT rp.ID) as total_preguntas_respondidas
FROM 
    EVALUACIONES_GENERICAS eg
    INNER JOIN CONFIGURACION_EVALUACION ce ON eg.CONFIGURACION_ID = ce.ID
    INNER JOIN TIPOS_EVALUACIONES te ON ce.TIPO_EVALUACION_ID = te.ID
    LEFT JOIN EVALUACIONES_GENERICAS_DETALLE egd ON eg.ID = egd.EVALUACION_GENERICA_ID
    LEFT JOIN RESPUESTAS_PREGUNTAS rp ON eg.ID = rp.EVALUACION_ID
GROUP BY 
    eg.ID, eg.DOCUMENTO_ESTUDIANTE, eg.CONFIGURACION_ID, ce.TITULO, 
    te.NOMBRE, te.DESCRIPCION, eg.COMENTARIO_GENERAL, eg.FECHA_EVALUACION,
    eg.ESTADO, ce.FECHA_INICIO, ce.FECHA_FIN, ce.ACTIVO;

-- Vista detallada: Respuestas a preguntas por evaluación
CREATE OR REPLACE VIEW vista_respuestas_preguntas AS
SELECT 
    eg.ID as evaluacion_id,
    eg.DOCUMENTO_ESTUDIANTE,
    eg.CONFIGURACION_ID,
    ce.TITULO as titulo_evaluacion,
    p.ID as pregunta_id,
    p.TEXTO as pregunta,
    p.TIPO_PREGUNTA,
    rp.RESPUESTA,
    rp.CREATED_AT as fecha_respuesta,
    cp.ORDEN as orden_pregunta
FROM 
    EVALUACIONES_GENERICAS eg
    INNER JOIN CONFIGURACION_EVALUACION ce ON eg.CONFIGURACION_ID = ce.ID
    INNER JOIN RESPUESTAS_PREGUNTAS rp ON eg.ID = rp.EVALUACION_ID
    INNER JOIN PREGUNTAS p ON rp.PREGUNTA_ID = p.ID
    LEFT JOIN CONFIGURACION_PREGUNTAS cp ON p.ID = cp.PREGUNTA_ID AND ce.ID = cp.CONFIGURACION_EVALUACION_ID
ORDER BY 
    eg.ID DESC, cp.ORDEN;

-- Vista resumen: Estadísticas por configuración
CREATE OR REPLACE VIEW vista_estadisticas_evaluaciones_genericas AS
SELECT 
    ce.ID as configuracion_id,
    ce.TITULO,
    te.NOMBRE as tipo_evaluacion,
    COUNT(DISTINCT eg.ID) as total_evaluaciones,
    COUNT(DISTINCT eg.DOCUMENTO_ESTUDIANTE) as total_estudiantes,
    COUNT(DISTINCT rp.ID) as total_respuestas,
    ce.FECHA_INICIO,
    ce.FECHA_FIN,
    ce.ACTIVO
FROM 
    CONFIGURACION_EVALUACION ce
    INNER JOIN TIPOS_EVALUACIONES te ON ce.TIPO_EVALUACION_ID = te.ID
    LEFT JOIN EVALUACIONES_GENERICAS eg ON ce.ID = eg.CONFIGURACION_ID
    LEFT JOIN RESPUESTAS_PREGUNTAS rp ON eg.ID = rp.EVALUACION_ID
WHERE 
    ce.ES_EVALUACION_DOCENTE = FALSE
GROUP BY 
    ce.ID, ce.TITULO, te.NOMBRE, ce.FECHA_INICIO, ce.FECHA_FIN, ce.ACTIVO;

-- Vista: Respuestas agrupadas por pregunta
CREATE OR REPLACE VIEW vista_respuestas_por_pregunta AS
SELECT 
    p.ID as pregunta_id,
    p.TEXTO as pregunta,
    p.TIPO_PREGUNTA,
    ce.ID as configuracion_id,
    ce.TITULO as titulo_evaluacion,
    COUNT(DISTINCT rp.ID) as total_respuestas,
    COUNT(DISTINCT eg.DOCUMENTO_ESTUDIANTE) as total_estudiantes,
    GROUP_CONCAT(DISTINCT rp.RESPUESTA ORDER BY rp.CREATED_AT DESC SEPARATOR ' | ') as ultimas_respuestas
FROM 
    PREGUNTAS p
    INNER JOIN CONFIGURACION_PREGUNTAS cp ON p.ID = cp.PREGUNTA_ID
    INNER JOIN CONFIGURACION_EVALUACION ce ON cp.CONFIGURACION_EVALUACION_ID = ce.ID
    LEFT JOIN RESPUESTAS_PREGUNTAS rp ON p.ID = rp.PREGUNTA_ID
    LEFT JOIN EVALUACIONES_GENERICAS eg ON rp.EVALUACION_ID = eg.ID AND eg.CONFIGURACION_ID = ce.ID
WHERE 
    cp.ACTIVO = TRUE
GROUP BY 
    p.ID, p.TEXTO, p.TIPO_PREGUNTA, ce.ID, ce.TITULO;

-- ------------------------------------------------------------------------------------------------------------------------------------------
-- TABLAS PARA AUTOEVALUACIÓN DOCENTE
-- ------------------------------------------------------------------------------------------------------------------------------------------

-- Tabla principal de autoevaluaciones de docentes
CREATE TABLE IF NOT EXISTS AUTOEVALUACION_DOCENTE (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    DOCUMENTO_DOCENTE VARCHAR(15) NOT NULL,
    PERIODO VARCHAR(20) NOT NULL,
    COMPLETADA BOOLEAN DEFAULT FALSE,
    PROMEDIO_AUTOEVALUACION DECIMAL(5,4) DEFAULT NULL COMMENT 'Promedio calculado de la autoevaluación (0-1)',
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_autoevaluacion_docente (DOCUMENTO_DOCENTE, PERIODO),
    INDEX idx_autoevaluacion_docente (DOCUMENTO_DOCENTE),
    INDEX idx_autoevaluacion_periodo (PERIODO)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de respuestas detalladas de la autoevaluación
CREATE TABLE IF NOT EXISTS AUTOEVALUACION_DOCENTE_DETALLE (
    ID INT AUTO_INCREMENT PRIMARY KEY,
    AUTOEVALUACION_ID INT NOT NULL,
    ASPECTO_ID INT NOT NULL,
    VALORACION VARCHAR(20) NOT NULL COMMENT 'excelente, bueno, aceptable, por_mejorar',
    PUNTAJE DECIMAL(3,2) NOT NULL COMMENT 'Puntaje numérico (1.0, 0.75, 0.5, 0.25)',
    FECHA_CREACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FECHA_ACTUALIZACION TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (AUTOEVALUACION_ID) REFERENCES AUTOEVALUACION_DOCENTE(ID) ON DELETE CASCADE,
    FOREIGN KEY (ASPECTO_ID) REFERENCES ASPECTOS_EVALUACION(ID) ON DELETE CASCADE,
    UNIQUE KEY unique_autoevaluacion_aspecto (AUTOEVALUACION_ID, ASPECTO_ID),
    INDEX idx_autoevaluacion_detalle (AUTOEVALUACION_ID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------------------------------------------------------------------
-- VISTA PARA AUTOEVALUACIÓN DOCENTE
-- ------------------------------------------------------------------------------------------------------------------------------------------

-- Vista de autoevaluaciones con detalles
CREATE OR REPLACE VIEW vista_autoevaluacion_docente AS
SELECT 
    ad.ID as autoevaluacion_id,
    ad.DOCUMENTO_DOCENTE,
    ad.PERIODO,
    ad.COMPLETADA,
    ad.PROMEDIO_AUTOEVALUACION,
    ad.FECHA_CREACION as fecha_autoevaluacion,
    ae.ID as aspecto_id,
    ae.ETIQUETA as aspecto,
    ae.DESCRIPCION as descripcion_aspecto,
    add_det.VALORACION,
    add_det.PUNTAJE
FROM 
    AUTOEVALUACION_DOCENTE ad
    LEFT JOIN AUTOEVALUACION_DOCENTE_DETALLE add_det ON ad.ID = add_det.AUTOEVALUACION_ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON add_det.ASPECTO_ID = ae.ID
ORDER BY 
    ad.FECHA_CREACION DESC;


-- ------------------------------------------------------------------------------------------------------------------------------------------

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
CREATE INDEX idx_evaluaciones_docente_config ON EVALUACIONES(DOCUMENTO_DOCENTE, ID_CONFIGURACION);
CREATE INDEX idx_evaluaciones_materia_config ON EVALUACIONES(CODIGO_MATERIA, ID_CONFIGURACION);
CREATE INDEX idx_evaluaciones_fecha ON EVALUACIONES(FECHA_CREACION);

-- Índices en tabla EVALUACION_DETALLE para reportes
CREATE INDEX idx_detalle_aspecto_valoracion ON EVALUACION_DETALLE(ASPECTO_ID, VALORACION_ID);

-- ===================================================================================
-- FIN DE LA MIGRACIÓN
--
