/**
 * @fileoverview Controlador de Reportes para el módulo de administrador
 * @description Maneja los endpoints de reportes por programa, facultad e institucional
 * @version 1.0.0
 */

const reportesModel = require('../../models/reportes/reportes.model');
const iaService = require('../../services/reportes/ia.service');
const { successResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

// ======================================
// FACULTADES Y PROGRAMAS
// ======================================

/**
 * @desc    Obtiene todas las facultades activas
 * @route   GET /api/v1/reportes/facultades
 * @access  Private (Admin)
 */
const getFacultades = async (req, res) => {
  try {
    const facultades = await reportesModel.getFacultades();
    return successResponse(res, {
      message: 'Facultades obtenidas exitosamente',
      data: facultades
    });
  } catch (error) {
    console.error('Error al obtener facultades:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener facultades',
      error: error.message
    });
  }
};

/**
 * @desc    Obtiene todos los programas, opcionalmente filtrados por facultad
 * @route   GET /api/v1/reportes/programas
 * @access  Private (Admin)
 */
const getProgramas = async (req, res) => {
  try {
    const { facultadId } = req.query;
    const programas = await reportesModel.getProgramas(facultadId);
    return successResponse(res, {
      message: 'Programas obtenidos exitosamente',
      data: programas
    });
  } catch (error) {
    console.error('Error al obtener programas:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener programas',
      error: error.message
    });
  }
};

// ======================================
// REPORTE POR PROGRAMA
// ======================================

/**
 * @desc    Obtiene el reporte completo de un programa
 * @route   GET /api/v1/reportes/programa/:id
 * @access  Private (Admin, Director de Programa)
 */
const getReportePrograma = async (req, res) => {
  try {
    const { id } = req.params;
    const { idConfiguracion, incluirIA } = req.query;

    if (!id) {
      return errorResponse(res, {
        code: 400,
        message: 'ID del programa es requerido'
      });
    }

    if (!idConfiguracion) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de configuración es requerido'
      });
    }

    // Obtener reporte base
    const reporte = await reportesModel.getReportePrograma(id, idConfiguracion);

    if (!reporte) {
      return errorResponse(res, {
        code: 404,
        message: 'Programa no encontrado'
      });
    }

    // Si se solicita IA, generar resumen consolidado del programa
    if (incluirIA === 'true') {
      // Intentar obtener resumen cacheado del programa
      const resumenCacheado = await reportesModel.getResumenIA('PROGRAMA', {
        programa_id: id,
        configuracion_id: idConfiguracion
      });

      if (resumenCacheado) {
        reporte.resumen_ia = resumenCacheado;
      } else {
        // Obtener todos los comentarios del programa
        const comentariosPrograma = await reportesModel.getComentariosPrograma(id, idConfiguracion);
        
        if (comentariosPrograma.textos_para_analisis.length > 0) {
          // Generar resumen consolidado del programa
          const resumenIA = await iaService.generateResumenPrograma(
            comentariosPrograma.textos_para_analisis,
            reporte.programa.nombre
          );
          
          reporte.resumen_ia = {
            ...resumenIA,
            estadisticas: {
              total_comentarios: comentariosPrograma.total_comentarios,
              // Clasificación rápida usando fallback
              ...iaService.getEstadisticasRapidas(comentariosPrograma.textos_para_analisis)
            },
            procesado_con_ia: true,
            modelo_usado: 'phi3:mini'
          };

          // Guardar en caché
          try {
            await reportesModel.saveResumenIA({
              tipo_resumen: 'PROGRAMA',
              programa_id: id,
              configuracion_id: idConfiguracion,
              fortalezas: resumenIA.fortalezas,
              aspectos_mejora: resumenIA.aspectos_mejora,
              frases_positivas: resumenIA.frases_representativas?.positivas || [],
              frases_negativas: resumenIA.frases_representativas?.negativas || [],
              resumen_ejecutivo: resumenIA.resumen_ejecutivo,
              total_comentarios: comentariosPrograma.total_comentarios
            });
          } catch (cacheError) {
            console.warn('No se pudo guardar el resumen en caché:', cacheError.message);
          }
        }
      }
    }

    return successResponse(res, {
      message: 'Reporte de programa obtenido exitosamente',
      data: reporte
    });
  } catch (error) {
    console.error('Error al obtener reporte de programa:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener reporte de programa',
      error: error.message
    });
  }
};

