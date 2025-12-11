// src/api/v1/controllers/evaluacion/evaluaciones.controller.js
const EvaluacionesService = require('../../services/evaluacion/evaluaciones.service');
const { successResponse, successPaginatedResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getEvaluaciones = async (req, res, next) => {
  try {
    const { pagination } = req;
    const evaluaciones = await EvaluacionesService.getAllEvaluaciones(pagination);

    const paginatedResponse = res.paginate(evaluaciones.data, evaluaciones.totalCount);

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

const getEvaluacionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const evaluacion = await EvaluacionesService.getEvaluacionById(id);
    
    if (!evaluacion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.NOT_FOUND });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: evaluacion,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getEvaluacionesByEstudiante = async (req, res, next) => {
  try {
    const { documentoEstudiante } = req.params;
    const evaluaciones = await EvaluacionesService.getEvaluacionesByEstudiante(documentoEstudiante);
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: evaluaciones,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getEvaluacionesByEstudianteByConfiguracion = async (req, res, next) => {
  try {
    const { documentoEstudiante, configuracionId } = req.params;
    const evaluaciones = await EvaluacionesService.getEvaluacionesByEstudianteByConfiguracion(documentoEstudiante, configuracionId);
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: evaluaciones,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getEvaluacionesByDocente = async (req, res, next) => {
  try {
    const { documentoDocente } = req.params;
    const evaluaciones = await EvaluacionesService.getEvaluacionesByDocente(documentoDocente);
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: evaluaciones,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getEvaluacionesByEstudianteAsignatura = async (req, res, next) => {
  try {
    const { documentoEstudiante, codigoAsignatura } = req.params;
    const evaluaciones = await EvaluacionesService.getEvaluacionesByEstudianteAsignatura(documentoEstudiante, codigoAsignatura);
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: evaluaciones,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createEvaluacion = async (req, res, next) => {
  try {
    const evaluacionData = req.body;
    const nuevaEvaluacion = await EvaluacionesService.createEvaluacion(evaluacionData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: nuevaEvaluacion,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateEvaluacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const evaluacionData = req.body;
    const evaluacionActualizada = await EvaluacionesService.updateEvaluacion(id, evaluacionData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: evaluacionActualizada,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteEvaluacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    await EvaluacionesService.deleteEvaluacion(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

const createEvaluacionU = async (req, res, next) => {
  try {
    // Validar que el usuario esté autenticado
    if (!req.user) {
      return errorResponse(res, { 
        code: 401, 
        message: "Usuario no autenticado" 
      });
    }

    console.log('Contenido de req.user:', req.user);
    const { username: DOCUMENTO_ESTUDIANTE } = req.user;
    const { tipoEvaluacionId } = req.body;
    
    // Validar que se proporcione el tipo de evaluación
    if (!tipoEvaluacionId) {
      return errorResponse(res, { 
        code: 400, 
        message: "El tipo de evaluación es requerido" 
      });
    }

    const result = await EvaluacionesService.createEvaluacionesForEstudiante(
      DOCUMENTO_ESTUDIANTE,
      tipoEvaluacionId,
      req.user.roles
    );

    // Si es una evaluación genérica (no de docentes), devolver respuesta específica
    if (result.isGenericEvaluation) {
      return successResponse(res, {
        message: "Esta es una evaluación genérica. Redirigir a formulario genérico.",
        data: {
          total: 0,
          evaluaciones: [],
          aspectos: result.aspectos,
          valoraciones: result.valoraciones,
          isGenericEvaluation: true
        },
      });
    }

    if (result.evaluacionesCreadas.length === 0) {
      return errorResponse(res, { 
        code: 200, 
        message: "No se pudieron crear nuevas evaluaciones. Posiblemente ya existan todas las evaluaciones necesarias." 
      });
    }

    return successResponse(res, {
      message: "Evaluaciones creadas exitosamente. Por favor, complete las evaluaciones con sus detalles.",
      data: {
        total: result.evaluacionesCreadas.length,
        evaluaciones: result.evaluacionesCreadas,
        aspectos: result.aspectos,
        valoraciones: result.valoraciones
      },
    });
  } catch (error) {
    console.error('Error al crear evaluación:', error);
    if (error.message === 'El tipo de evaluación no existe o no está activo') {
      return errorResponse(res, { 
        code: 404, 
        message: error.message 
      });
    }
    if (error.message === 'La evaluación no está disponible en este momento') {
      return errorResponse(res, { 
        code: 400, 
        message: error.message 
      });
    }
    if (error.message === 'No se encontró información del perfil del estudiante') {
      return errorResponse(res, { 
        code: 404, 
        message: error.message 
      });
    }
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const getEvaluacionesPendientes = async (req, res, next) => {
  try {
    // Validar que el usuario esté autenticado
    if (!req.user) {
      return errorResponse(res, { 
        code: 401, 
        message: "Usuario no autenticado" 
      });
    }

    const { documento: DOCUMENTO_ESTUDIANTE } = req.user;
    
    const result = await EvaluacionesService.getEvaluacionesPendientesForEstudiante(DOCUMENTO_ESTUDIANTE);

    return successResponse(res, {
      message: "Estado de evaluaciones obtenido exitosamente",
      data: result,
    });
  } catch (error) {
    console.error('Error al obtener evaluaciones pendientes:', error);
    if (error.message === 'No se encontró información del perfil del estudiante') {
      return errorResponse(res, { 
        code: 404, 
        message: error.message 
      });
    }
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const iniciarProcesoEvaluacion = async (req, res, next) => {
  try {
    // Validar que el usuario esté autenticado
    if (!req.user) {
      return errorResponse(res, { 
        code: 401, 
        message: "Usuario no autenticado" 
      });
    }

    const { tipoEvaluacionId } = req.params;
    const { documento: DOCUMENTO_ESTUDIANTE } = req.user;

    const result = await EvaluacionesService.iniciarProcesoEvaluacion(
      DOCUMENTO_ESTUDIANTE,
      tipoEvaluacionId
    );

    return successResponse(res, {
      message: "Puede proceder con la evaluación",
      data: result,
    });
  } catch (error) {
    console.error('Error al iniciar proceso de evaluación:', error);
    if (error.message === 'El tipo de evaluación no existe o no está activo') {
      return errorResponse(res, { 
        code: 404, 
        message: error.message 
      });
    }
    if (error.message === 'La evaluación no está disponible en este momento') {
      return errorResponse(res, { 
        code: 400, 
        message: error.message 
      });
    }
    if (error.message === 'No se encontró información del perfil del estudiante') {
      return errorResponse(res, { 
        code: 404, 
        message: error.message 
      });
    }
    if (error.message === 'Ya has completado todas las evaluaciones para este tipo') {
      return errorResponse(res, { 
        code: 400, 
        message: error.message 
      });
    }
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

/**
 * Obtiene los resultados de evaluación de un docente
 * Incluye nota final y aspectos a mejorar
 */
const getResultadosEvaluacionDocente = async (req, res, next) => {
  try {
    const { documentoDocente } = req.params;
    const { codigoMateria } = req.query;
    
    const resultados = await EvaluacionesService.getResultadosEvaluacionDocente(
      documentoDocente, 
      codigoMateria || null
    );
    
    return successResponse(res, {
      message: 'Resultados de evaluación obtenidos correctamente',
      data: resultados,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

/**
 * Obtiene la autoevaluación de un docente para un periodo específico
 */
const getAutoevaluacionDocente = async (req, res, next) => {
  try {
    const { documentoDocente } = req.params;
    const { periodo } = req.query;
    
    const autoevaluacion = await EvaluacionesService.getAutoevaluacionDocente(
      documentoDocente, 
      periodo
    );
    
    // Si no existe autoevaluación, devolver null (no es error, simplemente no la ha hecho)
    return successResponse(res, {
      message: autoevaluacion ? 'Autoevaluación obtenida correctamente' : 'No existe autoevaluación aún',
      data: autoevaluacion,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

/**
 * Crea o actualiza la autoevaluación de un docente
 */
const createAutoevaluacionDocente = async (req, res, next) => {
  try {
    const { documentoDocente } = req.params;
    const { periodo, respuestas } = req.body;
    
    if (!periodo || !respuestas || !Array.isArray(respuestas)) {
      return errorResponse(res, { 
        code: 400, 
        message: 'Datos incompletos. Se requiere periodo y respuestas' 
      });
    }
    
    const resultado = await EvaluacionesService.createAutoevaluacionDocente(
      documentoDocente,
      periodo,
      respuestas
    );
    
    return successResponse(res, {
      message: 'Autoevaluación guardada correctamente',
      data: resultado,
    });
  } catch (error) {
    console.error('Error al guardar autoevaluación:', error);
    error.message = MESSAGES.GENERAL.CREATE_ERROR;
    next(error);
  }
};

module.exports = {
  getEvaluaciones,
  getEvaluacionById,
  getEvaluacionesByEstudiante,
  getEvaluacionesByEstudianteByConfiguracion,
  getEvaluacionesByDocente,
  getEvaluacionesByEstudianteAsignatura,
  createEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
  createEvaluacionU,
  getEvaluacionesPendientes,
  iniciarProcesoEvaluacion,
  getResultadosEvaluacionDocente,
  getAutoevaluacionDocente,
  createAutoevaluacionDocente
};