const { getPool, getRemotePool } = require('../../../../db');

// ======================================
// UTILIDADES COMPARTIDAS
// ======================================

const buildWhereClause = (filters, alias = 'va') => {
  const { periodo, nombreSede, nomPrograma, semestre, grupo, idDocente } = filters;
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
  
  if (idDocente) {
    conditions.push(`${alias}.ID_DOCENTE = ?`);
    params.push(idDocente);
  }
  
  return {
    clause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
    params
  };
};

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

const createSimpleInPlaceholders = (items) => {
  const placeholders = items.map(() => '?').join(', ');
  return { placeholders, params: items };
};

const createInPlaceholders = (items) => {
  const placeholders = items.map(() => '(?, ?)').join(', ');
  const params = items.flatMap(item => [
    item.estudiante || item.ID_ESTUDIANTE, 
    item.asignatura || item.COD_ASIGNATURA
  ]);
  return { placeholders, params };
};

const calcularPromedio = (valores) => {
  if (valores.length === 0) return 0.00;
  const suma = valores.reduce((sum, valor) => sum + parseFloat(valor || 0), 0);
  return parseFloat((suma / valores.length).toFixed(2));
};

const calcularPorcentaje = (numerador, denominador) => {
  if (denominador === 0) return 0;
  return Math.round((numerador / denominador) * 100 * 100) / 100;
};

const getCompletedEvaluationsMap = async (idConfiguracion, combinaciones) => {
  if (combinaciones.length === 0) return new Map();
  
  const pool = await getPool();
  const { placeholders, params } = createInPlaceholders(combinaciones);
  
  // Si no se proporciona idConfiguracion, buscar evaluaciones sin filtrar por configuración
  // pero asegurándose de que tengan detalle completado
  let evaluacionesQuery;
  let evaluacionesParams;
  
  if (idConfiguracion) {
    evaluacionesQuery = `
      SELECT 
        e.DOCUMENTO_ESTUDIANTE,
        e.CODIGO_MATERIA,
        ed.ID as detalle_id
      FROM evaluaciones e
      LEFT JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
      WHERE e.ID_CONFIGURACION = ?
        AND (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
    `;
    evaluacionesParams = [idConfiguracion, ...params];
  } else {
    // Sin idConfiguracion, buscar cualquier evaluación completada (con detalle)
    evaluacionesQuery = `
      SELECT 
        e.DOCUMENTO_ESTUDIANTE,
        e.CODIGO_MATERIA,
        COUNT(DISTINCT ed.ID) as tiene_detalle
      FROM evaluaciones e
      LEFT JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
      WHERE (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
      GROUP BY e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA
      HAVING tiene_detalle > 0
    `;
    evaluacionesParams = params;
  }
  
  const [evaluacionesData] = await pool.query(evaluacionesQuery, evaluacionesParams);
  
  const evaluationMap = new Map();
  evaluacionesData.forEach(row => {
    // Asegurar que ambos valores sean strings para consistencia en las claves
    const key = `${String(row.DOCUMENTO_ESTUDIANTE)}-${String(row.CODIGO_MATERIA)}`;
    if (idConfiguracion) {
      if (row.detalle_id !== null) {
        evaluationMap.set(key, true);
      }
    } else {
      // Para la consulta agrupada, si llegó aquí ya tiene detalle
      evaluationMap.set(key, true);
    }
  });
  
  return evaluationMap;
};

// ======================================
// FUNCIONES DE PROCESAMIENTO DE DATOS MEJORADAS
// ======================================

const findPredominantValue = (countsMap) => {
  let maxCount = 0;
  let predominantValue = null;
  
  countsMap.forEach((count, value) => {
    if (count > maxCount) {
      maxCount = count;
      predominantValue = value;
    } else if (count === maxCount) {
      // En caso de empate, preferir el semestre más bajo
      if (value < predominantValue) {
        predominantValue = value;
      }
    }
  });
  
  return predominantValue;
};