// ======================================
// REPORTE POR FACULTAD
// ======================================

/**
 * @desc    Obtiene el reporte consolidado de una facultad
 * @route   GET /api/v1/reportes/facultad/:id
 * @access  Private (Admin, Decano)
 */
const getReporteFacultad = async (req, res) => {
  try {
    const { id } = req.params;
    const { idConfiguracion, incluirIA } = req.query;

    if (!id) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de la facultad es requerido'
      });
    }

    if (!idConfiguracion) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de configuración es requerido'
      });
    }

    // Obtener reporte base
    const reporte = await reportesModel.getReporteFacultad(id, idConfiguracion);

    if (!reporte) {
      return errorResponse(res, {
        code: 404,
        message: 'Facultad no encontrada'
      });
    }

    // Si se solicita IA, generar resumen consolidado
    if (incluirIA === 'true') {
      // Intentar obtener resumen cacheado
      const resumenCacheado = await reportesModel.getResumenIA('FACULTAD', {
        facultad_id: id,
        configuracion_id: idConfiguracion
      });

      if (resumenCacheado) {
        reporte.resumen_ia = resumenCacheado;
      } else {
        // Obtener todos los comentarios de la facultad
        const comentariosPorPrograma = {};
        for (const programa of reporte.programas) {
          const comentarios = await reportesModel.getComentariosPrograma(programa.id, idConfiguracion);
          comentariosPorPrograma[programa.nombre] = comentarios;
        }

        // Generar resumen
        const resumenIA = await iaService.generateResumenPrograma(
          Object.values(comentariosPorPrograma).flatMap(p => p.textos_para_analisis),
          reporte.facultad.nombre
        );

        reporte.resumen_ia = resumenIA;

        // Guardar en caché
        await reportesModel.saveResumenIA({
          tipo_resumen: 'FACULTAD',
          facultad_id: id,
          configuracion_id: idConfiguracion,
          fortalezas: resumenIA.fortalezas,
          aspectos_mejora: resumenIA.aspectos_mejora,
          frases_positivas: resumenIA.frases_representativas?.positivas || [],
          frases_negativas: resumenIA.frases_representativas?.negativas || [],
          resumen_ejecutivo: resumenIA.resumen_ejecutivo,
          total_comentarios: Object.values(comentariosPorPrograma).reduce((sum, p) => sum + p.total_comentarios, 0)
        });
      }
    }

    return successResponse(res, {
      message: 'Reporte de facultad obtenido exitosamente',
      data: reporte
    });
  } catch (error) {
    console.error('Error al obtener reporte de facultad:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener reporte de facultad',
      error: error.message
    });
  }
};

// ======================================
// REPORTE INSTITUCIONAL
// ======================================

/**
 * @desc    Obtiene el reporte institucional consolidado
 * @route   GET /api/v1/reportes/institucional
 * @access  Private (Admin)
 */
const getReporteInstitucional = async (req, res) => {
  try {
    const { idConfiguracion, incluirIA } = req.query;

    if (!idConfiguracion) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de configuración es requerido'
      });
    }

    // Obtener reporte base
    const reporte = await reportesModel.getReporteInstitucional(idConfiguracion);

    // Si se solicita IA, generar resumen y tendencias
    if (incluirIA === 'true') {
      // Intentar obtener resumen cacheado
      const resumenCacheado = await reportesModel.getResumenIA('INSTITUCIONAL', {
        configuracion_id: idConfiguracion
      });

      if (resumenCacheado) {
        reporte.resumen_ia = resumenCacheado;
      } else {
        // Obtener comentarios por facultad
        const comentariosPorFacultad = {};
        for (const facultad of reporte.facultades) {
          const facultadData = await reportesModel.getFacultadById(facultad.id);
          const comentarios = [];

          for (const programa of facultadData.programas) {
            const comentariosPrograma = await reportesModel.getComentariosPrograma(programa.ID, idConfiguracion);
            comentarios.push(...comentariosPrograma.textos_para_analisis);
          }

          comentariosPorFacultad[facultad.nombre] = { comentarios };
        }

        // Generar resumen institucional con tendencias
        const resumenIA = await iaService.generateResumenInstitucional(comentariosPorFacultad);
        reporte.resumen_ia = resumenIA;
        reporte.tendencias = resumenIA.tendencias;

        // Guardar en caché
        await reportesModel.saveResumenIA({
          tipo_resumen: 'INSTITUCIONAL',
          configuracion_id: idConfiguracion,
          fortalezas: resumenIA.fortalezas,
          aspectos_mejora: resumenIA.aspectos_mejora,
          frases_positivas: resumenIA.frases_representativas?.positivas || [],
          frases_negativas: resumenIA.frases_representativas?.negativas || [],
          tendencias: resumenIA.tendencias,
          resumen_ejecutivo: resumenIA.resumen_ejecutivo,
          total_comentarios: Object.values(comentariosPorFacultad).reduce((sum, f) => sum + f.comentarios.length, 0)
        });
      }
    }

    return successResponse(res, {
      message: 'Reporte institucional obtenido exitosamente',
      data: reporte
    });
  } catch (error) {
    console.error('Error al obtener reporte institucional:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener reporte institucional',
      error: error.message
    });
  }
};

