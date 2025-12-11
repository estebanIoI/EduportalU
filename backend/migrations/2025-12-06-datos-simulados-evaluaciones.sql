-- ===================================================================================
-- MIGRACIÓN: DATOS SIMULADOS DE EVALUACIONES DOCENTES
-- Base de datos: sigedin_ies_v4
-- Fecha: 2025-12-06
-- Descripción: Inserta 20 evaluaciones completas con todos los aspectos evaluados,
--              comentarios variados y respuestas a preguntas para pruebas de reportes
-- ===================================================================================

USE sigedin_ies_v4;

-- ===================================================================================
-- PASO 1: INSERTAR FACULTADES Y PROGRAMAS (si no existen)
-- ===================================================================================

-- Insertar facultades
INSERT IGNORE INTO FACULTADES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) VALUES
('FAC-ING', 'Facultad de Ingeniería', 'Facultad de Ingeniería y Tecnologías', TRUE),
('FAC-CEAC', 'Facultad de Ciencias Económicas, Administrativas y Contables', 'Facultad de Ciencias Económicas, Administrativas y Contables', TRUE),
('FAC-AGRO', 'Facultad de Ciencias Agropecuarias y Ambientales', 'Facultad de Ciencias Agropecuarias, Ambientales y Forestales', TRUE),
('FAC-POSG', 'Facultad de Posgrados', 'Especializaciones y Maestrías', TRUE);

-- Obtener IDs de facultades
SET @fac_ing = (SELECT ID FROM FACULTADES WHERE CODIGO = 'FAC-ING');
SET @fac_ceac = (SELECT ID FROM FACULTADES WHERE CODIGO = 'FAC-CEAC');
SET @fac_agro = (SELECT ID FROM FACULTADES WHERE CODIGO = 'FAC-AGRO');

-- Insertar programas de Ingeniería
INSERT IGNORE INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, DESCRIPCION, FACULTAD_ID, NIVEL, MODALIDAD, ACTIVO) VALUES
('ING-SIS', 'Ingeniería de Sistemas', 'Programa de Ingeniería de Sistemas', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE),
('ING-CIV', 'Ingeniería Civil', 'Programa de Ingeniería Civil', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE),
('ING-AMB', 'Ingeniería Ambiental', 'Programa de Ingeniería Ambiental', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE),
('TEC-DES', 'Tecnología en Desarrollo de Software', 'Programa de Tecnología en Desarrollo de Software', @fac_ing, 'TECNOLOGIA', 'PRESENCIAL', TRUE);

-- Insertar programas de CEAC
INSERT IGNORE INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, DESCRIPCION, FACULTAD_ID, NIVEL, MODALIDAD, ACTIVO) VALUES
('ADM-EMP', 'Administración de Empresas', 'Programa de Administración de Empresas', @fac_ceac, 'PREGRADO', 'PRESENCIAL', TRUE),
('CON-PUB', 'Contaduría Pública', 'Programa de Contaduría Pública', @fac_ceac, 'PREGRADO', 'PRESENCIAL', TRUE);

-- ===================================================================================
-- PASO 2: CREAR DOCENTES SIMULADOS Y ASIGNARLOS A PROGRAMAS
-- ===================================================================================

-- Obtener IDs de programas
SET @prog_ing_sis = (SELECT ID FROM PROGRAMAS_ACADEMICOS WHERE CODIGO = 'ING-SIS');
SET @prog_ing_civ = (SELECT ID FROM PROGRAMAS_ACADEMICOS WHERE CODIGO = 'ING-CIV');
SET @prog_adm = (SELECT ID FROM PROGRAMAS_ACADEMICOS WHERE CODIGO = 'ADM-EMP');
SET @prog_cont = (SELECT ID FROM PROGRAMAS_ACADEMICOS WHERE CODIGO = 'CON-PUB');

