// src/api/v1/models/evaluacion/configuracionValoracion.model.js
const { getPool } = require('../../../../db');

const ConfiguracionValoracion = {
  getAllConfiguraciones: async (pagination) => {
    try {
      const pool = getPool();
      let query = `
        SELECT * 
        FROM CONFIGURACION_VALORACION 
        WHERE ACTIVO = TRUE
      `;
      let params = [];
      
      if (pagination) {
        const limit = parseInt(pagination.limit);
        const offset = parseInt(pagination.offset);
        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
          throw new Error('Parámetros de paginación inválidos');
        }
        query += ' ORDER BY ORDEN LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        query += ' ORDER BY ORDEN';
      }
      
      console.log('Query ejecutada:', query);
      console.log('Parámetros:', params);
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error en getAllConfiguraciones:', error);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM CONFIGURACION_VALORACION WHERE ACTIVO = TRUE');
      return rows[0].total;
    } catch (error) {
      console.error('Error en getConfiguracionesCount:', error);
      throw error;
    }
  },

  getConfiguracionById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT * FROM CONFIGURACION_VALORACION WHERE ID = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  createConfiguracion: async (configuracionData) => {
    try {
      const pool = getPool();
      const { CONFIGURACION_EVALUACION_ID, VALORACION_ID, PUNTAJE, ORDEN, ACTIVO } = configuracionData;
      const [result] = await pool.query(
        'INSERT INTO CONFIGURACION_VALORACION (CONFIGURACION_EVALUACION_ID, VALORACION_ID, PUNTAJE, ORDEN, ACTIVO) VALUES (?, ?, ?, ?, ?)',
        [CONFIGURACION_EVALUACION_ID, VALORACION_ID, PUNTAJE, ORDEN, ACTIVO ?? true]
      );
      return { id: result.insertId, ...configuracionData };
    } catch (error) {
      throw error;
    }
  },

  updateConfiguracion: async (id, configuracionData) => {
    try {
      const pool = getPool();
      const { CONFIGURACION_EVALUACION_ID, VALORACION_ID, PUNTAJE, ORDEN, ACTIVO } = configuracionData;
      await pool.query(
        'UPDATE CONFIGURACION_VALORACION SET CONFIGURACION_EVALUACION_ID = ?, VALORACION_ID = ?, PUNTAJE = ?, ORDEN = ?, ACTIVO = ? WHERE ID = ?',
        [CONFIGURACION_EVALUACION_ID, VALORACION_ID, PUNTAJE, ORDEN, ACTIVO, id]
      );
      return { id, ...configuracionData };
    } catch (error) {
      throw error;
    }
  },

  deleteConfiguracion: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM CONFIGURACION_VALORACION WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  },

  updateEstado: async (id, activo) => {
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE CONFIGURACION_VALORACION SET ACTIVO = ? WHERE ID = ?',
        [activo, id]
      );
      return { id, activo };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ConfiguracionValoracion;
