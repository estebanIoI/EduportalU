// src/api/v1/services/evaluacion/configuracionValoracion.service.js
const ConfiguracionValoracionModel = require('../../models/evaluacion/configuracionValoracion.model');

const getAllConfiguraciones = async (pagination) => {
  try {
    const configuraciones = await ConfiguracionValoracionModel.getAllConfiguraciones(pagination);
    const totalCount = await ConfiguracionValoracionModel.getCount();

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
    const configuracion = await ConfiguracionValoracionModel.getConfiguracionById(id);
    return configuracion;
  } catch (error) {
    throw error;
  }
};

const createConfiguracion = async (configuracionData) => {
  try {
    const newConfiguracion = await ConfiguracionValoracionModel.createConfiguracion(configuracionData);
    return newConfiguracion;
  } catch (error) {
    throw error;
  }
};

const updateConfiguracion = async (id, configuracionData) => {
  try {
    const updatedConfiguracion = await ConfiguracionValoracionModel.updateConfiguracion(id, configuracionData);
    return updatedConfiguracion;
  } catch (error) {
    throw error;
  }
};

const deleteConfiguracion = async (id) => {
  try {
    await ConfiguracionValoracionModel.deleteConfiguracion(id);
    return true;
  } catch (error) {
    throw error;
  }
};

const updateEstado = async (id, activo) => {
  try {
    const updated = await ConfiguracionValoracionModel.updateEstado(id, activo);
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