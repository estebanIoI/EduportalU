// src/api/v1/services/evaluacion/tiposEvaluaciones.service.js
const TiposEvaluacionModel = require('../../models/evaluacion/tiposEvaluaciones.model');

const getConfiguracionDetalles = async (id, roles) => {
  try {
    const detalles = await TiposEvaluacionModel.getConfiguracionDetalles(id, roles);
    return detalles;
  } catch (error) {
    throw error;
  }
};

const updateEstado = async (id, activo) => {
  try {
    const updated = await TiposEvaluacionModel.updateEstado(id, activo);
    return updated;
  } catch (error) {
    throw error;
  }
};

const getAllTipos = async (pagination) => {
  try {
    const tipos = await TiposEvaluacionModel.getAllTipos(pagination);
    const totalCount = await TiposEvaluacionModel.getCount();
    
    return {
      data: tipos,
      totalCount
    };
  } catch (error) {
    throw error;
  }
};

const getTipoById = async (id) => {
  try {
    const tipo = await TiposEvaluacionModel.getTipoById(id);
    return tipo;
  } catch (error) {
    throw error;
  }
};

const createTipo = async (tipoData) => {
  try {
    const newTipo = await TiposEvaluacionModel.createTipo(tipoData);
    return newTipo;
  } catch (error) {
    throw error;
  }
};

const updateTipo = async (id, tipoData) => {
  try {
    const updatedTipo = await TiposEvaluacionModel.updateTipo(id, tipoData);
    return updatedTipo;
  } catch (error) {
    throw error;
  }
};

const deleteTipo = async (id) => {
  try {
    await TiposEvaluacionModel.deleteTipo(id);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getConfiguracionDetalles,
  updateEstado,
  getAllTipos,
  getTipoById,
  createTipo,
  updateTipo,
  deleteTipo
};