const processAcademicDataForTeachersAssignments = (academicData, filters = {}) => {
  // Paso 1: Calcular semestres predominantes por asignatura
  const subjectSemesterMap = new Map();

  academicData.forEach(row => {
    const subjectKey = `${row.ID_DOCENTE}-${row.COD_ASIGNATURA}-${row.NOMBRE_SEDE}`;
    
    if (!subjectSemesterMap.has(subjectKey)) {
      subjectSemesterMap.set(subjectKey, {
        semesterCounts: new Map(),
        programCounts: new Map(),
        allStudents: []
      });
    }
    
    const subjectData = subjectSemesterMap.get(subjectKey);
    subjectData.allStudents.push(row);
    
    // Contar semestres para determinar predominante
    const semCount = subjectData.semesterCounts.get(row.SEMESTRE) || 0;
    subjectData.semesterCounts.set(row.SEMESTRE, semCount + 1);
    
    // Contar programas para determinar predominante
    const progCount = subjectData.programCounts.get(row.NOM_PROGRAMA) || 0;
    subjectData.programCounts.set(row.NOM_PROGRAMA, progCount + 1);
  });

  // Paso 2: Determinar semestre predominante para cada asignatura
  const predominantSemesters = new Map();
  subjectSemesterMap.forEach((data, key) => {
    let maxCount = 0;
    let predominantSemester = '';
    
    data.semesterCounts.forEach((count, semester) => {
      if (count > maxCount || (count === maxCount && semester < predominantSemester)) {
        maxCount = count;
        predominantSemester = semester;
      }
    });
    
    predominantSemesters.set(key, predominantSemester);
  });

  // Paso 3: Reorganizar los datos
  const finalData = new Map();
  
  subjectSemesterMap.forEach((subjectData, subjectKey) => {
    const [idDocente, codAsignatura, nombreSede] = subjectKey.split('-');
    const predominantSemester = predominantSemesters.get(subjectKey);
    
    // Aplicar filtro de semestre si existe
    if (filters.semestre && filters.semestre !== predominantSemester) {
      return; // Saltar asignaturas que no coincidan con el filtro
    }
    
    const predominantProgram = findPredominantValue(subjectData.programCounts);
    
    if (!finalData.has(idDocente)) {
      finalData.set(idDocente, {
        ID_DOCENTE: idDocente,
        DOCENTE: subjectData.allStudents[0].DOCENTE,
        total_evaluaciones_esperadas: 0,
        evaluaciones_completadas: 0,
        asignaturas: new Map()
      });
    }
    
    const docenteData = finalData.get(idDocente);
    const asignaturaKey = `${codAsignatura}-${nombreSede}`;
    
    if (!docenteData.asignaturas.has(asignaturaKey)) {
      docenteData.asignaturas.set(asignaturaKey, {
        SEMESTRE_PREDOMINANTE: predominantSemester,
        PROGRAMA_PREDOMINANTE: predominantProgram,
        COD_ASIGNATURA: codAsignatura,
        ASIGNATURA: subjectData.allStudents[0].ASIGNATURA,
        NOMBRE_SEDE: nombreSede,
        grupos: new Map(),
        total_evaluaciones_esperadas: 0,
        evaluaciones_completadas: 0
      });
    }
    
    const asignaturaData = docenteData.asignaturas.get(asignaturaKey);
    
    // Procesar estudiantes
    subjectData.allStudents.forEach(student => {
      const grupo = student.GRUPO;
      
      if (!asignaturaData.grupos.has(grupo)) {
        asignaturaData.grupos.set(grupo, {
          GRUPO: grupo,
          total_evaluaciones_esperadas: 0,
          evaluaciones_completadas: 0,
          estudiantes: new Set()
        });
      }
      
      const grupoData = asignaturaData.grupos.get(grupo);
      // Asegurar que ambos valores sean strings para consistencia con evaluationMap
      const studentKey = `${String(student.ID_ESTUDIANTE)}-${String(codAsignatura)}`;
      
      if (!grupoData.estudiantes.has(studentKey)) {
        grupoData.estudiantes.add(studentKey);
        grupoData.total_evaluaciones_esperadas += 1;
        asignaturaData.total_evaluaciones_esperadas += 1;
        docenteData.total_evaluaciones_esperadas += 1;
      }
    });
  });

  // Convertir a estructura final
  return Array.from(finalData.values()).map(docente => ({
    ...docente,
    asignaturas: Array.from(docente.asignaturas.values()).map(asignatura => ({
      ...asignatura,
      grupos: Array.from(asignatura.grupos.values())
    }))
  }));
};

