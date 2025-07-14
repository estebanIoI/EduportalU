// src/api/v1/services/evaluacion/evaluaciones.service.js
const Evaluaciones = require('../../models/evaluacion/evaluaciones.model');
const VistaEstudianteModel = require('../../models/vista/vistaEstudiante.model');
const TiposEvaluacion = require('../../models/evaluacion/tiposEvaluaciones.model');

const getAllEvaluaciones = async () => {
  try {
    const evaluaciones = await Evaluaciones.getAllEvaluaciones();
    return evaluaciones;
  } catch (error) {
    throw error;
  }
};

const getEvaluacionById = async (id) => {
  try {
    const evaluacion = await Evaluaciones.getEvaluacionById(id);
    return evaluacion;
  } catch (error) {
    throw error;
  }
};

const getEvaluacionesByEstudiante = async (documentoEstudiante) => {
  try {
    const evaluaciones = await Evaluaciones.getEvaluacionesByEstudiante(documentoEstudiante);
    return evaluaciones;
  } catch (error) {
    throw error;
  }
};

const getEvaluacionesByEstudianteByConfiguracion = async (documentoEstudiante, configuracionId) => {
  try {
    const evaluaciones = await Evaluaciones.getEvaluacionesByEstudianteByConfiguracion(documentoEstudiante, configuracionId);
    return evaluaciones;
  } catch (error) {
    throw error;
  }
};

const getEvaluacionesByDocente = async (documentoDocente) => {
  try {
    const evaluaciones = await Evaluaciones.getEvaluacionesByDocente(documentoDocente);
    return evaluaciones;
  } catch (error) {
    throw error;
  }
};

const createEvaluacion = async (evaluacionData) => {
  try {
    const nuevaEvaluacion = await Evaluaciones.createEvaluacion(evaluacionData);
    return nuevaEvaluacion;
  } catch (error) {
    throw error;
  }
};

const updateEvaluacion = async (id, evaluacionData) => {
  try {
    const evaluacionActualizada = await Evaluaciones.updateEvaluacion(id, evaluacionData);
    return evaluacionActualizada;
  } catch (error) {
    throw error;
  }
};

const deleteEvaluacion = async (id) => {
  try {
    await Evaluaciones.deleteEvaluacion(id);
    return true;
  } catch (error) {
    throw error;
  }
};

const createEvaluacionesForEstudiante = async (documentoEstudiante, tipoEvaluacionId, userRoles) => {
  try {
    // Verificar que el tipo de evaluación existe y está activo
    const configuracionDetalles = await TiposEvaluacion.getConfiguracionDetalles(tipoEvaluacionId, userRoles);
    if (!configuracionDetalles || !configuracionDetalles.configuracion.ACTIVO) {
      throw new Error('El tipo de evaluación no existe o no está activo');
    }

    // Verificar que estamos dentro del período de evaluación
    const fechaActual = new Date();
    const fechaInicio = new Date(configuracionDetalles.configuracion.FECHA_INICIO);
    const fechaFin = new Date(configuracionDetalles.configuracion.FECHA_FIN);

    if (fechaActual < fechaInicio || fechaActual > fechaFin) {
      throw new Error('La evaluación no está disponible en este momento');
    }

    // Obtener información del perfil del estudiante
    const perfilEstudiante = await VistaEstudianteModel.getEstudianteByDocumento(documentoEstudiante);
    if (!perfilEstudiante || perfilEstudiante.length === 0) {
      throw new Error('No se encontró información del perfil del estudiante');
    }

    let evaluacionesCreadas = [];
    
    for (let materia of perfilEstudiante) {
      const { 
        ASIGNATURA: NOMBRE_MATERIA, 
        DOCENTE: NOMBRE_DOCENTE, 
        ID_DOCENTE: DOCUMENTO_DOCENTE, 
        COD_ASIGNATURA 
      } = materia;

      // Validar que COD_ASIGNATURA no sea null o undefined
      if (!COD_ASIGNATURA) {
        console.warn(`Materia omitida porque COD_ASIGNATURA es null o undefined:`, materia);
        continue;
      }

      // Verificar si ya existe una evaluación para esta materia y configuración
      const evaluacionExistente = await Evaluaciones.findOne(
        tipoEvaluacionId,
        documentoEstudiante,
        COD_ASIGNATURA
      );

      if (evaluacionExistente && evaluacionExistente.length > 0) {
        continue;
      }

      // Crear la evaluación principal para esta materia
      const nuevaEvaluacion = await Evaluaciones.createEvaluacion({
        DOCUMENTO_ESTUDIANTE: documentoEstudiante,
        DOCUMENTO_DOCENTE,
        CODIGO_MATERIA: COD_ASIGNATURA,
        ID_CONFIGURACION: tipoEvaluacionId,
      });

      evaluacionesCreadas.push({ 
        id: nuevaEvaluacion.id,
        materia: {
          codigo: COD_ASIGNATURA,
          nombre: NOMBRE_MATERIA
        },
        docente: {
          documento: DOCUMENTO_DOCENTE,
          nombre: NOMBRE_DOCENTE
        },
        estudiante: {
          documento: documentoEstudiante
        },
        configuracion: {
          id: tipoEvaluacionId
        }
      });
    }

    return {
      evaluacionesCreadas,
      aspectos: configuracionDetalles.aspectos,
      valoraciones: configuracionDetalles.valoraciones
    };
  } catch (error) {
    throw error;
  }
};

