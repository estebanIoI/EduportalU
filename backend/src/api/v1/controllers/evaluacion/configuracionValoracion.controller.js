// src/api/v1/controllers/evaluacion/configuracionValoracion.controller.js
const ConfiguracionValoracionService = require('../../services/evaluacion/configuracionValoracion.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getConfiguraciones = async (req, res, next) => {
  try {
    const { pagination } = req;
    const configuraciones = await ConfiguracionValoracionService.getAllConfiguraciones(pagination);

    const paginatedResponse = res.paginate(configuraciones.data, configuraciones.totalCount);
    
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

const getConfiguracionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracion = await ConfiguracionValoracionService.getConfiguracionById(id);
    
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

const createConfiguracion = async (req, res, next) => {
  try {
    const configuracionData = req.body;
    const newConfiguracion = await ConfiguracionValoracionService.createConfiguracion(configuracionData);
    return successResponse(res, {
      code: 201,
      message: MESSAGES.GENERAL.CREATED,
      data: newConfiguracion,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateConfiguracion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracion = await ConfiguracionValoracionService.getConfiguracionById(id);

    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const configuracionData = req.body;
    const updatedConfiguracion = await ConfiguracionValoracionService.updateConfiguracion(id, configuracionData);

    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updatedConfiguracion,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteConfiguracion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracion = await ConfiguracionValoracionService.getConfiguracionById(id);
    
    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    await ConfiguracionValoracionService.deleteConfiguracion(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

const updateEstadoConfiguracion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    // Validación del estado
    if (typeof activo !== 'number' || (activo !== 0 && activo !== 1)) {
      return errorResponse(res, { code: 400, message: 'Valor de estado inválido' });
    }

    const configuracion = await ConfiguracionValoracionService.getConfiguracionById(id);
    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const updated = await ConfiguracionValoracionService.updateEstado(id, activo);
    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updated,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

module.exports = {
  getConfiguraciones,
  getConfiguracionById,
  createConfiguracion,
  updateConfiguracion,
  deleteConfiguracion,
  updateEstadoConfiguracion,
};