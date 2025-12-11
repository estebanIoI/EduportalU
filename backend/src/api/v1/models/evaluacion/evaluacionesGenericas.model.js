// src/api/v1/models/evaluacion/evaluacionesGenericas.model.js
const { getPool } = require('../../../../db');

const EvaluacionesGenericas = {
  // Crear una evaluación genérica con sus detalles y respuestas
  createBulk: async (data) => {
    const pool = getPool();
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      const { configuracionId, documentoEstudiante, comentarioGeneral, aspectos, respuestas } = data;
      
      console.log('📋 Datos recibidos en createBulk:', {
        configuracionId,
        documentoEstudiante,
        comentarioGeneral: comentarioGeneral ? 'Sí' : 'No',
        cantidadAspectos: aspectos?.length || 0,
        cantidadRespuestas: respuestas?.length || 0,
        respuestas: respuestas
      });
      
      // 1. Verificar si ya existe una evaluación completada
      const [existente] = await connection.query(`
        SELECT ID, ESTADO FROM EVALUACIONES_GENERICAS
        WHERE CONFIGURACION_ID = ? AND DOCUMENTO_ESTUDIANTE = ?
      `, [configuracionId, documentoEstudiante]);
      
      if (existente.length > 0 && existente[0].ESTADO === 'completada') {
        throw new Error('Ya has completado esta evaluación previamente');
      }
      
      // 1. Crear la evaluación genérica principal
      const [result] = await connection.query(`
        INSERT INTO EVALUACIONES_GENERICAS 
        (CONFIGURACION_ID, DOCUMENTO_ESTUDIANTE, COMENTARIO_GENERAL, ESTADO)
        VALUES (?, ?, ?, 'completada')
      `, [configuracionId, documentoEstudiante, comentarioGeneral || null]);
      
      const evaluacionGenericaId = result.insertId;
      console.log('✅ Evaluación genérica creada con ID:', evaluacionGenericaId);
      
      // 2. Guardar los detalles de aspectos (si existen)
      if (aspectos && aspectos.length > 0) {
        console.log(`💾 Guardando ${aspectos.length} aspectos...`);
        for (const aspecto of aspectos) {
          await connection.query(`
            INSERT INTO EVALUACIONES_GENERICAS_DETALLE
            (EVALUACION_GENERICA_ID, ASPECTO_ID, VALORACION_ID, COMENTARIO)
            VALUES (?, ?, ?, ?)
          `, [evaluacionGenericaId, aspecto.aspectoId, aspecto.valoracionId, aspecto.comentario || null]);
        }
        console.log('✅ Aspectos guardados correctamente');
      }
      
      // 3. Guardar las respuestas a preguntas (si existen)
      if (respuestas && respuestas.length > 0) {
        console.log(`💾 Guardando ${respuestas.length} respuestas...`);
        for (const respuesta of respuestas) {
          console.log('   - Guardando respuesta:', {
            evaluacionGenericaId,
            preguntaId: respuesta.preguntaId,
            respuesta: respuesta.respuesta
          });
          await connection.query(`
            INSERT INTO RESPUESTAS_PREGUNTAS
            (EVALUACION_ID, PREGUNTA_ID, RESPUESTA)
            VALUES (?, ?, ?)
          `, [evaluacionGenericaId, respuesta.preguntaId, respuesta.respuesta]);
        }
        console.log('✅ Respuestas guardadas correctamente');
      } else {
        console.log('⚠️ No hay respuestas para guardar');
      }
      
      await connection.commit();
      
      return {
        id: evaluacionGenericaId,
        configuracionId,
        documentoEstudiante,
        mensaje: 'Evaluación genérica creada exitosamente'
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
  
  // Obtener evaluaciones genéricas por estudiante y configuración
  getByEstudianteAndConfiguracion: async (documentoEstudiante, configuracionId) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query(`
        SELECT 
          eg.*,
          ce.TITULO,
          te.NOMBRE as TIPO_EVALUACION
        FROM EVALUACIONES_GENERICAS eg
        JOIN CONFIGURACION_EVALUACION ce ON eg.CONFIGURACION_ID = ce.ID
        JOIN TIPOS_EVALUACIONES te ON ce.TIPO_EVALUACION_ID = te.ID
        WHERE eg.DOCUMENTO_ESTUDIANTE = ? AND eg.CONFIGURACION_ID = ?
      `, [documentoEstudiante, configuracionId]);
      
      return rows;
    } catch (error) {
      throw error;
    }
  },
  
  // Obtener detalle completo de una evaluación genérica
  getDetalleById: async (evaluacionGenericaId) => {
    try {
      const pool = getPool();
      
      // Obtener la evaluación principal
      const [evaluacion] = await pool.query(`
        SELECT * FROM EVALUACIONES_GENERICAS WHERE ID = ?
      `, [evaluacionGenericaId]);
      
      if (evaluacion.length === 0) {
        return null;
      }
      
      // Obtener los detalles de aspectos
      const [aspectos] = await pool.query(`
        SELECT 
          egd.*,
          ae.ETIQUETA as ASPECTO,
          ev.ETIQUETA as VALORACION
        FROM EVALUACIONES_GENERICAS_DETALLE egd
        LEFT JOIN ASPECTOS_EVALUACION ae ON egd.ASPECTO_ID = ae.ID
        LEFT JOIN ESCALA_VALORACION ev ON egd.VALORACION_ID = ev.ID
        WHERE egd.EVALUACION_GENERICA_ID = ?
      `, [evaluacionGenericaId]);
      
      // Obtener las respuestas a preguntas
      const [respuestas] = await pool.query(`
        SELECT 
          rp.*,
          p.TEXTO as PREGUNTA,
          p.TIPO_PREGUNTA
        FROM RESPUESTAS_PREGUNTAS rp
        JOIN PREGUNTAS p ON rp.PREGUNTA_ID = p.ID
        WHERE rp.EVALUACION_ID = ?
      `, [evaluacionGenericaId]);
      
      return {
        evaluacion: evaluacion[0],
        aspectos,
        respuestas
      };
    } catch (error) {
      throw error;
    }
  },
  
  // Obtener todas las evaluaciones genéricas (para administradores)
  getAllEvaluaciones: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query(`
        SELECT 
          eg.*,
          ce.TITULO as NOMBRE_CONFIGURACION,
          eg.DOCUMENTO_ESTUDIANTE
        FROM EVALUACIONES_GENERICAS eg
        JOIN CONFIGURACION_EVALUACION ce ON eg.CONFIGURACION_ID = ce.ID
        ORDER BY eg.FECHA_EVALUACION DESC
      `);
      
      return rows;
    } catch (error) {
      console.error('Error en getAllEvaluaciones model:', error);
      throw error;
    }
  },
  
  // Obtener todas las evaluaciones con detalle completo (para informes)
  getAllEvaluacionesConDetalle: async () => {
    try {
      const pool = getPool();
      const [evaluaciones] = await pool.query(`
        SELECT 
          eg.*,
          ce.TITULO as NOMBRE_CONFIGURACION,
          eg.DOCUMENTO_ESTUDIANTE
        FROM EVALUACIONES_GENERICAS eg
        JOIN CONFIGURACION_EVALUACION ce ON eg.CONFIGURACION_ID = ce.ID
        ORDER BY eg.FECHA_EVALUACION DESC
      `);
      
      // Para cada evaluación, obtener sus aspectos y respuestas
      for (let i = 0; i < evaluaciones.length; i++) {
        const [aspectos] = await pool.query(`
          SELECT 
            egd.*,
            ae.ETIQUETA as ASPECTO,
            ev.ETIQUETA as VALORACION
          FROM EVALUACIONES_GENERICAS_DETALLE egd
          LEFT JOIN ASPECTOS_EVALUACION ae ON egd.ASPECTO_ID = ae.ID
          LEFT JOIN ESCALA_VALORACION ev ON egd.VALORACION_ID = ev.ID
          WHERE egd.EVALUACION_GENERICA_ID = ?
        `, [evaluaciones[i].ID]);
        
        const [respuestas] = await pool.query(`
          SELECT 
            rp.*,
            p.TEXTO as PREGUNTA,
            p.TIPO_PREGUNTA
          FROM RESPUESTAS_PREGUNTAS rp
          JOIN PREGUNTAS p ON rp.PREGUNTA_ID = p.ID
          WHERE rp.EVALUACION_ID = ?
        `, [evaluaciones[i].ID]);
        
        evaluaciones[i].aspectos = aspectos;
        evaluaciones[i].respuestas = respuestas;
      }
      
      return evaluaciones;
    } catch (error) {
      throw error;
    }
  },

  // Obtener evaluaciones completadas por una lista de estudiantes para una configuración
  getCompletadasByEstudiantes: async (configuracionId, documentosEstudiantes) => {
    try {
      if (!documentosEstudiantes || documentosEstudiantes.length === 0) {
        return [];
      }
      
      const pool = getPool();
      const placeholders = documentosEstudiantes.map(() => '?').join(', ');
      
      const [rows] = await pool.query(`
        SELECT 
          DOCUMENTO_ESTUDIANTE,
          ESTADO,
          FECHA_EVALUACION
        FROM EVALUACIONES_GENERICAS
        WHERE CONFIGURACION_ID = ? 
          AND DOCUMENTO_ESTUDIANTE IN (${placeholders})
          AND ESTADO = 'completada'
      `, [configuracionId, ...documentosEstudiantes]);
      
      return rows;
    } catch (error) {
      console.error('Error en getCompletadasByEstudiantes:', error);
      throw error;
    }
  }
};

module.exports = EvaluacionesGenericas;
