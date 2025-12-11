const Joi = require('joi');
const moment = require('moment');

const configuracionEvaluacionSchema = Joi.object({
  TIPO_EVALUACION_ID: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'El ID del tipo de evaluación debe ser un número',
      'number.integer': 'El ID del tipo de evaluación debe ser un número entero',
      'number.positive': 'El ID del tipo de evaluación debe ser un número positivo',
      'any.required': 'El ID del tipo de evaluación es obligatorio'
    }),

  FECHA_INICIO: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .custom((value, helpers) => {
      // Parsear como fecha sin conversión de zona horaria
      const today = moment().format('YYYY-MM-DD');
      const inicio = value; // Mantener como string

      console.log('🕐 Validación de fechas:');
      console.log('   HOY:', today);
      console.log('   FECHA_INICIO:', inicio);

      if (inicio < today) {
        return helpers.message('La fecha de inicio no puede ser menor a la fecha actual');
      }

      return value;
    })
    .messages({
      'string.pattern.base': 'La fecha de inicio debe tener el formato YYYY-MM-DD',
      'any.required': 'La fecha de inicio es obligatoria',
    }),

  FECHA_FIN: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required()
    .messages({
      'string.pattern.base': 'La fecha fin debe tener el formato YYYY-MM-DD',
      'any.required': 'La fecha fin es obligatoria',
    }),

  ACTIVO: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'El campo ACTIVO debe ser verdadero o falso',
    }),

  ES_EVALUACION_DOCENTE: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'El campo ES_EVALUACION_DOCENTE debe ser verdadero o falso',
    }),

  TITULO: Joi.string()
    .max(200)
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'El título debe ser una cadena de texto',
      'string.max': 'El título no puede exceder 200 caracteres',
    }),

  INSTRUCCIONES: Joi.string()
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'Las instrucciones deben ser una cadena de texto',
    }),

  URL_FORMULARIO: Joi.string()
    .uri()
    .allow(null, '')
    .optional()
    .messages({
      'string.base': 'La URL del formulario debe ser una cadena de texto',
      'string.uri': 'La URL del formulario debe ser una URL válida',
    }),

}).custom((obj, helpers) => {
  // Comparar strings directamente (YYYY-MM-DD se compara lexicográficamente correcto)
  const inicio = obj.FECHA_INICIO;
  const fin = obj.FECHA_FIN;

  console.log('🔍 Comparación de fechas:');
  console.log('   Inicio:', inicio);
  console.log('   Fin:', fin);

  if (inicio >= fin) {
    return helpers.message('La fecha de inicio debe ser menor a la fecha fin');
  }

  return obj;
});

module.exports = configuracionEvaluacionSchema;