const buildTeachersAssignmentsResults = (processedData, evaluationMap) => {
  processedData.forEach(docente => {
    docente.asignaturas.forEach(asignatura => {
      asignatura.grupos.forEach(grupo => {
        let completadas = 0;
        
        grupo.estudiantes.forEach(studentKey => {
          if (evaluationMap.has(studentKey)) {
            completadas++;
          }
        });
        
        grupo.evaluaciones_completadas = completadas;
        grupo.porcentaje_completado = calcularPorcentaje(completadas, grupo.total_evaluaciones_esperadas);
        
        asignatura.evaluaciones_completadas += completadas;
      });
      
      asignatura.porcentaje_completado = calcularPorcentaje(
        asignatura.evaluaciones_completadas,
        asignatura.total_evaluaciones_esperadas
      );
      
      docente.evaluaciones_completadas += asignatura.evaluaciones_completadas;
    });
    
    docente.evaluaciones_pendientes = docente.total_evaluaciones_esperadas - docente.evaluaciones_completadas;
    docente.porcentaje_completado = calcularPorcentaje(
      docente.evaluaciones_completadas,
      docente.total_evaluaciones_esperadas
    );
    
    docente.estado_evaluacion = 
      docente.evaluaciones_pendientes === 0 ? 'COMPLETADO' :
      docente.evaluaciones_completadas === 0 ? 'NO INICIADO' : 'EN PROGRESO';
  });
  
  return processedData;
};

// ======================================
// FUNCIONES PRINCIPALES DE NEGOCIO
// ======================================

const getDocentesAsignaturasModel = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo, idDocente, pagination }) => {
  try {
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo, idDocente };
    
    // Obtener datos académicos sin filtrar por semestre predominante
    const academicData = await getAcademicData({ ...filters, semestre: undefined }, [
      'COD_ASIGNATURA', 'ASIGNATURA', 'ID_DOCENTE', 'DOCENTE',
      'SEMESTRE', 'NOM_PROGRAMA', 'NOMBRE_SEDE', 'GRUPO', 'ID_ESTUDIANTE'
    ]);
    
    if (academicData.length === 0) return [];
    
    // Obtener evaluaciones completadas - asegurar strings para consistencia
    const combinaciones = academicData
      .map(row => ({ 
        estudiante: String(row.ID_ESTUDIANTE), 
        asignatura: String(row.COD_ASIGNATURA) 
      }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );
    
    const evaluationMap = await getCompletedEvaluationsMap(idConfiguracion, combinaciones);
    
    // Procesar datos aplicando filtro de semestre predominante
    const processedData = processAcademicDataForTeachersAssignments(academicData, { semestre });
    
    // Construir resultados finales
    const finalResults = processedData.map(docente => {
      let evaluaciones_completadas_docente = 0;
      
      docente.asignaturas.forEach(asignatura => {
        let evaluaciones_completadas_asignatura = 0;
        
        asignatura.grupos.forEach(grupo => {
          let completadas = 0;
          grupo.estudiantes.forEach(studentKey => {
            if (evaluationMap.has(studentKey)) completadas++;
          });
          
          grupo.evaluaciones_completadas = completadas;
          grupo.porcentaje_completado = calcularPorcentaje(completadas, grupo.total_evaluaciones_esperadas);
          evaluaciones_completadas_asignatura += completadas;
        });
        
        // Actualizar estadísticas de la asignatura
        asignatura.evaluaciones_completadas = evaluaciones_completadas_asignatura;
        asignatura.porcentaje_completado = calcularPorcentaje(
          evaluaciones_completadas_asignatura, 
          asignatura.total_evaluaciones_esperadas
        );
        
        evaluaciones_completadas_docente += evaluaciones_completadas_asignatura;
      });
      
      return {
        ...docente,
        evaluaciones_completadas: evaluaciones_completadas_docente,
        evaluaciones_pendientes: docente.total_evaluaciones_esperadas - evaluaciones_completadas_docente,
        porcentaje_completado: calcularPorcentaje(evaluaciones_completadas_docente, docente.total_evaluaciones_esperadas),
        estado_evaluacion: 
          evaluaciones_completadas_docente === 0 ? 'NO INICIADO' :
          docente.total_evaluaciones_esperadas === evaluaciones_completadas_docente ? 'COMPLETADO' : 'EN PROGRESO'
      };
    });
    
    finalResults.sort((a, b) => b.porcentaje_completado - a.porcentaje_completado);
    
    if (pagination) {
      const limit = parseInt(pagination.limit);
      const offset = parseInt(pagination.offset);
      return finalResults.slice(offset, offset + limit);
    }
    
    return finalResults;
  } catch (error) {
    console.error('Error in getDocentesAsignaturasModel:', error);
    throw error;
  }
};

