// src/api/v1/services/evaluacion/preguntas.service.js
const PreguntasModel = require('../../models/evaluacion/preguntas.model');

const getAllPreguntas = async (pagination) => {
  try {
    const preguntas = await PreguntasModel.getAllPreguntas(pagination);
    const totalCount = await PreguntasModel.getCount();
    
    return {
      data: preguntas,
      totalCount
    };
  } catch (error) {
    throw error;
  }
};

const getPreguntaById = async (id) => {
  try {
    const pregunta = await PreguntasModel.getPreguntaById(id);
    return pregunta;
  } catch (error) {
    throw error;
  }
};

const createPregunta = async (preguntaData) => {
  try {
    const newPregunta = await PreguntasModel.createPregunta(preguntaData);
    return newPregunta;
  } catch (error) {
    throw error;
  }
};

const updatePregunta = async (id, preguntaData) => {
  try {
    const updatedPregunta = await PreguntasModel.updatePregunta(id, preguntaData);
    return updatedPregunta;
  } catch (error) {
    throw error;
  }
};

const deletePregunta = async (id) => {
  try {
    await PreguntasModel.deletePregunta(id);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllPreguntas,
  getPreguntaById,
  createPregunta,
  updatePregunta,
  deletePregunta,
};
