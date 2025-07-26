const { getPool, getRemotePool } = require('../../../../db');

// ======================================
// CONFIGURACIÓN DEL SISTEMA
// ======================================

const RANKING_CONFIG = {
  K_FACTOR: 20, // Número de estudiantes necesarios para confianza completa
  MIN_EVALUACIONES: 3, // Mínimo de evaluaciones para aparecer en ranking
};

// ======================================
// UTILIDADES COMPARTIDAS
// ======================================

/**
 * Construye las condiciones WHERE dinámicamente para filtrado académico
 * @param {Object} filters - Filtros de consulta
 * @param {string} alias - Alias de la tabla (por defecto 'va')
 * @returns {Object} - Objeto con clause y params
 */
const buildWhereClause = (filters, alias = 'va') => {
  const { periodo, nombreSede, nomPrograma, semestre, grupo } = filters;
  let conditions = [];
  let params = [];
  
  if (periodo) {
    conditions.push(`${alias}.PERIODO = ?`);
    params.push(periodo);
  }
  
  if (nombreSede) {
    conditions.push(`${alias}.NOMBRE_SEDE = ?`);
    params.push(nombreSede);
  }
  
  if (nomPrograma) {
    conditions.push(`${alias}.NOM_PROGRAMA = ?`);
    params.push(nomPrograma);
  }
  
  if (semestre) {
    conditions.push(`${alias}.SEMESTRE = ?`);
    params.push(semestre);
  }
  
  if (grupo) {
    conditions.push(`${alias}.GRUPO = ?`);
    params.push(grupo);
  }
  
  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

/**
 * Obtiene datos académicos filtrados de la vista remota
 * @param {Object} filters - Filtros de consulta
 * @param {Array} campos - Campos a seleccionar
 * @returns {Array} - Datos académicos filtrados
 */
const getAcademicData = async (filters, campos = ['ID_ESTUDIANTE', 'COD_ASIGNATURA', 'ID_DOCENTE']) => {
  const remotePool = await getRemotePool();
  const whereClause = buildWhereClause(filters, 'va');
  
  const query = `
    SELECT ${campos.join(', ')}
    FROM vista_academica_insitus va
    ${whereClause.clause}
  `;
  
  const [data] = await remotePool.query(query, whereClause.params);
  return data;
};

/**
 * Crea placeholders para consultas IN con pares de valores
 * @param {Array} items - Array de items
 * @returns {Object} - Placeholders y parámetros planos
 */
const createInPlaceholders = (items) => {
  const placeholders = items.map(() => '(?, ?)').join(', ');
  const params = items.flatMap(item => [item.estudiante || item.ID_ESTUDIANTE, item.asignatura || item.COD_ASIGNATURA]);
  return { placeholders, params };
};

/**
 * Calcula el promedio con redondeo a 2 decimales
 * @param {Array} valores - Array de números
 * @returns {number} - Promedio redondeado
 */
const calcularPromedio = (valores) => {
  if (valores.length === 0) return 0.00;
  const suma = valores.reduce((sum, valor) => sum + valor, 0);
  return parseFloat((suma / valores.length).toFixed(2));
};

/**
 * Calcula porcentaje con redondeo a 2 decimales
 * @param {number} numerador 
 * @param {number} denominador 
 * @returns {number} - Porcentaje redondeado
 */
const calcularPorcentaje = (numerador, denominador) => {
  if (denominador === 0) return 0;
  return Math.round((numerador / denominador) * 100 * 100) / 100;
};

/**
 * Aplica ajuste bayesiano al puntaje
 * @param {number} promedioReal - Promedio real del docente
 * @param {number} totalEstudiantes - Número de estudiantes que evaluaron
 * @param {number} mediaGlobal - Media global de todos los docentes
 * @param {number} kFactor - Factor K para el ajuste
 * @returns {number} - Puntaje ajustado
 */
const aplicarAjusteBayesiano = (promedioReal, totalEstudiantes, mediaGlobal, kFactor = RANKING_CONFIG.K_FACTOR) => {
  const puntajeAjustado = (mediaGlobal * kFactor + promedioReal * totalEstudiantes) / (kFactor + totalEstudiantes);
  return parseFloat(puntajeAjustado.toFixed(4));
};

/**
 * Calcula factor de confianza (0-1)
 * @param {number} totalEstudiantes - Número de estudiantes
 * @param {number} kFactor - Factor K
 * @returns {number} - Factor de confianza
 */
const calcularFactorConfianza = (totalEstudiantes, kFactor = RANKING_CONFIG.K_FACTOR) => {
  return parseFloat((totalEstudiantes / (totalEstudiantes + kFactor)).toFixed(3));
};

// ======================================
// FUNCIONES DE PROCESAMIENTO DE DATOS
// ======================================

/**
 * Procesa datos académicos y crea mapas para estadísticas
 * @param {Array} academicData - Datos académicos
 * @returns {Object} - Mapas de estudiantes, evaluaciones, docentes y relaciones
 */
const processAcademicDataForStats = (academicData) => {
  const estudiantes = new Set();
  const evaluaciones = new Set();
  const docentes = new Set();
  const estudianteAsignatura = [];
  
  academicData.forEach(row => {
    estudiantes.add(row.ID_ESTUDIANTE);
    docentes.add(row.ID_DOCENTE);
    const evalKey = `${row.ID_ESTUDIANTE}-${row.COD_ASIGNATURA}`;
    evaluaciones.add(evalKey);
    estudianteAsignatura.push({
      estudiante: row.ID_ESTUDIANTE,
      asignatura: row.COD_ASIGNATURA,
      docente: row.ID_DOCENTE,
      key: evalKey
    });
  });
  
  return { estudiantes, evaluaciones, docentes, estudianteAsignatura };
};

/**
 * Obtiene evaluaciones completadas del pool principal
 * @param {number} idConfiguracion - ID de configuración
 * @param {Set} evaluaciones - Set de evaluaciones esperadas
 * @returns {Object} - Sets de evaluaciones completadas y pendientes
 */
const getCompletedEvaluations = async (idConfiguracion, evaluaciones) => {
  const pool = await getPool();
  
  const evaluacionesQuery = `
    SELECT 
      e.DOCUMENTO_ESTUDIANTE,
      e.CODIGO_MATERIA,
      ed.ID as detalle_id
    FROM evaluaciones e
    LEFT JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
    WHERE e.ID_CONFIGURACION = ?
      AND CONCAT(e.DOCUMENTO_ESTUDIANTE, '-', e.CODIGO_MATERIA) IN (${Array(evaluaciones.size).fill('?').join(',')})
  `;
  
  const evaluacionesParams = [idConfiguracion, ...Array.from(evaluaciones)];
  const [evaluacionesData] = await pool.query(evaluacionesQuery, evaluacionesParams);
  
  const evaluacionesCompletadas = new Set();
  const evaluacionesPendientes = new Set();
  
  evaluacionesData.forEach(row => {
    const evalKey = `${row.DOCUMENTO_ESTUDIANTE}-${row.CODIGO_MATERIA}`;
    if (row.detalle_id) {
      evaluacionesCompletadas.add(evalKey);
    }
  });
  
  evaluaciones.forEach(evalKey => {
    if (!evaluacionesCompletadas.has(evalKey)) {
      evaluacionesPendientes.add(evalKey);
    }
  });
  
  return { evaluacionesCompletadas, evaluacionesPendientes };
};

/**
 * Calcula docentes completamente evaluados
 * @param {Set} docentes - Set de docentes
 * @param {Array} estudianteAsignatura - Relaciones estudiante-asignatura-docente
 * @param {Set} evaluacionesCompletadas - Set de evaluaciones completadas
 * @returns {Set} - Set de docentes evaluados
 */
const calculateEvaluatedTeachers = (docentes, estudianteAsignatura, evaluacionesCompletadas) => {
  const docentesEvaluados = new Set();
  
  docentes.forEach(docente => {
    const evaluacionesDocente = estudianteAsignatura.filter(ea => ea.docente === docente);
    const totalEvaluacionesDocente = evaluacionesDocente.length;
    const completadasDocente = evaluacionesDocente.filter(ea => 
      evaluacionesCompletadas.has(ea.key)
    ).length;
    
    if (totalEvaluacionesDocente > 0 && totalEvaluacionesDocente === completadasDocente) {
      docentesEvaluados.add(docente);
    }
  });
  
  return docentesEvaluados;
};

// ======================================
// FUNCIONES DE PROCESAMIENTO PARA RANKING/PODIO
// ======================================

/**
 * Obtiene estadísticas globales para ajuste bayesiano
 * @param {number} idConfiguracion - ID de configuración
 * @param {Array} estudiantesAsignaturasUnicos - Combinaciones únicas estudiante-asignatura
 * @returns {Object} - Estadísticas globales
 */
const getEstadisticasGlobales = async (idConfiguracion, estudiantesAsignaturasUnicos) => {
  if (estudiantesAsignaturasUnicos.length === 0) return { mediaGlobal: 0.5, totalDocentes: 0 };
  
  const pool = await getPool();
  const { placeholders, params } = createInPlaceholders(
    estudiantesAsignaturasUnicos.map(ea => ({
      estudiante: ea.estudiante,
      asignatura: ea.asignatura
    }))
  );
  
  const query = `
    WITH promedios_docente AS (
      SELECT 
        e.DOCUMENTO_DOCENTE,
        AVG(cv.PUNTAJE) as promedio_docente,
        COUNT(DISTINCT e.DOCUMENTO_ESTUDIANTE) as total_estudiantes
      FROM evaluaciones e
      JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
      JOIN configuracion_valoracion cv ON ed.VALORACION_ID = cv.VALORACION_ID
      WHERE e.ID_CONFIGURACION = ?
        AND cv.ACTIVO = TRUE
        AND (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
      GROUP BY e.DOCUMENTO_DOCENTE
      HAVING COUNT(DISTINCT e.DOCUMENTO_ESTUDIANTE) >= ?
    )
    SELECT 
      AVG(promedio_docente) as media_global,
      COUNT(*) as total_docentes,
      STDDEV(promedio_docente) as desviacion_estandar
    FROM promedios_docente
  `;
  
  const [resultado] = await pool.query(query, [idConfiguracion, ...params, RANKING_CONFIG.MIN_EVALUACIONES]);
  
  return {
    mediaGlobal: parseFloat(resultado[0]?.media_global || 0.5),
    totalDocentes: parseInt(resultado[0]?.total_docentes || 0),
    desviacionEstandar: parseFloat(resultado[0]?.desviacion_estandar || 0)
  };
};

/**
 * Obtiene evaluaciones con puntajes para ranking/podio
 * @param {number} idConfiguracion - ID de configuración
 * @param {Array} estudiantesAsignaturasUnicos - Combinaciones únicas estudiante-asignatura
 * @returns {Array} - Datos de evaluaciones con puntajes
 */
const getEvaluationsWithScores = async (idConfiguracion, estudiantesAsignaturasUnicos) => {
  if (estudiantesAsignaturasUnicos.length === 0) return [];
  
  const pool = await getPool();
  const { placeholders, params } = createInPlaceholders(
    estudiantesAsignaturasUnicos.map(ea => ({
      estudiante: ea.estudiante,
      asignatura: ea.asignatura
    }))
  );

  const evaluacionesQuery = `
    SELECT 
      e.ID,
      e.DOCUMENTO_ESTUDIANTE,
      e.DOCUMENTO_DOCENTE,
      e.CODIGO_MATERIA,
      e.ID_CONFIGURACION,
      ed.ID as detalle_id,
      cv.PUNTAJE,
      ca.ASPECTO_ID
    FROM evaluaciones e
    LEFT JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN configuracion_valoracion cv ON ed.VALORACION_ID = cv.VALORACION_ID AND cv.ACTIVO = TRUE
    LEFT JOIN configuracion_aspecto ca ON ed.ASPECTO_ID = ca.ID AND ca.ACTIVO = TRUE
    WHERE e.ID_CONFIGURACION = ?
      AND (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
  `;

  const [evaluacionesData] = await pool.query(evaluacionesQuery, [idConfiguracion, ...params]);
  return evaluacionesData;
};

/**
 * Inicializa la estructura de datos para docentes
 * @param {Array} vistaData - Datos de la vista académica
 * @returns {Map} - Mapa de docentes con datos inicializados
 */
const initializeTeachersMap = (vistaData) => {
  const docentesMap = new Map();

  vistaData.forEach(row => {
    const key = `${row.ID_DOCENTE}`;
    if (!docentesMap.has(key)) {
      docentesMap.set(key, {
        ID_DOCENTE: row.ID_DOCENTE,
        DOCENTE: row.DOCENTE,
        PERIODO: row.PERIODO,
        NOMBRE_SEDE: row.NOMBRE_SEDE,
        NOM_PROGRAMA: row.NOM_PROGRAMA,
        SEMESTRE: row.SEMESTRE,
        GRUPO: row.GRUPO,
        asignaturas: new Set(),
        estudiantes: new Set(),
        evaluaciones_esperadas: new Set(),
        evaluaciones_realizadas: new Set(),
        puntajes: [],
        total_respuestas: 0,
        estudiante_asignatura_docente: new Map()
      });
    }

    const docente = docentesMap.get(key);
    docente.asignaturas.add(row.COD_ASIGNATURA);
    docente.estudiantes.add(row.ID_ESTUDIANTE);
    
    const evaluacionKey = `${row.ID_ESTUDIANTE}-${row.COD_ASIGNATURA}`;
    docente.evaluaciones_esperadas.add(evaluacionKey);
    docente.estudiante_asignatura_docente.set(evaluacionKey, true);
  });

  return docentesMap;
};

/**
 * Procesa evaluaciones y las asocia con docentes
 * @param {Map} docentesMap - Mapa de docentes
 * @param {Array} evaluacionesData - Datos de evaluaciones
 */
const processEvaluationsForTeachers = (docentesMap, evaluacionesData) => {
  // Primero agrupar por evaluación (e.ID)
  const evaluacionesAgrupadas = evaluacionesData.reduce((acc, eval) => {
    if (!acc[eval.ID]) {
      acc[eval.ID] = {
        ...eval,
        detalles: []
      };
    }
    if (eval.detalle_id) {
      acc[eval.ID].detalles.push({
        puntaje: parseFloat(eval.PUNTAJE),
        aspecto_id: eval.ASPECTO_ID
      });
    }
    return acc;
  }, {});

  // Procesar cada evaluación agrupada
  Object.values(evaluacionesAgrupadas).forEach(eval => {
    const estudianteAsignatura = `${eval.DOCUMENTO_ESTUDIANTE}-${eval.CODIGO_MATERIA}`;
    
    for (let [docenteKey, docente] of docentesMap) {
      if (docente.estudiante_asignatura_docente.has(estudianteAsignatura)) {
        // Marcar como evaluación realizada
        docente.evaluaciones_realizadas.add(estudianteAsignatura);
        
        // Solo contar como completa si tiene detalles
        if (eval.detalles.length > 0) {
          docente.total_respuestas += eval.detalles.length;
          eval.detalles.forEach(detalle => {
            if (!isNaN(detalle.puntaje)) {
              docente.puntajes.push(detalle.puntaje);
            }
          });
        }
        
        break;
      }
    }
  });
};

/**
 * Calcula métricas finales para docentes con ajuste bayesiano
 * @param {Map} docentesMap - Mapa de docentes con datos procesados
 * @param {Object} estadisticasGlobales - Estadísticas globales para ajuste
 * @returns {Array} - Array de docentes con métricas calculadas
 */
const calculateTeacherMetrics = (docentesMap, estadisticasGlobales) => {
  return Array.from(docentesMap.values())
    .map(docente => {
      const evaluaciones_esperadas = docente.evaluaciones_esperadas.size;
      const evaluaciones_realizadas = docente.evaluaciones_realizadas.size;
      const evaluaciones_pendientes = evaluaciones_esperadas - evaluaciones_realizadas;
      const total_estudiantes = docente.estudiantes.size;
      const total_asignaturas = docente.asignaturas.size;
      
      const promedio_real = calcularPromedio(docente.puntajes);
      
      // NUEVO: Aplicar ajuste bayesiano
      const puntaje_ajustado = aplicarAjusteBayesiano(
        promedio_real,
        total_estudiantes,
        estadisticasGlobales.mediaGlobal
      );
      
      const factor_confianza = calcularFactorConfianza(total_estudiantes);
      
      const respuestas_por_estudiante = total_estudiantes > 0 
        ? parseFloat((docente.total_respuestas / total_estudiantes).toFixed(2))
        : 0;
      
      const eficiencia_respuestas = evaluaciones_realizadas > 0 
        ? parseFloat((docente.total_respuestas / evaluaciones_realizadas).toFixed(2))
        : 0;

      return {
        ID_DOCENTE: docente.ID_DOCENTE,
        DOCENTE: docente.DOCENTE,
        PERIODO: docente.PERIODO,
        NOMBRE_SEDE: docente.NOMBRE_SEDE,
        NOM_PROGRAMA: docente.NOM_PROGRAMA,
        SEMESTRE: docente.SEMESTRE,
        GRUPO: docente.GRUPO,
        TOTAL_ESTUDIANTES: total_estudiantes,
        TOTAL_ASIGNATURAS: total_asignaturas,
        PROMEDIO_GENERAL: promedio_real, // Mantener el nombre original
        PUNTAJE_AJUSTADO: puntaje_ajustado, // NUEVO campo
        FACTOR_CONFIANZA: factor_confianza, // NUEVO campo
        TOTAL_RESPUESTAS: docente.total_respuestas,
        EVALUACIONES_ESPERADAS: evaluaciones_esperadas,
        EVALUACIONES_REALIZADAS: evaluaciones_realizadas,
        EVALUACIONES_PENDIENTES: evaluaciones_pendientes,
        RESPUESTAS_POR_ESTUDIANTE: respuestas_por_estudiante,
        EFICIENCIA_RESPUESTAS: eficiencia_respuestas
      };
    })
    .filter(docente => docente.TOTAL_RESPUESTAS >= RANKING_CONFIG.MIN_EVALUACIONES);
};

/**
 * Ordena docentes para ranking usando puntaje ajustado
 * @param {Array} docentes - Array de docentes con métricas
 * @returns {Array} - Docentes ordenados para ranking
 */
const sortTeachersForRanking = (docentes) => {
  return docentes.sort((a, b) => {
    // Criterio principal: Puntaje ajustado
    if (Math.abs(b.PUNTAJE_AJUSTADO - a.PUNTAJE_AJUSTADO) > 0.001) {
      return b.PUNTAJE_AJUSTADO - a.PUNTAJE_AJUSTADO;
    }
    // Criterio secundario: Factor de confianza
    if (Math.abs(b.FACTOR_CONFIANZA - a.FACTOR_CONFIANZA) > 0.01) {
      return b.FACTOR_CONFIANZA - a.FACTOR_CONFIANZA;
    }
    // Criterio terciario: Respuestas por estudiante
    if (b.RESPUESTAS_POR_ESTUDIANTE !== a.RESPUESTAS_POR_ESTUDIANTE) {
      return b.RESPUESTAS_POR_ESTUDIANTE - a.RESPUESTAS_POR_ESTUDIANTE;
    }
    // Criterio final: ID docente para consistencia
    return a.ID_DOCENTE - b.ID_DOCENTE;
  });
};

/**
 * Crea el podio con mejores y peores docentes usando puntaje ajustado
 * @param {Array} docentes - Array de docentes con métricas
 * @returns {Array} - Podio con top mejores y peores
 */
const createPodium = (docentes) => {
  if (docentes.length === 0) return [];

  const ordenadosPorPuntajeAjustado = [...docentes].sort((a, b) => {
    if (Math.abs(b.PUNTAJE_AJUSTADO - a.PUNTAJE_AJUSTADO) > 0.001) {
      return b.PUNTAJE_AJUSTADO - a.PUNTAJE_AJUSTADO;
    }
    return b.FACTOR_CONFIANZA - a.FACTOR_CONFIANZA;
  });
  
  const topMejores = ordenadosPorPuntajeAjustado.slice(0, 3).map((docente, index) => ({
    ...docente,
    POSICION: `TOP ${index + 1} MEJOR`
  }));

  let topPeores = [];
  if (ordenadosPorPuntajeAjustado.length > 3) {
    const docentesParaPeores = ordenadosPorPuntajeAjustado.filter(docente => 
      !topMejores.some(mejor => mejor.ID_DOCENTE === docente.ID_DOCENTE)
    );
    
    topPeores = docentesParaPeores
      .slice(-3)
      .reverse()
      .map((docente, index) => ({
        ...docente,
        POSICION: `TOP ${index + 1} PEOR`
      }));
  }

  return [...topMejores, ...topPeores];
};

// ======================================
// FUNCIONES PRINCIPALES DE NEGOCIO
// ======================================

/**
 * Obtiene estadísticas del dashboard
 */
/**
 * Obtiene estadísticas del dashboard
 */
const getDashboardStats = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
  
  // Obtener datos académicos
  const academicData = await getAcademicData(filters);
  
  if (academicData.length === 0) {
    return {
      total_estudiantes: 0,
      total_evaluaciones: 0,
      evaluaciones_completadas: 0,
      evaluaciones_pendientes: 0,
      porcentaje_completado: 0,
      docentes_evaluados: 0,
      total_docentes: 0,
      porcentaje_docentes_evaluados: 0,
      estudiantes_completados: 0,
      porcentaje_estudiantes_completados: 0
    };
  }
  
  // Procesar datos académicos
  const { estudiantes, evaluaciones, docentes, estudianteAsignatura } = processAcademicDataForStats(academicData);
  
  // Obtener evaluaciones completadas
  const { evaluacionesCompletadas, evaluacionesPendientes } = await getCompletedEvaluations(idConfiguracion, evaluaciones);
  
  // Calcular docentes evaluados
  const docentesEvaluados = calculateEvaluatedTeachers(docentes, estudianteAsignatura, evaluacionesCompletadas);
  
  // Calcular estudiantes que han completado todas sus evaluaciones
  let estudiantesCompletados = 0;
  const estudiantesArray = Array.from(estudiantes);
  
  // Agrupar asignaturas por estudiante
  const asignaturasPorEstudiante = academicData.reduce((acc, row) => {
    if (!acc[row.ID_ESTUDIANTE]) {
      acc[row.ID_ESTUDIANTE] = new Set();
    }
    acc[row.ID_ESTUDIANTE].add(row.COD_ASIGNATURA);
    return acc;
  }, {});
  
  // Contar evaluaciones completadas por estudiante
  const evaluacionesCompletadasPorEstudiante = Array.from(evaluacionesCompletadas).reduce((acc, evalKey) => {
    const [estudiante, asignatura] = evalKey.split('-');
    if (!acc[estudiante]) {
      acc[estudiante] = new Set();
    }
    acc[estudiante].add(asignatura);
    return acc;
  }, {});
  
  // Verificar qué estudiantes han completado todas sus evaluaciones
  estudiantesArray.forEach(estudiante => {
    const totalAsignaturas = asignaturasPorEstudiante[estudiante]?.size || 0;
    const completadas = evaluacionesCompletadasPorEstudiante[estudiante]?.size || 0;
    
    if (totalAsignaturas > 0 && totalAsignaturas === completadas) {
      estudiantesCompletados++;
    }
  });
  
  // Calcular estadísticas finales
  const totalEstudiantes = estudiantes.size;
  const totalEvaluaciones = evaluaciones.size;
  const totalEvaluacionesCompletadas = evaluacionesCompletadas.size;
  const totalEvaluacionesPendientes = evaluacionesPendientes.size;
  const porcentajeCompletado = calcularPorcentaje(totalEvaluacionesCompletadas, totalEvaluaciones);
  
  const totalDocentes = docentes.size;
  const totalDocentesEvaluados = docentesEvaluados.size;
  const porcentajeDocentesEvaluados = calcularPorcentaje(totalDocentesEvaluados, totalDocentes);
  
  const porcentajeEstudiantesCompletados = calcularPorcentaje(estudiantesCompletados, totalEstudiantes);
  
  return {
    total_estudiantes: totalEstudiantes,
    total_evaluaciones: totalEvaluaciones,
    evaluaciones_completadas: totalEvaluacionesCompletadas,
    evaluaciones_pendientes: totalEvaluacionesPendientes,
    porcentaje_completado: porcentajeCompletado,
    docentes_evaluados: totalDocentesEvaluados,
    total_docentes: totalDocentes,
    porcentaje_docentes_evaluados: porcentajeDocentesEvaluados,
    estudiantes_completados: estudiantesCompletados,
    porcentaje_estudiantes_completados: porcentajeEstudiantesCompletados
  };
};

