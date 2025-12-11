const dashboardModel = require('../../models/reportes/dashboard.model');
const { successResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getDashboardStats = async (req, res) => {
  try {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo,
    } = req.query;

    // Solo ID_CONFIGURACION es obligatorio
    if (!idConfiguracion) {
      return errorResponse(res, { code: 404, message: MESSAGES.GENERAL.MISSING_FIELDS });
    }

    const stats = await dashboardModel.getDashboardStats({
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo,
    });

    return successResponse(res, { message: MESSAGES.DASHBOARD.FETCH_STATS_SUCCESS, data: stats });
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error);
    return errorResponse(res, { code: 500, message: MESSAGES.GENERAL.SERVER_ERROR });
  }
};

const getAspectosPromedio = async (req, res) => {
  try {
    const { idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo } = req.query;

    // Solo ID_CONFIGURACION es obligatorio
    if (!idConfiguracion) {
      return errorResponse(res, { code: 400, message: MESSAGES.DASHBOARD.MISSING_ID_CONFIGURACION });
    }

    const aspectos = await dashboardModel.getAspectosPromedio({
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    });

    return successResponse(res, { message: MESSAGES.DASHBOARD.FETCH_ASPECTOS_SUCCESS, data: aspectos });
  } catch (error) {
    console.error('Error al obtener promedios por aspecto:', error);
    return errorResponse(res, { code: 500, message: MESSAGES.GENERAL.SERVER_ERROR });
  }
};

const getRankingDocentes = async (req, res) => {
  try {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    } = req.query;

    // Verificación de los parámetros obligatorios
    if (!idConfiguracion) {
      return errorResponse(res, { code: 400, message: MESSAGES.DASHBOARD.MISSING_ID_CONFIGURACION });
    }

    // Llamar al modelo con los parámetros obtenidos
    const ranking = await dashboardModel.getPodioDocentes({
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    });

    return successResponse(res, { message: MESSAGES.DASHBOARD.FETCH_RANKING_SUCCESS, data: ranking });
  } catch (error) {
    console.error('Error al obtener ranking de docentes:', error);
    return errorResponse(res, { code: 500, message: MESSAGES.GENERAL.SERVER_ERROR });
  }
};

const getPodioDocentes = async (req, res) => {
  try {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    } = req.query;

    // Verificación de los parámetros obligatorios
    if (!idConfiguracion) {
      return errorResponse(res, { code: 400, message: MESSAGES.DASHBOARD.MISSING_ID_CONFIGURACION });
    }

    const podio = await dashboardModel.getPodioDocentes({
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    });

    return successResponse(res, { message: MESSAGES.DASHBOARD.FETCH_PODIO_SUCCESS, data: podio });
  } catch (error) {
    console.error('Error al obtener podio de docentes:', error);
    return errorResponse(res, { code: 500, message: MESSAGES.GENERAL.SERVER_ERROR });
  }
};

const getEstadisticasPorPrograma = async (req, res) => {
  try {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      semestre,
      grupo
    } = req.query;

    // Verificación de los parámetros obligatorios
    if (!idConfiguracion) {
      return errorResponse(res, { code: 400, message: MESSAGES.DASHBOARD.MISSING_ID_CONFIGURACION });
    }

    const estadisticas = await dashboardModel.getEstadisticasPorPrograma({
      idConfiguracion,
      periodo,
      nombreSede,
      semestre,
      grupo
    });

    return successResponse(res, { message: 'Estadísticas por programa obtenidas exitosamente', data: estadisticas });
  } catch (error) {
    console.error('Error al obtener estadísticas por programa:', error);
    return errorResponse(res, { code: 500, message: MESSAGES.GENERAL.SERVER_ERROR });
  }
};

const getEstudiantesPorPrograma = async (req, res) => {
  try {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      semestre,
      grupo,
      nomPrograma,
      estado
    } = req.query;

    // Verificación de los parámetros obligatorios
    if (!idConfiguracion) {
      return errorResponse(res, { code: 400, message: MESSAGES.DASHBOARD.MISSING_ID_CONFIGURACION });
    }

    if (!nomPrograma) {
      return errorResponse(res, { code: 400, message: 'El nombre del programa es requerido' });
    }

    const estudiantes = await dashboardModel.getEstudiantesPorPrograma({
      idConfiguracion,
      periodo,
      nombreSede,
      semestre,
      grupo,
      nomPrograma,
      estado
    });

    return successResponse(res, { message: 'Estudiantes del programa obtenidos exitosamente', data: estudiantes });
  } catch (error) {
    console.error('Error al obtener estudiantes por programa:', error);
    return errorResponse(res, { code: 500, message: MESSAGES.GENERAL.SERVER_ERROR });
  }
};

/**
 * Obtiene los docentes de un programa con su rendimiento
 */
const getDocentesPorPrograma = async (req, res) => {
  try {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      semestre,
      grupo,
      nomPrograma
    } = req.query;

    // Verificación de los parámetros obligatorios
    if (!idConfiguracion) {
      return errorResponse(res, { code: 400, message: MESSAGES.DASHBOARD.MISSING_ID_CONFIGURACION });
    }

    if (!nomPrograma) {
      return errorResponse(res, { code: 400, message: 'El nombre del programa es requerido' });
    }

    const docentes = await dashboardModel.getDocentesPorPrograma({
      idConfiguracion,
      periodo,
      nombreSede,
      semestre,
      grupo,
      nomPrograma
    });

    return successResponse(res, { message: 'Docentes del programa obtenidos exitosamente', data: docentes });
  } catch (error) {
    console.error('Error al obtener docentes por programa:', error);
    return errorResponse(res, { code: 500, message: MESSAGES.GENERAL.SERVER_ERROR });
  }
};

module.exports = {
  getDashboardStats,
  getAspectosPromedio,
  getRankingDocentes,
  getPodioDocentes,
  getEstadisticasPorPrograma,
  getEstudiantesPorPrograma,
  getDocentesPorPrograma
};
