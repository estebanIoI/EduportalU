// src/api/v1/models/evaluacion/aspectosEvaluacion.model.js
const { getPool } = require('../../../../db');

const AspectosEvaluacion = {
  getAllAspectos: async (pagination) => {
    try {
      const pool = getPool();
      let query = 'SELECT ID, ETIQUETA, DESCRIPCION FROM ASPECTOS_EVALUACION';
      let params = [];
      
      // Agregar paginación si se proporciona
      if (pagination) {
        // Asegurar que los valores sean enteros
        const limit = parseInt(pagination.limit);
        const offset = parseInt(pagination.offset);
        
        // Validar que los valores sean válidos
        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
          throw new Error('Parámetros de paginación inválidos');
        }
        
        // Agregar ORDER BY para resultados consistentes
        query += ' ORDER BY ID';
        
        // Usar sintaxis compatible con MySQL/MariaDB
        query += ' LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        // Si no hay paginación, agregar ORDER BY de todas formas
        query += ' ORDER BY ID';
      }
      
      console.log('Query ejecutada:', query);
      console.log('Parámetros:', params);
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error en getAllAspectos:', error);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM ASPECTOS_EVALUACION');
      return rows[0].total;
    } catch (error) {
      console.error('Error en getAspectosCount:', error);
      throw error;
    }
  },

  getAspectoById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT ID, ETIQUETA, DESCRIPCION FROM ASPECTOS_EVALUACION WHERE ID = ?', [id]);
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  createAspecto: async (aspectoData) => {
    try {
      const pool = getPool();
      const { ETIQUETA, DESCRIPCION } = aspectoData;
      const [result] = await pool.query(
        'INSERT INTO ASPECTOS_EVALUACION (ETIQUETA, DESCRIPCION) VALUES (?, ?)',
        [ETIQUETA, DESCRIPCION]
      );
      return { id: result.insertId, ...aspectoData };
    } catch (error) {
      throw error;
    }
  },

  updateAspecto: async (id, aspectoData) => {
    try {
      const pool = getPool();
      const { ETIQUETA, DESCRIPCION } = aspectoData;
      await pool.query(
        'UPDATE ASPECTOS_EVALUACION SET ETIQUETA = ?, DESCRIPCION = ? WHERE ID = ?',
        [ETIQUETA, DESCRIPCION, id]
      );
      return { id, ...aspectoData };
    } catch (error) {
      throw error;
    }
  },

  deleteAspecto: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM ASPECTOS_EVALUACION WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  }
};

module.exports = AspectosEvaluacion;