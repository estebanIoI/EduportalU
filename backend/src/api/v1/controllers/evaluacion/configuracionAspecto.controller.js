// src/api/v1/controllers/evaluacion/configuracionAspecto.controller.js
const ConfiguracionAspectoService = require('../../services/evaluacion/configuracionAspecto.service');
const { successResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getConfiguracionesAspecto = async (req, res, next) => {
  try {
    const configuracionesAspecto = await ConfiguracionAspectoService.getAllConfiguracionesAspecto();
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: configuracionesAspecto,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getConfiguracionAspectoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracionAspecto = await ConfiguracionAspectoService.getConfiguracionAspectoById(id);
    
    if (!configuracionAspecto) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: configuracionAspecto,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createConfiguracionAspecto = async (req, res, next) => {
  try {
    const configuracionAspectoData = req.body;
    const newConfiguracionAspecto = await ConfiguracionAspectoService.createConfiguracionAspecto(configuracionAspectoData);
    return successResponse(res, {
      code: 201,
      message: MESSAGES.GENERAL.CREATED,
      data: newConfiguracionAspecto,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateConfiguracionAspecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracionAspecto = await ConfiguracionAspectoService.getConfiguracionAspectoById(id);

    if (!configuracionAspecto) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const configuracionAspectoData = req.body;
    const updatedConfiguracionAspecto = await ConfiguracionAspectoService.updateConfiguracionAspecto(id, configuracionAspectoData);

    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updatedConfiguracionAspecto,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteConfiguracionAspecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const configuracionAspecto = await ConfiguracionAspectoService.getConfiguracionAspectoById(id);
    
    if (!configuracionAspecto) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    await ConfiguracionAspectoService.deleteConfiguracionAspecto(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

const updateEstadoConfiguracionAspecto = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    // Validación del estado
    if (typeof activo !== 'number' || (activo !== 0 && activo !== 1)) {
      return errorResponse(res, { code: 400, message: 'Valor de estado inválido' });
    }

    const configuracion = await ConfiguracionAspectoService.getConfiguracionAspectoById(id);
    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const updated = await ConfiguracionAspectoService.updateEstado(id, activo);
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
  getConfiguracionesAspecto,
  getConfiguracionAspectoById,
  createConfiguracionAspecto,
  updateConfiguracionAspecto,
  deleteConfiguracionAspecto,
  updateEstadoConfiguracionAspecto,
};