// ======================================
// ENDPOINTS DE IA
// ======================================

/**
 * @desc    Genera resumen IA bajo demanda
 * @route   POST /api/v1/reportes/ia/resumen
 * @access  Private (Admin)
 */
const generarResumenIA = async (req, res) => {
  try {
    const { comentarios, tipo } = req.body;

    if (!comentarios || !Array.isArray(comentarios)) {
      return errorResponse(res, {
        code: 400,
        message: 'Se requiere un array de comentarios'
      });
    }

    if (!tipo) {
      return errorResponse(res, {
        code: 400,
        message: 'Se requiere el tipo de resumen (fortalezas_mejora, polaridad, clustering)'
      });
    }

    const resultado = await iaService.processResumenRequest({ comentarios, tipo });

    if (!resultado.success) {
      return errorResponse(res, {
        code: 400,
        message: resultado.message
      });
    }

    return successResponse(res, {
      message: 'Resumen generado exitosamente',
      data: resultado.data,
      procesado_con_ia: resultado.procesado_con_ia || false
    });
  } catch (error) {
    console.error('Error al generar resumen IA:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al generar resumen IA',
      error: error.message
    });
  }
};

/**
 * @desc    Obtiene comentarios de un docente para análisis
 * @route   GET /api/v1/reportes/comentarios/docente/:documento
 * @access  Private (Admin)
 */
const getComentariosDocente = async (req, res) => {
  try {
    const { documento } = req.params;
    const { idConfiguracion, codigoMateria, analizarIA } = req.query;

    if (!documento) {
      return errorResponse(res, {
        code: 400,
        message: 'Documento del docente es requerido'
      });
    }

    if (!idConfiguracion) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de configuración es requerido'
      });
    }

    // Obtener comentarios
    let comentariosData;
    if (codigoMateria) {
      comentariosData = await reportesModel.getComentariosDocente(
        documento,
        codigoMateria,
        idConfiguracion
      );
    } else {
      // Obtener todas las materias del docente
      const pool = require('../../../../db').getPool();
      const [materias] = await pool.query(`
        SELECT DISTINCT e.CODIGO_MATERIA
        FROM EVALUACIONES e
        WHERE e.DOCUMENTO_DOCENTE = ? AND e.ID_CONFIGURACION = ?
      `, [documento, idConfiguracion]);

      comentariosData = {
        documento_docente: documento,
        total_comentarios: 0,
        comentarios_generales: [],
        comentarios_por_aspecto: {},
        textos_para_analisis: []
      };

      for (const mat of materias) {
        const matComentarios = await reportesModel.getComentariosDocente(
          documento,
          mat.CODIGO_MATERIA,
          idConfiguracion
        );
        comentariosData.total_comentarios += matComentarios.total_comentarios;
        comentariosData.comentarios_generales.push(...matComentarios.comentarios_generales);
        comentariosData.textos_para_analisis.push(...matComentarios.textos_para_analisis);
        
        // Merge comentarios por aspecto
        for (const [aspecto, comentarios] of Object.entries(matComentarios.comentarios_por_aspecto)) {
          if (!comentariosData.comentarios_por_aspecto[aspecto]) {
            comentariosData.comentarios_por_aspecto[aspecto] = [];
          }
          comentariosData.comentarios_por_aspecto[aspecto].push(...comentarios);
        }
      }
    }

    // Si se solicita análisis IA
    let resumenIA = null;
    if (analizarIA === 'true' && comentariosData.textos_para_analisis.length > 0) {
      resumenIA = await iaService.processComentariosDocente(comentariosData);
    }

    return successResponse(res, {
      message: 'Comentarios obtenidos exitosamente',
      data: {
        ...comentariosData,
        resumen_ia: resumenIA
      }
    });
  } catch (error) {
    console.error('Error al obtener comentarios del docente:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener comentarios del docente',
      error: error.message
    });
  }
};

