const { getPool } = require('../../../../db');

const TiposEvaluacion = {

  getConfiguracionDetalles: async (configuracionId, roles) => {
    try {
      const pool = getPool();
      let query = `
        SELECT 
          ce.ID, 
          te.NOMBRE AS NOMBRE, 
          ce.FECHA_INICIO, 
          ce.FECHA_FIN, 
          ce.ACTIVO,
          ce.ES_EVALUACION_DOCENTE,
          ce.TITULO,
          ce.INSTRUCCIONES,
          ce.URL_FORMULARIO
        FROM CONFIGURACION_EVALUACION ce 
        JOIN TIPOS_EVALUACIONES te ON ce.TIPO_EVALUACION_ID = te.ID 
        WHERE ce.ID = ?`;
      const params = [configuracionId];
      
      // Si el rol incluye 'Estudiante', solo traer configuraciones activas
      if (roles.includes('Estudiante')) {
        query += " AND ce.ACTIVO = TRUE";
      }
      
      const [configuracion] = await pool.query(query, params);
      if (configuracion.length === 0) {
        throw new Error('Configuración no encontrada');
      }
      
      // Obtener los aspectos relacionados con la configuración a través de configuracion_aspecto
      query = `
        SELECT ca.ID, ca.ASPECTO_ID, ae.ETIQUETA, ae.DESCRIPCION, ca.ORDEN, ca.ACTIVO 
        FROM CONFIGURACION_ASPECTO ca 
        JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID 
        WHERE ca.CONFIGURACION_EVALUACION_ID = ?`;
      
      // Filtrar los aspectos solo si el rol incluye 'Estudiante'
      if (roles.includes('Estudiante')) {
        query += " AND ca.ACTIVO = TRUE";
      }
      query += " ORDER BY ca.ORDEN";
      
      const [aspectos] = await pool.query(query, [configuracionId]);
      
      // Obtener las valoraciones relacionadas con la configuración a través de configuracion_valoracion
      query = `
        SELECT cv.ID, cv.VALORACION_ID, ev.ETIQUETA, ev.VALOR, cv.PUNTAJE, cv.ORDEN, cv.ACTIVO 
        FROM CONFIGURACION_VALORACION cv 
        JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID 
        WHERE cv.CONFIGURACION_EVALUACION_ID = ?`;
      
      // Filtrar las valoraciones solo si el rol incluye 'Estudiante'
      if (roles.includes('Estudiante')) {
        query += " AND cv.ACTIVO = TRUE";
      }
      query += " ORDER BY cv.ORDEN";
      
      const [valoraciones] = await pool.query(query, [configuracionId]);
      
      // Obtener las preguntas relacionadas con la configuración a través de configuracion_pregunta
      let preguntas = [];
      try {
        query = `
          SELECT cp.ID, cp.PREGUNTA_ID, p.TEXTO, p.TIPO_PREGUNTA, p.OPCIONES, cp.ORDEN, cp.ACTIVO 
          FROM CONFIGURACION_PREGUNTAS cp 
          JOIN PREGUNTAS p ON cp.PREGUNTA_ID = p.ID 
          WHERE cp.CONFIGURACION_EVALUACION_ID = ?`;
        
        // Filtrar las preguntas solo si el rol incluye 'Estudiante'
        if (roles.includes('Estudiante')) {
          query += " AND cp.ACTIVO = TRUE";
        }
        query += " ORDER BY cp.ORDEN";
        
        const [preguntasResult] = await pool.query(query, [configuracionId]);
        preguntas = preguntasResult;
      } catch (error) {
        // Si las tablas de preguntas no existen, continuar sin preguntas
        console.log('Advertencia: No se pudieron cargar las preguntas:', error.message);
        preguntas = [];
      }
      
      return {
        configuracion: configuracion[0],
        aspectos,
        valoraciones,
        preguntas
      };
    } catch (error) {
      throw error;
    }
  },

  updateEstado: async (id, activo) => {
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE TIPOS_EVALUACIONES SET ACTIVO = ? WHERE ID = ?',
        [activo, id]
      );
      return { id, activo };
    } catch (error) {
      throw error;
    }
  },

  // Get all tipos de evaluacion
  getAllTipos: async (pagination) => {
    try {
      const pool = getPool();
      let query = `
        SELECT * 
        FROM TIPOS_EVALUACIONES
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
      console.error('Error en getAllTipos:', error);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM TIPOS_EVALUACIONES');
      return rows[0].total;
    } catch (error) {
      console.error('Error en getTiposCount:', error);
      throw error;
    }
  },

  // Get a tipo de evaluacion by ID
  getTipoById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM TIPOS_EVALUACIONES WHERE ID = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Create a new tipo de evaluacion
  createTipo: async (tipoData) => {
    try {
      const pool = getPool();
      const { NOMBRE, DESCRIPCION, ACTIVO } = tipoData;
      const [result] = await pool.query(
        'INSERT INTO TIPOS_EVALUACIONES (NOMBRE, DESCRIPCION, ACTIVO) VALUES (?, ?, ?)',
        [NOMBRE, DESCRIPCION, ACTIVO ?? true]
      );
      return { id: result.insertId, ...tipoData };
    } catch (error) {
      throw error;
    }
  },

  // Update an existing tipo de evaluacion
  updateTipo: async (id, tipoData) => {
    try {
      const pool = getPool();
      const { NOMBRE, DESCRIPCION, ACTIVO } = tipoData;
      await pool.query(
        'UPDATE TIPOS_EVALUACIONES SET NOMBRE = ?, DESCRIPCION = ?, ACTIVO = ? WHERE ID = ?',
        [NOMBRE, DESCRIPCION, ACTIVO, id]
      );
      return { id, ...tipoData };
    } catch (error) {
      throw error;
    }
  },

  // Delete a tipo de evaluacion
  deleteTipo: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM TIPOS_EVALUACIONES WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = TiposEvaluacion;