const getCount = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo, idDocente }) => {
  try {
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo, idDocente };
    const academicData = await getAcademicData(filters, [
      'COD_ASIGNATURA', 'ASIGNATURA', 'ID_DOCENTE', 'DOCENTE',
      'SEMESTRE', 'NOM_PROGRAMA', 'NOMBRE_SEDE', 'GRUPO', 'ID_ESTUDIANTE'
    ]);
    
    if (academicData.length === 0) return 0;
    
    const combinaciones = academicData
      .map(row => ({ 
        estudiante: String(row.ID_ESTUDIANTE), 
        asignatura: String(row.COD_ASIGNATURA) 
      }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );
    
    const evaluationMap = await getCompletedEvaluationsMap(idConfiguracion, combinaciones);
    const processedData = processAcademicDataForTeachersAssignments(academicData);
    const finalResults = buildTeachersAssignmentsResults(processedData, evaluationMap);
    
    return finalResults.length;
  } catch (error) {
    console.error('Error en getDocentesAsignaturasCount:', error);
    throw error;
  }
};

const getEstudiantesEvaluadosModel = async (idDocente, codAsignatura, grupo) => {
  try {
    const remotePool = await getRemotePool();
    const localPool = await getPool();
    
    const estudiantesQuery = `
      SELECT DISTINCT ID_ESTUDIANTE
      FROM vista_academica_insitus
      WHERE ID_DOCENTE = ? AND COD_ASIGNATURA = ? AND GRUPO = ?
    `;
    const [estudiantes] = await remotePool.query(estudiantesQuery, [idDocente, codAsignatura, grupo]);
    
    if (estudiantes.length === 0) {
      return {
        total_estudiantes: 0,
        evaluaciones_realizadas: 0,
        evaluaciones_sin_realizar: 0
      };
    }
    
    const combinaciones = estudiantes.map(est => ({
      estudiante: est.ID_ESTUDIANTE,
      asignatura: codAsignatura
    }));
    
    const { placeholders, params } = createInPlaceholders(combinaciones);
    
    // Consultar evaluaciones de docentes (in-situ) con detalle
    const evaluacionesQuery = `
      SELECT 
        e.DOCUMENTO_ESTUDIANTE,
        COUNT(DISTINCT ed.ID) as tiene_evaluacion
      FROM evaluaciones e
      LEFT JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
      WHERE (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
      GROUP BY e.DOCUMENTO_ESTUDIANTE
    `;
    const [evaluaciones] = await localPool.query(evaluacionesQuery, params);
    
    // Consultar evaluaciones genéricas completadas
    const documentosEstudiantes = estudiantes.map(est => est.ID_ESTUDIANTE);
    const placeholdersGenericas = documentosEstudiantes.map(() => '?').join(', ');
    
    const evaluacionesGenericasQuery = `
      SELECT DISTINCT DOCUMENTO_ESTUDIANTE
      FROM EVALUACIONES_GENERICAS
      WHERE DOCUMENTO_ESTUDIANTE IN (${placeholdersGenericas})
        AND ESTADO = 'completada'
    `;
    const [evaluacionesGenericas] = await localPool.query(evaluacionesGenericasQuery, documentosEstudiantes);
    
    const total_estudiantes = estudiantes.length;
    
    // Combinar estudiantes con evaluación de docentes
    const estudiantesConEvaluacion = new Set(
      evaluaciones
        .filter(ev => ev.tiene_evaluacion > 0)
        .map(ev => ev.DOCUMENTO_ESTUDIANTE)
    );
    
    // Agregar estudiantes con evaluación genérica completada
    evaluacionesGenericas.forEach(ev => {
      estudiantesConEvaluacion.add(ev.DOCUMENTO_ESTUDIANTE);
    });
    
    return {
      total_estudiantes,
      evaluaciones_realizadas: estudiantesConEvaluacion.size,
      evaluaciones_sin_realizar: total_estudiantes - estudiantesConEvaluacion.size
    };
  } catch (error) {
    console.error('Error in getEstudiantesEvaluadosModel:', error);
    throw error;
  }
};

