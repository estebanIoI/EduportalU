const { getRemotePool } = require('../../../../db');

const VistaAcademica = {
  getAllVistaAcademica: async () => {
    try {
      const pool = getRemotePool();
      const [rows] = await pool.query('SELECT * FROM vista_academica_insitus');
      return rows;
    } catch (error) {
      console.error(`Error al obtener todos los registros: ${error.message}`);
      throw error;
    }
  },

  // Nuevo método con filtros para obtener estudiantes específicos
  getVistaAcademicaFiltered: async (filters) => {
    try {
      const pool = getRemotePool();
      
      let query = `
        SELECT 
          ID_ESTUDIANTE,
          PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, 
          ASIGNATURA, COD_ASIGNATURA, SEMESTRE, GRUPO, 
          ID_DOCENTE, DOCENTE, NOMBRE_SEDE, PERIODO, NOM_PROGRAMA
        FROM vista_academica_insitus 
        WHERE 1=1
      `;
      const params = [];

      if (filters.ID_DOCENTE) {
        query += ' AND ID_DOCENTE = ?';
        params.push(String(filters.ID_DOCENTE));
      }
      if (filters.COD_ASIGNATURA) {
        // Convertir a número para comparación correcta
        query += ' AND COD_ASIGNATURA = ?';
        params.push(Number(filters.COD_ASIGNATURA));
      }
      if (filters.GRUPO) {
        // Usar LIKE para mayor flexibilidad con espacios/mayúsculas
        query += ' AND UPPER(TRIM(GRUPO)) = UPPER(TRIM(?))';
        params.push(String(filters.GRUPO));
      }
      if (filters.PERIODO) {
        query += ' AND PERIODO = ?';
        params.push(String(filters.PERIODO));
      }

      query += ' ORDER BY PRIMER_APELLIDO, SEGUNDO_APELLIDO, PRIMER_NOMBRE';

      console.log('=== getVistaAcademicaFiltered ===');
      console.log('Filtros recibidos:', JSON.stringify(filters, null, 2));
      console.log('Query:', query);
      console.log('Params:', params);

      const [rows] = await pool.query(query, params);
      console.log(`Registros encontrados: ${rows.length}`);
      
      if (rows.length === 0) {
        // Debug 1: verificar qué grupos hay para este docente + asignatura
        const [debugRows] = await pool.query(
          `SELECT DISTINCT GRUPO, COUNT(*) as total 
           FROM vista_academica_insitus 
           WHERE ID_DOCENTE = ? AND COD_ASIGNATURA = ?
           GROUP BY GRUPO`,
          [String(filters.ID_DOCENTE), Number(filters.COD_ASIGNATURA)]
        );
        console.log('DEBUG 1 - Grupos para docente+asignatura:', debugRows);
        
        // Debug 2: verificar si el docente existe con alguna asignatura
        const [debugDocente] = await pool.query(
          `SELECT DISTINCT ID_DOCENTE, COD_ASIGNATURA, ASIGNATURA, GRUPO 
           FROM vista_academica_insitus 
           WHERE ID_DOCENTE = ? 
           LIMIT 5`,
          [String(filters.ID_DOCENTE)]
        );
        console.log('DEBUG 2 - Asignaturas del docente (string):', debugDocente);
        
        // Debug 3: probar con ID_DOCENTE como número
        const [debugDocenteNum] = await pool.query(
          `SELECT DISTINCT ID_DOCENTE, COD_ASIGNATURA, ASIGNATURA, GRUPO 
           FROM vista_academica_insitus 
           WHERE ID_DOCENTE = ? 
           LIMIT 5`,
          [Number(filters.ID_DOCENTE)]
        );
        console.log('DEBUG 3 - Asignaturas del docente (número):', debugDocenteNum);
        
        // Debug 4: buscar con LIKE para ver si hay espacios o caracteres extra
        const [debugLike] = await pool.query(
          `SELECT DISTINCT ID_DOCENTE, COD_ASIGNATURA 
           FROM vista_academica_insitus 
           WHERE CAST(ID_DOCENTE AS CHAR) LIKE ?
           LIMIT 5`,
          [`%${filters.ID_DOCENTE}%`]
        );
        console.log('DEBUG 4 - Busqueda LIKE ID_DOCENTE:', debugLike);
      }
      
      return rows;
    } catch (error) {
      console.error(`Error al obtener registros filtrados: ${error.message}`);
      throw error;
    }
  },

  getVistaAcademicaById: async (documento) => {
    try {
      const pool = getRemotePool();
      if (!documento) {
        throw new Error('El documento del estudiante o docente es requerido');
      }

      // Intentar buscar en ID_ESTUDIANTE
      let query = `
        SELECT 
          PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, 
          ASIGNATURA, COD_ASIGNATURA, SEMESTRE, GRUPO, 
          DOCENTE, NOMBRE_SEDE, PERIODO, NOTA_FINAL 
        FROM vista_academica_insitus 
        WHERE ID_ESTUDIANTE = ?;
      `;
      let [rows] = await pool.query(query, [documento]);

      // Si no se encontró en ID_ESTUDIANTE, buscar en ID_DOCENTE
      if (rows.length === 0) {
        query = `
          SELECT 
            PRIMER_NOMBRE, SEGUNDO_NOMBRE, PRIMER_APELLIDO, SEGUNDO_APELLIDO, 
            ASIGNATURA, COD_ASIGNATURA, SEMESTRE, GRUPO, 
            DOCENTE, NOMBRE_SEDE, PERIODO, NOTA_FINAL 
          FROM vista_academica_insitus 
          WHERE ID_DOCENTE = ?;
        `;
        [rows] = await pool.query(query, [documento]);
      }

      return rows;
    } catch (error) {
      console.error(`Error en la consulta de VistaAcademicaById: ${error.message}`);
      throw error;
    }
  },

  // NUEVO MÉTODO PARA OBTENER OPCIONES DISPONIBLES
  getOpcionesFiltros: async (filters) => {
    try {
      const pool = getRemotePool();
      const opciones = {};

      // Construir filtros comunes (PERIODO es obligatorio)
      const baseWhere = 'WHERE PERIODO = ?';
      const baseParams = [filters.periodo];

      // SEDES (aplica filtros excepto "sede")
      {
        let where = baseWhere;
        const params = [...baseParams];

        if (filters.programa) {
          where += ' AND NOM_PROGRAMA = ?';
          params.push(filters.programa);
        }
        if (filters.semestre) {
          where += ' AND SEMESTRE = ?';
          params.push(filters.semestre);
        }
        if (filters.grupo) {
          where += ' AND GRUPO = ?';
          params.push(filters.grupo);
        }

        const sedesQuery = `
          SELECT DISTINCT NOMBRE_SEDE as value, NOMBRE_SEDE as label
          FROM vista_academica_insitus 
          ${where}
          AND NOMBRE_SEDE IS NOT NULL 
          AND NOMBRE_SEDE != ''
          ORDER BY NOMBRE_SEDE
        `;
        const [sedes] = await pool.query(sedesQuery, params);
        console.log('Sedes filtradas:', sedes);
        opciones.sedes = sedes;
      }

      // PROGRAMAS (aplica filtros excepto "programa")
      {
        let where = baseWhere;
        const params = [...baseParams];

        if (filters.sede) {
          where += ' AND NOMBRE_SEDE = ?';
          params.push(filters.sede);
        }
        if (filters.semestre) {
          where += ' AND SEMESTRE = ?';
          params.push(filters.semestre);
        }
        if (filters.grupo) {
          where += ' AND GRUPO = ?';
          params.push(filters.grupo);
        }

        const programasQuery = `
          SELECT DISTINCT NOM_PROGRAMA as value, NOM_PROGRAMA as label
          FROM vista_academica_insitus 
          ${where}
          AND NOM_PROGRAMA IS NOT NULL 
          AND NOM_PROGRAMA != ''
          ORDER BY NOM_PROGRAMA
        `;
        const [programas] = await pool.query(programasQuery, params);
        console.log('Programas filtrados:', programas);
        opciones.programas = programas;
      }

      // SEMESTRES (aplica filtros excepto "semestre") - ORDEN NATURAL
      {
        let where = baseWhere;
        const params = [...baseParams];

        if (filters.sede) {
          where += ' AND NOMBRE_SEDE = ?';
          params.push(filters.sede);
        }
        if (filters.programa) {
          where += ' AND NOM_PROGRAMA = ?';
          params.push(filters.programa);
        }
        if (filters.grupo) {
          where += ' AND GRUPO = ?';
          params.push(filters.grupo);
        }

        const semestresQuery = `
          SELECT DISTINCT SEMESTRE as value, SEMESTRE as label
          FROM vista_academica_insitus 
          ${where}
          AND SEMESTRE IS NOT NULL 
          AND SEMESTRE != ''
          ORDER BY 
            CASE SEMESTRE
              WHEN 'PRIMER SEMESTRE' THEN 1
              WHEN 'SEGUNDO SEMESTRE' THEN 2
              WHEN 'TERCER SEMESTRE' THEN 3
              WHEN 'CUARTO SEMESTRE' THEN 4
              WHEN 'QUINTO SEMESTRE' THEN 5
              WHEN 'SEXTO SEMESTRE' THEN 6
              WHEN 'SÉPTIMO SEMESTRE' THEN 7
              WHEN 'SEPTIMO SEMESTRE' THEN 7
              WHEN 'OCTAVO SEMESTRE' THEN 8
              WHEN 'NOVENO SEMESTRE' THEN 9
              WHEN 'DÉCIMO SEMESTRE' THEN 10
              WHEN 'DECIMO SEMESTRE' THEN 10
              WHEN 'UNDÉCIMO SEMESTRE' THEN 11
              WHEN 'UNDECIMO SEMESTRE' THEN 11
              WHEN 'DUODÉCIMO SEMESTRE' THEN 12
              WHEN 'DUODECIMO SEMESTRE' THEN 12
              ELSE 999
            END
        `;
        const [semestres] = await pool.query(semestresQuery, params);
        console.log('Semestres filtrados:', semestres);
        console.log('Filtros aplicados para semestres:', filters);
        opciones.semestres = semestres;
      }

      // GRUPOS (aplica filtros excepto "grupo")
      {
        let where = baseWhere;
        const params = [...baseParams];

        if (filters.sede) {
          where += ' AND NOMBRE_SEDE = ?';
          params.push(filters.sede);
        }
        if (filters.programa) {
          where += ' AND NOM_PROGRAMA = ?';
          params.push(filters.programa);
        }
        if (filters.semestre) {
          where += ' AND SEMESTRE = ?';
          params.push(filters.semestre);
        }

        const gruposQuery = `
          SELECT DISTINCT GRUPO as value, GRUPO as label
          FROM vista_academica_insitus 
          ${where}
          AND GRUPO IS NOT NULL 
          AND GRUPO != ''
          ORDER BY GRUPO
        `;
        const [grupos] = await pool.query(gruposQuery, params);
        console.log('Grupos filtrados:', grupos);
        opciones.grupos = grupos;
      }

      console.log('Opciones finales retornadas:', JSON.stringify(opciones, null, 2));
      return opciones;
    } catch (error) {
      console.error(`Error en getOpcionesFiltros: ${error.message}`);
      throw error;
    }
  },



  // Métodos existentes para compatibilidad
  getPeriodos: async () => {
    try {
      const pool = getRemotePool();
      const [rows] = await pool.query('SELECT DISTINCT PERIODO FROM vista_academica_insitus ORDER BY PERIODO DESC');
      return rows;
    } catch (error) {
      console.error(`Error al obtener periodos: ${error.message}`);
      throw error;
    }
  },

  getSedes: async () => {
    try {
      const pool = getRemotePool();
      const [rows] = await pool.query(`
        SELECT DISTINCT 
          NOMBRE_SEDE as value, 
          NOMBRE_SEDE as label 
        FROM vista_academica_insitus 
        WHERE NOMBRE_SEDE IS NOT NULL 
          AND NOMBRE_SEDE != '' 
        ORDER BY NOMBRE_SEDE
      `);
      console.log('Sedes obtenidas:', rows);
      return rows;
    } catch (error) {
      console.error(`Error al obtener sedes: ${error.message}`);
      throw error;
    }
  },

  getProgramas: async () => {
    try {
      const pool = getRemotePool();
      const [rows] = await pool.query(`
        SELECT DISTINCT 
          NOM_PROGRAMA as value, 
          NOM_PROGRAMA as label 
        FROM vista_academica_insitus 
        WHERE NOM_PROGRAMA IS NOT NULL 
          AND NOM_PROGRAMA != '' 
        ORDER BY NOM_PROGRAMA
      `);
      console.log('Programas obtenidos:', rows);
      return rows;
    } catch (error) {
      console.error(`Error al obtener programas: ${error.message}`);
      throw error;
    }
  },
  
  getSemestres: async () => {
    try {
      const pool = getRemotePool();
      const [rows] = await pool.query(`
        SELECT DISTINCT 
          SEMESTRE as value, 
          SEMESTRE as label 
        FROM vista_academica_insitus 
        WHERE SEMESTRE IS NOT NULL 
          AND SEMESTRE != '' 
        ORDER BY 
          CASE SEMESTRE
            WHEN 'PRIMER SEMESTRE' THEN 1
            WHEN 'SEGUNDO SEMESTRE' THEN 2
            WHEN 'TERCER SEMESTRE' THEN 3
            WHEN 'CUARTO SEMESTRE' THEN 4
            WHEN 'QUINTO SEMESTRE' THEN 5
            WHEN 'SEXTO SEMESTRE' THEN 6
            WHEN 'SÉPTIMO SEMESTRE' THEN 7
            WHEN 'SEPTIMO SEMESTRE' THEN 7
            WHEN 'OCTAVO SEMESTRE' THEN 8
            WHEN 'NOVENO SEMESTRE' THEN 9
            WHEN 'DÉCIMO SEMESTRE' THEN 10
            WHEN 'DECIMO SEMESTRE' THEN 10
            WHEN 'UNDÉCIMO SEMESTRE' THEN 11
            WHEN 'UNDECIMO SEMESTRE' THEN 11
            WHEN 'DUODÉCIMO SEMESTRE' THEN 12
            WHEN 'DUODECIMO SEMESTRE' THEN 12
            ELSE 999
          END
      `);
      console.log('Semestres obtenidos:', rows);
      return rows;
    } catch (error) {
      console.error(`Error al obtener semestres: ${error.message}`);
      throw error;
    }
  },

  getGrupos: async () => {
    try {
      const pool = getRemotePool();
      const [rows] = await pool.query('SELECT DISTINCT GRUPO as value, GRUPO as label FROM vista_academica_insitus ORDER BY GRUPO');
      return rows;
    } catch (error) {
      console.error(`Error al obtener grupos: ${error.message}`);
      throw error;
    }
  }
};

module.exports = VistaAcademica;