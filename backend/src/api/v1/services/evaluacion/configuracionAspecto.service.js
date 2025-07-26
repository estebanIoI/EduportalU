// src/api/v1/services/evaluacion/configuracionAspecto.service.js
const ConfiguracionAspectoModel = require('../../models/evaluacion/configuracionAspecto.model');

const getAllConfiguracionesAspecto = async (pagination) => {
  try {
    const configuracionesAspecto = await ConfiguracionAspectoModel.getAllConfiguracionesAspecto(pagination);
    const totalCount = await ConfiguracionAspectoModel.getCount();

    return {
      data: configuracionesAspecto,
      totalCount
    };

  } catch (error) {
    throw error;
  }
};

const getConfiguracionAspectoById = async (id) => {
  try {
    const configuracionAspecto = await ConfiguracionAspectoModel.getConfiguracionAspectoById(id);
    return configuracionAspecto;
  } catch (error) {
    throw error;
  }
};

const createConfiguracionAspecto = async (configuracionAspectoData) => {
  try {
    const newConfiguracionAspecto = await ConfiguracionAspectoModel.createConfiguracionAspecto(configuracionAspectoData);
    return newConfiguracionAspecto;
  } catch (error) {
    throw error;
  }
};

const updateConfiguracionAspecto = async (id, configuracionAspectoData) => {
  try {
    const updatedConfiguracionAspecto = await ConfiguracionAspectoModel.updateConfiguracionAspecto(id, configuracionAspectoData);
    return updatedConfiguracionAspecto;
  } catch (error) {
    throw error;
  }
};

const deleteConfiguracionAspecto = async (id) => {
  try {
    await ConfiguracionAspectoModel.deleteConfiguracionAspecto(id);
    return true;
  } catch (error) {
    throw error;
  }
};

const updateEstado = async (id, activo) => {
  try {
    const updated = await ConfiguracionAspectoModel.updateEstado(id, activo);
    return updated;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllConfiguracionesAspecto,
  getConfiguracionAspectoById,
  createConfiguracionAspecto,
  updateConfiguracionAspecto,
  deleteConfiguracionAspecto,
  updateEstado,
};