/**
 * Obtiene puntajes promedio por aspectos de evaluación para un docente con filtros
 */
const getAspectosPuntajeModel = async ({ idDocente, idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo }) => {
  try {
    const remotePool = await getRemotePool();
    const localPool = await getPool();

    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo, idDocente };
    const whereClause = buildWhereClause(filters, 'va');

    const vistaQuery = `
      SELECT DISTINCT
        va.ID_DOCENTE, 
        va.DOCENTE, 
        va.ID_ESTUDIANTE, 
        va.COD_ASIGNATURA,
        va.SEMESTRE,
        va.NOM_PROGRAMA,
        va.NOMBRE_SEDE,
        va.GRUPO,
        va.PERIODO
      FROM vista_academica_insitus va
      ${whereClause.clause}
    `;

    //console.log('[DEBUG] vistaQuery:', vistaQuery);
    //console.log('[DEBUG] vistaParams:', whereClause.params);

    const [vistaData] = await remotePool.query(vistaQuery, whereClause.params);

    //console.log('[DEBUG] vistaData:', vistaData);

    if (vistaData.length === 0) {
      console.warn('[WARN] No se encontraron registros en vista_academica_insitus con los filtros dados.');
      return [];
    }

    const combinaciones = vistaData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );

    //console.log('[DEBUG] combinaciones estudiante-asignatura:', combinaciones);

    if (combinaciones.length === 0) {
      console.warn('[WARN] No se generaron combinaciones únicas de estudiante-asignatura.');
      return [];
    }

    const { placeholders, params } = createInPlaceholders(combinaciones);

    let evaluacionesQuery = `
      SELECT 
        e.DOCUMENTO_ESTUDIANTE,
        e.CODIGO_MATERIA,
        a.ETIQUETA AS ASPECTO,
        a.descripcion,
        cv.PUNTAJE
      FROM evaluaciones e
      JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
      JOIN aspectos_evaluacion a ON ed.ASPECTO_ID = a.ID
      JOIN configuracion_valoracion cv ON ed.VALORACION_ID = cv.VALORACION_ID
      WHERE (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
    `;

    const evaluacionesParams = [...params];

    if (idConfiguracion) {
      evaluacionesQuery += ' AND e.ID_CONFIGURACION = ?';
      evaluacionesParams.push(idConfiguracion);
    }

    evaluacionesQuery += ' ORDER BY a.ETIQUETA';

    //console.log('[DEBUG] evaluacionesQuery:', evaluacionesQuery);
    //console.log('[DEBUG] evaluacionesParams:', evaluacionesParams);

    const [evaluacionesData] = await localPool.query(evaluacionesQuery, evaluacionesParams);

    //console.log('[DEBUG] evaluacionesData:', evaluacionesData);

    if (evaluacionesData.length === 0) {
      console.warn('[WARN] No se encontraron evaluaciones en la base de datos local.');
      return [];
    }

    const resultMap = new Map();

    evaluacionesData.forEach(eval => {
      const key = eval.ASPECTO;

      if (!resultMap.has(key)) {
        resultMap.set(key, {
          ASPECTO: eval.ASPECTO,
          descripcion: eval.descripcion,
          puntajes: []
        });
      }

      resultMap.get(key).puntajes.push(parseFloat(eval.PUNTAJE) || 0);
    });

    const result = Array.from(resultMap.values()).map(item => ({
      ASPECTO: item.ASPECTO,
      descripcion: item.descripcion,
      PUNTAJE_PROMEDIO: calcularPromedio(item.puntajes),
      TOTAL_EVALUACIONES: item.puntajes.length
    }));

    result.sort((a, b) => a.ASPECTO.localeCompare(b.ASPECTO));

    if (vistaData.length > 0) {
      const docenteInfo = vistaData[0];
      return result.map(item => ({
        ID_DOCENTE: docenteInfo.ID_DOCENTE,
        DOCENTE: docenteInfo.DOCENTE,
        SEMESTRE: docenteInfo.SEMESTRE,
        NOM_PROGRAMA: docenteInfo.NOM_PROGRAMA,
        NOMBRE_SEDE: docenteInfo.NOMBRE_SEDE,
        GRUPO: docenteInfo.GRUPO,
        ...item
      }));
    }

    return result;
  } catch (error) {
    console.error('[ERROR] Error en getAspectosPuntajeModel:', error);
    throw error;
  }
};

