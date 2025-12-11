/**
 * @fileoverview Modelo de reportes para el módulo de administrador
 * @description Contiene todas las consultas SQL para generar reportes por programa, facultad e institucional
 * @version 1.0.0
 */

const { getPool, getRemotePool } = require('../../../../db');

// ======================================
// CONFIGURACIÓN
// ======================================

const REPORTES_CONFIG = {
  TOP_RANKING: 5,
  MIN_EVALUACIONES_RANKING: 3,
  CACHE_DURATION_HOURS: 24,
};

// ======================================
// UTILIDADES
// ======================================

/**
 * Calcula promedio con redondeo a 2 decimales
 */
const calcularPromedio = (valores) => {
  if (!valores || valores.length === 0) return 0.00;
  const suma = valores.reduce((sum, valor) => sum + parseFloat(valor || 0), 0);
  return parseFloat((suma / valores.length).toFixed(2));
};

/**
 * Calcula desviación estándar
 */
const calcularDesviacion = (valores) => {
  if (!valores || valores.length === 0) return 0.00;
  const promedio = calcularPromedio(valores);
  const sumaCuadrados = valores.reduce((sum, valor) => sum + Math.pow(parseFloat(valor || 0) - promedio, 2), 0);
  return parseFloat(Math.sqrt(sumaCuadrados / valores.length).toFixed(2));
};

// ======================================
// CONSULTAS DE FACULTADES Y PROGRAMAS
// ======================================

/**
 * Obtiene todas las facultades activas
 */
