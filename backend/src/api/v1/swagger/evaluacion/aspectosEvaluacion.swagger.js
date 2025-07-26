/**
 * @swagger
 * components:
 *   schemas:
 *     AspectoEvaluacion:
 *       type: object
 *       properties:
 *         ID:
 *           type: integer
 *           description: ID único del aspecto de evaluación
 *           example: 1
 *         ETIQUETA:
 *           type: string
 *           description: Nombre o etiqueta del aspecto de evaluación
 *           example: "Participación"
 *         DESCRIPCION:
 *           type: string
 *           description: Descripción detallada del aspecto de evaluación
 *           example: "Evaluación de la participación activa de los estudiantes"
 *     AspectoEvaluacionInput:
 *       type: object
 *       required:
 *         - ETIQUETA
 *       properties:
 *         ETIQUETA:
 *           type: string
 *           description: Nombre o etiqueta del aspecto de evaluación
 *           example: "Participación"
 *         DESCRIPCION:
 *           type: string
 *           description: Descripción detallada del aspecto de evaluación
 *           example: "Evaluación de la participación activa de los estudiantes"
 *     PaginationInfo:
 *       type: object
 *       properties:
 *         currentPage:
 *           type: integer
 *           description: Página actual
 *           example: 1
 *         totalPages:
 *           type: integer
 *           description: Total de páginas
 *           example: 5
 *         totalItems:
 *           type: integer
 *           description: Total de elementos
 *           example: 47
 *         itemsPerPage:
 *           type: integer
 *           description: Elementos por página
 *           example: 10
 *         hasNextPage:
 *           type: boolean
 *           description: Indica si hay página siguiente
 *           example: true
 *         hasPrevPage:
 *           type: boolean
 *           description: Indica si hay página anterior
 *           example: false
 *         nextPage:
 *           type: integer
 *           nullable: true
 *           description: Número de página siguiente
 *           example: 2
 *         prevPage:
 *           type: integer
 *           nullable: true
 *           description: Número de página anterior
 *           example: null
 *     PaginatedResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "Datos obtenidos exitosamente"
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/AspectoEvaluacion'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 *   parameters:
 *     PageParam:
 *       name: page
 *       in: query
 *       description: Número de página (por defecto 1)
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         default: 1
 *         example: 1
 *     LimitParam:
 *       name: limit
 *       in: query
 *       description: Número de elementos por página (por defecto 10, máximo 50)
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 1
 *         maximum: 50
 *         default: 10
 *         example: 10
 *     OffsetParam:
 *       name: offset
 *       in: query
 *       description: Número de elementos a saltar (alternativa a page)
 *       required: false
 *       schema:
 *         type: integer
 *         minimum: 0
 *         default: 0
 *         example: 0
 */

/**
 * @swagger
 * /aspectos-evaluacion:
 *   get:
 *     summary: Obtener todos los aspectos de evaluación
 *     description: Obtiene una lista paginada de todos los aspectos de evaluación
 *     tags: [Aspectos de Evaluación]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Lista paginada de aspectos de evaluación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *             examples:
 *               success:
 *                 summary: Respuesta exitosa con paginación
 *                 value:
 *                   success: true
 *                   message: "Datos obtenidos exitosamente"
 *                   data:
 *                     - ID: 1
 *                       ETIQUETA: "Participación"
 *                       DESCRIPCION: "Evaluación de la participación activa de los estudiantes"
 *                     - ID: 2
 *                       ETIQUETA: "Puntualidad"
 *                       DESCRIPCION: "Evaluación de la puntualidad en entregas"
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 5
 *                     totalItems: 47
 *                     itemsPerPage: 10
 *                     hasNextPage: true
 *                     hasPrevPage: false
 *                     nextPage: 2
 *                     prevPage: null
 *       500:
 *         description: Error del servidor
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
 *                   example: "Error al obtener los datos"
 *   post:
 *     summary: Crear un nuevo aspecto de evaluación
 *     description: Crea un nuevo aspecto de evaluación en el sistema
 *     tags: [Aspectos de Evaluación]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AspectoEvaluacionInput'
 *           examples:
 *             example1:
 *               summary: Ejemplo de creación
 *               value:
 *                 ETIQUETA: "Creatividad"
 *                 DESCRIPCION: "Evaluación de la creatividad en las actividades"
 *     responses:
 *       201:
 *         description: Aspecto creado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Aspecto creado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/AspectoEvaluacion'
 *       400:
 *         description: Datos de entrada inválidos
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
 *                   example: "Datos inválidos"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /aspectos-evaluacion/{id}:
 *   get:
 *     summary: Obtener un aspecto de evaluación por ID
 *     description: Obtiene los detalles de un aspecto de evaluación específico
 *     tags: [Aspectos de Evaluación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del aspecto de evaluación
 *         example: 1
 *     responses:
 *       200:
 *         description: Datos del aspecto de evaluación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Datos obtenidos exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/AspectoEvaluacion'
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Aspecto no encontrado
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
 *                   example: "Aspecto no encontrado"
 *       500:
 *         description: Error del servidor
 *   put:
 *     summary: Actualizar un aspecto de evaluación
 *     description: Actualiza los datos de un aspecto de evaluación existente
 *     tags: [Aspectos de Evaluación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del aspecto de evaluación
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AspectoEvaluacionInput'
 *           examples:
 *             example1:
 *               summary: Ejemplo de actualización
 *               value:
 *                 ETIQUETA: "Participación Actualizada"
 *                 DESCRIPCION: "Evaluación actualizada de la participación"
 *     responses:
 *       200:
 *         description: Aspecto actualizado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Aspecto actualizado exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/AspectoEvaluacion'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Aspecto no encontrado
 *       500:
 *         description: Error del servidor
 *   delete:
 *     summary: Eliminar un aspecto de evaluación
 *     description: Elimina un aspecto de evaluación del sistema
 *     tags: [Aspectos de Evaluación]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID del aspecto de evaluación
 *         example: 1
 *     responses:
 *       200:
 *         description: Aspecto eliminado correctamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Aspecto de evaluación eliminado correctamente"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Aspecto no encontrado
 *       500:
 *         description: Error del servidor
 */
