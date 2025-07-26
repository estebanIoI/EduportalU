// src/api/v1/services/evaluacion/escalaValoracion.service.js
const EscalaValoracionModel = require('../../models/evaluacion/escalaValoracion.model');

const getAllEscalas = async (pagination) => {
  try {
    const escalas = await EscalaValoracionModel.getAllEscalas(pagination);
    const totalCount = await EscalaValoracionModel.getCount();

    return {
      data: escalas,
      totalCount
    };
  } catch (error) {
    throw error;
  }
};

const getEscalaById = async (id) => {
  try {
    const escala = await EscalaValoracionModel.getEscalaById(id);
    return escala;
  } catch (error) {
    throw error;
  }
};

const createEscala = async (escalaData) => {
  try {
    const newEscala = await EscalaValoracionModel.createEscala(escalaData);
    return newEscala;
  } catch (error) {
    throw error;
  }
};

const updateEscala = async (id, escalaData) => {
  try {
    const updatedEscala = await EscalaValoracionModel.updateEscala(id, escalaData);
    return updatedEscala;
  } catch (error) {
    throw error;
  }
};

const deleteEscala = async (id) => {
  try {
    await EscalaValoracionModel.deleteEscala(id);
    return true;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllEscalas,
  getEscalaById,
  createEscala,
  updateEscala,
  deleteEscala,
};