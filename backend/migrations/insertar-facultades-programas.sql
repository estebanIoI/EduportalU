-- ===================================================================================
-- SCRIPT PARA INSERTAR FACULTADES Y PROGRAMAS
-- Base de datos: sigedin_ies_v4
-- Institución: Universidad del Pacífico (adaptado a estructura real)
-- Ejecutar este script para poblar las tablas de estructura académica
-- ===================================================================================

USE sigedin_ies_v4;

-- Limpiar datos existentes (para evitar duplicados)
DELETE FROM DOCENTES_PROGRAMAS;
DELETE FROM PROGRAMAS_ACADEMICOS;
DELETE FROM FACULTADES;

-- ===================================================================================
-- INSERTAR FACULTADES (3 principales + 1 posgrados)
-- ===================================================================================

INSERT INTO FACULTADES (CODIGO, NOMBRE, DESCRIPCION, ACTIVO) VALUES
('FAC-ING', 'Facultad de Ingeniería', 'Facultad de Ingeniería y Tecnologías', TRUE),
('FAC-CEAC', 'Facultad de Ciencias Económicas, Administrativas y Contables', 'Facultad de Ciencias Económicas, Administrativas y Contables', TRUE),
('FAC-AGRO', 'Facultad de Ciencias Agropecuarias y Ambientales', 'Facultad de Ciencias Agropecuarias, Ambientales y Forestales', TRUE),
('FAC-POSG', 'Facultad de Posgrados', 'Especializaciones y Maestrías', TRUE);

-- Verificar facultades insertadas
SELECT 'Facultades insertadas:' as mensaje;
SELECT ID, CODIGO, NOMBRE FROM FACULTADES WHERE ACTIVO = TRUE;

-- ===================================================================================
-- INSERTAR PROGRAMAS ACADÉMICOS
-- ===================================================================================

-- Obtener IDs de facultades
SET @fac_ing = (SELECT ID FROM FACULTADES WHERE CODIGO = 'FAC-ING');
SET @fac_ceac = (SELECT ID FROM FACULTADES WHERE CODIGO = 'FAC-CEAC');
SET @fac_agro = (SELECT ID FROM FACULTADES WHERE CODIGO = 'FAC-AGRO');
SET @fac_posg = (SELECT ID FROM FACULTADES WHERE CODIGO = 'FAC-POSG');

-- ===================================================================================
-- PROGRAMAS DE FACULTAD DE INGENIERÍA
-- ===================================================================================

-- Ingenierías (Pregrado)
INSERT INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, DESCRIPCION, FACULTAD_ID, NIVEL, MODALIDAD, ACTIVO) VALUES
('ING-CIV', 'Ingeniería Civil', 'Programa de Ingeniería Civil', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE),
('ING-AMB', 'Ingeniería Ambiental', 'Programa de Ingeniería Ambiental', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE),
('ING-SIS', 'Ingeniería de Sistemas', 'Programa de Ingeniería de Sistemas', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE),
('ING-FOR', 'Ingeniería Forestal', 'Programa de Ingeniería Forestal', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE),
('ING-AGR', 'Ingeniería Agroindustrial', 'Programa de Ingeniería Agroindustrial', @fac_ing, 'PREGRADO', 'PRESENCIAL', TRUE);

-- Tecnologías de Ingeniería (Pregrado Tecnológico)
INSERT INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, DESCRIPCION, FACULTAD_ID, NIVEL, MODALIDAD, ACTIVO) VALUES
('TEC-OBR', 'Tecnología en Obras Civiles', 'Programa de Tecnología en Obras Civiles', @fac_ing, 'TECNOLOGIA', 'PRESENCIAL', TRUE),
('TEC-SAN', 'Tecnología en Saneamiento', 'Programa de Tecnología en Saneamiento Ambiental', @fac_ing, 'TECNOLOGIA', 'PRESENCIAL', TRUE),
('TEC-REC', 'Tecnología en Recursos Naturales', 'Programa de Tecnología en Gestión de Recursos Naturales', @fac_ing, 'TECNOLOGIA', 'PRESENCIAL', TRUE),
('TEC-PRO', 'Tecnología en Producción', 'Programa de Tecnología en Producción Industrial', @fac_ing, 'TECNOLOGIA', 'PRESENCIAL', TRUE),
('TEC-DES', 'Tecnología en Desarrollo de Software', 'Programa de Tecnología en Desarrollo de Software', @fac_ing, 'TECNOLOGIA', 'PRESENCIAL', TRUE);

-- ===================================================================================
-- PROGRAMAS DE FACULTAD DE CIENCIAS ECONÓMICAS, ADMINISTRATIVAS Y CONTABLES
-- ===================================================================================

-- Programas Profesionales (Pregrado)
INSERT INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, DESCRIPCION, FACULTAD_ID, NIVEL, MODALIDAD, ACTIVO) VALUES
('ADM-EMP', 'Administración de Empresas', 'Programa de Administración de Empresas', @fac_ceac, 'PREGRADO', 'PRESENCIAL', TRUE),
('ADM-NEG', 'Administración de Negocios', 'Programa de Administración de Negocios Internacionales', @fac_ceac, 'PREGRADO', 'PRESENCIAL', TRUE),
('CON-PUB', 'Contaduría Pública', 'Programa de Contaduría Pública', @fac_ceac, 'PREGRADO', 'PRESENCIAL', TRUE);

