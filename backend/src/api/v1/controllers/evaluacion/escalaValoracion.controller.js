// src/api/v1/controllers/evaluacion/escalaValoracion.controller.js
const EscalaValoracionService = require('../../services/evaluacion/escalaValoracion.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getEscalas = async (req, res, next) => {
  try {
    const { pagination } = req;
    const escalas = await EscalaValoracionService.getAllEscalas(pagination);

    const paginatedResponse = res.paginate(escalas.data, escalas.totalCount);

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

const getEscalaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const escala = await EscalaValoracionService.getEscalaById(id);
    
    if (!escala) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: escala,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createEscala = async (req, res, next) => {
  try {
    const escalaData = req.body;
    const newEscala = await EscalaValoracionService.createEscala(escalaData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: newEscala,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateEscala = async (req, res, next) => {
  try {
    const { id } = req.params;
    const escala = await EscalaValoracionService.getEscalaById(id);

    if (!escala) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const escalaData = req.body;
    const updatedEscala = await EscalaValoracionService.updateEscala(id, escalaData);

    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updatedEscala,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteEscala = async (req, res, next) => {
  try {
    const { id } = req.params;
    const escala = await EscalaValoracionService.getEscalaById(id);
    
    if (!escala) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    await EscalaValoracionService.deleteEscala(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

module.exports = {
  getEscalas,
  getEscalaById,
  createEscala,
  updateEscala,
  deleteEscala,
};