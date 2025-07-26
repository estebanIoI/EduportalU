/**
 * @swagger
 * tags:
 *   name: Reportes Docentes
 *   description: Endpoints para consultas de reportes de docentes
 */

/**
 * @swagger
 * /reportes/docentes/asignaturas:
 *   get:
 *     summary: Obtiene lista de docentes con sus asignaturas y progreso de evaluación
 *     description: Retorna información detallada de docentes, sus asignaturas asignadas y el progreso de evaluaciones con filtros dinámicos opcionales
 *     tags: [Reportes Docentes]
 *     parameters:
 *       - in: query
 *         name: idConfiguracion
 *         schema:
 *           type: integer
 *         description: ID de configuración de evaluación
 *         example: 1
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *         description: Período académico
 *         example: "2025-1"
 *       - in: query
 *         name: nombreSede
 *         schema:
 *           type: string
 *         description: Nombre de la sede educativa
 *         example: "SEDE NORTE"
 *       - in: query
 *         name: nomPrograma
 *         schema:
 *           type: string
 *         description: Nombre del programa académico
 *         example: "Estadística"
 *       - in: query
 *         name: semestre
 *         schema:
 *           type: string
 *         description: Semestre académico
 *         example: "4 SEMESTRE"
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         description: Grupo específico
 *         example: "G2"
 *     responses:
 *       200:
 *         description: Lista de docentes con sus asignaturas obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indica si la operación fue exitosa
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Lista de docentes con sus asignaturas
 *                   items:
 *                     type: object
 *                     properties:
 *                       COD_ASIGNATURA:
 *                         type: string
 *                         description: Código único de la asignatura
 *                         example: "MAT101"
 *                       ASIGNATURA:
 *                         type: string
 *                         description: Nombre completo de la asignatura
 *                         example: "Matemáticas Básicas"
 *                       ID_DOCENTE:
 *                         type: string
 *                         description: Identificador único del docente
 *                         example: "DOC001"
 *                       DOCENTE:
 *                         type: string
 *                         description: Nombre completo del docente
 *                         example: "María García López"
 *                       SEMESTRE_PREDOMINANTE:
 *                         type: string
 *                         description: Semestre con mayor cantidad de estudiantes
 *                         example: "4 SEMESTRE"
 *                       PROGRAMA_PREDOMINANTE:
 *                         type: string
 *                         description: Programa académico con mayor cantidad de estudiantes
 *                         example: "Estadística"
 *                       NOMBRE_SEDE:
 *                         type: string
 *                         description: Nombre de la sede donde se imparte
 *                         example: "SEDE NORTE"
 *                       total_evaluaciones_esperadas:
 *                         type: integer
 *                         description: Total de evaluaciones que deberían completarse
 *                         example: 45
 *                       evaluaciones_completadas:
 *                         type: integer
 *                         description: Número de evaluaciones ya completadas
 *                         example: 38
 *                       evaluaciones_pendientes:
 *                         type: integer
 *                         description: Número de evaluaciones aún pendientes
 *                         example: 7
 *                       porcentaje_completado:
 *                         type: number
 *                         format: float
 *                         description: Porcentaje de evaluaciones completadas (0-100)
 *                         example: 84.44
 *                       estado_evaluacion:
 *                         type: string
 *                         enum: [COMPLETADO, NO INICIADO, EN PROGRESO]
 *                         description: Estado actual del proceso de evaluación
 *                         example: "EN PROGRESO"
 *                 filters_applied:
 *                   type: object
 *                   description: Filtros aplicados en la consulta
 *                   properties:
 *                     idConfiguracion:
 *                       type: integer
 *                       nullable: true
 *                       description: ID de configuración aplicado
 *                       example: 123
 *                     periodo:
 *                       type: string
 *                       nullable: true
 *                       description: Período filtrado
 *                       example: "2025-5"
 *                     nombreSede:
 *                       type: string
 *                       nullable: true
 *                       description: Sede filtrada
 *                       example: "SEDE NORTE"
 *                     nomPrograma:
 *                       type: string
 *                       nullable: true
 *                       description: Programa filtrado
 *                       example: "Estadística"
 *                     semestre:
 *                       type: string
 *                       nullable: true
 *                       description: Semestre filtrado
 *                       example: "4 SEMESTRE"
 *                     grupo:
 *                       type: string
 *                       nullable: true
 *                       description: Grupo filtrado
 *                       example: "G2"
 *             examples:
 *               success_response:
 *                 summary: Respuesta exitosa con datos
 *                 value:
 *                   success: true
 *                   data:
 *                     - COD_ASIGNATURA: "MAT101"
 *                       ASIGNATURA: "Matemáticas Básicas"
 *                       ID_DOCENTE: "DOC001"
 *                       DOCENTE: "María García López"
 *                       SEMESTRE_PREDOMINANTE: "4 SEMESTRE"
 *                       PROGRAMA_PREDOMINANTE: "Estadística"
 *                       NOMBRE_SEDE: "SEDE NORTE"
 *                       total_evaluaciones_esperadas: 45
 *                       evaluaciones_completadas: 38
 *                       evaluaciones_pendientes: 7
 *                       porcentaje_completado: 84.44
 *                       estado_evaluacion: "EN PROGRESO"
 *                     - COD_ASIGNATURA: "EST201"
 *                       ASIGNATURA: "Estadística Descriptiva"
 *                       ID_DOCENTE: "DOC002"
 *                       DOCENTE: "Juan Pérez Ruiz"
 *                       SEMESTRE_PREDOMINANTE: "4 SEMESTRE"
 *                       PROGRAMA_PREDOMINANTE: "Estadística"
 *                       NOMBRE_SEDE: "SEDE NORTE"
 *                       total_evaluaciones_esperadas: 30
 *                       evaluaciones_completadas: 30
 *                       evaluaciones_pendientes: 0
 *                       porcentaje_completado: 100.00
 *                       estado_evaluacion: "COMPLETADO"
 *                   filters_applied:
 *                     idConfiguracion: 123
 *                     periodo: "2025-5"
 *                     nombreSede: "SEDE NORTE"
 *                     nomPrograma: "Estadística"
 *                     semestre: "4 SEMESTRE"
 *                     grupo: "G2"
 *               empty_response:
 *                 summary: Respuesta exitosa sin datos
 *                 value:
 *                   success: true
 *                   data: []
 *                   filters_applied:
 *                     idConfiguracion: null
 *                     periodo: null
 *                     nombreSede: null
 *                     nomPrograma: null
 *                     semestre: null
 *                     grupo: null
 *       500:
 *         description: Error interno del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 error:
 *                   type: string
 *                   description: Mensaje de error principal
 *                   example: "Error al obtener la lista de docentes y asignaturas"
 *                 detalle:
 *                   type: string
 *                   description: Detalle técnico del error
 *                   example: "Database connection failed"
 *             examples:
 *               server_error:
 *                 summary: Error del servidor
 *                 value:
 *                   success: false
 *                   error: "Error al obtener la lista de docentes y asignaturas"
 *                   detalle: "Database connection failed"
 */