/**
 * @desc    Obtiene todos los comentarios de un programa para análisis
 * @route   GET /api/v1/reportes/comentarios/programa/:id
 * @access  Private (Admin)
 */
const getComentariosPrograma = async (req, res) => {
  try {
    const { id } = req.params;
    const { idConfiguracion, analizarIA } = req.query;

    if (!id) {
      return errorResponse(res, {
        code: 400,
        message: 'ID del programa es requerido'
      });
    }

    if (!idConfiguracion) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de configuración es requerido'
      });
    }

    const comentariosData = await reportesModel.getComentariosPrograma(id, idConfiguracion);

    // Si se solicita análisis IA
    let resumenIA = null;
    if (analizarIA === 'true' && comentariosData.textos_para_analisis && comentariosData.textos_para_analisis.length > 0) {
      const resultado = await iaService.processResumenRequest({
        comentarios: comentariosData.textos_para_analisis,
        tipo: 'fortalezas_mejora'
      });
      if (resultado.success) {
        resumenIA = {
          ...resultado.data,
          procesado_con_ia: resultado.procesado_con_ia
        };
      }
    }

    return successResponse(res, {
      message: 'Comentarios del programa obtenidos exitosamente',
      data: {
        programa_id: id,
        total_comentarios: comentariosData.total_comentarios || 0,
        comentarios: (comentariosData.textos_para_analisis || []).map(texto => ({ texto })),
        resumen_ia: resumenIA
      }
    });
  } catch (error) {
    console.error('Error al obtener comentarios del programa:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener comentarios del programa',
      error: error.message
    });
  }
};

/**
 * @desc    Verifica el estado del servicio de IA (Ollama)
 * @route   GET /api/v1/reportes/ia/status
 * @access  Private (Admin)
 */
const getIAStatus = async (req, res) => {
  try {
    const status = await iaService.checkOllamaHealth();
    return successResponse(res, {
      message: 'Estado de IA obtenido',
      data: status
    });
  } catch (error) {
    console.error('Error al verificar estado de IA:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al verificar estado de IA',
      error: error.message
    });
  }
};

/**
 * @desc    Obtiene el detalle completo de un docente con todas sus materias
 * @route   GET /api/v1/reportes/docente/:documento
 * @access  Private (Admin, Director)
 */