-- Asignar docentes a programas (documentos simulados)
INSERT IGNORE INTO DOCENTES_PROGRAMAS (DOCUMENTO_DOCENTE, PROGRAMA_ID, ES_TITULAR, ACTIVO) VALUES
-- Docentes de Ingeniería de Sistemas
('1001001001', @prog_ing_sis, TRUE, TRUE),   -- Juan Carlos Pérez
('1001001002', @prog_ing_sis, FALSE, TRUE),  -- María Elena González
('1001001003', @prog_ing_sis, FALSE, TRUE),  -- Carlos Alberto Ramírez
-- Docentes de Ingeniería Civil
('1001001004', @prog_ing_civ, TRUE, TRUE),   -- Ana Patricia López
('1001001005', @prog_ing_civ, FALSE, TRUE),  -- Roberto Andrés Silva
-- Docentes de Administración
('1001001006', @prog_adm, TRUE, TRUE),       -- Diana Carolina Martínez
('1001001007', @prog_adm, FALSE, TRUE),      -- Pedro José Hernández
-- Docentes de Contaduría
('1001001008', @prog_cont, TRUE, TRUE);      -- Laura Cristina Vargas

-- También asignar los docentes existentes de evaluaciones anteriores
INSERT IGNORE INTO DOCENTES_PROGRAMAS (DOCUMENTO_DOCENTE, PROGRAMA_ID, ES_TITULAR, ACTIVO)
SELECT DISTINCT e.DOCUMENTO_DOCENTE, @prog_ing_sis, FALSE, TRUE
FROM EVALUACIONES e
WHERE NOT EXISTS (
    SELECT 1 FROM DOCENTES_PROGRAMAS dp WHERE dp.DOCUMENTO_DOCENTE = e.DOCUMENTO_DOCENTE
);

-- ===================================================================================
-- PASO 3: VERIFICAR/CREAR CONFIGURACIÓN DE EVALUACIÓN ACTIVA
-- ===================================================================================

-- Obtener la configuración de evaluación activa (ID = 1)
SET @config_eval = 1;

-- Verificar que existan los aspectos configurados
SET @aspecto_dominio = (SELECT ID FROM CONFIGURACION_ASPECTO WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID = 1 LIMIT 1);
SET @aspecto_cumplimiento = (SELECT ID FROM CONFIGURACION_ASPECTO WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID = 2 LIMIT 1);

-- Activar más aspectos si están desactivados
UPDATE CONFIGURACION_ASPECTO SET ACTIVO = TRUE WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID IN (1, 2, 3, 4, 5);

-- Obtener IDs de aspectos configurados
SET @ca_dominio = (SELECT ID FROM CONFIGURACION_ASPECTO WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID = 1);
SET @ca_cumplimiento = (SELECT ID FROM CONFIGURACION_ASPECTO WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID = 2);
SET @ca_calidad = (SELECT ID FROM CONFIGURACION_ASPECTO WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID = 3);
SET @ca_puntualidad = (SELECT ID FROM CONFIGURACION_ASPECTO WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID = 4);
SET @ca_metodologia = (SELECT ID FROM CONFIGURACION_ASPECTO WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND ASPECTO_ID = 5);

-- Obtener IDs de valoraciones
SET @val_excelente = (SELECT ID FROM CONFIGURACION_VALORACION WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND VALORACION_ID = 1);
SET @val_bueno = (SELECT ID FROM CONFIGURACION_VALORACION WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND VALORACION_ID = 2);
SET @val_aceptable = (SELECT ID FROM CONFIGURACION_VALORACION WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND VALORACION_ID = 3);
SET @val_deficiente = (SELECT ID FROM CONFIGURACION_VALORACION WHERE CONFIGURACION_EVALUACION_ID = @config_eval AND VALORACION_ID = 4);

-- ===================================================================================
-- PASO 4: INSERTAR 20 EVALUACIONES SIMULADAS CON COMENTARIOS VARIADOS
-- ===================================================================================

-- Docente 1: Juan Carlos Pérez (1001001001) - Programación I (MAT001)
-- Muy buen docente - mayormente excelentes calificaciones
INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES
('2001001001', '1001001001', 'MAT001', 'Excelente profesor, explica muy bien y siempre está dispuesto a resolver dudas. Sus clases son muy dinámicas.', @config_eval),
('2001001002', '1001001001', 'MAT001', 'El mejor profesor que he tenido. Domina completamente el tema y hace que la programación sea fácil de entender.', @config_eval),
('2001001003', '1001001001', 'MAT001', 'Muy buen docente, aunque a veces las clases van un poco rápido. En general muy satisfecho.', @config_eval),
('2001001004', '1001001001', 'MAT001', 'Gran metodología de enseñanza. Los proyectos prácticos ayudan mucho a consolidar el conocimiento.', @config_eval);