/**
 * Obtiene el promedio por aspectos de evaluación
 */
const getAspectosPromedio = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  const pool = await getPool();
  const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
  
  // Obtener datos académicos filtrados
  const vistaData = await getAcademicData(filters, ['ID_ESTUDIANTE', 'COD_ASIGNATURA']);
  
  if (vistaData.length === 0) {
    return [];
  }
  
  // Crear placeholders para la consulta IN
  const { placeholders, params } = createInPlaceholders(vistaData);
  
  const mainQuery = `
    SELECT 
      ae.ETIQUETA AS ASPECTO,
      ROUND(
        AVG(cv.PUNTAJE), 2
      ) AS PROMEDIO_GENERAL
    FROM evaluaciones e
    JOIN configuracion_aspecto ca 
      ON e.ID_CONFIGURACION = ca.CONFIGURACION_EVALUACION_ID
    JOIN aspectos_evaluacion ae 
      ON ca.ASPECTO_ID = ae.ID
    JOIN evaluacion_detalle ed 
      ON e.ID = ed.EVALUACION_ID AND ed.ASPECTO_ID = ca.ID
    JOIN configuracion_valoracion cv 
      ON ed.VALORACION_ID = cv.VALORACION_ID
    WHERE ca.ACTIVO = TRUE
      AND cv.ACTIVO = TRUE
      AND e.ID_CONFIGURACION = ?
      AND (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
    GROUP BY ae.ID, ae.ETIQUETA 
    ORDER BY ae.ID;
  `;
  
  const mainParams = [idConfiguracion, ...params];
  const [aspectos] = await pool.query(mainQuery, mainParams);
  return aspectos;
};

