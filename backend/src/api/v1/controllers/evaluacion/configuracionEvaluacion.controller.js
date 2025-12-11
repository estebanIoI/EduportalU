// src/api/v1/controllers/evaluacion/configuracionEvaluacion.controller.js
const ConfiguracionEvaluacionService = require('../../services/evaluacion/configuracionEvaluacion.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getConfiguraciones = async (req, res, next) => {
  try {
    const { pagination } = req;
    const roles = req.user.roles;
    
    const configuraciones = await ConfiguracionEvaluacionService.getAllConfiguraciones(roles, pagination);
    
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
    const configuracion = await ConfiguracionEvaluacionService.getConfiguracionById(id);
    
    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      code: 200,
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
    const newConfiguracion = await ConfiguracionEvaluacionService.createConfiguracion(configuracionData);
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
    const configuracion = await ConfiguracionEvaluacionService.getConfiguracionById(id);

    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    const configuracionData = req.body;
    const updatedConfiguracion = await ConfiguracionEvaluacionService.updateConfiguracion(id, configuracionData);

    return successResponse(res, {
      code: 200,
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
    const configuracion = await ConfiguracionEvaluacionService.getConfiguracionById(id);
    
    if (!configuracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    await ConfiguracionEvaluacionService.deleteConfiguracion(id);
    return successResponse(res, {
      code: 200,
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

    console.log('📝 Solicitud de cambio de estado:');
    console.log('   ID de configuración:', id);
    console.log('   Nuevo estado (activo):', activo);
    console.log('   Tipo de dato:', typeof activo);

    // Validación del estado
    if (typeof activo !== 'number' || (activo !== 0 && activo !== 1)) {
      console.log('❌ Validación fallida: valor de estado inválido');
      return errorResponse(res, { code: 400, message: 'Valor de estado inválido. Debe ser 0 o 1' });
    }

    const configuracion = await ConfiguracionEvaluacionService.getConfiguracionById(id);
    if (!configuracion) {
      console.log('❌ Configuración no encontrada');
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }

    console.log('✓ Configuración encontrada, procediendo a actualizar...');
    const updated = await ConfiguracionEvaluacionService.updateEstado(id, activo);
    
    console.log('✅ Estado actualizado exitosamente');
    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updated,
    });
  } catch (error) {
    console.error('❌ Error en updateEstadoConfiguracion:', error);
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