/**
 * @swagger
 * /reportes/docentes/estudiantes-evaluados/{idDocente}/{codAsignatura}/{grupo}:
 *   get:
 *     summary: Obtiene estudiantes evaluados por docente, materia y grupo
 *     tags: [Reportes Docentes]
 *     parameters:
 *       - in: path
 *         name: idDocente
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del docente
 *       - in: path
 *         name: codAsignatura
 *         required: true
 *         schema:
 *           type: string
 *         description: Código de la asignatura
 *       - in: path
 *         name: grupo
 *         required: true
 *         schema:
 *           type: string
 *         description: Grupo de la asignatura
 *     responses:
 *       200:
 *         description: Estadísticas de estudiantes evaluados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_estudiantes:
 *                   type: integer
 *                   description: Total de estudiantes
 *                 evaluaciones_realizadas:
 *                   type: integer
 *                   description: Número de evaluaciones realizadas
 *                 evaluaciones_sin_realizar:
 *                   type: integer
 *                   description: Número de evaluaciones sin realizar
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /reportes/docentes/aspectos-puntaje:
 *   get:
 *     summary: Obtiene aspectos y puntajes promedio por docente
 *     tags: [Reportes Docentes]
 *     parameters:
 *       - in: query
 *         name: idDocente
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del docente
 *       - in: query
 *         name: idConfiguracion
 *         schema:
 *           type: integer
 *         description: ID de configuración de evaluación
 *         example: 1
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *         description: Período académico
 *         example: "2025-1"
 *       - in: query
 *         name: nombreSede
 *         schema:
 *           type: string
 *         description: Nombre de la sede educativa
 *         example: "SEDE NORTE"
 *       - in: query
 *         name: nomPrograma
 *         schema:
 *           type: string
 *         description: Nombre del programa académico
 *         example: "Estadística"
 *       - in: query
 *         name: semestre
 *         schema:
 *           type: string
 *         description: Semestre académico
 *         example: "4 SEMESTRE"
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         description: Grupo específico
 *         example: "G2"
 *     responses:
 *       200:
 *         description: Lista de aspectos y puntajes promedio
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID_DOCENTE:
 *                     type: string
 *                     description: ID del docente
 *                   DOCENTE:
 *                     type: string
 *                     description: Nombre del docente
 *                   ASPECTO:
 *                     type: string
 *                     description: Etiqueta del aspecto
 *                   descripcion:
 *                     type: string
 *                     description: Descripción del aspecto
 *                   PUNTAJE_PROMEDIO:
 *                     type: number
 *                     format: float
 *                     description: Puntaje promedio del aspecto
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /reportes/docentes/comentarios/{idDocente}:
 *   get:
 *     summary: Obtiene comentarios por docente
 *     tags: [Reportes Docentes]
 *     parameters:
 *       - in: path
 *         name: idDocente
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del docente
 *     responses:
 *       200:
 *         description: Lista de comentarios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   ID_DOCENTE:
 *                     type: string
 *                     description: ID del docente
 *                   DOCENTE:
 *                     type: string
 *                     description: Nombre del docente
 *                   ASPECTO:
 *                     type: string
 *                     description: Etiqueta del aspecto
 *                   descripcion:
 *                     type: string
 *                     description: Descripción del aspecto
 *                   COMENTARIO_GENERAL:
 *                     type: string
 *                     description: Comentario general de la evaluación
 *                   COMENTARIO:
 *                     type: string
 *                     description: Comentario específico del aspecto
 *       500:
 *         description: Error del servidor
 */ 