/**
 * Obtiene el ranking completo de docentes CON AJUSTE BAYESIANO
 */
const getRankingDocentes = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  try {
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
    
    // Obtener datos académicos completos
    const vistaData = await getAcademicData(filters, [
      'ID_DOCENTE', 'DOCENTE', 'ID_ESTUDIANTE', 'COD_ASIGNATURA',
      'PERIODO', 'NOMBRE_SEDE', 'NOM_PROGRAMA', 'SEMESTRE', 'GRUPO'
    ]);

    if (vistaData.length === 0) {
      console.log('No se encontraron datos en vista_academica_insitus');
      return [];
    }

    console.log(`Se encontraron ${vistaData.length} registros en vista_academica_insitus`);

    // Crear lista de estudiantes y asignaturas únicas
    const estudiantesAsignaturasUnicos = vistaData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );

    console.log(`Combinaciones únicas estudiante-asignatura: ${estudiantesAsignaturasUnicos.length}`);

    // NUEVO: Obtener estadísticas globales para ajuste bayesiano
    const estadisticasGlobales = await getEstadisticasGlobales(idConfiguracion, estudiantesAsignaturasUnicos);
    console.log('Estadísticas globales:', estadisticasGlobales);

    // Obtener evaluaciones con puntajes
    const evaluacionesData = await getEvaluationsWithScores(idConfiguracion, estudiantesAsignaturasUnicos);
    console.log(`Se encontraron ${evaluacionesData.length} respuestas de evaluación`);

    // Inicializar y procesar datos de docentes
    const docentesMap = initializeTeachersMap(vistaData);
    console.log('Docentes inicializados:', docentesMap.size);

    // Procesar evaluaciones para docentes
    processEvaluationsForTeachers(docentesMap, evaluacionesData);

    // MODIFICADO: Calcular métricas finales con ajuste bayesiano
    const docentes = calculateTeacherMetrics(docentesMap, estadisticasGlobales);
    console.log(`Docentes con métricas calculadas: ${docentes.length}`);

    // Ordenar docentes para ranking usando puntaje ajustado
    const rankingOrdenado = sortTeachersForRanking(docentes);
    
    // Agregar posición al ranking
    const rankingFinal = rankingOrdenado.map((docente, index) => ({
      ...docente,
      POSICION: index + 1
    }));

    console.log(`Ranking final generado con ${rankingFinal.length} docentes`);
    return rankingFinal;

  } catch (error) {
    console.error('Error en getRankingDocentes:', error);
    throw error;
  }
};

