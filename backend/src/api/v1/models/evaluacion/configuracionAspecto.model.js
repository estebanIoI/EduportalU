// src/models/evaluacion/configuracionAspecto.model.js
const { getPool } = require('../../../../db');

const ConfiguracionAspecto = {
  getAllConfiguracionesAspecto: async (pagination) => {
    try {
      const pool = getPool();
      let query = `
        SELECT 
          ca.ID, 
          ca.CONFIGURACION_EVALUACION_ID, 
          ca.ASPECTO_ID,
          ae.ETIQUETA, 
          ae.DESCRIPCION, 
          ca.ORDEN, 
          ca.ACTIVO 
        FROM CONFIGURACION_ASPECTO ca 
        INNER JOIN ASPECTOS_EVALUACION ae 
          ON ca.ASPECTO_ID = ae.ID
      `;
      let params = [];

      if (pagination) {
        const limit = parseInt(pagination.limit);
        const offset = parseInt(pagination.offset);

        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
          throw new Error('Parámetros de paginación inválidos');
        }

        query += ' ORDER BY ca.ID LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        query += ' ORDER BY ca.ID';
      }

      console.log('Query ejecutada:', query);
      console.log('Parámetros:', params);

      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error en getAllConfiguracionesAspecto:', error);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM CONFIGURACION_ASPECTO');
      return rows[0].total;
    } catch (error) {
      console.error('Error en getAspectosCount:', error);
      throw error;
    }
  },

  getConfiguracionAspectoById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        `SELECT 
          ca.ID, 
          ca.CONFIGURACION_EVALUACION_ID, 
          ca.ASPECTO_ID,
          ae.ETIQUETA, 
          ae.DESCRIPCION, 
          ca.ORDEN, 
          ca.ACTIVO 
        FROM CONFIGURACION_ASPECTO ca 
        INNER JOIN ASPECTOS_EVALUACION ae 
          ON ca.ASPECTO_ID = ae.ID 
        WHERE ca.ID = ?`,
        [id]
      );
      return rows[0]; // Si no se encuentra, devuelve null explícitamente
    } catch (error) {
      console.error('Error en getConfiguracionAspectoById:', error);
      throw error;
    }
  },

  createConfiguracionAspecto: async (configuracionAspectoData) => {
    try {
      const pool = getPool();
      const { CONFIGURACION_EVALUACION_ID, ASPECTO_ID, ORDEN, ACTIVO } = configuracionAspectoData;
      const [result] = await pool.query(
        'INSERT INTO CONFIGURACION_ASPECTO (CONFIGURACION_EVALUACION_ID, ASPECTO_ID, ORDEN, ACTIVO) VALUES (?, ?, ?, ?)',
        [CONFIGURACION_EVALUACION_ID, ASPECTO_ID, ORDEN, ACTIVO ?? true]
      );
      return { id: result.insertId, ...configuracionAspectoData };
    } catch (error) {
      throw error;
    }
  },

  updateConfiguracionAspecto: async (id, configuracionAspectoData) => {
    try {
      const pool = getPool();
      const { CONFIGURACION_EVALUACION_ID, ASPECTO_ID, ORDEN, ACTIVO } = configuracionAspectoData;
      await pool.query(
        'UPDATE CONFIGURACION_ASPECTO SET CONFIGURACION_EVALUACION_ID = ?, ASPECTO_ID = ?, ORDEN = ?, ACTIVO = ? WHERE ID = ?',
        [CONFIGURACION_EVALUACION_ID, ASPECTO_ID, ORDEN, ACTIVO, id]
      );
      return { id, ...configuracionAspectoData };
    } catch (error) {
      throw error;
    }
  },

  deleteConfiguracionAspecto: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM CONFIGURACION_ASPECTO WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  },

  updateEstado: async (id, activo) => {
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE CONFIGURACION_ASPECTO SET ACTIVO = ? WHERE ID = ?',
        [activo, id]
      );
      return { id, activo };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ConfiguracionAspecto;
