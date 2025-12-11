-- Migración: Actualizar fechas de configuración de evaluación para incluir diciembre 2025
-- Fecha: 2025-12-08

-- Ver configuraciones actuales
SELECT 
    ID, 
    TIPO_EVALUACION_ID,
    FECHA_INICIO, 
    FECHA_FIN, 
    ACTIVO,
    ES_EVALUACION_DOCENTE,
    TITULO 
FROM CONFIGURACION_EVALUACION;

-- Actualizar todas las configuraciones activas para extender el período hasta fin de 2026
-- Esto asegura que las evaluaciones estén disponibles durante el desarrollo
UPDATE CONFIGURACION_EVALUACION 
SET 
    FECHA_INICIO = '2025-01-01',
    FECHA_FIN = '2026-12-31'
WHERE ACTIVO = TRUE;

-- Verificar los cambios
SELECT 
    ID, 
    TIPO_EVALUACION_ID,
    FECHA_INICIO, 
    FECHA_FIN, 
    ACTIVO,
    ES_EVALUACION_DOCENTE,
    TITULO 
FROM CONFIGURACION_EVALUACION;
