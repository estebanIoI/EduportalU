// src/api/v1/controllers/evaluacion/evaluacionDetalle.controller.js
const EvaluacionDetalleService = require('../../services/evaluacion/evaluacionDetalle.service');
const { successResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getDetalles = async (req, res, next) => {
  try {
    const detalles = await EvaluacionDetalleService.getAllDetalles();
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: detalles,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getDetalleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const detalle = await EvaluacionDetalleService.getDetalleById(id);
    
    if (!detalle) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: detalle,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createDetalle = async (req, res, next) => {
  try {
    const detalleData = req.body;
    const newDetalle = await EvaluacionDetalleService.createDetalle(detalleData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: newDetalle,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const detalle = await EvaluacionDetalleService.getDetalleById(id);

    if (!detalle) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const detalleData = req.body;
    const updatedDetalle = await EvaluacionDetalleService.updateDetalle(id, detalleData);

    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updatedDetalle,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteDetalle = async (req, res, next) => {
  try {
    const { id } = req.params;
    const detalle = await EvaluacionDetalleService.getDetalleById(id);
    
    if (!detalle) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    await EvaluacionDetalleService.deleteDetalle(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

const createDetallesEvaluacion = async (req, res, next) => {
  try {
    const { evaluacionId, detalles, comentarioGeneral } = req.body;

    const result = await EvaluacionDetalleService.createDetallesEvaluacion(
      evaluacionId,
      detalles,
      comentarioGeneral
    );

    return successResponse(res, {
      message: "Detalles de evaluación creados exitosamente",
      data: result,
    });
  } catch (error) {
    if (error.message === 'La evaluación no existe') {
      return errorResponse(res, {
        code: 404,
        message: error.message,
      });
    }
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

module.exports = {
  getDetalles,
  getDetalleById,
  createDetalle,
  updateDetalle,
  deleteDetalle,
  createDetallesEvaluacion,
};