const getEvaluacionesPendientesForEstudiante = async (documentoEstudiante) => {
  try {
    // Obtener el perfil del estudiante
    const perfilEstudiante = await VistaEstudianteModel.getEstudianteByDocumento(documentoEstudiante);
    
    if (!perfilEstudiante || perfilEstudiante.length === 0) {
      throw new Error('No se encontró información del perfil del estudiante');
    }

    // Obtener todas las evaluaciones existentes del estudiante
    const evaluacionesEstudiante = await Evaluaciones.getEvaluacionesByEstudiante(documentoEstudiante);

    // Obtener tipos de evaluación activos
    const tiposEvaluacion = await TiposEvaluacion.getAllTipos();
    const tiposActivos = tiposEvaluacion.filter(tipo => tipo.ACTIVO);

    // Preparar respuesta
    const estadoEvaluaciones = {};

    for (const tipo of tiposActivos) {
      try {
        // Obtener configuración del tipo de evaluación
        const configuracion = await TiposEvaluacion.getConfiguracionDetalles(tipo.ID);
        
        if (configuracion && configuracion.configuracion.ACTIVO) {
          // Verificar si hay evaluaciones para este tipo
          const evaluacionesDeTipo = evaluacionesEstudiante.filter(
            eval => eval.CONFIGURACION_ID === tipo.ID
          );

          // Verificar período de evaluación
          const fechaActual = new Date();
          const fechaInicio = new Date(configuracion.configuracion.FECHA_INICIO);
          const fechaFin = new Date(configuracion.configuracion.FECHA_FIN);
          const periodoValido = fechaActual >= fechaInicio && fechaActual <= fechaFin;

          estadoEvaluaciones[tipo.NOMBRE.toLowerCase()] = {
            id: tipo.ID,
            nombre: tipo.NOMBRE,
            descripcion: tipo.DESCRIPCION,
            configuracion: {
              ...configuracion.configuracion,
              periodoValido,
              fechaInicio: fechaInicio.toISOString(),
              fechaFin: fechaFin.toISOString()
            },
            estado: {
              evaluacionesCreadas: evaluacionesDeTipo.length > 0,
              totalMaterias: perfilEstudiante.length,
              materiasEvaluadas: evaluacionesDeTipo.length,
              materiasPendientes: perfilEstudiante.length - evaluacionesDeTipo.length,
              completado: evaluacionesDeTipo.length === perfilEstudiante.length
            },
            siguientePaso: evaluacionesDeTipo.length === 0 ? 'CREAR_EVALUACIONES' : 'COMPLETAR_DETALLES'
          };
        }
      } catch (error) {
        console.log(`Error al procesar tipo de evaluación ${tipo.NOMBRE}:`, error);
      }
    }

    return {
      tiposEvaluacion: estadoEvaluaciones,
      perfilEstudiante: {
        documento: documentoEstudiante,
        totalMaterias: perfilEstudiante.length,
        materias: perfilEstudiante.map(m => ({
          codigo: m.COD_ASIGNATURA,
          nombre: m.NOMBRE_MATERIA,
          docente: {
            documento: m.DOCUMENTO_DOCENTE,
            nombre: m.NOMBRE_DOCENTE
          }
        }))
      }
    };
  } catch (error) {
    throw error;
  }
};

const iniciarProcesoEvaluacion = async (documentoEstudiante, tipoEvaluacionId) => {
  try {
    // Verificar que el tipo de evaluación existe y está activo
    const configuracionDetalles = await TiposEvaluacion.getConfiguracionDetalles(tipoEvaluacionId);
    
    if (!configuracionDetalles || !configuracionDetalles.configuracion.ACTIVO) {
      throw new Error('El tipo de evaluación no existe o no está activo');
    }

    // Verificar que estamos dentro del período de evaluación
    const fechaActual = new Date();
    const fechaInicio = new Date(configuracionDetalles.configuracion.FECHA_INICIO);
    const fechaFin = new Date(configuracionDetalles.configuracion.FECHA_FIN);

    if (fechaActual < fechaInicio || fechaActual > fechaFin) {
      throw new Error('La evaluación no está disponible en este momento');
    }

    // Obtener información del estudiante
    const perfilEstudiante = await VistaEstudianteModel.getEstudianteByDocumento(documentoEstudiante);
    
    if (!perfilEstudiante || perfilEstudiante.length === 0) {
      throw new Error('No se encontró información del perfil del estudiante');
    }

    // Verificar materias pendientes
    const materiasPendientes = [];
    for (let materia of perfilEstudiante) {
      const evaluacionExistente = await Evaluaciones.findOne(
        tipoEvaluacionId,
        documentoEstudiante,
        materia.COD_ASIGNATURA
      );

      if (!evaluacionExistente || evaluacionExistente.length === 0) {
        materiasPendientes.push({
          materia: {
            codigo: materia.COD_ASIGNATURA,
            nombre: materia.NOMBRE_MATERIA
          },
          docente: {
            documento: materia.DOCUMENTO_DOCENTE,
            nombre: materia.NOMBRE_DOCENTE
          }
        });
      }
    }

    if (materiasPendientes.length === 0) {
      throw new Error('Ya has completado todas las evaluaciones para este tipo');
    }

    return {
      tipoEvaluacion: {
        id: parseInt(tipoEvaluacionId),
        nombre: configuracionDetalles.configuracion.NOMBRE,
        configuracion: configuracionDetalles.configuracion,
        aspectos: configuracionDetalles.aspectos,
        valoraciones: configuracionDetalles.valoraciones
      },
      materiasPendientes,
      totalPendientes: materiasPendientes.length
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllEvaluaciones,
  getEvaluacionById,
  getEvaluacionesByEstudiante,
  getEvaluacionesByEstudianteByConfiguracion,
  getEvaluacionesByDocente,
  createEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
  createEvaluacionesForEstudiante,
  getEvaluacionesPendientesForEstudiante,
  iniciarProcesoEvaluacion,
};