-- Obtener IDs de las evaluaciones recién insertadas
SET @eval1 = LAST_INSERT_ID();
SET @eval2 = @eval1 + 1;
SET @eval3 = @eval1 + 2;
SET @eval4 = @eval1 + 3;

-- Detalles de evaluación 1
INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval1, @ca_dominio, @val_excelente, 'Domina perfectamente los temas de programación'),
(@eval1, @ca_cumplimiento, @val_excelente, 'Siempre cumple con el programa del curso'),
(@eval1, @ca_calidad, @val_excelente, 'Material de clase de excelente calidad'),
(@eval1, @ca_puntualidad, @val_bueno, 'Generalmente puntual'),
(@eval1, @ca_metodologia, @val_excelente, 'Metodología muy práctica y efectiva');

-- Detalles de evaluación 2
INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval2, @ca_dominio, @val_excelente, 'Conocimiento excepcional del tema'),
(@eval2, @ca_cumplimiento, @val_excelente, ''),
(@eval2, @ca_calidad, @val_excelente, 'Explicaciones muy claras'),
(@eval2, @ca_puntualidad, @val_excelente, 'Muy puntual'),
(@eval2, @ca_metodologia, @val_excelente, 'Excelentes ejemplos prácticos');

-- Detalles de evaluación 3
INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval3, @ca_dominio, @val_excelente, ''),
(@eval3, @ca_cumplimiento, @val_bueno, 'A veces se adelanta en los temas'),
(@eval3, @ca_calidad, @val_bueno, ''),
(@eval3, @ca_puntualidad, @val_aceptable, 'Ocasionalmente llega un poco tarde'),
(@eval3, @ca_metodologia, @val_bueno, 'Buena metodología en general');

-- Detalles de evaluación 4
INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval4, @ca_dominio, @val_excelente, 'Excelente manejo de los temas'),
(@eval4, @ca_cumplimiento, @val_excelente, ''),
(@eval4, @ca_calidad, @val_excelente, 'Los proyectos son muy útiles'),
(@eval4, @ca_puntualidad, @val_bueno, ''),
(@eval4, @ca_metodologia, @val_excelente, 'Me encanta su forma de enseñar');

-- Docente 2: María Elena González (1001001002) - Base de Datos (MAT002)
-- Docente promedio - calificaciones mixtas
INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES
('2001001005', '1001001002', 'MAT002', 'Buena profesora, aunque a veces los temas son un poco confusos. Podría mejorar las explicaciones.', @config_eval),
('2001001006', '1001001002', 'MAT002', 'Conoce bien la materia pero la forma de evaluar es muy estricta.', @config_eval),
('2001001007', '1001001002', 'MAT002', 'Regular. Los temas son interesantes pero falta más práctica en clase.', @config_eval),
('2001001008', '1001001002', 'MAT002', 'Profesora dedicada. Las prácticas de laboratorio son muy buenas.', @config_eval);

