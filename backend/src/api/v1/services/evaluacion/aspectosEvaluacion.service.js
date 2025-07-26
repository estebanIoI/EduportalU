// src/api/v1/services/evaluacion/aspectosEvaluacion.service.js
const AspectosEvaluacionModel = require('../../models/evaluacion/aspectosEvaluacion.model');

const getAllAspectos = async (pagination) => {
  try {
    const aspectos = await AspectosEvaluacionModel.getAllAspectos(pagination);
    const totalCount = await AspectosEvaluacionModel.getCount();
    
    return {
      data: aspectos,
      totalCount
    };
  } catch (error) {
    throw error;
  }
};

const getAspectoById = async (id) => {
  try {
    const aspecto = await AspectosEvaluacionModel.getAspectoById(id);
    return aspecto;
  } catch (error) {
    throw error;
  }
};

const createAspecto = async (aspectoData) => {
  try {
    const newAspecto = await AspectosEvaluacionModel.createAspecto(aspectoData);
    return newAspecto;
  } catch (error) {
    throw error;
  }
};

const updateAspecto = async (id, aspectoData) => {
  try {
    const updatedAspecto = await AspectosEvaluacionModel.updateAspecto(id, aspectoData);
    return updatedAspecto;
  } catch (error) {
    throw error;
  }
};

const deleteAspecto = async (id) => {
  try {
    await AspectosEvaluacionModel.deleteAspecto(id);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllAspectos,
  getAspectoById,
  createAspecto,
  updateAspecto,
  deleteAspecto,
};