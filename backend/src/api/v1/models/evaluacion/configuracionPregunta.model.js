// src/api/v1/models/evaluacion/configuracionPregunta.model.js
const { getPool } = require('../../../../db');

const ConfiguracionPregunta = {
  getAllConfiguracionPreguntas: async (pagination) => {
    try {
      const pool = getPool();
      let query = `
        SELECT 
          CP.ID, 
          CP.CONFIGURACION_EVALUACION_ID, 
          CP.PREGUNTA_ID, 
          CP.ORDEN, 
          CP.ACTIVO,
          P.TEXTO,
          P.TIPO_PREGUNTA,
          P.OPCIONES
        FROM CONFIGURACION_PREGUNTAS CP
        LEFT JOIN PREGUNTAS P ON CP.PREGUNTA_ID = P.ID
      `;
      let params = [];
      
      if (pagination) {
        const limit = parseInt(pagination.limit);
        const offset = parseInt(pagination.offset);
        
        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
          throw new Error('Parámetros de paginación inválidos');
        }
        
        query += ' ORDER BY CP.ORDEN, CP.ID';
        query += ' LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        query += ' ORDER BY CP.ORDEN, CP.ID';
      }
      
      console.log('Query ejecutada:', query);
      console.log('Parámetros:', params);
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error en getAllConfiguracionPreguntas:', error);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM CONFIGURACION_PREGUNTAS');
      return rows[0].total;
    } catch (error) {
      console.error('Error en getConfiguracionPreguntasCount:', error);
      throw error;
    }
  },

  getConfiguracionPreguntaById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        `SELECT 
          CP.ID, 
          CP.CONFIGURACION_EVALUACION_ID, 
          CP.PREGUNTA_ID, 
          CP.ORDEN, 
          CP.ACTIVO,
          P.TEXTO,
          P.TIPO_PREGUNTA,
          P.OPCIONES
        FROM CONFIGURACION_PREGUNTAS CP
        LEFT JOIN PREGUNTAS P ON CP.PREGUNTA_ID = P.ID
        WHERE CP.ID = ?`,
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  getPreguntasByConfiguracionId: async (configuracionId) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        `SELECT 
          CP.ID, 
          CP.CONFIGURACION_EVALUACION_ID, 
          CP.PREGUNTA_ID, 
          CP.ORDEN, 
          CP.ACTIVO,
          P.TEXTO,
          P.TIPO_PREGUNTA,
          P.OPCIONES
        FROM CONFIGURACION_PREGUNTAS CP
        LEFT JOIN PREGUNTAS P ON CP.PREGUNTA_ID = P.ID
        WHERE CP.CONFIGURACION_EVALUACION_ID = ?
        ORDER BY CP.ORDEN, CP.ID`,
        [configuracionId]
      );
      return rows;
    } catch (error) {
      throw error;
    }
  },

  createConfiguracionPregunta: async (configuracionData) => {
    try {
      const pool = getPool();
      const { CONFIGURACION_EVALUACION_ID, PREGUNTA_ID, ORDEN, ACTIVO } = configuracionData;
      const [result] = await pool.query(
        'INSERT INTO CONFIGURACION_PREGUNTAS (CONFIGURACION_EVALUACION_ID, PREGUNTA_ID, ORDEN, ACTIVO) VALUES (?, ?, ?, ?)',
        [CONFIGURACION_EVALUACION_ID, PREGUNTA_ID, ORDEN || 1, ACTIVO !== undefined ? ACTIVO : true]
      );
      return { ID: result.insertId, ...configuracionData };
    } catch (error) {
      throw error;
    }
  },

  updateConfiguracionPregunta: async (id, configuracionData) => {
    try {
      const pool = getPool();
      const fields = [];
      const values = [];
      
      if (configuracionData.CONFIGURACION_EVALUACION_ID !== undefined) {
        fields.push('CONFIGURACION_EVALUACION_ID = ?');
        values.push(configuracionData.CONFIGURACION_EVALUACION_ID);
      }
      if (configuracionData.PREGUNTA_ID !== undefined) {
        fields.push('PREGUNTA_ID = ?');
        values.push(configuracionData.PREGUNTA_ID);
      }
      if (configuracionData.ORDEN !== undefined) {
        fields.push('ORDEN = ?');
        values.push(configuracionData.ORDEN);
      }
      if (configuracionData.ACTIVO !== undefined) {
        fields.push('ACTIVO = ?');
        values.push(configuracionData.ACTIVO);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      const query = `UPDATE CONFIGURACION_PREGUNTAS SET ${fields.join(', ')} WHERE ID = ?`;
      
      await pool.query(query, values);
      return { ID: id, ...configuracionData };
    } catch (error) {
      throw error;
    }
  },

  updateEstado: async (id, activo) => {
    try {
      const pool = getPool();
      await pool.query('UPDATE CONFIGURACION_PREGUNTAS SET ACTIVO = ? WHERE ID = ?', [activo, id]);
      return { ID: id, ACTIVO: activo };
    } catch (error) {
      throw error;
    }
  },

  deleteConfiguracionPregunta: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM CONFIGURACION_PREGUNTAS WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ConfiguracionPregunta;