SET @eval5 = LAST_INSERT_ID();
SET @eval6 = @eval5 + 1;
SET @eval7 = @eval5 + 2;
SET @eval8 = @eval5 + 3;

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval5, @ca_dominio, @val_bueno, 'Conoce bien el tema'),
(@eval5, @ca_cumplimiento, @val_bueno, ''),
(@eval5, @ca_calidad, @val_aceptable, 'Podría mejorar el material'),
(@eval5, @ca_puntualidad, @val_excelente, 'Siempre puntual'),
(@eval5, @ca_metodologia, @val_aceptable, 'Falta más interacción');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval6, @ca_dominio, @val_bueno, ''),
(@eval6, @ca_cumplimiento, @val_bueno, 'Cumple con el programa'),
(@eval6, @ca_calidad, @val_bueno, ''),
(@eval6, @ca_puntualidad, @val_excelente, ''),
(@eval6, @ca_metodologia, @val_aceptable, 'Las evaluaciones son muy difíciles');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval7, @ca_dominio, @val_aceptable, 'A veces no responde bien las preguntas'),
(@eval7, @ca_cumplimiento, @val_bueno, ''),
(@eval7, @ca_calidad, @val_aceptable, 'Falta práctica'),
(@eval7, @ca_puntualidad, @val_bueno, ''),
(@eval7, @ca_metodologia, @val_aceptable, 'Muy teórica la clase');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval8, @ca_dominio, @val_bueno, 'Buen dominio'),
(@eval8, @ca_cumplimiento, @val_bueno, ''),
(@eval8, @ca_calidad, @val_bueno, 'Las prácticas son útiles'),
(@eval8, @ca_puntualidad, @val_excelente, ''),
(@eval8, @ca_metodologia, @val_bueno, '');

-- Docente 3: Carlos Alberto Ramírez (1001001003) - Redes (MAT003)
-- Docente con áreas de mejora - calificaciones bajas
INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES
('2001001009', '1001001003', 'MAT003', 'El profesor necesita mejorar su metodología. Los temas son confusos y no explica bien.', @config_eval),
('2001001010', '1001001003', 'MAT003', 'Difícil de entender. Debería usar más ejemplos prácticos.', @config_eval),
('2001001011', '1001001003', 'MAT003', 'No está mal, pero podría ser mejor. Falta organización en las clases.', @config_eval);

SET @eval9 = LAST_INSERT_ID();
SET @eval10 = @eval9 + 1;
SET @eval11 = @eval9 + 2;

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval9, @ca_dominio, @val_aceptable, 'Conoce el tema pero no lo transmite bien'),
(@eval9, @ca_cumplimiento, @val_aceptable, 'A veces no cumple con lo planeado'),
(@eval9, @ca_calidad, @val_deficiente, 'Material desactualizado'),
(@eval9, @ca_puntualidad, @val_deficiente, 'Frecuentemente llega tarde'),
(@eval9, @ca_metodologia, @val_deficiente, 'Necesita mejorar mucho');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval10, @ca_dominio, @val_aceptable, ''),
(@eval10, @ca_cumplimiento, @val_aceptable, ''),
(@eval10, @ca_calidad, @val_aceptable, 'Falta material de apoyo'),
(@eval10, @ca_puntualidad, @val_aceptable, ''),
(@eval10, @ca_metodologia, @val_deficiente, 'Clases muy aburridas');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval11, @ca_dominio, @val_bueno, ''),
(@eval11, @ca_cumplimiento, @val_aceptable, 'Desorganizado'),
(@eval11, @ca_calidad, @val_aceptable, ''),
(@eval11, @ca_puntualidad, @val_aceptable, ''),
(@eval11, @ca_metodologia, @val_aceptable, 'Puede mejorar');

-- Docente 4: Ana Patricia López (1001001004) - Estructuras (MAT004)
-- Excelente docente
INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES
('2001001012', '1001001004', 'MAT004', 'Increíble profesora. Sus clases son las mejores de la carrera. Muy clara y didáctica.', @config_eval),
('2001001013', '1001001004', 'MAT004', 'Excelente en todos los aspectos. La recomiendo totalmente.', @config_eval),
('2001001014', '1001001004', 'MAT004', 'Profesora muy dedicada y profesional. Se nota que ama lo que hace.', @config_eval);

