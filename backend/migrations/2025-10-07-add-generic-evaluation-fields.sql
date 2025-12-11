-- Migración: Agregar campos para evaluaciones genéricas
-- Fecha: 2025-10-07
-- Descripción: Agrega campos para soportar diferentes tipos de evaluaciones (no solo docentes)

USE sigedin_ies_v4;

-- Agregar nuevas columnas a la tabla CONFIGURACION_EVALUACION
ALTER TABLE CONFIGURACION_EVALUACION
  ADD COLUMN IF NOT EXISTS ES_EVALUACION_DOCENTE BOOLEAN DEFAULT TRUE COMMENT 'Indica si es una evaluación de docentes',
  ADD COLUMN IF NOT EXISTS TITULO VARCHAR(255) NULL COMMENT 'Título personalizado de la evaluación',
  ADD COLUMN IF NOT EXISTS INSTRUCCIONES TEXT NULL COMMENT 'Instrucciones específicas para esta evaluación',
  ADD COLUMN IF NOT EXISTS URL_FORMULARIO VARCHAR(500) NULL COMMENT 'URL de un formulario externo (ej: Google Forms)';

-- Verificar que las columnas se agregaron correctamente
DESCRIBE CONFIGURACION_EVALUACION;

-- Actualizar registros existentes para que sean evaluaciones de docentes por defecto
UPDATE CONFIGURACION_EVALUACION 
SET ES_EVALUACION_DOCENTE = TRUE 
WHERE ES_EVALUACION_DOCENTE IS NULL;

SELECT 'Migración completada exitosamente' AS status;