const getFacultades = async () => {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT 
      f.ID,
      f.CODIGO,
      f.NOMBRE,
      f.DESCRIPCION,
      f.DECANO_DOCUMENTO,
      (SELECT COUNT(*) FROM PROGRAMAS_ACADEMICOS pa WHERE pa.FACULTAD_ID = f.ID AND pa.ACTIVO = TRUE) as total_programas
    FROM FACULTADES f
    WHERE f.ACTIVO = TRUE
    ORDER BY f.NOMBRE ASC
  `);
  return rows;
};

/**
 * Obtiene facultad por ID con sus programas
 */
const getFacultadById = async (facultadId) => {
  const pool = getPool();
  const [facultad] = await pool.query(`
    SELECT 
      f.ID,
      f.CODIGO,
      f.NOMBRE,
      f.DESCRIPCION,
      f.DECANO_DOCUMENTO
    FROM FACULTADES f
    WHERE f.ID = ? AND f.ACTIVO = TRUE
  `, [facultadId]);

  if (facultad.length === 0) return null;

  const [programas] = await pool.query(`
    SELECT 
      pa.ID,
      pa.CODIGO,
      pa.NOMBRE,
      pa.NIVEL,
      pa.MODALIDAD
    FROM PROGRAMAS_ACADEMICOS pa
    WHERE pa.FACULTAD_ID = ? AND pa.ACTIVO = TRUE
    ORDER BY pa.NOMBRE ASC
  `, [facultadId]);

  return {
    ...facultad[0],
    programas
  };
};

/**
 * Obtiene todos los programas con su facultad
 */
const getProgramas = async (facultadId = null) => {
  const pool = getPool();
  let query = `
    SELECT 
      pa.ID,
      pa.CODIGO,
      pa.NOMBRE,
      pa.DESCRIPCION,
      pa.NIVEL,
      pa.MODALIDAD,
      pa.DIRECTOR_DOCUMENTO,
      f.ID as facultad_id,
      f.CODIGO as facultad_codigo,
      f.NOMBRE as facultad_nombre,
      (SELECT COUNT(DISTINCT dp.DOCUMENTO_DOCENTE) 
       FROM DOCENTES_PROGRAMAS dp 
       WHERE dp.PROGRAMA_ID = pa.ID AND dp.ACTIVO = TRUE) as total_docentes
    FROM PROGRAMAS_ACADEMICOS pa
    INNER JOIN FACULTADES f ON pa.FACULTAD_ID = f.ID
    WHERE pa.ACTIVO = TRUE AND f.ACTIVO = TRUE
  `;

  const params = [];
  if (facultadId) {
    query += ' AND pa.FACULTAD_ID = ?';
    params.push(facultadId);
  }

  query += ' ORDER BY f.NOMBRE, pa.NOMBRE ASC';

  const [rows] = await pool.query(query, params);
  return rows;
};

/**
 * Obtiene programa por ID
 */
const getProgramaById = async (programaId) => {
  const pool = getPool();
  const [rows] = await pool.query(`
    SELECT 
      pa.ID,
      pa.CODIGO,
      pa.NOMBRE,
      pa.DESCRIPCION,
      pa.NIVEL,
      pa.MODALIDAD,
      pa.DIRECTOR_DOCUMENTO,
      f.ID as facultad_id,
      f.CODIGO as facultad_codigo,
      f.NOMBRE as facultad_nombre
    FROM PROGRAMAS_ACADEMICOS pa
    INNER JOIN FACULTADES f ON pa.FACULTAD_ID = f.ID
    WHERE pa.ID = ? AND pa.ACTIVO = TRUE
  `, [programaId]);
  return rows[0] || null;
};

// ======================================
// REPORTES POR PROGRAMA
// ======================================

/**
 * Obtiene el reporte completo de un programa
 * Incluye todos los profesores con sus materias, promedios y observaciones
 */
const getReportePrograma = async (programaId, idConfiguracion, filtros = {}) => {
  const pool = getPool();

  // 1. Obtener información del programa
  const programa = await getProgramaById(programaId);
  if (!programa) return null;

  // 2. Obtener docentes del programa con sus evaluaciones
  const [docentes] = await pool.query(`
    SELECT DISTINCT
      dp.DOCUMENTO_DOCENTE,
      dp.ES_TITULAR
    FROM DOCENTES_PROGRAMAS dp
    WHERE dp.PROGRAMA_ID = ? AND dp.ACTIVO = TRUE
  `, [programaId]);

  if (docentes.length === 0) {
    return {
      programa,
      estadisticas: {
        total_docentes: 0,
        total_estudiantes_evaluaron: 0,
        total_evaluaciones: 0,
        promedio_general: 0,
        desviacion_general: 0
      },
      docentes: [],
      ranking_positivos: [],
      ranking_mejora: []
    };
  }

  const documentosDocentes = docentes.map(d => d.DOCUMENTO_DOCENTE);

  // 3. Obtener todas las evaluaciones de los docentes del programa
  const [evaluaciones] = await pool.query(`
    SELECT 
      e.ID as evaluacion_id,
      e.DOCUMENTO_DOCENTE,
      e.DOCUMENTO_ESTUDIANTE,
      e.CODIGO_MATERIA,
      e.COMENTARIO_GENERAL,
      e.FECHA_CREACION,
      ed.ID as detalle_id,
      ca.ASPECTO_ID as config_aspecto_id,
      ae.ID as aspecto_id,
      ae.ETIQUETA as aspecto_nombre,
      cv.PUNTAJE,
      ev.VALOR as valor_valoracion,
      ev.ETIQUETA as valoracion_nombre,
      ed.COMENTARIO as comentario_aspecto
    FROM EVALUACIONES e
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    LEFT JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
    WHERE e.ID_CONFIGURACION = ?
      AND e.DOCUMENTO_DOCENTE IN (${documentosDocentes.map(() => '?').join(',')})
    ORDER BY e.DOCUMENTO_DOCENTE, e.CODIGO_MATERIA, ae.ETIQUETA
  `, [idConfiguracion, ...documentosDocentes]);

  // 4. Procesar datos por docente y materia
  const docentesMap = new Map();
  const todosLosPuntajes = [];

  evaluaciones.forEach(evaluacion => {
    if (!docentesMap.has(evaluacion.DOCUMENTO_DOCENTE)) {
      docentesMap.set(evaluacion.DOCUMENTO_DOCENTE, {
        documento: evaluacion.DOCUMENTO_DOCENTE,
        materias: new Map(),
        total_evaluaciones: 0,
        estudiantes_evaluaron: new Set(),
        puntajes: [],
        aspectos_positivos: 0,
        aspectos_mejora: 0
      });
    }

    const docente = docentesMap.get(evaluacion.DOCUMENTO_DOCENTE);
    docente.estudiantes_evaluaron.add(evaluacion.DOCUMENTO_ESTUDIANTE);

    // Procesar materia
    if (!docente.materias.has(evaluacion.CODIGO_MATERIA)) {
      docente.materias.set(evaluacion.CODIGO_MATERIA, {
        codigo: evaluacion.CODIGO_MATERIA,
        nombre: evaluacion.CODIGO_MATERIA, // Se puede enriquecer con datos remotos
        evaluaciones: new Set(),
        aspectos: new Map(),
        comentarios_generales: [],
        comentarios_aspectos: [],
        puntajes: []
      });
    }

    const materia = docente.materias.get(evaluacion.CODIGO_MATERIA);
    materia.evaluaciones.add(evaluacion.evaluacion_id);

    if (evaluacion.COMENTARIO_GENERAL && evaluacion.COMENTARIO_GENERAL.trim()) {
      materia.comentarios_generales.push({
        texto: evaluacion.COMENTARIO_GENERAL,
        fecha: evaluacion.FECHA_CREACION
      });
    }

    if (evaluacion.detalle_id) {
      // Procesar aspecto
      if (!materia.aspectos.has(evaluacion.aspecto_id)) {
        materia.aspectos.set(evaluacion.aspecto_id, {
          id: evaluacion.aspecto_id,
          nombre: evaluacion.aspecto_nombre,
          puntajes: [],
          valoraciones: { E: 0, B: 0, A: 0, D: 0 },
          comentarios: []
        });
      }

      const aspecto = materia.aspectos.get(evaluacion.aspecto_id);
      if (evaluacion.PUNTAJE !== null) {
        aspecto.puntajes.push(parseFloat(evaluacion.PUNTAJE));
        materia.puntajes.push(parseFloat(evaluacion.PUNTAJE));
        docente.puntajes.push(parseFloat(evaluacion.PUNTAJE));
        todosLosPuntajes.push(parseFloat(evaluacion.PUNTAJE));
      }

      if (evaluacion.valor_valoracion) {
        aspecto.valoraciones[evaluacion.valor_valoracion]++;
        if (['E', 'B'].includes(evaluacion.valor_valoracion)) {
          docente.aspectos_positivos++;
        } else {
          docente.aspectos_mejora++;
        }
      }

      if (evaluacion.comentario_aspecto && evaluacion.comentario_aspecto.trim()) {
        aspecto.comentarios.push({
          texto: evaluacion.comentario_aspecto,
          valoracion: evaluacion.valoracion_nombre
        });
        materia.comentarios_aspectos.push({
          aspecto: evaluacion.aspecto_nombre,
          texto: evaluacion.comentario_aspecto,
          valoracion: evaluacion.valoracion_nombre
        });
      }
    }
  });

  // 5. Transformar datos a formato de respuesta
  const docentesArray = Array.from(docentesMap.values()).map(docente => {
    const materiasArray = Array.from(docente.materias.values()).map(materia => {
      const aspectosArray = Array.from(materia.aspectos.values()).map(aspecto => ({
        id: aspecto.id,
        nombre: aspecto.nombre,
        promedio: calcularPromedio(aspecto.puntajes),
        total_respuestas: aspecto.puntajes.length,
        distribucion: aspecto.valoraciones,
        comentarios: aspecto.comentarios
      }));

      return {
        codigo: materia.codigo,
        nombre: materia.nombre,
        total_evaluaciones: materia.evaluaciones.size,
        promedio: calcularPromedio(materia.puntajes),
        aspectos: aspectosArray,
        grafica: {
          labels: aspectosArray.map(a => a.nombre),
          values: aspectosArray.map(a => a.promedio)
        },
        observaciones_crudas: [
          ...materia.comentarios_generales,
          ...materia.comentarios_aspectos
        ],
        resumen_ia: null // Se llena por el servicio de IA
      };
    });

    return {
      documento: docente.documento,
      nombre: docente.documento, // Se puede enriquecer con datos remotos
      total_evaluaciones: docente.estudiantes_evaluaron.size,
      estudiantes_evaluaron: docente.estudiantes_evaluaron.size,
      promedio_general: calcularPromedio(docente.puntajes),
      aspectos_positivos: docente.aspectos_positivos,
      aspectos_mejora: docente.aspectos_mejora,
      materias: materiasArray
    };
  });

  // 6. Calcular rankings
  const rankingPositivos = [...docentesArray]
    .filter(d => d.total_evaluaciones >= REPORTES_CONFIG.MIN_EVALUACIONES_RANKING)
    .sort((a, b) => b.aspectos_positivos - a.aspectos_positivos)
    .slice(0, REPORTES_CONFIG.TOP_RANKING)
    .map((d, index) => ({
      posicion: index + 1,
      documento: d.documento,
      nombre: d.nombre,
      total_positivos: d.aspectos_positivos,
      promedio: d.promedio_general
    }));

  const rankingMejora = [...docentesArray]
    .filter(d => d.total_evaluaciones >= REPORTES_CONFIG.MIN_EVALUACIONES_RANKING)
    .sort((a, b) => b.aspectos_mejora - a.aspectos_mejora)
    .slice(0, REPORTES_CONFIG.TOP_RANKING)
    .map((d, index) => ({
      posicion: index + 1,
      documento: d.documento,
      nombre: d.nombre,
      total_mejora: d.aspectos_mejora,
      promedio: d.promedio_general
    }));

  // 7. Calcular estadísticas generales
  const estudiantesUnicos = new Set();
  docentesArray.forEach(d => {
    // Ya contamos estudiantes por docente
  });

  return {
    programa,
    estadisticas: {
      total_docentes: docentesArray.length,
      total_estudiantes_evaluaron: new Set(evaluaciones.map(e => e.DOCUMENTO_ESTUDIANTE)).size,
      total_evaluaciones: new Set(evaluaciones.map(e => e.evaluacion_id)).size,
      promedio_general: calcularPromedio(todosLosPuntajes),
      desviacion_general: calcularDesviacion(todosLosPuntajes)
    },
    docentes: docentesArray,
    ranking_positivos: rankingPositivos,
    ranking_mejora: rankingMejora
  };
};

// ======================================
// REPORTES POR FACULTAD
// ======================================

/**
 * Obtiene el reporte consolidado de una facultad
 */
const getReporteFacultad = async (facultadId, idConfiguracion) => {
  const pool = getPool();

  // 1. Obtener información de la facultad
  const facultad = await getFacultadById(facultadId);
  if (!facultad) return null;

  // 2. Obtener todos los programas de la facultad con sus estadísticas
  const programasConEstadisticas = [];
  let todosLosPuntajes = [];
  let todosLosDocentes = [];

  for (const programa of facultad.programas) {
    const reportePrograma = await getReportePrograma(programa.ID, idConfiguracion);
    if (reportePrograma) {
      programasConEstadisticas.push({
        id: programa.ID,
        codigo: programa.CODIGO,
        nombre: programa.NOMBRE,
        nivel: programa.NIVEL,
        estadisticas: reportePrograma.estadisticas,
        ranking_positivos: reportePrograma.ranking_positivos.slice(0, 3),
        ranking_mejora: reportePrograma.ranking_mejora.slice(0, 3)
      });

      reportePrograma.docentes.forEach(d => {
        todosLosDocentes.push({
          ...d,
          programa_id: programa.ID,
          programa_nombre: programa.NOMBRE
        });
        d.materias.forEach(m => {
          m.aspectos.forEach(a => {
            todosLosPuntajes.push(a.promedio);
          });
        });
      });
    }
  }

  // 3. Calcular ranking consolidado de facultad
  const rankingPositivosFacultad = [...todosLosDocentes]
    .filter(d => d.total_evaluaciones >= REPORTES_CONFIG.MIN_EVALUACIONES_RANKING)
    .sort((a, b) => b.aspectos_positivos - a.aspectos_positivos)
    .slice(0, REPORTES_CONFIG.TOP_RANKING)
    .map((d, index) => ({
      posicion: index + 1,
      documento: d.documento,
      nombre: d.nombre,
      programa: d.programa_nombre,
      total_positivos: d.aspectos_positivos,
      promedio: d.promedio_general
    }));

  const rankingMejoraFacultad = [...todosLosDocentes]
    .filter(d => d.total_evaluaciones >= REPORTES_CONFIG.MIN_EVALUACIONES_RANKING)
    .sort((a, b) => b.aspectos_mejora - a.aspectos_mejora)
    .slice(0, REPORTES_CONFIG.TOP_RANKING)
    .map((d, index) => ({
      posicion: index + 1,
      documento: d.documento,
      nombre: d.nombre,
      programa: d.programa_nombre,
      total_mejora: d.aspectos_mejora,
      promedio: d.promedio_general
    }));

  // 4. Gráfica comparativa por programa
  const graficaComparativa = {
    labels: programasConEstadisticas.map(p => p.nombre),
    values: programasConEstadisticas.map(p => p.estadisticas.promedio_general),
    total_docentes: programasConEstadisticas.map(p => p.estadisticas.total_docentes),
    total_evaluaciones: programasConEstadisticas.map(p => p.estadisticas.total_evaluaciones)
  };

  return {
    facultad: {
      id: facultad.ID,
      codigo: facultad.CODIGO,
      nombre: facultad.NOMBRE,
      descripcion: facultad.DESCRIPCION
    },
    estadisticas: {
      total_programas: programasConEstadisticas.length,
      total_docentes: todosLosDocentes.length,
      total_evaluaciones: programasConEstadisticas.reduce((sum, p) => sum + p.estadisticas.total_evaluaciones, 0),
      total_estudiantes_evaluaron: programasConEstadisticas.reduce((sum, p) => sum + p.estadisticas.total_estudiantes_evaluaron, 0),
      promedio_general: calcularPromedio(todosLosPuntajes),
      desviacion_general: calcularDesviacion(todosLosPuntajes)
    },
    programas: programasConEstadisticas,
    grafica_comparativa: graficaComparativa,
    ranking_positivos: rankingPositivosFacultad,
    ranking_mejora: rankingMejoraFacultad,
    resumen_ia: null // Se llena por el servicio de IA
  };
};

// ======================================
// REPORTE INSTITUCIONAL
// ======================================

/**
 * Obtiene el reporte institucional consolidado
 */
const getReporteInstitucional = async (idConfiguracion) => {
  const pool = getPool();

  // 1. Obtener todas las facultades
  const facultades = await getFacultades();
  const facultadesConEstadisticas = [];
  let todosLosPuntajes = [];
  let todosLosDocentes = [];

  for (const facultad of facultades) {
    const reporteFacultad = await getReporteFacultad(facultad.ID, idConfiguracion);
    if (reporteFacultad) {
      facultadesConEstadisticas.push({
        id: facultad.ID,
        codigo: facultad.CODIGO,
        nombre: facultad.NOMBRE,
        estadisticas: reporteFacultad.estadisticas,
        ranking_positivos: reporteFacultad.ranking_positivos.slice(0, 3),
        ranking_mejora: reporteFacultad.ranking_mejora.slice(0, 3)
      });

      reporteFacultad.programas.forEach(p => {
        todosLosPuntajes.push(p.estadisticas.promedio_general);
      });

      // Agregar docentes con su facultad
      reporteFacultad.ranking_positivos.forEach(d => {
        todosLosDocentes.push({
          ...d,
          facultad_id: facultad.ID,
          facultad_nombre: facultad.NOMBRE,
          tipo: 'positivo'
        });
      });
      reporteFacultad.ranking_mejora.forEach(d => {
        todosLosDocentes.push({
          ...d,
          facultad_id: facultad.ID,
          facultad_nombre: facultad.NOMBRE,
          tipo: 'mejora'
        });
      });
    }
  }

  // 2. Gráfica general por aspectos
  const [aspectosGlobales] = await pool.query(`
    SELECT 
      ae.ID,
      ae.ETIQUETA,
      AVG(cv.PUNTAJE) as promedio,
      COUNT(*) as total_respuestas
    FROM EVALUACION_DETALLE ed
    INNER JOIN EVALUACIONES e ON ed.EVALUACION_ID = e.ID
    INNER JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    INNER JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    INNER JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    WHERE e.ID_CONFIGURACION = ? AND ca.ACTIVO = TRUE
    GROUP BY ae.ID, ae.ETIQUETA
    ORDER BY promedio DESC
  `, [idConfiguracion]);

  const graficaAspectos = {
    labels: aspectosGlobales.map(a => a.ETIQUETA),
    values: aspectosGlobales.map(a => parseFloat(a.promedio).toFixed(2))
  };

  // 3. Gráfica comparativa entre facultades
  const graficaFacultades = {
    labels: facultadesConEstadisticas.map(f => f.nombre),
    values: facultadesConEstadisticas.map(f => f.estadisticas.promedio_general),
    total_docentes: facultadesConEstadisticas.map(f => f.estadisticas.total_docentes),
    total_programas: facultadesConEstadisticas.map(f => f.estadisticas.total_programas)
  };

  // 4. Ranking global
  const docentesPositivos = todosLosDocentes
    .filter(d => d.tipo === 'positivo')
    .sort((a, b) => b.total_positivos - a.total_positivos)
    .slice(0, REPORTES_CONFIG.TOP_RANKING);

  const docentesMejora = todosLosDocentes
    .filter(d => d.tipo === 'mejora')
    .sort((a, b) => b.total_mejora - a.total_mejora)
    .slice(0, REPORTES_CONFIG.TOP_RANKING);

  return {
    estadisticas: {
      total_facultades: facultadesConEstadisticas.length,
      total_programas: facultadesConEstadisticas.reduce((sum, f) => sum + f.estadisticas.total_programas, 0),
      total_docentes: facultadesConEstadisticas.reduce((sum, f) => sum + f.estadisticas.total_docentes, 0),
      total_evaluaciones: facultadesConEstadisticas.reduce((sum, f) => sum + f.estadisticas.total_evaluaciones, 0),
      total_estudiantes_evaluaron: facultadesConEstadisticas.reduce((sum, f) => sum + f.estadisticas.total_estudiantes_evaluaron, 0),
      promedio_general: calcularPromedio(facultadesConEstadisticas.map(f => f.estadisticas.promedio_general)),
      desviacion_general: calcularDesviacion(facultadesConEstadisticas.map(f => f.estadisticas.promedio_general))
    },
    facultades: facultadesConEstadisticas,
    grafica_aspectos: graficaAspectos,
    grafica_facultades: graficaFacultades,
    ranking_global_positivos: docentesPositivos,
    ranking_global_mejora: docentesMejora,
    resumen_ia: null, // Se llena por el servicio de IA
    tendencias: null // Se llena por el servicio de IA
  };
};

// ======================================
// CONSULTAS PARA IA
// ======================================

/**
 * Obtiene todos los comentarios de un docente por materia para análisis IA
 */
const getComentariosDocente = async (documentoDocente, codigoMateria, idConfiguracion) => {
  const pool = getPool();

  const [comentarios] = await pool.query(`
    SELECT 
      e.ID as evaluacion_id,
      e.COMENTARIO_GENERAL,
      ed.COMENTARIO as comentario_aspecto,
      ae.ETIQUETA as aspecto,
      cv.PUNTAJE,
      ev.VALOR as valoracion,
      ev.ETIQUETA as valoracion_nombre,
      e.FECHA_CREACION
    FROM EVALUACIONES e
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    LEFT JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
    WHERE e.DOCUMENTO_DOCENTE = ?
      AND e.CODIGO_MATERIA = ?
      AND e.ID_CONFIGURACION = ?
    ORDER BY e.FECHA_CREACION DESC
  `, [documentoDocente, codigoMateria, idConfiguracion]);

  // Agrupar comentarios
  const comentariosGenerales = [];
  const comentariosPorAspecto = new Map();

  comentarios.forEach(c => {
    if (c.COMENTARIO_GENERAL && c.COMENTARIO_GENERAL.trim()) {
      comentariosGenerales.push({
        texto: c.COMENTARIO_GENERAL,
        fecha: c.FECHA_CREACION
      });
    }

    if (c.comentario_aspecto && c.comentario_aspecto.trim()) {
      if (!comentariosPorAspecto.has(c.aspecto)) {
        comentariosPorAspecto.set(c.aspecto, []);
      }
      comentariosPorAspecto.get(c.aspecto).push({
        texto: c.comentario_aspecto,
        valoracion: c.valoracion,
        puntaje: c.PUNTAJE
      });
    }
  });

  return {
    documento_docente: documentoDocente,
    codigo_materia: codigoMateria,
    total_comentarios: comentarios.length,
    comentarios_generales: comentariosGenerales,
    comentarios_por_aspecto: Object.fromEntries(comentariosPorAspecto),
    // Todos los textos para análisis IA
    textos_para_analisis: [
      ...comentariosGenerales.map(c => c.texto),
      ...Array.from(comentariosPorAspecto.values()).flat().map(c => c.texto)
    ]
  };
};

/**
 * Obtiene todos los comentarios de un programa para análisis IA
 */
const getComentariosPrograma = async (programaId, idConfiguracion) => {
  const pool = getPool();

  const [comentarios] = await pool.query(`
    SELECT 
      e.DOCUMENTO_DOCENTE,
      e.CODIGO_MATERIA,
      e.COMENTARIO_GENERAL,
      ed.COMENTARIO as comentario_aspecto,
      ae.ETIQUETA as aspecto,
      ev.VALOR as valoracion
    FROM EVALUACIONES e
    INNER JOIN DOCENTES_PROGRAMAS dp ON e.DOCUMENTO_DOCENTE = dp.DOCUMENTO_DOCENTE
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    LEFT JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
    WHERE dp.PROGRAMA_ID = ?
      AND e.ID_CONFIGURACION = ?
      AND dp.ACTIVO = TRUE
  `, [programaId, idConfiguracion]);

  const todosLosTextos = [];
  comentarios.forEach(c => {
    if (c.COMENTARIO_GENERAL) todosLosTextos.push(c.COMENTARIO_GENERAL);
    if (c.comentario_aspecto) todosLosTextos.push(c.comentario_aspecto);
  });

  return {
    programa_id: programaId,
    total_comentarios: todosLosTextos.length,
    textos_para_analisis: todosLosTextos
  };
};

/**
 * Guarda un resumen generado por IA
 */
const saveResumenIA = async (resumenData) => {
  const pool = getPool();

  const {
    tipo_resumen,
    documento_docente,
    codigo_materia,
    programa_id,
    facultad_id,
    configuracion_id,
    fortalezas,
    aspectos_mejora,
    frases_positivas,
    frases_negativas,
    tendencias,
    resumen_ejecutivo,
    total_comentarios,
    total_positivos,
    total_negativos,
    total_neutros,
    modelo_ia
  } = resumenData;

  const [result] = await pool.query(`
    INSERT INTO RESUMENES_IA (
      TIPO_RESUMEN, DOCUMENTO_DOCENTE, CODIGO_MATERIA, PROGRAMA_ID, FACULTAD_ID,
      CONFIGURACION_ID, FORTALEZAS, ASPECTOS_MEJORA, FRASES_REPRESENTATIVAS_POSITIVAS,
      FRASES_REPRESENTATIVAS_NEGATIVAS, TENDENCIAS, RESUMEN_EJECUTIVO,
      TOTAL_COMENTARIOS_ANALIZADOS, TOTAL_POSITIVOS, TOTAL_NEGATIVOS, TOTAL_NEUTROS,
      MODELO_IA, VALIDO_HASTA
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))
    ON DUPLICATE KEY UPDATE
      FORTALEZAS = VALUES(FORTALEZAS),
      ASPECTOS_MEJORA = VALUES(ASPECTOS_MEJORA),
      FRASES_REPRESENTATIVAS_POSITIVAS = VALUES(FRASES_REPRESENTATIVAS_POSITIVAS),
      FRASES_REPRESENTATIVAS_NEGATIVAS = VALUES(FRASES_REPRESENTATIVAS_NEGATIVAS),
      TENDENCIAS = VALUES(TENDENCIAS),
      RESUMEN_EJECUTIVO = VALUES(RESUMEN_EJECUTIVO),
      TOTAL_COMENTARIOS_ANALIZADOS = VALUES(TOTAL_COMENTARIOS_ANALIZADOS),
      TOTAL_POSITIVOS = VALUES(TOTAL_POSITIVOS),
      TOTAL_NEGATIVOS = VALUES(TOTAL_NEGATIVOS),
      TOTAL_NEUTROS = VALUES(TOTAL_NEUTROS),
      VERSION = VERSION + 1,
      VALIDO_HASTA = VALUES(VALIDO_HASTA)
  `, [
    tipo_resumen,
    documento_docente,
    codigo_materia,
    programa_id,
    facultad_id,
    configuracion_id,
    JSON.stringify(fortalezas),
    JSON.stringify(aspectos_mejora),
    JSON.stringify(frases_positivas),
    JSON.stringify(frases_negativas),
    JSON.stringify(tendencias),
    resumen_ejecutivo,
    total_comentarios,
    total_positivos,
    total_negativos,
    total_neutros,
    modelo_ia || 'phi3.1:mini',
    REPORTES_CONFIG.CACHE_DURATION_HOURS
  ]);

  return result.insertId || result.affectedRows;
};

/**
 * Obtiene un resumen IA existente si está vigente
 */
const getResumenIA = async (tipoResumen, filtros) => {
  const pool = getPool();
  const { documento_docente, codigo_materia, programa_id, facultad_id, configuracion_id } = filtros;

  let query = `
    SELECT * FROM RESUMENES_IA
    WHERE TIPO_RESUMEN = ?
      AND CONFIGURACION_ID = ?
      AND (VALIDO_HASTA IS NULL OR VALIDO_HASTA > NOW())
  `;
  const params = [tipoResumen, configuracion_id];

  if (documento_docente) {
    query += ' AND DOCUMENTO_DOCENTE = ?';
    params.push(documento_docente);
  }
  if (codigo_materia) {
    query += ' AND CODIGO_MATERIA = ?';
    params.push(codigo_materia);
  }
  if (programa_id) {
    query += ' AND PROGRAMA_ID = ?';
    params.push(programa_id);
  }
  if (facultad_id) {
    query += ' AND FACULTAD_ID = ?';
    params.push(facultad_id);
  }

  query += ' ORDER BY FECHA_GENERACION DESC LIMIT 1';

  const [rows] = await pool.query(query, params);

  if (rows.length === 0) return null;

  const resumen = rows[0];
  
  // Helper function to safely parse JSON or return default
  const safeJSONParse = (value, defaultValue = []) => {
    if (!value) return defaultValue;
    try {
      // If it's already an array/object, return it
      if (typeof value === 'object') return value;
      // Try to parse as JSON
      return JSON.parse(value);
    } catch (e) {
      // If parsing fails and it's a string, wrap it in an array
      if (typeof value === 'string' && value.trim()) {
        return [value];
      }
      return defaultValue;
    }
  };
  
  return {
    ...resumen,
    fortalezas: safeJSONParse(resumen.FORTALEZAS),
    aspectos_mejora: safeJSONParse(resumen.ASPECTOS_MEJORA),
    frases_representativas: {
      positivas: safeJSONParse(resumen.FRASES_REPRESENTATIVAS_POSITIVAS),
      negativas: safeJSONParse(resumen.FRASES_REPRESENTATIVAS_NEGATIVAS)
    },
    tendencias: safeJSONParse(resumen.TENDENCIAS)
  };
};

// ======================================
// EXPORTACIÓN
// ======================================

module.exports = {
  // Estructura organizacional
  getFacultades,
  getFacultadById,
  getProgramas,
  getProgramaById,
  
  // Reportes
  getReportePrograma,
  getReporteFacultad,
  getReporteInstitucional,
  
  // IA
  getComentariosDocente,
  getComentariosPrograma,
  saveResumenIA,
  getResumenIA,
  
  // Config
  REPORTES_CONFIG
};