SET @eval12 = LAST_INSERT_ID();
SET @eval13 = @eval12 + 1;
SET @eval14 = @eval12 + 2;

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval12, @ca_dominio, @val_excelente, 'Dominio total del tema'),
(@eval12, @ca_cumplimiento, @val_excelente, 'Siempre cumple'),
(@eval12, @ca_calidad, @val_excelente, 'Material impecable'),
(@eval12, @ca_puntualidad, @val_excelente, 'Siempre puntual'),
(@eval12, @ca_metodologia, @val_excelente, 'La mejor metodología');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval13, @ca_dominio, @val_excelente, ''),
(@eval13, @ca_cumplimiento, @val_excelente, ''),
(@eval13, @ca_calidad, @val_excelente, 'Excelentes presentaciones'),
(@eval13, @ca_puntualidad, @val_excelente, ''),
(@eval13, @ca_metodologia, @val_excelente, 'Muy dinámica');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval14, @ca_dominio, @val_excelente, 'Profesional y conocedora'),
(@eval14, @ca_cumplimiento, @val_excelente, ''),
(@eval14, @ca_calidad, @val_excelente, ''),
(@eval14, @ca_puntualidad, @val_bueno, ''),
(@eval14, @ca_metodologia, @val_excelente, 'Apasionada por enseñar');

-- Docente 5: Diana Carolina Martínez (1001001006) - Administración General (MAT005)
-- Buena docente con algunas áreas de mejora
INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES
('2001001015', '1001001006', 'MAT005', 'Buena profesora. Las clases son interesantes aunque a veces falta profundidad en algunos temas.', @config_eval),
('2001001016', '1001001006', 'MAT005', 'Muy amable y accesible. Siempre dispuesta a ayudar a los estudiantes.', @config_eval),
('2001001017', '1001001006', 'MAT005', 'Profesora comprometida. Los casos de estudio son muy útiles para entender la teoría.', @config_eval);

SET @eval15 = LAST_INSERT_ID();
SET @eval16 = @eval15 + 1;
SET @eval17 = @eval15 + 2;

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval15, @ca_dominio, @val_bueno, 'Conoce bien los fundamentos'),
(@eval15, @ca_cumplimiento, @val_bueno, ''),
(@eval15, @ca_calidad, @val_aceptable, 'Podría profundizar más'),
(@eval15, @ca_puntualidad, @val_excelente, ''),
(@eval15, @ca_metodologia, @val_bueno, 'Clases dinámicas');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval16, @ca_dominio, @val_bueno, ''),
(@eval16, @ca_cumplimiento, @val_excelente, 'Siempre disponible'),
(@eval16, @ca_calidad, @val_bueno, ''),
(@eval16, @ca_puntualidad, @val_excelente, 'Muy puntual'),
(@eval16, @ca_metodologia, @val_excelente, 'Excelente trato');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval17, @ca_dominio, @val_bueno, ''),
(@eval17, @ca_cumplimiento, @val_bueno, ''),
(@eval17, @ca_calidad, @val_bueno, 'Buenos casos de estudio'),
(@eval17, @ca_puntualidad, @val_bueno, ''),
(@eval17, @ca_metodologia, @val_bueno, 'Buen balance teoría-práctica');

-- Docente 6: Pedro José Hernández (1001001007) - Mercadeo (MAT006)
-- Docente con calificaciones mixtas
INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES
('2001001018', '1001001007', 'MAT006', 'El profesor sabe mucho pero a veces es difícil seguir el ritmo de la clase.', @config_eval),
('2001001019', '1001001007', 'MAT006', 'Interesante la materia. El profesor tiene mucha experiencia en el campo.', @config_eval),
('2001001020', '1001001007', 'MAT006', 'Clases un poco monótonas pero el contenido es valioso. Debería usar más recursos audiovisuales.', @config_eval);

SET @eval18 = LAST_INSERT_ID();
SET @eval19 = @eval18 + 1;
SET @eval20 = @eval18 + 2;

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval18, @ca_dominio, @val_excelente, 'Mucho conocimiento'),
(@eval18, @ca_cumplimiento, @val_bueno, ''),
(@eval18, @ca_calidad, @val_bueno, ''),
(@eval18, @ca_puntualidad, @val_bueno, ''),
(@eval18, @ca_metodologia, @val_aceptable, 'Va muy rápido');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval19, @ca_dominio, @val_excelente, 'Experiencia práctica valiosa'),
(@eval19, @ca_cumplimiento, @val_bueno, ''),
(@eval19, @ca_calidad, @val_bueno, 'Ejemplos reales del mercado'),
(@eval19, @ca_puntualidad, @val_aceptable, ''),
(@eval19, @ca_metodologia, @val_bueno, '');

