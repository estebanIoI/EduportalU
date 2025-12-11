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
    // Las fechas ya vienen en formato YYYY-MM-DD como string desde el frontend
    // NO las convertimos, las mantenemos como string para evitar problemas de zona horaria
    const fechaInicio = configuracionData.FECHA_INICIO; // String: "2025-10-07"
    const fechaFin = configuracionData.FECHA_FIN;       // String: "2025-10-08"
    
    // Lógica para ACTIVO: comparar strings directamente
    const today = moment().format('YYYY-MM-DD');
    const activo = (fechaInicio === today) ? 1 : 0;

    const dataToInsert = {
      TIPO_EVALUACION_ID: configuracionData.TIPO_EVALUACION_ID,
      FECHA_INICIO: fechaInicio,
      FECHA_FIN: fechaFin,
      ACTIVO: activo,
      ES_EVALUACION_DOCENTE: configuracionData.ES_EVALUACION_DOCENTE ?? true,
      TITULO: configuracionData.TITULO || null,
      INSTRUCCIONES: configuracionData.INSTRUCCIONES || null,
      URL_FORMULARIO: configuracionData.URL_FORMULARIO || null
    };

    console.log('📅 Creando configuración con datos:');
    console.log('   FECHA_INICIO (string):', fechaInicio);
    console.log('   FECHA_FIN (string):', fechaFin);
    console.log('   HOY:', today);
    console.log('   ACTIVO:', activo);
    console.log('   ES_EVALUACION_DOCENTE:', dataToInsert.ES_EVALUACION_DOCENTE);
    console.log('   TITULO:', dataToInsert.TITULO);
    console.log('   URL_FORMULARIO:', dataToInsert.URL_FORMULARIO);

    const newConfiguracion = await ConfiguracionEvaluacionModel.createConfiguracion(dataToInsert);
    return newConfiguracion;
  } catch (error) {
    console.error('❌ Error en createConfiguracion:', error);
    throw error;
  }
};

const updateConfiguracion = async (id, configuracionData) => {
  try {
    // Las fechas ya vienen en formato YYYY-MM-DD como string desde el frontend
    // NO las convertimos, las mantenemos como string para evitar problemas de zona horaria
    const fechaInicio = configuracionData.FECHA_INICIO; // String: "2025-10-07"
    const fechaFin = configuracionData.FECHA_FIN;       // String: "2025-10-08"
    
    // Lógica para ACTIVO: comparar strings directamente
    const today = moment().format('YYYY-MM-DD');
    const activo = (fechaInicio === today) ? 1 : 0;

    const dataToUpdate = {
      TIPO_EVALUACION_ID: configuracionData.TIPO_EVALUACION_ID,
      FECHA_INICIO: fechaInicio,
      FECHA_FIN: fechaFin,
      ACTIVO: activo,
      ES_EVALUACION_DOCENTE: configuracionData.ES_EVALUACION_DOCENTE ?? true,
      TITULO: configuracionData.TITULO || null,
      INSTRUCCIONES: configuracionData.INSTRUCCIONES || null,
      URL_FORMULARIO: configuracionData.URL_FORMULARIO || null
    };

    console.log('📅 Actualizando configuración con datos:');
    console.log('   FECHA_INICIO (string):', fechaInicio);
    console.log('   FECHA_FIN (string):', fechaFin);
    console.log('   HOY:', today);
    console.log('   ACTIVO:', activo);
    console.log('   ES_EVALUACION_DOCENTE:', dataToUpdate.ES_EVALUACION_DOCENTE);
    console.log('   TITULO:', dataToUpdate.TITULO);
    console.log('   URL_FORMULARIO:', dataToUpdate.URL_FORMULARIO);

    const updatedConfiguracion = await ConfiguracionEvaluacionModel.updateConfiguracion(id, dataToUpdate);
    return updatedConfiguracion;
  } catch (error) {
    console.error('❌ Error en updateConfiguracion:', error);
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