-- Tecnologías Administrativas
INSERT INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, DESCRIPCION, FACULTAD_ID, NIVEL, MODALIDAD, ACTIVO) VALUES
('TEC-GCF', 'Tecnología en Gestión Contable y Financiera', 'Programa de Tecnología en Gestión Contable y Financiera', @fac_ceac, 'TECNOLOGIA', 'PRESENCIAL', TRUE),
('TEC-GEM', 'Tecnología en Gestión Empresarial', 'Programa de Tecnología en Gestión Empresarial', @fac_ceac, 'TECNOLOGIA', 'PRESENCIAL', TRUE),
('TEC-GAD', 'Tecnología en Gestión Administrativa', 'Programa de Tecnología en Gestión Administrativa', @fac_ceac, 'TECNOLOGIA', 'PRESENCIAL', TRUE);

-- ===================================================================================
-- PROGRAMAS DE FACULTAD DE CIENCIAS AGROPECUARIAS Y AMBIENTALES
-- (Programas que pueden estar compartidos o específicos de esta facultad)
-- ===================================================================================

-- Nota: Algunos programas como Ing. Ambiental, Forestal y Agroindustrial ya están en Ingeniería
-- Si tu institución los maneja en esta facultad, puedes mover los registros aquí

-- ===================================================================================
-- PROGRAMAS DE POSGRADOS
-- ===================================================================================

INSERT INTO PROGRAMAS_ACADEMICOS (CODIGO, NOMBRE, DESCRIPCION, FACULTAD_ID, NIVEL, MODALIDAD, ACTIVO) VALUES
('ESP-GER', 'Especialización en Gerencia', 'Especialización en Gerencia de Empresas', @fac_posg, 'ESPECIALIZACION', 'PRESENCIAL', TRUE),
('ESP-GFI', 'Especialización en Gerencia Financiera', 'Especialización en Gerencia Financiera', @fac_posg, 'ESPECIALIZACION', 'PRESENCIAL', TRUE);

-- Verificar programas insertados
SELECT 'Programas insertados:' as mensaje;
SELECT 
    pa.ID,
    pa.CODIGO,
    pa.NOMBRE as PROGRAMA,
    f.NOMBRE as FACULTAD,
    pa.NIVEL,
    pa.MODALIDAD
FROM PROGRAMAS_ACADEMICOS pa
INNER JOIN FACULTADES f ON pa.FACULTAD_ID = f.ID
WHERE pa.ACTIVO = TRUE
ORDER BY f.NOMBRE, pa.NOMBRE;

-- ===================================================================================
-- ASIGNAR DOCENTES A PROGRAMAS (basado en evaluaciones existentes)
-- Esto asigna automáticamente los docentes que tienen evaluaciones al programa
-- de Ingeniería de Sistemas por defecto
-- ===================================================================================

-- Obtener el ID del programa de Ingeniería de Sistemas
SET @prog_ing_sis = (SELECT ID FROM PROGRAMAS_ACADEMICOS WHERE CODIGO = 'ING-SIS');

-- Insertar docentes que tienen evaluaciones pero no están asignados a ningún programa
INSERT INTO DOCENTES_PROGRAMAS (DOCUMENTO_DOCENTE, PROGRAMA_ID, ES_TITULAR, ACTIVO)
SELECT DISTINCT 
    e.DOCUMENTO_DOCENTE,
    @prog_ing_sis,
    FALSE,
    TRUE
FROM EVALUACIONES e
WHERE NOT EXISTS (
    SELECT 1 FROM DOCENTES_PROGRAMAS dp 
    WHERE dp.DOCUMENTO_DOCENTE = e.DOCUMENTO_DOCENTE
);

-- Verificar docentes asignados
SELECT 'Docentes asignados a programas:' as mensaje;
SELECT 
    dp.DOCUMENTO_DOCENTE,
    pa.NOMBRE as PROGRAMA,
    f.NOMBRE as FACULTAD,
    dp.ES_TITULAR
FROM DOCENTES_PROGRAMAS dp
INNER JOIN PROGRAMAS_ACADEMICOS pa ON dp.PROGRAMA_ID = pa.ID
INNER JOIN FACULTADES f ON pa.FACULTAD_ID = f.ID
WHERE dp.ACTIVO = TRUE;

-- ===================================================================================
-- RESUMEN
-- ===================================================================================
SELECT 'RESUMEN DE DATOS INSERTADOS:' as mensaje;
SELECT 
    (SELECT COUNT(*) FROM FACULTADES WHERE ACTIVO = TRUE) as total_facultades,
    (SELECT COUNT(*) FROM PROGRAMAS_ACADEMICOS WHERE ACTIVO = TRUE) as total_programas,
    (SELECT COUNT(*) FROM DOCENTES_PROGRAMAS WHERE ACTIVO = TRUE) as total_docentes_asignados;