const getInformeDownload = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo, pagination }) => {
  try {
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
         
    // Obtener datos académicos sin filtrar por semestre predominante
    const academicData = await getAcademicData({ ...filters, semestre: undefined }, [
      'COD_ASIGNATURA', 'ASIGNATURA', 'ID_DOCENTE', 'DOCENTE',
      'SEMESTRE', 'NOM_PROGRAMA', 'NOMBRE_SEDE', 'GRUPO', 'ID_ESTUDIANTE'
    ]);
         
    if (academicData.length === 0) return [];
         
    // Obtener evaluaciones completadas
    const combinaciones = academicData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );
         
    const evaluationMap = await getCompletedEvaluationsMap(idConfiguracion, combinaciones);
         
    // Procesar datos aplicando filtro de semestre predominante
    const processedData = processAcademicDataForTeachersAssignments(academicData, { semestre });

    // **OPTIMIZACIÓN: Obtener todos los aspectos en una sola consulta**
    const aspectosMap = await getAllAspectosPuntajeOptimized({
      idConfiguracion,
      periodo,
      nombreSede,
      nomPrograma,
      semestre,
      grupo,
      docenteIds: processedData.map(d => d.ID_DOCENTE)
    });
         
    // Construir resultados finales
    const finalResults = processedData.map(docente => {
      let evaluaciones_completadas = 0;
             
      docente.asignaturas.forEach(asignatura => {
        asignatura.grupos.forEach(grupo => {
          let completadas = 0;
          grupo.estudiantes.forEach(studentKey => {
            if (evaluationMap.has(studentKey)) completadas++;
          });
                     
          grupo.evaluaciones_completadas = completadas;
          grupo.porcentaje_completado = calcularPorcentaje(completadas, grupo.total_evaluaciones_esperadas);
          evaluaciones_completadas += completadas;
        });
      });

      // Obtener aspectos desde el Map (ya cargado)
      const aspectosDocente = aspectosMap.get(docente.ID_DOCENTE) || [];
             
      return {
        ...docente,
        evaluaciones_completadas,
        evaluaciones_pendientes: docente.total_evaluaciones_esperadas - evaluaciones_completadas,
        porcentaje_completado: calcularPorcentaje(evaluaciones_completadas, docente.total_evaluaciones_esperadas),
        estado_evaluacion: 
          evaluaciones_completadas === 0 ? 'NO INICIADO' :
          docente.total_evaluaciones_esperadas === evaluaciones_completadas ? 'COMPLETADO' : 'EN PROGRESO',
        aspectos_evaluacion: aspectosDocente
      };
    });
         
    finalResults.sort((a, b) => b.porcentaje_completado - a.porcentaje_completado);
         
    if (pagination) {
      const limit = parseInt(pagination.limit);
      const offset = parseInt(pagination.offset);
      return finalResults.slice(offset, offset + limit);
    }
         
    return finalResults;
  } catch (error) {
    console.error('Error in getDocentesAsignaturasModel:', error);
    throw error;
  }
};

