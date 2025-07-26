/**
 * @swagger
 * components:
 *   schemas:
 *     VistaAcademica:
 *       type: object
 *       properties:
 *         ID:
 *           type: integer
 *           example: 1
 *         SEMESTRE_MATRICULA:
 *           type: string
 *           example: 2024-1
 *         SEDE:
 *           type: string
 *           example: BOG
 *         CODIGO_ESTUDIANTE:
 *           type: string
 *           example: 100200
 *         DOCUMENTO_ESTUDIANTE:
 *           type: string
 *           example: 1234567890
 *         CODIGO_MATERIA:
 *           type: string
 *           example: MAT101
 *         NOMBRE_MATERIA:
 *           type: string
 *           example: Matemáticas Básicas
 *         CREDITOS_MATERIA:
 *           type: integer
 *           example: 3
 *         NOMBRE_DOCENTE:
 *           type: string
 *           example: Juan Pérez
 *         DOCUMENTO_DOCENTE:
 *           type: string
 *           example: 987654321
 *         CORREO_DOCENTE:
 *           type: string
 *           example: juan.perez@universidad.edu
 *         ESTADO_MATERIA:
 *           type: string
 *           enum: [INSCRITO, CANCELADA, APROBADA, REPROBADA]
 *           example: INSCRITO
 *         NOTA_CORTE_1:
 *           type: number
 *           format: float
 *           example: 3.5
 *         PESO_NOTA_1:
 *           type: integer
 *           example: 30
 *         NOTA_CORTE_2:
 *           type: number
 *           format: float
 *           example: 4.0
 *         PESO_NOTA_2:
 *           type: integer
 *           example: 30
 *         NOTA_CORTE_3:
 *           type: number
 *           format: float
 *           example: 3.8
 *         PESO_NOTA_3:
 *           type: integer
 *           example: 40
 *         VECES_INSCRITO:
 *           type: integer
 *           example: 1
 *         VECES_PERDIDA:
 *           type: integer
 *           example: 0
 *         VECES_CANCELADA:
 *           type: integer
 *           example: 0
 *     FiltrosDinamicos:
 *       type: object
 *       properties:
 *         PRIMER_NOMBRE:
 *           type: string
 *           example: Juan
 *         SEGUNDO_NOMBRE:
 *           type: string
 *           example: Carlos
 *         PRIMER_APELLIDO:
 *           type: string
 *           example: Pérez
 *         SEGUNDO_APELLIDO:
 *           type: string
 *           example: García
 *         ID_ESTUDIANTE:
 *           type: string
 *           example: 1234567890
 *         ID_DOCENTE:
 *           type: string
 *           example: 987654321
 *         ASIGNATURA:
 *           type: string
 *           example: Matemáticas I
 *         COD_ASIGNATURA:
 *           type: string
 *           example: MAT101
 *         SEMESTRE:
 *           type: string
 *           example: 1
 *         GRUPO:
 *           type: string
 *           example: A
 *         DOCENTE:
 *           type: string
 *           example: Dr. María López
 *         NOMBRE_SEDE:
 *           type: string
 *           example: Sede Principal
 *         PERIODO:
 *           type: string
 *           example: 2024-1
 *         NOM_PROGRAMA:
 *           type: string
 *           example: Ingeniería de Sistemas
 *         NOTA_FINAL:
 *           type: number
 *           format: float
 *           example: 4.2
 *     OpcionesFiltros:
 *       type: object
 *       properties:
 *         sedes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: Sede Principal
 *               label:
 *                 type: string
 *                 example: Sede Principal
 *         programas:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: Ingeniería de Sistemas
 *               label:
 *                 type: string
 *                 example: Ingeniería de Sistemas
 *         semestres:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: 1
 *               label:
 *                 type: string
 *                 example: 1
 *         grupos:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 example: A
 *               label:
 *                 type: string
 *                 example: A
 */

/**
 * @swagger
 * /academica:
 *   get:
 *     summary: Get all academic data
 *     tags: [Vista Academica]
 *     responses:
 *       200:
 *         description: List of academic data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/VistaAcademica'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /academica/opciones-filtros:
 *   get:
 *     summary: Get available filter options based on applied filters
 *     tags: [Vista Academica]
 *     parameters:
 *       - in: query
 *         name: periodo
 *         schema:
 *           type: string
 *         required: true
 *         description: Periodo académico (obligatorio)
 *         example: "2024-1"
 *       - in: query
 *         name: sede
 *         schema:
 *           type: string
 *         required: false
 *         description: Nombre de la sede
 *         example: "Sede Principal"
 *       - in: query
 *         name: programa
 *         schema:
 *           type: string
 *         required: false
 *         description: Nombre del programa académico
 *         example: "Ingeniería de Sistemas"
 *       - in: query
 *         name: semestre
 *         schema:
 *           type: string
 *         required: false
 *         description: Semestre académico
 *         example: "1"
 *       - in: query
 *         name: grupo
 *         schema:
 *           type: string
 *         required: false
 *         description: Grupo académico
 *         example: "A"
 *     responses:
 *       200:
 *         description: Available filter options
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/OpcionesFiltros'
 *                 filters_applied:
 *                   type: object
 *                   properties:
 *                     periodo:
 *                       type: string
 *                       example: "2024-1"
 *                     sede:
 *                       type: string
 *                       example: "Sede Principal"
 *                     programa:
 *                       type: string
 *                       example: "Ingeniería de Sistemas"
 *                     semestre:
 *                       type: string
 *                       example: "1"
 *       400:
 *         description: Bad request - periodo parameter is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "El parámetro 'periodo' es obligatorio"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /academica/periodos:
 *   get:
 *     summary: Get all distinct periods
 *     tags: [Vista Academica]
 *     responses:
 *       200:
 *         description: List of distinct periods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: "2024-1"
 *                       label:
 *                         type: string
 *                         example: "2024-1"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /academica/sedes:
 *   get:
 *     summary: Get all distinct sedes
 *     tags: [Vista Academica]
 *     responses:
 *       200:
 *         description: List of distinct sedes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: "Sede Principal"
 *                       label:
 *                         type: string
 *                         example: "Sede Principal"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /academica/programas:
 *   get:
 *     summary: Get all distinct programs
 *     tags: [Vista Academica]
 *     responses:
 *       200:
 *         description: List of distinct programs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: "Ingeniería de Sistemas"
 *                       label:
 *                         type: string
 *                         example: "Ingeniería de Sistemas"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /academica/semestres:
 *   get:
 *     summary: Get all distinct semesters
 *     tags: [Vista Academica]
 *     responses:
 *       200:
 *         description: List of distinct semesters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: "1"
 *                       label:
 *                         type: string
 *                         example: "1"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /academica/grupos:
 *   get:
 *     summary: Get all distinct groups
 *     tags: [Vista Academica]
 *     responses:
 *       200:
 *         description: List of distinct groups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         example: "A"
 *                       label:
 *                         type: string
 *                         example: "A"
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /academica/{id}:
 *   get:
 *     summary: Get academic data by student or teacher ID
 *     tags: [Vista Academica]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Document ID of student or teacher
 *         example: "1234567890"
 *     responses:
 *       200:
 *         description: Academic data for the specified ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FiltrosDinamicos'
 *       404:
 *         description: Academic data not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Vista Académica no encontrada"
 *       500:
 *         description: Server error
 */