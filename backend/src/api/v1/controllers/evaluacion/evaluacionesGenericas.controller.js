// src/api/v1/controllers/evaluacion/evaluacionesGenericas.controller.js
const EvaluacionesGenericasService = require('../../services/evaluacion/evaluacionesGenericas.service');
const { successResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const createBulk = async (req, res, next) => {
  try {
    const { configuracionId, comentarioGeneral, aspectos, respuestas } = req.body;
    const documentoEstudiante = req.user.documento; // Obtener del usuario autenticado
    
    if (!configuracionId) {
      return errorResponse(res, { code: 400, message: 'configuracionId es requerido' });
    }
    
    if (!documentoEstudiante) {
      return errorResponse(res, { code: 400, message: 'No se pudo identificar al estudiante' });
    }
    
    const data = {
      configuracionId,
      documentoEstudiante,
      comentarioGeneral,
      aspectos: aspectos || [],
      respuestas: respuestas || []
    };
    
    const result = await EvaluacionesGenericasService.createBulk(data);
    
    return successResponse(res, {
      code: 201,
      message: 'Evaluación genérica creada exitosamente',
      data: result
    });
  } catch (error) {
    console.error('Error en createBulk:', error);
    error.message = error.message || MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const getByEstudianteAndConfiguracion = async (req, res, next) => {
  try {
    const { configuracionId } = req.params;
    const documentoEstudiante = req.user.documento;
    
    const evaluaciones = await EvaluacionesGenericasService.getByEstudianteAndConfiguracion(
      documentoEstudiante,
      configuracionId
    );
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: evaluaciones
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getDetalleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const detalle = await EvaluacionesGenericasService.getDetalleById(id);
    
    if (!detalle) {
      return errorResponse(res, { code: 404, message: 'Evaluación no encontrada' });
    }
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: detalle
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getAllEvaluaciones = async (req, res, next) => {
  try {
    const evaluaciones = await EvaluacionesGenericasService.getAllEvaluaciones();
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: evaluaciones
    });
  } catch (error) {
    console.error('Error en getAllEvaluaciones:', error);
    error.message = error.message || MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const generarInformePDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const pdfBuffer = await EvaluacionesGenericasService.generarInformePDF(id);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=informe-evaluacion-${id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error al generar PDF:', error);
    error.message = 'Error al generar el informe PDF';
    next(error);
  }
};

const generarInformeConsolidado = async (req, res, next) => {
  try {
    const excelBuffer = await EvaluacionesGenericasService.generarInformeConsolidado();
    
    const fecha = new Date().toISOString().split('T')[0];
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=informe-evaluaciones-genericas-${fecha}.xlsx`);
    res.send(excelBuffer);
  } catch (error) {
    console.error('Error al generar informe consolidado:', error);
    error.message = 'Error al generar el informe consolidado';
    next(error);
  }
};

const getCompletadasByEstudiantes = async (req, res, next) => {
  try {
    const { configuracionId } = req.params;
    const { estudiantes } = req.body;
    
    if (!configuracionId) {
      return errorResponse(res, { code: 400, message: 'configuracionId es requerido' });
    }
    
    if (!estudiantes || !Array.isArray(estudiantes) || estudiantes.length === 0) {
      return errorResponse(res, { code: 400, message: 'Se requiere un array de documentos de estudiantes' });
    }
    
    const completadas = await EvaluacionesGenericasService.getCompletadasByEstudiantes(
      configuracionId,
      estudiantes
    );
    
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: completadas
    });
  } catch (error) {
    console.error('Error en getCompletadasByEstudiantes:', error);
    error.message = error.message || MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

module.exports = {
  createBulk,
  getByEstudianteAndConfiguracion,
  getDetalleById,
  getAllEvaluaciones,
  generarInformePDF,
  generarInformeConsolidado,
  getCompletadasByEstudiantes
};