/**
 * Obtiene el podio de mejores y peores docentes CON AJUSTE BAYESIANO
 */
const getPodioDocentes = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  try {
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
    
    // Obtener datos académicos completos
    const vistaData = await getAcademicData(filters, [
      'ID_DOCENTE', 'DOCENTE', 'ID_ESTUDIANTE', 'COD_ASIGNATURA',
      'PERIODO', 'NOMBRE_SEDE', 'NOM_PROGRAMA', 'SEMESTRE', 'GRUPO'
    ]);

    if (vistaData.length === 0) {
      console.log('No se encontraron datos en vista_academica_insitus para podio');
      return [];
    }

    console.log(`Procesando podio con ${vistaData.length} registros`);

    // Crear lista de estudiantes y asignaturas únicas
    const estudiantesAsignaturasUnicos = vistaData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );

    // Obtener estadísticas globales para ajuste bayesiano
    const estadisticasGlobales = await getEstadisticasGlobales(idConfiguracion, estudiantesAsignaturasUnicos);
    console.log('Estadísticas globales para podio:', estadisticasGlobales);

    // Obtener evaluaciones con puntajes
    const evaluacionesData = await getEvaluationsWithScores(idConfiguracion, estudiantesAsignaturasUnicos);
    console.log(`Evaluaciones para podio: ${evaluacionesData.length}`);

    // Inicializar y procesar datos de docentes
    const docentesMap = initializeTeachersMap(vistaData);
    processEvaluationsForTeachers(docentesMap, evaluacionesData);

    // Calcular métricas finales con ajuste bayesiano
    const docentes = calculateTeacherMetrics(docentesMap, estadisticasGlobales);
    console.log(`Docentes procesados para podio: ${docentes.length}`);

    // Crear el podio
    const podio = createPodium(docentes);
    console.log(`Podio generado con ${podio.length} docentes`);

    return podio;

  } catch (error) {
    console.error('Error en getPodioDocentes:', error);
    throw error;
  }
};

