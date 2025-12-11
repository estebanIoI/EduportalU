// src/api/v1/services/evaluacion/evaluaciones.service.js
const Evaluaciones = require('../../models/evaluacion/evaluaciones.model');
const VistaEstudianteModel = require('../../models/vista/vistaEstudiante.model');
const TiposEvaluacion = require('../../models/evaluacion/tiposEvaluaciones.model');

const getAllEvaluaciones = async (pagination) => {
  try {
    const evaluaciones = await Evaluaciones.getAllEvaluaciones(pagination);
    const totalCount = await Evaluaciones.getCount();

    return {
      data: evaluaciones,
      totalCount
    };
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

const getEvaluacionesByEstudianteAsignatura = async (documentoEstudiante, codigoAsignatura) => {
  try {
    const evaluaciones = await Evaluaciones.getEvaluacionesByEstudianteAsignatura(documentoEstudiante, codigoAsignatura);
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
    
    // En desarrollo, permitir bypass de validación de fechas
    const skipDateValidation = process.env.NODE_ENV === 'development' || process.env.SKIP_DATE_VALIDATION === 'true';
    
    console.log('📅 [createEvaluacionesForEstudiante] Verificación de fechas:', {
      fechaActual: fechaActual.toISOString().split('T')[0],
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: fechaFin.toISOString().split('T')[0],
      dentroDelPeriodo: fechaActual >= fechaInicio && fechaActual <= fechaFin,
      skipDateValidation
    });

    if (!skipDateValidation && (fechaActual < fechaInicio || fechaActual > fechaFin)) {
      throw new Error('La evaluación no está disponible en este momento');
    }

    // Verificar si es una evaluación de docentes
    // Si NO es evaluación de docentes, no crear evaluaciones in-situ
    console.log('🔍 Configuración cargada:', {
      ID: tipoEvaluacionId,
      ES_EVALUACION_DOCENTE: configuracionDetalles.configuracion.ES_EVALUACION_DOCENTE,
      tipo: typeof configuracionDetalles.configuracion.ES_EVALUACION_DOCENTE,
      esVerdadero: !!configuracionDetalles.configuracion.ES_EVALUACION_DOCENTE
    });
    
    if (!configuracionDetalles.configuracion.ES_EVALUACION_DOCENTE) {
      console.log('⚠️ No es evaluación de docentes, devolviendo flag genérico');
      return {
        evaluacionesCreadas: [],
        aspectos: configuracionDetalles.aspectos,
        valoraciones: configuracionDetalles.valoraciones,
        isGenericEvaluation: true // Flag para indicar que es evaluación genérica
      };
    }
    
    console.log('✅ ES evaluación de docentes, procediendo a crear evaluaciones');

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
            evaluacion => evaluacion.CONFIGURACION_ID === tipo.ID
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
    
    // En desarrollo, permitir bypass de validación de fechas
    const skipDateValidation = process.env.NODE_ENV === 'development' || process.env.SKIP_DATE_VALIDATION === 'true';
    
    console.log('📅 [iniciarProcesoEvaluacion] Verificación de fechas:', {
      fechaActual: fechaActual.toISOString().split('T')[0],
      fechaInicio: fechaInicio.toISOString().split('T')[0],
      fechaFin: fechaFin.toISOString().split('T')[0],
      dentroDelPeriodo: fechaActual >= fechaInicio && fechaActual <= fechaFin,
      skipDateValidation
    });

    if (!skipDateValidation && (fechaActual < fechaInicio || fechaActual > fechaFin)) {
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

/**
 * Obtiene los resultados de evaluación de un docente
 * @param {string} documentoDocente - Documento del docente
 * @param {string|null} codigoMateria - Código de materia opcional
 * @returns {Object} Resultados de evaluación con nota final y aspectos a mejorar
 */
const getResultadosEvaluacionDocente = async (documentoDocente, codigoMateria = null) => {
  try {
    const resultados = await Evaluaciones.getResultadosEvaluacionDocente(documentoDocente, codigoMateria);
    
    // Procesar los datos para estructurar mejor la respuesta
    const { aspectos, estadisticasGenerales, comentarios } = resultados;
    
    // Calcular promedio general ponderado
    // NOTA: Los puntajes ya están en escala 1-5 (Deficiente=2, Aceptable=3, Bueno=4, Excelente=5)
    let promedioGeneralTotal = 0;
    let totalEvaluacionesTotal = 0;
    
    estadisticasGenerales.forEach(stat => {
      promedioGeneralTotal += parseFloat(stat.promedio_general || 0) * stat.total_evaluaciones;
      totalEvaluacionesTotal += stat.total_evaluaciones;
    });
    
    // notaFinal ya está en escala 1-5, no necesita conversión
    const notaFinal = totalEvaluacionesTotal > 0 
      ? (promedioGeneralTotal / totalEvaluacionesTotal) 
      : 0;
    
    // Identificar aspectos a mejorar (promedio < 3.5 en escala 1-5, equivale a menos de 70%)
    const aspectosAMejorar = aspectos
      .filter(a => parseFloat(a.promedio_aspecto) < 3.5)
      .map(a => ({
        aspecto: a.aspecto,
        descripcion: a.descripcion_aspecto,
        promedio: (parseFloat(a.promedio_aspecto) / 5).toFixed(2), // Normalizado a 0-1 para el frontend
        codigoMateria: a.CODIGO_MATERIA,
        totalEvaluaciones: a.total_evaluaciones,
        distribucion: {
          excelente: a.total_excelente,
          bueno: a.total_bueno,
          aceptable: a.total_aceptable,
          deficiente: a.total_deficiente
        }
      }))
      .sort((a, b) => parseFloat(a.promedio) - parseFloat(b.promedio));
    
    // Agrupar aspectos por materia
    const aspectosPorMateria = {};
    aspectos.forEach(a => {
      if (!aspectosPorMateria[a.CODIGO_MATERIA]) {
        aspectosPorMateria[a.CODIGO_MATERIA] = [];
      }
      aspectosPorMateria[a.CODIGO_MATERIA].push({
        aspecto: a.aspecto,
        descripcion: a.descripcion_aspecto,
        promedio: (parseFloat(a.promedio_aspecto) / 5).toFixed(2), // Normalizado a 0-1 para el frontend
        totalEvaluaciones: a.total_evaluaciones,
        distribucion: {
          excelente: a.total_excelente,
          bueno: a.total_bueno,
          aceptable: a.total_aceptable,
          deficiente: a.total_deficiente
        }
      });
    });
    
    // Calcular nota final por materia (normalizada a 0-1 para el frontend)
    const notaFinalPorMateria = estadisticasGenerales.map(stat => ({
      codigoMateria: stat.CODIGO_MATERIA,
      notaFinal: (parseFloat(stat.promedio_general) / 5).toFixed(2), // Normalizado a 0-1 para el frontend
      totalEvaluaciones: stat.total_evaluaciones,
      totalEstudiantes: stat.total_estudiantes_evaluadores,
      aspectos: aspectosPorMateria[stat.CODIGO_MATERIA] || []
    }));
    
    // notaFinal ya está en escala 1-5
    const notaFinalEscala5 = notaFinal.toFixed(2);
    
    // Normalizar a 0-1 para el frontend (notaFinal / 5)
    const notaFinalNormalizada = notaFinal / 5;
    
    // Determinar calificación cualitativa basada en escala 1-5
    // Excelente: >= 4.5, Bueno: >= 3.75, Aceptable: >= 3.0, Deficiente: < 3.0
    let calificacionCualitativa = 'Sin evaluaciones';
    if (notaFinal >= 4.5) calificacionCualitativa = 'Excelente';
    else if (notaFinal >= 3.75) calificacionCualitativa = 'Bueno';
    else if (notaFinal >= 3.0) calificacionCualitativa = 'Aceptable';
    else if (notaFinal > 0) calificacionCualitativa = 'Deficiente';
    
    return {
      notaFinal: notaFinalNormalizada.toFixed(2), // Normalizado a 0-1 para compatibilidad con el frontend
      notaFinalEscala5,
      calificacionCualitativa,
      totalEvaluaciones: totalEvaluacionesTotal,
      totalEstudiantes: estadisticasGenerales.reduce((sum, s) => sum + s.total_estudiantes_evaluadores, 0),
      aspectosAMejorar,
      notaFinalPorMateria,
      comentarios: comentarios.map(c => ({
        codigoMateria: c.CODIGO_MATERIA,
        comentarioGeneral: c.COMENTARIO_GENERAL,
        aspecto: c.aspecto,
        comentarioAspecto: c.comentario_aspecto,
        fecha: c.FECHA_CREACION
      })).filter(c => c.comentarioGeneral || c.comentarioAspecto)
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Obtiene la autoevaluación de un docente para un periodo específico
 */
const getAutoevaluacionDocente = async (documentoDocente, periodo) => {
  try {
    const autoevaluacion = await Evaluaciones.getAutoevaluacionDocente(documentoDocente, periodo);
    return autoevaluacion;
  } catch (error) {
    throw error;
  }
};

/**
 * Crea o actualiza la autoevaluación de un docente
 */
const createAutoevaluacionDocente = async (documentoDocente, periodo, respuestas) => {
  try {
    const resultado = await Evaluaciones.createAutoevaluacionDocente(documentoDocente, periodo, respuestas);
    return resultado;
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
  getEvaluacionesByEstudianteAsignatura,
  createEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
  createEvaluacionesForEstudiante,
  getEvaluacionesPendientesForEstudiante,
  iniciarProcesoEvaluacion,
  getResultadosEvaluacionDocente,
  getAutoevaluacionDocente,
  createAutoevaluacionDocente,
};