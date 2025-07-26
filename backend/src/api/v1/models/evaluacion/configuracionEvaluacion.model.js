// src/api/v1/models/configuracionEvaluacion.model.js
const { getPool } = require('../../../../db');

const ConfiguracionEvaluacion = {
  getAllConfiguraciones: async (roles, pagination) => { 
    try {
      const pool = getPool();

      let query = `
        SELECT 
          CE.ID, 
          CE.TIPO_EVALUACION_ID, 
          TE.NOMBRE AS TIPO_EVALUACION_NOMBRE,
          TE.DESCRIPCION AS TIPO_EVALUACION_DESCRIPCION,
          DATE_FORMAT(CE.FECHA_INICIO, '%Y-%m-%d') AS FECHA_INICIO,
          DATE_FORMAT(CE.FECHA_FIN,   '%Y-%m-%d') AS FECHA_FIN, 
          CE.ACTIVO 
        FROM CONFIGURACION_EVALUACION CE
        JOIN TIPOS_EVALUACIONES TE ON CE.TIPO_EVALUACION_ID = TE.ID
      `;

      let params = []; // Para almacenar los parámetros de paginación

      // Si el usuario tiene el rol 'Admin', mostramos todas las configuraciones
      if (roles.includes('Admin')) {
        // No modificamos la consulta, ya que un Admin puede ver todo
      } 
      // Si el usuario tiene el rol 'Estudiante' (y no es Admin), solo mostramos configuraciones activas
      else if (roles.includes('Estudiante')) {
        query += " WHERE CE.ACTIVO = TRUE";
      }

      // Si hay parámetros de paginación
      if (pagination) {
        const limit = parseInt(pagination.limit);
        const offset = parseInt(pagination.offset);

        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
          throw new Error('Parámetros de paginación inválidos');
        }

        query += ' ORDER BY CE.ID LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        query += ' ORDER BY CE.ID'; // Si no hay paginación, ordenamos por ID
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

  getCount: async (roles) => {
    try {
      const pool = getPool();

      // La consulta de conteo debe respetar los roles: si el usuario es Admin, no filtrar, si es Estudiante, solo contar las activas
      let query = 'SELECT COUNT(*) as total FROM CONFIGURACION_EVALUACION CE';

      // Si el usuario tiene el rol 'Estudiante', solo contar configuraciones activas
      if (roles.includes('Estudiante') && !roles.includes('Admin')) {
        query += ' WHERE CE.ACTIVO = TRUE';
      }

      const [rows] = await pool.query(query);
      return rows[0].total;
    } catch (error) {
      console.error('Error en getCount:', error);
      throw error;
    }
  },

  getConfiguracionById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query(`SELECT 
        CE.ID, 
        CE.TIPO_EVALUACION_ID, 
        TE.NOMBRE as TIPO_EVALUACION_NOMBRE,
        TE.DESCRIPCION as TIPO_EVALUACION_DESCRIPCION,
        DATE_FORMAT(CE.FECHA_INICIO, '%Y-%m-%d') AS FECHA_INICIO,
        DATE_FORMAT(CE.FECHA_FIN,   '%Y-%m-%d') AS FECHA_FIN,  
        CE.ACTIVO 
      FROM CONFIGURACION_EVALUACION CE
      JOIN TIPOS_EVALUACIONES TE ON CE.TIPO_EVALUACION_ID = TE.ID
      WHERE CE.ID = ?`, [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  createConfiguracion: async (configuracionData) => {
    try {
      const pool = getPool();
      const { TIPO_EVALUACION_ID, FECHA_INICIO, FECHA_FIN, ACTIVO } = configuracionData;
      const [result] = await pool.query(
        'INSERT INTO CONFIGURACION_EVALUACION (TIPO_EVALUACION_ID, FECHA_INICIO, FECHA_FIN, ACTIVO) VALUES (?, ?, ?, ?)',
        [TIPO_EVALUACION_ID, FECHA_INICIO, FECHA_FIN, ACTIVO]
      );
      return { id: result.insertId, ...configuracionData };
    } catch (error) {
      throw error;
    }
  },

  updateConfiguracion: async (id, configuracionData) => {
    try {
      const pool = getPool();
      const { TIPO_EVALUACION_ID, FECHA_INICIO, FECHA_FIN, ACTIVO } = configuracionData;
      await pool.query(
        'UPDATE CONFIGURACION_EVALUACION SET TIPO_EVALUACION_ID = ?, FECHA_INICIO = ?, FECHA_FIN = ?, ACTIVO = ? WHERE ID = ?',
        [TIPO_EVALUACION_ID, FECHA_INICIO, FECHA_FIN, ACTIVO, id]
      );
      return { id, ...configuracionData };
    } catch (error) {
      throw error;
    }
  },

  deleteConfiguracion: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM CONFIGURACION_EVALUACION WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  },

  updateEstado: async (id, activo) => {
    try {
      const pool = getPool();
      await pool.query(
        'UPDATE CONFIGURACION_EVALUACION SET ACTIVO = ? WHERE ID = ?',
        [activo, id]
      );
      return { id, activo };
    } catch (error) {
      throw error;
    }
  },
};

module.exports = ConfiguracionEvaluacion;