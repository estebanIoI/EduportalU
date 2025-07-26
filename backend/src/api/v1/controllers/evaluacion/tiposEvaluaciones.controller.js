// src/api/v1/controllers/evaluacion/tiposEvaluaciones.controller.js
const TiposEvaluacionService = require('../../services/evaluacion/tiposEvaluaciones.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getConfiguracionDetalles = async (req, res, next) => {
  try {
    const { id } = req.params; // Obtener el ID de la configuración desde los parámetros de la URL
    const roles = req.user.roles; // Obtener todos los roles del usuario desde `req.user.roles`
    console.log("Roles del usuario:", roles); // Ver los roles para depuración
    
    // Obtener los detalles de la configuración, pasando los roles
    const detalles = await TiposEvaluacionService.getConfiguracionDetalles(id, roles);
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: detalles
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const updateEstadoTipo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;
    
    if (typeof activo !== 'number' || (activo !== 0 && activo !== 1)) {
      return errorResponse(res, { code: 400, message: 'Valor de estado inválido' });
    }
    
    const tipo = await TiposEvaluacionService.getTipoById(id);
    if (!tipo) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    const updated = await TiposEvaluacionService.updateEstado(id, activo);
    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updated
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const getTipos = async (req, res, next) => {
  try {
    const { pagination } = req;
    const tipos = await TiposEvaluacionService.getAllTipos(pagination);

    const paginatedResponse = res.paginate(tipos.data, tipos.totalCount);

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

const getTipoById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tipo = await TiposEvaluacionService.getTipoById(id);
    
    if (!tipo) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, { 
      message: MESSAGES.GENERAL.FETCH_SUCCESS, 
      data: tipo 
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createTipo = async (req, res, next) => {
  try {
    const tipoData = req.body;
    const newTipo = await TiposEvaluacionService.createTipo(tipoData);
    return successResponse(res, { 
      code: 201, 
      message: MESSAGES.GENERAL.CREATED, 
      data: newTipo 
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateTipo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tipo = await TiposEvaluacionService.getTipoById(id);
    
    if (!tipo) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    const tipoData = req.body;
    const updatedTipo = await TiposEvaluacionService.updateTipo(id, tipoData);
    
    return successResponse(res, { 
      message: MESSAGES.GENERAL.UPDATED, 
      data: updatedTipo 
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteTipo = async (req, res, next) => {
  try {
    const { id } = req.params;
    const tipo = await TiposEvaluacionService.getTipoById(id);
    
    if (!tipo) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    await TiposEvaluacionService.deleteTipo(id);
    return successResponse(res, { 
      message: MESSAGES.GENERAL.DELETED 
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

module.exports = {
  getConfiguracionDetalles,
  updateEstadoTipo,
  getTipos,
  getTipoById,
  createTipo,
  updateTipo,
  deleteTipo
};