// **Nueva función optimizada para obtener todos los aspectos de una vez**
const getAllAspectosPuntajeOptimized = async ({ idConfiguracion, periodo, nombreSede, nomPrograma, semestre, grupo, docenteIds }) => {
  try {
    const remotePool = await getRemotePool();
    const localPool = await getPool();

    // Crear placeholders para los IDs de docentes
    const docentePlaceholders = docenteIds.map(() => '?').join(',');
    
    const filters = { periodo, nombreSede, nomPrograma, semestre, grupo };
    const whereClause = buildWhereClause(filters, 'va');
    
    // Agregar filtro para los docentes específicos
    const docenteFilter = docenteIds.length > 0 ? `AND va.ID_DOCENTE IN (${docentePlaceholders})` : '';

    const vistaQuery = `
      SELECT DISTINCT
        va.ID_DOCENTE, 
        va.DOCENTE, 
        va.ID_ESTUDIANTE, 
        va.COD_ASIGNATURA,
        va.SEMESTRE,
        va.NOM_PROGRAMA,
        va.NOMBRE_SEDE,
        va.GRUPO,
        va.PERIODO
      FROM vista_academica_insitus va
      ${whereClause.clause}
      ${docenteFilter}
    `;

    const vistaParams = [...whereClause.params, ...docenteIds];
    const [vistaData] = await remotePool.query(vistaQuery, vistaParams);

    if (vistaData.length === 0) {
      return new Map();
    }

    // Crear un mapa de estudiante-asignatura -> docente para poder relacionar después
    const estudianteAsignaturaDocenteMap = new Map();
    vistaData.forEach(row => {
      const key = `${row.ID_ESTUDIANTE}-${row.COD_ASIGNATURA}`;
      estudianteAsignaturaDocenteMap.set(key, row.ID_DOCENTE);
    });

    const combinaciones = vistaData
      .map(row => ({ estudiante: row.ID_ESTUDIANTE, asignatura: row.COD_ASIGNATURA }))
      .filter((item, index, self) =>
        index === self.findIndex(t => t.estudiante === item.estudiante && t.asignatura === item.asignatura)
      );

    if (combinaciones.length === 0) {
      return new Map();
    }

    const { placeholders, params } = createInPlaceholders(combinaciones);

    let evaluacionesQuery = `
      SELECT 
        e.DOCUMENTO_ESTUDIANTE,
        e.CODIGO_MATERIA,
        a.ETIQUETA AS ASPECTO,
        a.descripcion,
        cv.PUNTAJE
      FROM evaluaciones e
      JOIN evaluacion_detalle ed ON e.ID = ed.EVALUACION_ID
      JOIN aspectos_evaluacion a ON ed.ASPECTO_ID = a.ID
      JOIN configuracion_valoracion cv ON ed.VALORACION_ID = cv.VALORACION_ID
      WHERE (e.DOCUMENTO_ESTUDIANTE, e.CODIGO_MATERIA) IN (${placeholders})
    `;

    const evaluacionesParams = [...params];

    if (idConfiguracion) {
      evaluacionesQuery += ' AND e.ID_CONFIGURACION = ?';
      evaluacionesParams.push(idConfiguracion);
    }

    evaluacionesQuery += ' ORDER BY a.ETIQUETA';

    const [evaluacionesData] = await localPool.query(evaluacionesQuery, evaluacionesParams);

    // Agrupar por docente y aspecto usando el mapa de relación
    const docenteAspectoMap = new Map();

    evaluacionesData.forEach(eval => {
      const key = `${eval.DOCUMENTO_ESTUDIANTE}-${eval.CODIGO_MATERIA}`;
      const docenteId = estudianteAsignaturaDocenteMap.get(key);
      
      if (!docenteId) return; // Skip si no encontramos el docente
      
      const aspecto = eval.ASPECTO;
      
      if (!docenteAspectoMap.has(docenteId)) {
        docenteAspectoMap.set(docenteId, new Map());
      }
      
      const aspectoMap = docenteAspectoMap.get(docenteId);
      
      if (!aspectoMap.has(aspecto)) {
        aspectoMap.set(aspecto, {
          ASPECTO: eval.ASPECTO,
          descripcion: eval.descripcion,
          puntajes: []
        });
      }
      
      aspectoMap.get(aspecto).puntajes.push(parseFloat(eval.PUNTAJE) || 0);
    });

    // Convertir a formato final
    const resultMap = new Map();
    
    docenteAspectoMap.forEach((aspectoMap, docenteId) => {
      const aspectos = Array.from(aspectoMap.values()).map(item => ({
        ASPECTO: item.ASPECTO,
        descripcion: item.descripcion,
        PUNTAJE_PROMEDIO: calcularPromedio(item.puntajes)
      }));
      
      aspectos.sort((a, b) => a.ASPECTO.localeCompare(b.ASPECTO));
      resultMap.set(docenteId, aspectos);
    });

    return resultMap;
  } catch (error) {
    console.error('[ERROR] Error en getAllAspectosPuntajeOptimized:', error);
    return new Map();
  }
};

module.exports = {
  getCount,
  getDocentesAsignaturasModel,
  getEstudiantesEvaluadosModel,
  getAspectosPuntajeModel,
  getInformeDownload
};