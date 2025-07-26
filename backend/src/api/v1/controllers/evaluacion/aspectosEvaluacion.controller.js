// src/api/v1/controllers/evaluacion/aspectosEvaluacion.controller.js
const AspectosEvaluacionService = require('../../services/evaluacion/aspectosEvaluacion.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getAspectos = async (req, res, next) => {
  try {
    const { pagination } = req;
    const result = await AspectosEvaluacionService.getAllAspectos(pagination);
    
    // Usar el helper de paginación del middleware
    const paginatedResponse = res.paginate(result.data, result.totalCount);
    
    return successPaginatedResponse(res, {
      data: paginatedResponse.data,
      pagination: paginatedResponse.pagination,
      message: MESSAGES.GENERAL.FETCH_SUCCESS
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getAspectoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aspecto = await AspectosEvaluacionService.getAspectoById(id);
    
    if (!aspecto) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: aspecto,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createAspecto = async (req, res, next) => {
  try {
    const aspectoData = req.body;
    const newAspecto = await AspectosEvaluacionService.createAspecto(aspectoData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: newAspecto,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateAspecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aspecto = await AspectosEvaluacionService.getAspectoById(id);

    if (!aspecto) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const aspectoData = req.body;
    const updatedAspecto = await AspectosEvaluacionService.updateAspecto(id, aspectoData);

    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updatedAspecto,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteAspecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const aspecto = await AspectosEvaluacionService.getAspectoById(id);
    
    if (!aspecto) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    await AspectosEvaluacionService.deleteAspecto(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

module.exports = {
  getAspectos,
  getAspectoById,
  createAspecto,
  updateAspecto,
  deleteAspecto,
};