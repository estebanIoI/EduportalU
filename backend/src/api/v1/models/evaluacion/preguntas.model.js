// src/api/v1/models/evaluacion/preguntas.model.js
const { getPool } = require('../../../../db');

const Preguntas = {
  getAllPreguntas: async (pagination) => {
    try {
      const pool = getPool();
      let query = 'SELECT ID, TEXTO, TIPO_PREGUNTA, ORDEN, ACTIVO, OPCIONES FROM PREGUNTAS';
      let params = [];
      
      // Agregar paginación si se proporciona
      if (pagination) {
        const limit = parseInt(pagination.limit);
        const offset = parseInt(pagination.offset);
        
        if (isNaN(limit) || isNaN(offset) || limit < 1 || offset < 0) {
          throw new Error('Parámetros de paginación inválidos');
        }
        
        query += ' ORDER BY ORDEN, ID';
        query += ' LIMIT ? OFFSET ?';
        params = [limit, offset];
      } else {
        query += ' ORDER BY ORDEN, ID';
      }
      
      console.log('Query ejecutada:', query);
      console.log('Parámetros:', params);
      
      const [rows] = await pool.query(query, params);
      return rows;
    } catch (error) {
      console.error('Error en getAllPreguntas:', error);
      throw error;
    }
  },

  getCount: async () => {
    try {
      const pool = getPool();
      const [rows] = await pool.query('SELECT COUNT(*) as total FROM PREGUNTAS');
      return rows[0].total;
    } catch (error) {
      console.error('Error en getPreguntasCount:', error);
      throw error;
    }
  },

  getPreguntaById: async (id) => {
    try {
      const pool = getPool();
      const [rows] = await pool.query(
        'SELECT ID, TEXTO, TIPO_PREGUNTA, ORDEN, ACTIVO, OPCIONES FROM PREGUNTAS WHERE ID = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      throw error;
    }
  },

  createPregunta: async (preguntaData) => {
    try {
      const pool = getPool();
      const { TEXTO, TIPO_PREGUNTA, ORDEN, ACTIVO, OPCIONES } = preguntaData;
      const [result] = await pool.query(
        'INSERT INTO PREGUNTAS (TEXTO, TIPO_PREGUNTA, ORDEN, ACTIVO, OPCIONES) VALUES (?, ?, ?, ?, ?)',
        [TEXTO, TIPO_PREGUNTA, ORDEN || 1, ACTIVO !== undefined ? ACTIVO : true, OPCIONES || null]
      );
      return { ID: result.insertId, ...preguntaData };
    } catch (error) {
      throw error;
    }
  },

  updatePregunta: async (id, preguntaData) => {
    try {
      const pool = getPool();
      const fields = [];
      const values = [];
      
      if (preguntaData.TEXTO !== undefined) {
        fields.push('TEXTO = ?');
        values.push(preguntaData.TEXTO);
      }
      if (preguntaData.TIPO_PREGUNTA !== undefined) {
        fields.push('TIPO_PREGUNTA = ?');
        values.push(preguntaData.TIPO_PREGUNTA);
      }
      if (preguntaData.ORDEN !== undefined) {
        fields.push('ORDEN = ?');
        values.push(preguntaData.ORDEN);
      }
      if (preguntaData.ACTIVO !== undefined) {
        fields.push('ACTIVO = ?');
        values.push(preguntaData.ACTIVO);
      }
      if (preguntaData.OPCIONES !== undefined) {
        fields.push('OPCIONES = ?');
        values.push(preguntaData.OPCIONES);
      }
      
      if (fields.length === 0) {
        throw new Error('No hay campos para actualizar');
      }
      
      values.push(id);
      const query = `UPDATE PREGUNTAS SET ${fields.join(', ')} WHERE ID = ?`;
      
      await pool.query(query, values);
      return { ID: id, ...preguntaData };
    } catch (error) {
      throw error;
    }
  },

  deletePregunta: async (id) => {
    try {
      const pool = getPool();
      await pool.query('DELETE FROM PREGUNTAS WHERE ID = ?', [id]);
      return true;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = Preguntas;
