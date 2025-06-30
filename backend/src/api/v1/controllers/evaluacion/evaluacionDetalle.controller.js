// src/api/v1/controllers/evaluacion/evaluacionDetalle.controller.js
const EvaluacionDetalleModel = require('../../models/evaluacion/evaluacionDetalle.model');
const { successResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');
const EvaluacionesModel = require('../../models/evaluacion/evaluaciones.model');

const getDetalles = async (req, res, next) => {
  try {
    const detalles = await EvaluacionDetalleModel.getAllDetalles();
    return successResponse(res, { message: MESSAGES.GENERAL.FETCH_SUCCESS, data: detalles });
  } catch (error) {
    next(error);
  }
};

const getDetalleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const detalle = await EvaluacionDetalleModel.getDetalleById(id);
    
    if (!detalle) {
      return errorResponse(res, { code: 404, message: MESSAGES.EVALUACION_DETALLE.NOT_FOUND });
    }
    
    return successResponse(res, { message: MESSAGES.GENERAL.FETCH_SUCCESS, data: detalle });
  } catch (error) {
    next(error);
  }
};

const createDetalle = async (req, res, next) => {
  try {
    const detalleData = req.body;
    const newDetalle = await EvaluacionDetalleModel.createDetalle(detalleData);

    return successResponse(res, { code: 201, message: MESSAGES.GENERAL.CREATED, data: newDetalle });
  } catch (error) {
    next(error);
  }
};

const updateDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const detalle = await EvaluacionDetalleModel.getDetalleById(id);

    if (!detalle) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const detalleData = req.body;
    const updatedDetalle = await EvaluacionDetalleModel.updateDetalle(id, detalleData);

    return successResponse(res, { message: MESSAGES.GENERAL.UPDATED, data: updatedDetalle });
  } catch (error) {
    next(error);
  }
};

const deleteDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const detalle = await EvaluacionDetalleModel.getDetalleById(id);
    
    if (!detalle) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    await EvaluacionDetalleModel.deleteDetalle(id);
    return successResponse(res, { message: MESSAGES.GENERAL.DELETED });
  } catch (error) {
    next(error);
  }
};

const createDetallesEvaluacion = async (req, res, next) => {
  try {
    const { evaluacionId, detalles, comentarioGeneral } = req.body;

    // Validar que la evaluación exista
    const evaluacion = await EvaluacionesModel.getEvaluacionById(evaluacionId);
    if (!evaluacion) {
      return errorResponse(res, { 
        code: 404, 
        message: "La evaluación no existe" 
      });
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

    return successResponse(res, {
      code: 201,
      message: "Detalles de evaluación creados exitosamente",
      data: {
        evaluacion: {
          ...evaluacion,
          COMENTARIO_GENERAL: comentarioGeneral
        },
        detalles: detallesCreados
      }
    });
  } catch (error) {
    console.error('Error al crear detalles de evaluación:', error);
    return errorResponse(res, {
      code: 500,
      message: MESSAGES.GENERAL.ERROR,
      error: error.message
    });
  }
};

module.exports = {
  getDetalles,
  getDetalleById,
  createDetalle,
  updateDetalle,
  deleteDetalle,
  createDetallesEvaluacion
};
