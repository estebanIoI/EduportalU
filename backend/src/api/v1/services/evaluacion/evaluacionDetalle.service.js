// src/api/v1/services/evaluacion/evaluacionDetalle.service.js
const EvaluacionDetalleModel = require('../../models/evaluacion/evaluacionDetalle.model');
const EvaluacionesModel = require('../../models/evaluacion/evaluaciones.model');

const getAllDetalles = async () => {
  try {
    const detalles = await EvaluacionDetalleModel.getAllDetalles();
    return detalles;
  } catch (error) {
    throw error;
  }
};

const getDetalleById = async (id) => {
  try {
    const detalle = await EvaluacionDetalleModel.getDetalleById(id);
    return detalle;
  } catch (error) {
    throw error;
  }
};

const createDetalle = async (detalleData) => {
  try {
    const newDetalle = await EvaluacionDetalleModel.createDetalle(detalleData);
    return newDetalle;
  } catch (error) {
    throw error;
  }
};

const updateDetalle = async (id, detalleData) => {
  try {
    const updatedDetalle = await EvaluacionDetalleModel.updateDetalle(id, detalleData);
    return updatedDetalle;
  } catch (error) {
    throw error;
  }
};

const deleteDetalle = async (id) => {
  try {
    await EvaluacionDetalleModel.deleteDetalle(id);
    return true;
  } catch (error) {
    throw error;
  }
};

const createDetallesEvaluacion = async (evaluacionId, detalles, comentarioGeneral) => {
  try {
    // Validar que la evaluación exista
    const evaluacion = await EvaluacionesModel.getEvaluacionById(evaluacionId);
    if (!evaluacion) {
      throw new Error('La evaluación no existe');
    }

    // Actualizar el comentario general en la evaluación
    await EvaluacionesModel.updateEvaluacion(evaluacionId, {
      ...evaluacion,
      COMENTARIO_GENERAL: comentarioGeneral
    });

    // Preparar los detalles para inserción masiva
    const detallesFormateados = detalles.map(detalle => ({
      EVALUACION_ID: evaluacionId,
      ASPECTO_ID: detalle.aspectoId,
      VALORACION_ID: detalle.valoracionId,
      COMENTARIO: detalle.comentario || null
    }));

    // Crear todos los detalles
    const detallesCreados = await EvaluacionDetalleModel.bulkCreate(detallesFormateados);

    return {
      evaluacion: {
        ...evaluacion,
        COMENTARIO_GENERAL: comentarioGeneral
      },
      detalles: detallesCreados
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllDetalles,
  getDetalleById,
  createDetalle,
  updateDetalle,
  deleteDetalle,
  createDetallesEvaluacion,
};