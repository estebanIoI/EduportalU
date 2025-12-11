const DocentesService = require("../../services/reportes/docentes.service");
const {
  successResponse,
  successPaginatedResponse,
  errorResponse,
} = require("../../utils/responseHandler");
const MESSAGES = require("../../../../constants/messages");

const getDocentesAsignaturasController = async (req, res, next) => {
  try {
    const {
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo,
      idDocente
    } = req.query;

    const filters = {
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo,
      idDocente
    };

    const { pagination } = req;
    
    const docentes = await DocentesService.getDocentesAsignaturas(filters, pagination);

    const paginatedResponse = res.paginate(docentes.data, docentes.totalCount);

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

const getEstudiantesEvaluadosController = async (req, res, next) => {
  try {
    const { idDocente, codAsignatura, grupo } = req.params;

    const estudiantes = await DocentesService.getEstudiantesEvaluados(
      idDocente,
      codAsignatura,
      grupo
    );

    return successResponse(res, {
      data: estudiantes,
      message: MESSAGES.GENERAL.FETCH_SUCCESS
    });
  } catch (error) {
    if (error.message.includes("parámetros requeridos") || 
        error.message.includes("parámetro") && error.message.includes("requerido")) {
      return errorResponse(res, {
        message: error.message,
        statusCode: 400
      });
    }

    if (error.message.includes("No se encontraron")) {
      return errorResponse(res, {
        message: error.message,
        statusCode: 404
      });
    }

    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getAspectosPuntajeController = async (req, res, next) => {
  try {
    const {
      idDocente,
      idConfiguracion,  
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    } = req.query;

    // Validar parámetros requeridos

    if (!idConfiguracion) {
      throw new Error("El parámetro 'idConfiguracion' es requerido");
    }

    // Construir objeto de filtros
    const filters = {
      idDocente,
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo
    };

    // Obtener datos del servicio
    const aspectos = await DocentesService.getAspectosPuntaje(filters);

    // Manejar caso de no encontrados
    if (!aspectos || aspectos.length === 0) {
      return errorResponse(res, {
        message: MESSAGES.DOCENTES.ASPECTOS_NO_ENCONTRADOS || "No se encontraron aspectos para los filtros especificados",
        statusCode: 404
      });
    }

    // Retornar respuesta exitosa
    return successResponse(res, {
      data: aspectos,
      message: MESSAGES.GENERAL.FETCH_SUCCESS
    });

  } catch (error) {
    // Manejo específico de errores
    if (error.message.includes("parámetro") && error.message.includes("requerido")) {
      return errorResponse(res, {
        message: error.message,
        statusCode: 400
      });
    }

    if (error.message.includes("No se encontraron")) {
      return errorResponse(res, {
        message: error.message,
        statusCode: 404
      });
    }

    // Error genérico
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getComentariosController = async (req, res, next) => {
  try {
    const { idDocente } = req.params;

    const comentarios = await DocentesService.getComentarios(idDocente);

    return successResponse(res, {
      data: comentarios,
      message: MESSAGES.GENERAL.FETCH_SUCCESS
    });
  } catch (error) {
    if (error.message.includes("parámetro") && error.message.includes("requerido")) {
      return errorResponse(res, {
        message: error.message,
        statusCode: 400
      });
    }

    if (error.message.includes("No se encontraron")) {
      return errorResponse(res, {
        message: error.message,
        statusCode: 404
      });
    }

    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

module.exports = {
  getDocentesAsignaturasController,
  getEstudiantesEvaluadosController,
  getAspectosPuntajeController,
  getComentariosController,
};