INSERT INTO EVALUACION_DETALLE (EVALUACION_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO) VALUES
(@eval20, @ca_dominio, @val_bueno, ''),
(@eval20, @ca_cumplimiento, @val_bueno, ''),
(@eval20, @ca_calidad, @val_aceptable, 'Falta material multimedia'),
(@eval20, @ca_puntualidad, @val_bueno, ''),
(@eval20, @ca_metodologia, @val_aceptable, 'Clases poco dinámicas');

-- ===================================================================================
-- PASO 5: INSERTAR RESPUESTAS A PREGUNTAS (para evaluaciones con preguntas adicionales)
-- ===================================================================================

-- Asociar algunas evaluaciones con respuestas a preguntas
INSERT INTO RESPUESTAS_PREGUNTAS (EVALUACION_ID, PREGUNTA_ID, RESPUESTA) VALUES
(@eval1, 1, '5'),  -- Muy satisfecho
(@eval1, 2, 'Sí'),
(@eval1, 3, 'Metodología del docente'),
(@eval2, 1, '5'),
(@eval2, 2, 'Sí'),
(@eval5, 1, '3'),  -- Satisfacción media
(@eval5, 2, 'Sí'),
(@eval9, 1, '2'),  -- Poco satisfecho
(@eval9, 2, 'No'),
(@eval9, 3, 'Contenido teórico'),
(@eval12, 1, '5'),
(@eval12, 2, 'Sí'),
(@eval12, 3, 'Práctica aplicada');

-- ===================================================================================
-- PASO 6: VERIFICACIÓN DE DATOS INSERTADOS
-- ===================================================================================

SELECT '==================== RESUMEN DE DATOS SIMULADOS ====================' AS mensaje;

SELECT 'Facultades:' AS tipo, COUNT(*) AS cantidad FROM FACULTADES WHERE ACTIVO = TRUE
UNION ALL
SELECT 'Programas:', COUNT(*) FROM PROGRAMAS_ACADEMICOS WHERE ACTIVO = TRUE
UNION ALL
SELECT 'Docentes asignados:', COUNT(*) FROM DOCENTES_PROGRAMAS WHERE ACTIVO = TRUE
UNION ALL
SELECT 'Evaluaciones totales:', COUNT(*) FROM EVALUACIONES
UNION ALL
SELECT 'Detalles de evaluación:', COUNT(*) FROM EVALUACION_DETALLE
UNION ALL
SELECT 'Respuestas a preguntas:', COUNT(*) FROM RESPUESTAS_PREGUNTAS;

SELECT '==================== EVALUACIONES POR DOCENTE ====================' AS mensaje;

SELECT 
    e.DOCUMENTO_DOCENTE,
    COUNT(DISTINCT e.ID) AS total_evaluaciones,
    ROUND(AVG(cv.PUNTAJE), 2) AS promedio_general,
    pa.NOMBRE AS programa,
    f.NOMBRE AS facultad
FROM EVALUACIONES e
LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
LEFT JOIN DOCENTES_PROGRAMAS dp ON e.DOCUMENTO_DOCENTE = dp.DOCUMENTO_DOCENTE AND dp.ACTIVO = TRUE
LEFT JOIN PROGRAMAS_ACADEMICOS pa ON dp.PROGRAMA_ID = pa.ID
LEFT JOIN FACULTADES f ON pa.FACULTAD_ID = f.ID
GROUP BY e.DOCUMENTO_DOCENTE, pa.NOMBRE, f.NOMBRE
ORDER BY promedio_general DESC;

SELECT '==================== DISTRIBUCIÓN DE VALORACIONES ====================' AS mensaje;

SELECT 
    ev.ETIQUETA AS valoracion,
    COUNT(*) AS cantidad,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM EVALUACION_DETALLE), 1) AS porcentaje,
    MAX(cv.PUNTAJE) AS puntaje
FROM EVALUACION_DETALLE ed
JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
GROUP BY ev.ETIQUETA, ev.ID
ORDER BY puntaje DESC;

SELECT '==================== FIN DE LA MIGRACIÓN ====================' AS mensaje;
