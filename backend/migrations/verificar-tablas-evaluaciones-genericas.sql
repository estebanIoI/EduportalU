-- Script para verificar si las tablas de evaluaciones genéricas existen
-- Ejecutar este script para verificar el estado de las tablas

-- Verificar tabla EVALUACIONES_GENERICAS
SELECT 
    'EVALUACIONES_GENERICAS' as tabla,
    COUNT(*) as registros
FROM EVALUACIONES_GENERICAS
UNION ALL
-- Verificar tabla EVALUACIONES_GENERICAS_DETALLE
SELECT 
    'EVALUACIONES_GENERICAS_DETALLE' as tabla,
    COUNT(*) as registros
FROM EVALUACIONES_GENERICAS_DETALLE
UNION ALL
-- Verificar tabla RESPUESTAS_PREGUNTAS
SELECT 
    'RESPUESTAS_PREGUNTAS' as tabla,
    COUNT(*) as registros
FROM RESPUESTAS_PREGUNTAS;

-- Si este script falla, ejecuta la migración:
-- SOURCE c:/Users/esteb/OneDrive/Escritorio/evaluacion_insitu/FormularioU/backend/migrations/2025-10-16-add-evaluaciones-genericas.sql;
