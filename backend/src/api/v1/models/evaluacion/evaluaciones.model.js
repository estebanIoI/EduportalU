const { getPool, getRemotePool } = require('../../../../db');

const Evaluaciones = {

  findOne: async (configuracionId, documentoEstudiante, codigoMateria) => {
    try {
        const pool = getPool();
        const [rows] = await pool.query(
            'SELECT * FROM EVALUACIONES WHERE ID_CONFIGURACION = ? AND DOCUMENTO_ESTUDIANTE = ? AND CODIGO_MATERIA = ?', 
            [configuracionId, documentoEstudiante, codigoMateria]
        );
        return rows;
    } catch (error) {
        throw error;
    }
  },

  getAllEvaluaciones: async (pagination) => {
    try {
      const pool = getPool();
      let query = `
        SELECT * 
        FROM EVALUACIONES
      `;
      let params = [];
      
      if (pagination) {
        const limit = parseInt(pagination.limit);
        const offset = parseInt(pagination.offset);
        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
          throw new Error('Parámetros de paginación inválidos');
        }
        query += ' ORDER BY ID LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        query += ' ORDER BY ID';
      }
      
      console.log('Query ejecutada:', query);
      console.log('Parámetros:', params);
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error en getAllEvaluaciones:', error);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM EVALUACIONES');
      return rows[0].total;
    } catch (error) {
      console.error('Error en getEvaluacionesCount:', error);
      throw error;
    }
  },

  getEvaluacionById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM EVALUACIONES WHERE ID = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  getEvaluacionesByEstudiante: async (documentoEstudiante) => {
    try {
      const pool = getPool();
      const query = `
        WITH SEMESTRE_PREDOMINANTE AS (
            SELECT 
                COD_ASIGNATURA,
                ID_DOCENTE,
                SEMESTRE AS SEMESTRE_PREDOMINANTE,
                ROW_NUMBER() OVER (PARTITION BY COD_ASIGNATURA, ID_DOCENTE ORDER BY COUNT(*) DESC) AS rn
            FROM vista_academica_insitus
            GROUP BY COD_ASIGNATURA, ID_DOCENTE, SEMESTRE
        ),
        PROGRAMA_PREDOMINANTE AS (
            SELECT 
                COD_ASIGNATURA,
                ID_DOCENTE,
                NOM_PROGRAMA AS PROGRAMA_PREDOMINANTE,
                ROW_NUMBER() OVER (PARTITION BY COD_ASIGNATURA, ID_DOCENTE ORDER BY COUNT(*) DESC) AS rn
            FROM vista_academica_insitus
            GROUP BY COD_ASIGNATURA, ID_DOCENTE, NOM_PROGRAMA
        )
  
        SELECT DISTINCT
            e.ID,
            e.DOCUMENTO_ESTUDIANTE,
            e.DOCUMENTO_DOCENTE,
            vai.DOCENTE,
            vai.ASIGNATURA,
            e.CODIGO_MATERIA,
            e.ID_CONFIGURACION,
            sp.SEMESTRE_PREDOMINANTE,
            pp.PROGRAMA_PREDOMINANTE
        FROM EVALUACIONES e
        LEFT JOIN vista_academica_insitus vai 
            ON e.DOCUMENTO_DOCENTE = vai.ID_DOCENTE AND e.CODIGO_MATERIA = vai.COD_ASIGNATURA
        LEFT JOIN SEMESTRE_PREDOMINANTE sp 
            ON e.CODIGO_MATERIA = sp.COD_ASIGNATURA AND e.DOCUMENTO_DOCENTE = sp.ID_DOCENTE AND sp.rn = 1
        LEFT JOIN PROGRAMA_PREDOMINANTE pp 
            ON e.CODIGO_MATERIA = pp.COD_ASIGNATURA AND e.DOCUMENTO_DOCENTE = pp.ID_DOCENTE AND pp.rn = 1
        WHERE e.DOCUMENTO_ESTUDIANTE = ?
      `;
      
      const [rows] = await pool.query(query, [documentoEstudiante]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getEvaluacionesByEstudianteByConfiguracion: async (documentoEstudiante, configuracionId) => {
    try {
      const pool = getPool(); // Para EVALUACIONES y evaluacion_detalle
      const remotePool = getRemotePool(); // Para vista_academica_insitus
      
      // Step 1: Get the vista_academica_insitus data (remote pool)
      const queryVistaAcademica = `
        SELECT 
            COD_ASIGNATURA, 
            ID_DOCENTE, 
            SEMESTRE, 
            NOM_PROGRAMA,
            DOCENTE,
            ASIGNATURA
        FROM vista_academica_insitus
        WHERE ID_ESTUDIANTE = ?
      `;
      const [vistaAcademicaRows] = await remotePool.query(queryVistaAcademica, [documentoEstudiante]);
      
      // Step 2: Process the result and query the main database (pool)
      if (vistaAcademicaRows.length === 0) {
        return [];
      }
      
      const codAsignaturas = vistaAcademicaRows.map(row => row.COD_ASIGNATURA);
      const docentes = vistaAcademicaRows.map(row => row.ID_DOCENTE);
      
      // Create a map for quick lookup of vista_academica_insitus data
      const vistaAcademicaMap = new Map();
      vistaAcademicaRows.forEach(row => {
        const key = `${row.ID_DOCENTE}_${row.COD_ASIGNATURA}`;
        if (!vistaAcademicaMap.has(key)) {
          vistaAcademicaMap.set(key, {
            semestres: [],
            programas: [],
            docente: row.DOCENTE,
            asignatura: row.ASIGNATURA
          });
        }
        vistaAcademicaMap.get(key).semestres.push(row.SEMESTRE);
        vistaAcademicaMap.get(key).programas.push(row.NOM_PROGRAMA);
      });
      
      // Calculate predominant semester and program for each combination
      const predominantData = new Map();
      vistaAcademicaMap.forEach((data, key) => {
        // Get most frequent semester
        const semestreCount = {};
        data.semestres.forEach(sem => {
          semestreCount[sem] = (semestreCount[sem] || 0) + 1;
        });
        const semestrePredominante = Object.keys(semestreCount).reduce((a, b) => 
          semestreCount[a] > semestreCount[b] ? a : b
        );
        
        // Get most frequent program
        const programaCount = {};
        data.programas.forEach(prog => {
          programaCount[prog] = (programaCount[prog] || 0) + 1;
        });
        const programaPredominante = Object.keys(programaCount).reduce((a, b) => 
          programaCount[a] > programaCount[b] ? a : b
        );
        
        predominantData.set(key, {
          semestrePredominante,
          programaPredominante,
          docente: data.docente,
          asignatura: data.asignatura
        });
      });
      
      // Step 3: Query evaluaciones from the main pool
      const queryEvaluaciones = `
        SELECT DISTINCT
            e.ID,
            e.DOCUMENTO_ESTUDIANTE,
            e.DOCUMENTO_DOCENTE,
            e.CODIGO_MATERIA,
            e.ID_CONFIGURACION,
            CASE 
                WHEN ed.ID IS NOT NULL THEN 1 
                ELSE 0 
            END AS ACTIVO
        FROM EVALUACIONES e
        LEFT JOIN evaluacion_detalle ed 
            ON e.ID = ed.EVALUACION_ID
        WHERE e.DOCUMENTO_ESTUDIANTE = ? 
          AND e.ID_CONFIGURACION = ? 
          AND e.CODIGO_MATERIA IN (${codAsignaturas.map(() => '?').join(',')}) 
          AND e.DOCUMENTO_DOCENTE IN (${docentes.map(() => '?').join(',')})
      `;
      
      const [evaluacionesRows] = await pool.query(queryEvaluaciones, [
        documentoEstudiante, 
        configuracionId, 
        ...codAsignaturas, 
        ...docentes
      ]);
      
      // Step 4: Combine the results
      const finalResults = evaluacionesRows.map(evaluacion => {
        const key = `${evaluacion.DOCUMENTO_DOCENTE}_${evaluacion.CODIGO_MATERIA}`;
        const academicData = predominantData.get(key) || {};
        
        return {
          ID: evaluacion.ID,
          DOCUMENTO_ESTUDIANTE: evaluacion.DOCUMENTO_ESTUDIANTE,
          DOCUMENTO_DOCENTE: evaluacion.DOCUMENTO_DOCENTE,
          DOCENTE: academicData.docente || null,
          ASIGNATURA: academicData.asignatura || null,
          CODIGO_MATERIA: evaluacion.CODIGO_MATERIA,
          ID_CONFIGURACION: evaluacion.ID_CONFIGURACION,
          SEMESTRE_PREDOMINANTE: academicData.semestrePredominante || null,
          PROGRAMA_PREDOMINANTE: academicData.programaPredominante || null,
          ACTIVO: evaluacion.ACTIVO
        };
      });
      
      return finalResults;
      
    } catch (error) {
      throw error;
    }
  },
  
  getEvaluacionesByDocente: async (documentoDocente) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM EVALUACIONES WHERE DOCUMENTO_DOCENTE = ?', [documentoDocente]);
      return rows;
    } catch (error) {
      throw error;
    }
  },

  getEvaluacionesByEstudianteAsignatura: async (documentoEstudiante, codigoAsignatura) => {
    try {
      const pool = getPool();
      
      // Consultar evaluaciones de docentes (in-situ) con detalle
      const query = `
        SELECT e.*, ed.ID as detalle_id, 'docente' as tipo_evaluacion
        FROM EVALUACIONES e
        LEFT JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
        WHERE e.DOCUMENTO_ESTUDIANTE = ? AND e.CODIGO_MATERIA = ?
      `;
      const [evaluacionesDocente] = await pool.query(query, [documentoEstudiante, codigoAsignatura]);
      
      // Consultar evaluaciones genéricas completadas del estudiante
      const queryGenericas = `
        SELECT 
          eg.ID, 
          eg.CONFIGURACION_ID, 
          eg.DOCUMENTO_ESTUDIANTE, 
          eg.ESTADO, 
          eg.FECHA_EVALUACION,
          'generica' as tipo_evaluacion,
          eg.ID as detalle_id
        FROM EVALUACIONES_GENERICAS eg
        WHERE eg.DOCUMENTO_ESTUDIANTE = ? AND eg.ESTADO = 'completada'
      `;
      const [evaluacionesGenericas] = await pool.query(queryGenericas, [documentoEstudiante]);
      
      // Combinar ambos tipos de evaluaciones
      return [...evaluacionesDocente, ...evaluacionesGenericas];
    } catch (error) {
      throw error;
    }
  },

  createEvaluacion: async (evaluacionData) => {
    try {
      const pool = getPool();
      const { DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION, } = evaluacionData;
      
      const [result] = await pool.query(
        'INSERT INTO EVALUACIONES (DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION) VALUES (?, ?, ?, ?, ?)',
        [DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION]
      );
      
      return { id: result.insertId, ...evaluacionData };
    } catch (error) {
      throw error;
    }
  },

  updateEvaluacion: async (id, evaluacionData) => {
    try {
      const pool = getPool();
      const { DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION } = evaluacionData;
      
      await pool.query(
        'UPDATE EVALUACIONES SET DOCUMENTO_ESTUDIANTE = ?, DOCUMENTO_DOCENTE = ?, CODIGO_MATERIA = ?, COMENTARIO_GENERAL = ?, ID_CONFIGURACION = ? WHERE ID = ?',
        [DOCUMENTO_ESTUDIANTE, DOCUMENTO_DOCENTE, CODIGO_MATERIA, COMENTARIO_GENERAL, ID_CONFIGURACION, id]
      );
      
      return { id, ...evaluacionData };
    } catch (error) {
      throw error;
    }
  },

  deleteEvaluacion: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM EVALUACIONES WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene los resultados de evaluación de un docente
   * Incluye nota final promedio y desglose por aspectos
   */
  getResultadosEvaluacionDocente: async (documentoDocente, codigoMateria = null) => {
    try {
      const pool = getPool();
      
      // Query para obtener el promedio general y por aspecto
      let query = `
        SELECT 
          e.DOCUMENTO_DOCENTE,
          e.CODIGO_MATERIA,
          ae.ID as aspecto_id,
          ae.ETIQUETA as aspecto,
          ae.DESCRIPCION as descripcion_aspecto,
          COUNT(DISTINCT e.ID) as total_evaluaciones,
          AVG(cv.PUNTAJE) as promedio_aspecto,
          MAX(cv.PUNTAJE) as mejor_calificacion,
          MIN(cv.PUNTAJE) as peor_calificacion,
          SUM(CASE WHEN ev.VALOR = 'E' THEN 1 ELSE 0 END) as total_excelente,
          SUM(CASE WHEN ev.VALOR = 'B' THEN 1 ELSE 0 END) as total_bueno,
          SUM(CASE WHEN ev.VALOR = 'A' THEN 1 ELSE 0 END) as total_aceptable,
          SUM(CASE WHEN ev.VALOR = 'D' THEN 1 ELSE 0 END) as total_deficiente
        FROM 
          EVALUACIONES e
          INNER JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
          INNER JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
          INNER JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
          INNER JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
          INNER JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
        WHERE 
          e.DOCUMENTO_DOCENTE = ?
          AND ca.ACTIVO = TRUE
      `;
      
      const params = [documentoDocente];
      
      if (codigoMateria) {
        query += ` AND e.CODIGO_MATERIA = ?`;
        params.push(codigoMateria);
      }
      
      query += `
        GROUP BY 
          e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, ae.ID, ae.ETIQUETA, ae.DESCRIPCION
        ORDER BY 
          e.CODIGO_MATERIA, promedio_aspecto ASC
      `;
      
      const [aspectos] = await pool.query(query, params);
      
      // Query para obtener el promedio general
      let queryGeneral = `
        SELECT 
          e.DOCUMENTO_DOCENTE,
          e.CODIGO_MATERIA,
          COUNT(DISTINCT e.ID) as total_evaluaciones,
          COUNT(DISTINCT e.DOCUMENTO_ESTUDIANTE) as total_estudiantes_evaluadores,
          AVG(cv.PUNTAJE) as promedio_general
        FROM 
          EVALUACIONES e
          INNER JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
          INNER JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
        WHERE 
          e.DOCUMENTO_DOCENTE = ?
      `;
      
      const paramsGeneral = [documentoDocente];
      
      if (codigoMateria) {
        queryGeneral += ` AND e.CODIGO_MATERIA = ?`;
        paramsGeneral.push(codigoMateria);
      }
      
      queryGeneral += ` GROUP BY e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA`;
      
      const [estadisticasGenerales] = await pool.query(queryGeneral, paramsGeneral);
      
      // Query para obtener comentarios
      let queryComentarios = `
        SELECT 
          e.ID as evaluacion_id,
          e.CODIGO_MATERIA,
          e.COMENTARIO_GENERAL,
          ae.ETIQUETA as aspecto,
          ed.COMENTARIO as comentario_aspecto,
          e.FECHA_CREACION
        FROM 
          EVALUACIONES e
          LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
          LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
          LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
        WHERE 
          e.DOCUMENTO_DOCENTE = ?
          AND (
            (e.COMENTARIO_GENERAL IS NOT NULL AND e.COMENTARIO_GENERAL != '')
            OR (ed.COMENTARIO IS NOT NULL AND ed.COMENTARIO != '')
          )
      `;
      
      const paramsComentarios = [documentoDocente];
      
      if (codigoMateria) {
        queryComentarios += ` AND e.CODIGO_MATERIA = ?`;
        paramsComentarios.push(codigoMateria);
      }
      
      queryComentarios += ` ORDER BY e.FECHA_CREACION DESC LIMIT 50`;
      
      const [comentarios] = await pool.query(queryComentarios, paramsComentarios);
      
      return {
        aspectos,
        estadisticasGenerales,
        comentarios
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Obtiene la autoevaluación de un docente para un periodo específico
   */
  getAutoevaluacionDocente: async (documentoDocente, periodo) => {
    try {
      const pool = getPool();
      
      const [rows] = await pool.query(
        `SELECT * FROM AUTOEVALUACION_DOCENTE WHERE DOCUMENTO_DOCENTE = ? AND PERIODO = ?`,
        [documentoDocente, periodo]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      const autoevaluacion = rows[0];
      
      // Obtener las respuestas
      const [respuestas] = await pool.query(
        `SELECT ad.ASPECTO_ID as aspectoId, ad.VALORACION as valoracion, ad.PUNTAJE as puntaje
         FROM AUTOEVALUACION_DOCENTE_DETALLE ad
         WHERE ad.AUTOEVALUACION_ID = ?`,
        [autoevaluacion.ID]
      );
      
      return {
        id: autoevaluacion.ID,
        fecha: autoevaluacion.FECHA_CREACION,
        completada: autoevaluacion.COMPLETADA === 1,
        respuestas
      };
    } catch (error) {
      throw error;
    }
  },

  /**
   * Crea o actualiza la autoevaluación de un docente
   */
  createAutoevaluacionDocente: async (documentoDocente, periodo, respuestas) => {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si ya existe una autoevaluación para este docente y periodo
      const [existente] = await connection.query(
        `SELECT ID FROM AUTOEVALUACION_DOCENTE WHERE DOCUMENTO_DOCENTE = ? AND PERIODO = ?`,
        [documentoDocente, periodo]
      );
      
      let autoevaluacionId;
      
      if (existente.length > 0) {
        // Actualizar existente
        autoevaluacionId = existente[0].ID;
        await connection.query(
          `UPDATE AUTOEVALUACION_DOCENTE SET COMPLETADA = 1, FECHA_ACTUALIZACION = NOW() WHERE ID = ?`,
          [autoevaluacionId]
        );
        
        // Eliminar respuestas anteriores
        await connection.query(
          `DELETE FROM AUTOEVALUACION_DOCENTE_DETALLE WHERE AUTOEVALUACION_ID = ?`,
          [autoevaluacionId]
        );
      } else {
        // Crear nueva autoevaluación
        const [result] = await connection.query(
          `INSERT INTO AUTOEVALUACION_DOCENTE (DOCUMENTO_DOCENTE, PERIODO, COMPLETADA, FECHA_CREACION) VALUES (?, ?, 1, NOW())`,
          [documentoDocente, periodo]
        );
        autoevaluacionId = result.insertId;
      }
      
      // Insertar respuestas
      for (const respuesta of respuestas) {
        await connection.query(
          `INSERT INTO AUTOEVALUACION_DOCENTE_DETALLE (AUTOEVALUACION_ID, ASPECTO_ID, VALORACION, PUNTAJE) VALUES (?, ?, ?, ?)`,
          [autoevaluacionId, respuesta.aspectoId, respuesta.valoracion, respuesta.puntaje]
        );
      }
      
      // Calcular promedio
      const promedioAutoevaluacion = respuestas.reduce((acc, r) => acc + r.puntaje, 0) / respuestas.length;
      
      // Actualizar promedio en la tabla principal
      await connection.query(
        `UPDATE AUTOEVALUACION_DOCENTE SET PROMEDIO_AUTOEVALUACION = ? WHERE ID = ?`,
        [promedioAutoevaluacion, autoevaluacionId]
      );

      await connection.commit();
      
      return {
        id: autoevaluacionId,
        completada: true
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
};

module.exports = Evaluaciones;
