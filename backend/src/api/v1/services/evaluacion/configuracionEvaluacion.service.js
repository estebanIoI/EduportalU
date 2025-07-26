// src/api/v1/services/evaluacion/configuracionEvaluacion.service.js
const ConfiguracionEvaluacionModel = require('../../models/evaluacion/configuracionEvaluacion.model');
const pagination = require('../../middlewares/pagination');
const moment = require('moment');

const getAllConfiguraciones = async (roles, pagination) => {
  try {
    const configuraciones = await ConfiguracionEvaluacionModel.getAllConfiguraciones(roles, pagination);
    const totalCount = await ConfiguracionEvaluacionModel.getCount(roles);

    return {
      data: configuraciones,
      totalCount
    };
  } catch (error) {
    throw error;
  }
};

const getConfiguracionById = async (id) => {
  try {
    const configuracion = await ConfiguracionEvaluacionModel.getConfiguracionById(id);
    return configuracion;
  } catch (error) {
    throw error;
  }
};

const createConfiguracion = async (configuracionData) => {
  try {
    // Lógica para ACTIVO:
    const inicio = moment.utc(configuracionData.FECHA_INICIO).startOf('day');
    const today = moment.utc().startOf('day');
    configuracionData.ACTIVO = inicio.isSame(today) ? 1 : 0;

    const newConfiguracion = await ConfiguracionEvaluacionModel.createConfiguracion(configuracionData);
    return newConfiguracion;
  } catch (error) {
    throw error;
  }
};

const updateConfiguracion = async (id, configuracionData) => {
  try {
    // Lógica para ACTIVO también en update:
    const inicio = moment.utc(configuracionData.FECHA_INICIO).startOf('day');
    const today = moment.utc().startOf('day');
    configuracionData.ACTIVO = inicio.isSame(today) ? 1 : 0;

    const updatedConfiguracion = await ConfiguracionEvaluacionModel.updateConfiguracion(id, configuracionData);
    return updatedConfiguracion;
  } catch (error) {
    throw error;
  }
};

const deleteConfiguracion = async (id) => {
  try {
    await ConfiguracionEvaluacionModel.deleteConfiguracion(id);
    return true;
  } catch (error) {
    throw error;
  }
};

const updateEstado = async (id, activo) => {
  try {
    const updated = await ConfiguracionEvaluacionModel.updateEstado(id, activo);
    return updated;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllConfiguraciones,
  getConfiguracionById,
  createConfiguracion,
  updateConfiguracion,
  deleteConfiguracion,
  updateEstado,
};