/**
 * Obtiene el detalle de un docente específico
 */
const getDetalleDocente = async ({ idConfiguracion, idDocente, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  try {
    const pool = await getPool();
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
    
    // Obtener datos académicos del docente específico
    const vistaData = await getAcademicData(filters, [
      'ID_DOCENTE', 'DOCENTE', 'ID_ESTUDIANTE', 'COD_ASIGNATURA', 'ASIGNATURA',
      'PERIODO', 'NOMBRE_SEDE', 'NOM_PROGRAMA', 'SEMESTRE', 'GRUPO'
    ]);

    // Filtrar por el docente específico
    const docenteData = vistaData.filter(row => row.ID_DOCENTE == idDocente);
    
    if (docenteData.length === 0) {
      return null;
    }

    // Crear lista de estudiantes y asignaturas únicas para este docente
    const estudiantesAsignaturasUnicos = docenteData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );

    // Obtener estadísticas globales
    const estadisticasGlobales = await getEstadisticasGlobales(idConfiguracion, estudiantesAsignaturasUnicos);

    // Obtener evaluaciones del docente
    const evaluacionesData = await getEvaluationsWithScores(idConfiguracion, estudiantesAsignaturasUnicos);

    // Procesar datos del docente
    const docentesMap = initializeTeachersMap(docenteData);
    processEvaluationsForTeachers(docentesMap, evaluacionesData);

    // Calcular métricas
    const docentes = calculateTeacherMetrics(docentesMap, estadisticasGlobales);
    
    if (docentes.length === 0) {
      return null;
    }

    const detalleDocente = docentes[0];

    // Obtener detalle por aspectos
    const { placeholders, params } = createInPlaceholders(estudiantesAsignaturasUnicos);
    
    const aspectosQuery = `
      SELECT 
        ae.ETIQUETA AS ASPECTO,
        ROUND(AVG(cv.PUNTAJE), 2) AS PROMEDIO_ASPECTO,
        COUNT(cv.PUNTAJE) AS TOTAL_RESPUESTAS_ASPECTO
      FROM evaluaciones e
      JOIN configuracion_aspecto ca 
        ON e.ID_CONFIGURACION = ca.CONFIGURACION_EVALUACION_ID
      JOIN aspectos_evaluacion ae 
        ON ca.ASPECTO_ID = ae.ID
      JOIN evaluacion_detalle ed 
        ON e.ID = ed.EVALUACION_ID AND ed.ASPECTO_ID = ca.ID
      JOIN configuracion_valoracion cv 
        ON ed.VALORACION_ID = cv.VALORACION_ID
      WHERE ca.ACTIVO = TRUE
        AND cv.ACTIVO = TRUE
        AND e.ID_CONFIGURACION = ?
        AND e.DOCUMENTO_DOCENTE = ?
        AND (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
      GROUP BY ae.ID, ae.ETIQUETA 
      ORDER BY ae.ID
    `;

    const [aspectos] = await pool.query(aspectosQuery, [idConfiguracion, idDocente, ...params]);

    // Obtener lista de asignaturas del docente
    const asignaturas = [...new Set(docenteData.map(row => ({
      COD_ASIGNATURA: row.COD_ASIGNATURA,
      ASIGNATURA: row.ASIGNATURA
    })))];

    return {
      ...detalleDocente,
      ASPECTOS: aspectos,
      ASIGNATURAS: asignaturas
    };

  } catch (error) {
    console.error('Error en getDetalleDocente:', error);
    throw error;
  }
};

