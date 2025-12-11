/**
 * Consultas SQL para el módulo de Docentes
 * Separadas por base de datos (local y remotas)
 */

// =============================================================================
// CONSULTAS PARA BASE DE DATOS LOCAL (sigedin_ies_v4)
// =============================================================================

/**
 * Obtener todas las evaluaciones recibidas por un docente
 */
const getEvaluacionesDocenteQuery = `
    SELECT * FROM vista_evaluaciones_docente
    WHERE DOCUMENTO_DOCENTE = ?
    ORDER BY fecha_evaluacion DESC
`;

/**
 * Obtener evaluaciones de un docente filtradas por materia
 */
const getEvaluacionesDocenteMateriaQuery = `
    SELECT * FROM vista_evaluaciones_docente
    WHERE DOCUMENTO_DOCENTE = ? AND CODIGO_MATERIA = ?
    ORDER BY fecha_evaluacion DESC
`;

/**
 * Obtener estadísticas generales de un docente
 */
const getEstadisticasDocenteQuery = `
    SELECT * FROM vista_estadisticas_docente_materia
    WHERE DOCUMENTO_DOCENTE = ?
`;

/**
 * Obtener estadísticas de un docente por materia específica
 */
const getEstadisticasDocenteMateriaQuery = `
    SELECT * FROM vista_estadisticas_docente_materia
    WHERE DOCUMENTO_DOCENTE = ? AND CODIGO_MATERIA = ?
`;

/**
 * Obtener rendimiento por aspectos evaluados de un docente
 */
const getAspectosDocenteQuery = `
    SELECT * FROM vista_aspectos_por_docente
    WHERE DOCUMENTO_DOCENTE = ?
    ORDER BY aspecto, promedio_aspecto DESC
`;

/**
 * Obtener rendimiento por aspectos de un docente en una materia específica
 */
const getAspectosDocenteMateriaQuery = `
    SELECT * FROM vista_aspectos_por_docente
    WHERE DOCUMENTO_DOCENTE = ? AND CODIGO_MATERIA = ?
    ORDER BY aspecto, promedio_aspecto DESC
`;

/**
 * Obtener resumen de aspectos con distribución de valoraciones
 */
const getResumenAspectosDocenteQuery = `
    SELECT * FROM vista_resumen_aspectos_docente
    WHERE DOCUMENTO_DOCENTE = ?
    ORDER BY promedio_aspecto DESC
`;

/**
 * Obtener resumen de aspectos por materia con distribución de valoraciones
 */
const getResumenAspectosDocenteMateriaQuery = `
    SELECT * FROM vista_resumen_aspectos_docente
    WHERE DOCUMENTO_DOCENTE = ? AND CODIGO_MATERIA = ?
    ORDER BY promedio_aspecto DESC
`;

/**
 * Obtener lista de materias evaluadas por un docente
 */
const getMateriasDocenteEvaluadasQuery = `
    SELECT * FROM vista_materias_docente
    WHERE DOCUMENTO_DOCENTE = ?
    ORDER BY promedio_general DESC, total_evaluaciones DESC
`;

/**
 * Obtener comentarios recibidos por un docente
 */
const getComentariosDocenteQuery = `
    SELECT * FROM vista_comentarios_docente
    WHERE DOCUMENTO_DOCENTE = ?
    ORDER BY FECHA_CREACION DESC
    LIMIT ? OFFSET ?
`;

/**
 * Obtener comentarios de un docente por materia
 */
const getComentariosDocenteMateriaQuery = `
    SELECT * FROM vista_comentarios_docente
    WHERE DOCUMENTO_DOCENTE = ? AND CODIGO_MATERIA = ?
    ORDER BY FECHA_CREACION DESC
`;

/**
 * Obtener detalle completo de una evaluación específica
 */
const getDetalleEvaluacionQuery = `
    SELECT 
        e.*,
        ed.ID as detalle_id,
        ae.ETIQUETA as aspecto,
        ae.DESCRIPCION as descripcion_aspecto,
        ev.VALOR as valor_valoracion,
        ev.ETIQUETA as etiqueta_valoracion,
        cv.PUNTAJE,
        ed.COMENTARIO as comentario_aspecto
    FROM EVALUACIONES e
    LEFT JOIN EVALUACION_DETALLE ed ON e.ID = ed.EVALUACION_ID
    LEFT JOIN CONFIGURACION_ASPECTO ca ON ed.ASPECTO_ID = ca.ID
    LEFT JOIN ASPECTOS_EVALUACION ae ON ca.ASPECTO_ID = ae.ID
    LEFT JOIN CONFIGURACION_VALORACION cv ON ed.VALORACION_ID = cv.ID
    LEFT JOIN ESCALA_VALORACION ev ON cv.VALORACION_ID = ev.ID
    WHERE e.ID = ?
    ORDER BY ca.ORDEN
`;

