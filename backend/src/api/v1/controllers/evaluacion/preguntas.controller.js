// src/api/v1/controllers/evaluacion/preguntas.controller.js
const PreguntasService = require('../../services/evaluacion/preguntas.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getPreguntas = async (req, res, next) => {
  try {
    const { pagination } = req;
    const result = await PreguntasService.getAllPreguntas(pagination);
    
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

const getPreguntaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pregunta = await PreguntasService.getPreguntaById(id);
    
    if (!pregunta) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: pregunta,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createPregunta = async (req, res, next) => {
  try {
    const preguntaData = req.body;
    const newPregunta = await PreguntasService.createPregunta(preguntaData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: newPregunta,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updatePregunta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const preguntaData = req.body;
    const updated = await PreguntasService.updatePregunta(id, preguntaData);
    
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

const deletePregunta = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await PreguntasService.deletePregunta(id);
    
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
  getPreguntas,
  getPreguntaById,
  createPregunta,
  updatePregunta,
  deletePregunta,
};
