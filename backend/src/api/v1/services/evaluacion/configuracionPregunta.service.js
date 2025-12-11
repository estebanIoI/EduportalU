// src/api/v1/services/evaluacion/configuracionPregunta.service.js
const ConfiguracionPreguntaModel = require('../../models/evaluacion/configuracionPregunta.model');

const getAllConfiguracionPreguntas = async (pagination) => {
  try {
    const configuraciones = await ConfiguracionPreguntaModel.getAllConfiguracionPreguntas(pagination);
    const totalCount = await ConfiguracionPreguntaModel.getCount();
    
    return {
      data: configuraciones,
      totalCount
    };
  } catch (error) {
    throw error;
  }
};

const getConfiguracionPreguntaById = async (id) => {
  try {
    const configuracion = await ConfiguracionPreguntaModel.getConfiguracionPreguntaById(id);
    return configuracion;
  } catch (error) {
    throw error;
  }
};

const getPreguntasByConfiguracionId = async (configuracionId) => {
  try {
    const preguntas = await ConfiguracionPreguntaModel.getPreguntasByConfiguracionId(configuracionId);
    return preguntas;
  } catch (error) {
    throw error;
  }
};

const createConfiguracionPregunta = async (configuracionData) => {
  try {
    const newConfiguracion = await ConfiguracionPreguntaModel.createConfiguracionPregunta(configuracionData);
    return newConfiguracion;
  } catch (error) {
    throw error;
  }
};

const updateConfiguracionPregunta = async (id, configuracionData) => {
  try {
    const updatedConfiguracion = await ConfiguracionPreguntaModel.updateConfiguracionPregunta(id, configuracionData);
    return updatedConfiguracion;
  } catch (error) {
    throw error;
  }
};

const updateEstado = async (id, activo) => {
  try {
    const updated = await ConfiguracionPreguntaModel.updateEstado(id, activo);
    return updated;
  } catch (error) {
    throw error;
  }
};

const deleteConfiguracionPregunta = async (id) => {
  try {
    await ConfiguracionPreguntaModel.deleteConfiguracionPregunta(id);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllConfiguracionPreguntas,
  getConfiguracionPreguntaById,
  getPreguntasByConfiguracionId,
  createConfiguracionPregunta,
  updateConfiguracionPregunta,
  updateEstado,
  deleteConfiguracionPregunta,
};
