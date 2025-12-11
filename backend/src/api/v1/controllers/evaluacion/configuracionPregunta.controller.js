// src/api/v1/controllers/evaluacion/configuracionPregunta.controller.js
const ConfiguracionPreguntaService = require('../../services/evaluacion/configuracionPregunta.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getConfiguracionPreguntas = async (req, res, next) => {
  try {
    const { pagination } = req;
    const result = await ConfiguracionPreguntaService.getAllConfiguracionPreguntas(pagination);
    
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

const getConfiguracionPreguntaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracion = await ConfiguracionPreguntaService.getConfiguracionPreguntaById(id);
    
    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: configuracion,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getConfiguracionPreguntasByConfiguracionId = async (req, res, next) => {
  try {
    const { configuracionId } = req.params;
    const preguntas = await ConfiguracionPreguntaService.getPreguntasByConfiguracionId(configuracionId);
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: preguntas,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createConfiguracionPregunta = async (req, res, next) => {
  try {
    const configuracionData = req.body;
    const newConfiguracion = await ConfiguracionPreguntaService.createConfiguracionPregunta(configuracionData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: newConfiguracion,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateConfiguracionPregunta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracionData = req.body;
    const updated = await ConfiguracionPreguntaService.updateConfiguracionPregunta(id, configuracionData);
    
    if (!updated) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updated,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const updateEstadoConfiguracionPregunta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    const updated = await ConfiguracionPreguntaService.updateEstado(id, activo);
    
    if (!updated) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updated,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteConfiguracionPregunta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await ConfiguracionPreguntaService.deleteConfiguracionPregunta(id);
    
    if (!deleted) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

module.exports = {
  getConfiguracionPreguntas,
  getConfiguracionPreguntaById,
  getConfiguracionPreguntasByConfiguracionId,
  createConfiguracionPregunta,
  updateConfiguracionPregunta,
  updateEstadoConfiguracionPregunta,
  deleteConfiguracionPregunta,
};
