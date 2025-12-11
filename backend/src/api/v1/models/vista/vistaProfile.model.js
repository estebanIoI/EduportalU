const { getPool } = require("../../../../db");
const { getRemotePool } = require('../../../../db');
const { getSecurityPool } = require('../../../../db');

const VistaProfileModel = {

  // INFORMACION DE ESTUDIANTE

  async getEstudianteAcademicInfo(documento) {
    const remotePool = await getRemotePool(); // sigedin_ies
    
    // Consulta principal de estudiante + materias desde sigedin_ies
    const estudianteRows = await remotePool.query(
        `SELECT DISTINCT
            e.SEDE,
            e.TIPO_DOC,
            e.DOCUMENTO_ESTUDIANTE,
            e.ESTADO_MATRICULA,
            p.NOM_PROGRAMA,
            e.SEMESTRE_MATRICULA,
            p.SEMESTRE,
            p.GRUPO,
            p.COD_ASIGNATURA as CODIGO_MATERIA,
            p.ASIGNATURA as NOMBRE_MATERIA,
            p.ID_DOCENTE as DOCUMENTO_DOCENTE,
            p.DOCENTE as NOMBRE_DOCENTE
        FROM vista_estudiantes e
        LEFT JOIN vista_academica_insitus p 
            ON e.DOCUMENTO_ESTUDIANTE = p.ID_ESTUDIANTE
        WHERE e.DOCUMENTO_ESTUDIANTE = ?`,
        [documento]
    ).then(([rows]) => rows);

    // Si no hay información de estudiante, retornar null
    if (estudianteRows.length === 0) {
      return null;
    }

    // Extraer información base del primer registro
    const firstRow = estudianteRows[0];
    const infoBase = {
      SEDE: firstRow.SEDE,
      TIPO_DOC: firstRow.TIPO_DOC,
      DOCUMENTO_ESTUDIANTE: firstRow.DOCUMENTO_ESTUDIANTE,
      ESTADO_MATRICULA: firstRow.ESTADO_MATRICULA,
      NOM_PROGRAMA: firstRow.NOM_PROGRAMA,
      SEMESTRE_MATRICULA: firstRow.SEMESTRE_MATRICULA,
      SEMESTRE: firstRow.SEMESTRE,
      GRUPO: firstRow.GRUPO
    };

    // Extraer materias únicas
    const materiasMap = new Map();
    estudianteRows.forEach(row => {
        if (row.CODIGO_MATERIA) {
            const key = `${row.CODIGO_MATERIA}-${row.DOCUMENTO_DOCENTE}`;
            if (!materiasMap.has(key)) {
                materiasMap.set(key, {
                    CODIGO_MATERIA: row.CODIGO_MATERIA,
                    NOMBRE_MATERIA: row.NOMBRE_MATERIA,
                    DOCUMENTO_DOCENTE: row.DOCUMENTO_DOCENTE,
                    NOMBRE_DOCENTE: row.NOMBRE_DOCENTE
                });
            }
        }
    });
    const materias = Array.from(materiasMap.values());

    return {
        infoBase,
        materias
    };
  },

  // MATERIAS DE ESTUDIANTE

  async getMateriasEstudiante(documento) {
    const remotePool = await getRemotePool();
    const [materias] = await remotePool.query(
      `SELECT DISTINCT 
         ai.COD_ASIGNATURA as CODIGO_MATERIA,
         ai.ASIGNATURA as NOMBRE_MATERIA,
         ai.ID_DOCENTE as DOCUMENTO_DOCENTE,
         ai.DOCENTE as NOMBRE_DOCENTE
       FROM vista_academica_insitus ai
       WHERE ai.ID_ESTUDIANTE = ?`,
      [documento]
    );
    return materias;
  },

  // INFORMACION DE DOCENTE

  async getDocenteAcademicInfo(documento) {
    const remotePool = await getRemotePool(); // sigedin_ies
    
    // Consulta principal de docente desde sigedin_ies
    const docenteInfo = await remotePool.query(
        `SELECT DISTINCT
           ai.ID_DOCENTE AS DOCUMENTO_DOCENTE,
           ai.DOCENTE AS NOMBRE_DOCENTE,
           ai.NOMBRE_SEDE AS SEDE,
           ai.PERIODO
         FROM vista_academica_insitus ai
         WHERE ai.ID_DOCENTE = ?
         GROUP BY 
            ai.ID_DOCENTE,
            ai.DOCENTE,
            ai.NOMBRE_SEDE,
            ai.PERIODO`,
        [documento]
    ).then(([rows]) => rows);

    // Si no hay información de docente, retornar array vacío
    if (docenteInfo.length === 0) {
      return [];
    }

    return docenteInfo;
  },

  // MATERIAS DE DOCENTE
  // Nota: Consulta compatible con MySQL 5.x (sin CTEs ni funciones de ventana)

  async getMateriasDocente(documento) {
    const remotePool = await getRemotePool();
    const [materias] = await remotePool.query(
      `SELECT 
          ai.COD_ASIGNATURA,
          ai.ASIGNATURA,
          (
              SELECT sp.SEMESTRE 
              FROM vista_academica_insitus sp 
              WHERE sp.COD_ASIGNATURA = ai.COD_ASIGNATURA 
                AND sp.ID_DOCENTE = ai.ID_DOCENTE
              GROUP BY sp.SEMESTRE 
              ORDER BY COUNT(*) DESC 
              LIMIT 1
          ) AS SEMESTRE_PREDOMINANTE,
          (
              SELECT pp.NOM_PROGRAMA 
              FROM vista_academica_insitus pp 
              WHERE pp.COD_ASIGNATURA = ai.COD_ASIGNATURA 
                AND pp.ID_DOCENTE = ai.ID_DOCENTE
              GROUP BY pp.NOM_PROGRAMA 
              ORDER BY COUNT(*) DESC 
              LIMIT 1
          ) AS PROGRAMA_PREDOMINANTE
      FROM (
          SELECT DISTINCT COD_ASIGNATURA, ASIGNATURA, ID_DOCENTE
          FROM vista_academica_insitus
          WHERE ID_DOCENTE = ?
      ) ai
      ORDER BY ai.ASIGNATURA`,
      [documento]
    );
    return materias;
  },

  // OBTENER ROLES ADICIONALES (desde base local)

  async getRolesAdicionales(userId) {
    const localPool = await getPool();
    const [additionalRoles] = await localPool.query(
      `SELECT r.ID, r.NOMBRE_ROL 
       FROM users_roles ur 
       JOIN ROLES r ON ur.rol_id = r.ID 
       WHERE ur.user_id = ?`,
      [userId]
    );
    return additionalRoles;
  },

  // OBTENER INFORMACION DE LOGIN (desde sigedin_seguridad)

  async getLoginInfo(username) {
    const securityPool = await getSecurityPool();
    const [loginInfo] = await securityPool.query(
      `SELECT 
          user_id,
          user_name,
          user_username,
          user_idrole,
          role_name
      FROM datalogin 
      WHERE user_username = ?`,
      [username]
    );
    return loginInfo;
  }
};

module.exports = VistaProfileModel;