/**
 * Obtiene comentarios de evaluaciones para un docente específico
 */
const getComentariosDocente = async ({ idConfiguracion, idDocente, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  try {
    const pool = await getPool();
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
    
    // Obtener datos académicos del docente
    const vistaData = await getAcademicData(filters, ['ID_ESTUDIANTE', 'COD_ASIGNATURA']);
    
    if (vistaData.length === 0) {
      return [];
    }

    const { placeholders, params } = createInPlaceholders(vistaData);

    const comentariosQuery = `
      SELECT 
        e.COMENTARIO,
        e.CODIGO_MATERIA,
        e.FECHA_CREACION
      FROM evaluaciones e
      WHERE e.ID_CONFIGURACION = ?
        AND e.DOCUMENTO_DOCENTE = ?
        AND e.COMENTARIO IS NOT NULL 
        AND TRIM(e.COMENTARIO) != ''
        AND (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
      ORDER BY e.FECHA_CREACION DESC
    `;

    const [comentarios] = await pool.query(comentariosQuery, [idConfiguracion, idDocente, ...params]);

    return comentarios.map(comentario => ({
      COMENTARIO: comentario.COMENTARIO,
      MATERIA: comentario.CODIGO_MATERIA,
      FECHA: comentario.FECHA_CREACION
    }));

  } catch (error) {
    console.error('Error en getComentariosDocente:', error);
    throw error;
  }
};

/**
 * Obtiene estadísticas comparativas del docente vs promedio general
 */
const getComparativaDocente = async ({ idConfiguracion, idDocente, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  try {
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
    
    // Obtener datos académicos generales
    const vistaData = await getAcademicData(filters, [
      'ID_DOCENTE', 'DOCENTE', 'ID_ESTUDIANTE', 'COD_ASIGNATURA'
    ]);

    if (vistaData.length === 0) {
      return null;
    }

    // Datos del docente específico
    const docenteData = vistaData.filter(row => row.ID_DOCENTE == idDocente);
    
    // Crear listas de estudiantes y asignaturas
    const estudiantesAsignaturasGeneral = vistaData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );

    const estudiantesAsignaturasDocente = docenteData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );

    // Obtener estadísticas globales
    const estadisticasGlobales = await getEstadisticasGlobales(idConfiguracion, estudiantesAsignaturasGeneral);

    // Procesar datos generales
    const evaluacionesDataGeneral = await getEvaluationsWithScores(idConfiguracion, estudiantesAsignaturasGeneral);
    const docentesMapGeneral = initializeTeachersMap(vistaData);
    processEvaluationsForTeachers(docentesMapGeneral, evaluacionesDataGeneral);
    const docentesGeneral = calculateTeacherMetrics(docentesMapGeneral, estadisticasGlobales);

    // Procesar datos del docente específico
    const evaluacionesDataDocente = await getEvaluationsWithScores(idConfiguracion, estudiantesAsignaturasDocente);
    const docentesMapDocente = initializeTeachersMap(docenteData);
    processEvaluationsForTeachers(docentesMapDocente, evaluacionesDataDocente);
    const docentesEspecifico = calculateTeacherMetrics(docentesMapDocente, estadisticasGlobales);

    if (docentesEspecifico.length === 0) {
      return null;
    }

    // Calcular promedios generales
    const promedioGeneralSistema = calcularPromedio(docentesGeneral.map(d => d.PROMEDIO_GENERAL));
    const puntajeAjustadoPromedio = calcularPromedio(docentesGeneral.map(d => d.PUNTAJE_AJUSTADO));
    const factorConfianzaPromedio = calcularPromedio(docentesGeneral.map(d => d.FACTOR_CONFIANZA));

    const docenteEspecifico = docentesEspecifico[0];

    return {
      DOCENTE: docenteEspecifico,
      PROMEDIO_SISTEMA: {
        PROMEDIO_GENERAL: promedioGeneralSistema,
        PUNTAJE_AJUSTADO: puntajeAjustadoPromedio,
        FACTOR_CONFIANZA: factorConfianzaPromedio
      },
      DIFERENCIAS: {
        PROMEDIO_GENERAL: parseFloat((docenteEspecifico.PROMEDIO_GENERAL - promedioGeneralSistema).toFixed(4)),
        PUNTAJE_AJUSTADO: parseFloat((docenteEspecifico.PUNTAJE_AJUSTADO - puntajeAjustadoPromedio).toFixed(4)),
        FACTOR_CONFIANZA: parseFloat((docenteEspecifico.FACTOR_CONFIANZA - factorConfianzaPromedio).toFixed(3))
      }
    };

  } catch (error) {
    console.error('Error en getComparativaDocente:', error);
    throw error;
  }
};

// ======================================
// EXPORTACIONES
// ======================================

module.exports = {
  // Funciones principales
  getDashboardStats,
  getAspectosPromedio,
  getRankingDocentes,
  getPodioDocentes,
  getDetalleDocente,
  getComentariosDocente,
  getComparativaDocente,
  
  // Utilidades (por si se necesitan en otros módulos)
  buildWhereClause,
  getAcademicData,
  calcularPromedio,
  calcularPorcentaje,
  aplicarAjusteBayesiano,
  calcularFactorConfianza,
  
  // Configuración
  RANKING_CONFIG
};// MODIFICADO