/**
 * Verificar si un docente tiene evaluaciones
 */
const verificarEvaluacionesDocenteQuery = `
    SELECT COUNT(*) as total
    FROM EVALUACIONES
    WHERE DOCUMENTO_DOCENTE = ?
`;

// =============================================================================
// CONSULTAS PARA BASE DE DATOS REMOTA (sigedin_ies)
// =============================================================================

/**
 * Obtener información completa de un docente
 */
const getDocenteInfoQuery = `
    SELECT 
        p.cedula_persona,
        p.primer_nombre,
        p.segundo_nombre,
        p.primer_apellido,
        p.segundo_apellido,
        p.correo_personal,
        p.correo_institucional,
        d.codigo_docente
    FROM sigedin_ies.persona p
    INNER JOIN sigedin_ies.docente d ON p.cedula_persona = d.cedula_persona
    WHERE p.cedula_persona = ?
`;

/**
 * Obtener información de una materia específica
 */
const getMateriaInfoQuery = `
    SELECT 
        m.codigo_materia,
        m.nombre_materia,
        m.creditos,
        s.nombre_semestre,
        s.anio,
        s.periodo
    FROM sigedin_ies.materia m
    INNER JOIN sigedin_ies.semestre s ON m.codigo_semestre = s.codigo_semestre
    WHERE m.codigo_materia = ?
`;

/**
 * Obtener todas las materias de un docente
 */
const getMateriasDocenteQuery = `
    SELECT DISTINCT
        m.codigo_materia,
        m.nombre_materia,
        m.creditos,
        s.nombre_semestre,
        s.anio,
        s.periodo
    FROM sigedin_ies.materia m
    INNER JOIN sigedin_ies.semestre s ON m.codigo_semestre = s.codigo_semestre
    INNER JOIN sigedin_ies.docente_materia dm ON m.codigo_materia = dm.codigo_materia
    INNER JOIN sigedin_ies.docente d ON dm.codigo_docente = d.codigo_docente
    WHERE d.cedula_persona = ?
    ORDER BY s.anio DESC, s.periodo DESC, m.nombre_materia
`;

/**
 * Obtener información de un estudiante
 */
const getEstudianteInfoQuery = `
    SELECT 
        p.cedula_persona,
        p.primer_nombre,
        p.segundo_nombre,
        p.primer_apellido,
        p.segundo_apellido,
        p.correo_personal,
        p.correo_institucional,
        e.codigo_estudiante
    FROM sigedin_ies.persona p
    INNER JOIN sigedin_ies.estudiante e ON p.cedula_persona = e.cedula_persona
    WHERE p.cedula_persona = ?
`;

/**
 * Obtener estudiantes matriculados en una materia
 */
const getEstudiantesMatriculadosQuery = `
    SELECT 
        p.cedula_persona,
        p.primer_nombre,
        p.segundo_nombre,
        p.primer_apellido,
        p.segundo_apellido,
        p.correo_institucional,
        e.codigo_estudiante
    FROM sigedin_ies.persona p
    INNER JOIN sigedin_ies.estudiante e ON p.cedula_persona = e.cedula_persona
    INNER JOIN sigedin_ies.estudiante_materia em ON e.codigo_estudiante = em.codigo_estudiante
    WHERE em.codigo_materia = ?
    ORDER BY p.primer_apellido, p.segundo_apellido, p.primer_nombre
`;

// =============================================================================
// EXPORTAR TODAS LAS CONSULTAS
// =============================================================================

module.exports = {
    // Consultas para base de datos local (sigedin_ies_v4)
    getEvaluacionesDocenteQuery,
    getEvaluacionesDocenteMateriaQuery,
    getEstadisticasDocenteQuery,
    getEstadisticasDocenteMateriaQuery,
    getAspectosDocenteQuery,
    getAspectosDocenteMateriaQuery,
    getResumenAspectosDocenteQuery,
    getResumenAspectosDocenteMateriaQuery,
    getMateriasDocenteEvaluadasQuery,
    getComentariosDocenteQuery,
    getComentariosDocenteMateriaQuery,
    getDetalleEvaluacionQuery,
    verificarEvaluacionesDocenteQuery,
    
    // Consultas para base de datos remota (sigedin_ies)
    getDocenteInfoQuery,
    getMateriaInfoQuery,
    getMateriasDocenteQuery,
    getEstudianteInfoQuery,
    getEstudiantesMatriculadosQuery
};