const getDetalleDocente = async (req, res) => {
  try {
    const { documento } = req.params;
    const { idConfiguracion, incluirIA } = req.query;

    if (!documento) {
      return errorResponse(res, {
        code: 400,
        message: 'Documento del docente es requerido'
      });
    }

    if (!idConfiguracion) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de configuración es requerido'
      });
    }

    const pool = require('../../../../db').getPool();

    // Obtener materias del docente
    const [materias] = await pool.query(`
      SELECT DISTINCT e.CODIGO_MATERIA
      FROM EVALUACIONES e
      WHERE e.DOCUMENTO_DOCENTE = ? AND e.ID_CONFIGURACION = ?
    `, [documento, idConfiguracion]);

    const detalle = {
      documento,
      nombre: documento, // Puede enriquecerse con datos remotos
      materias: []
    };

    for (const mat of materias) {
      // Obtener comentarios por materia
      const comentariosData = await reportesModel.getComentariosDocente(
        documento,
        mat.CODIGO_MATERIA,
        idConfiguracion
      );

      // Obtener promedios por aspecto
      const [promedios] = await pool.query(`
        SELECT 
          ae.ETIQUETA as aspecto,
          AVG(cv.PUNTAJE) as promedio,
          COUNT(*) as total_respuestas
        FROM EVALUACIONES e
        INNER JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
        INNER JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
        INNER JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
        INNER JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
        WHERE e.DOCUMENTO_DOCENTE = ?
          AND e.CODIGO_MATERIA = ?
          AND e.ID_CONFIGURACION = ?
        GROUP BY ae.ID, ae.ETIQUETA
      `, [documento, mat.CODIGO_MATERIA, idConfiguracion]);

      const materiaDetalle = {
        codigo: mat.CODIGO_MATERIA,
        nombre: mat.CODIGO_MATERIA,
        promedios: promedios.reduce((acc, p) => {
          acc[p.aspecto.toLowerCase().replace(/\s+/g, '_')] = parseFloat(p.promedio).toFixed(2);
          return acc;
        }, {}),
        grafica: {
          labels: promedios.map(p => p.aspecto),
          values: promedios.map(p => parseFloat(p.promedio).toFixed(2))
        },
        observaciones_crudas: comentariosData.textos_para_analisis,
        resumen_ia: null
      };

      // Generar resumen IA si se solicita
      if (incluirIA === 'true' && comentariosData.textos_para_analisis.length > 0) {
        const resumenIA = await iaService.processComentariosDocente(comentariosData);
        materiaDetalle.resumen_ia = resumenIA;
      }

      detalle.materias.push(materiaDetalle);
    }

    return successResponse(res, {
      message: 'Detalle del docente obtenido exitosamente',
      data: detalle
    });
  } catch (error) {
    console.error('Error al obtener detalle del docente:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener detalle del docente',
      error: error.message
    });
  }
};

/**
 * @desc    Obtiene los rankings de docentes
 * @route   GET /api/v1/reportes/rankings
 * @access  Private (Admin)
 */
const getRankings = async (req, res) => {
  try {
    const { tipo, idConfiguracion, programaId, facultadId, limite } = req.query;

    if (!idConfiguracion) {
      return errorResponse(res, {
        code: 400,
        message: 'ID de configuración es requerido'
      });
    }

    let reporte;
    let rankings = {
      positivos: [],
      mejora: []
    };

    switch (tipo) {
      case 'programa':
        if (!programaId) {
          return errorResponse(res, { code: 400, message: 'ID del programa es requerido' });
        }
        reporte = await reportesModel.getReportePrograma(programaId, idConfiguracion);
        if (reporte) {
          rankings.positivos = reporte.ranking_positivos;
          rankings.mejora = reporte.ranking_mejora;
        }
        break;

      case 'facultad':
        if (!facultadId) {
          return errorResponse(res, { code: 400, message: 'ID de la facultad es requerido' });
        }
        reporte = await reportesModel.getReporteFacultad(facultadId, idConfiguracion);
        if (reporte) {
          rankings.positivos = reporte.ranking_positivos;
          rankings.mejora = reporte.ranking_mejora;
        }
        break;

      case 'institucional':
      default:
        reporte = await reportesModel.getReporteInstitucional(idConfiguracion);
        if (reporte) {
          rankings.positivos = reporte.ranking_global_positivos;
          rankings.mejora = reporte.ranking_global_mejora;
        }
        break;
    }

    // Aplicar límite si se especifica
    const limiteNum = parseInt(limite) || 5;
    rankings.positivos = rankings.positivos.slice(0, limiteNum);
    rankings.mejora = rankings.mejora.slice(0, limiteNum);

    return successResponse(res, {
      message: 'Rankings obtenidos exitosamente',
      data: rankings
    });
  } catch (error) {
    console.error('Error al obtener rankings:', error);
    return errorResponse(res, {
      code: 500,
      message: 'Error al obtener rankings',
      error: error.message
    });
  }
};

// ======================================
// EXPORTACIÓN
// ======================================

module.exports = {
  // Estructura
  getFacultades,
  getProgramas,
  
  // Reportes
  getReportePrograma,
  getReporteFacultad,
  getReporteInstitucional,
  
  // Detalle docente
  getDetalleDocente,
  
  // Rankings
  getRankings,
  
  // Comentarios
  getComentariosDocente,
  getComentariosPrograma,
  
  // IA
  generarResumenIA,
  getIAStatus
};
