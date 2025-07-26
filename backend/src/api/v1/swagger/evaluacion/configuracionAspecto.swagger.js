// src/api/v1/routes/evaluacion/configuracionAspecto.swagger.js
/**
 * @swagger
 * components:
 *   schemas:
 *     ConfiguracionAspecto:
 *       type: object
 *       properties:
 *         ID:
 *           type: integer
 *           description: ID único de la configuración del aspecto
 *           example: 1
 *         CONFIGURACION_EVALUACION_ID:
 *           type: integer
 *           description: ID de la configuración de evaluación
 *           example: 2
 *         ASPECTO_ID:
 *           type: integer
 *           description: ID del aspecto de evaluación relacionado
 *           example: 5
 *         ORDEN:
 *           type: number
 *           format: decimal
 *           description: Orden o peso del aspecto en la configuración de evaluación
 *           example: 1.00
 *         ACTIVO:
 *           type: boolean
 *           description: Estado del aspecto (true para activo, false para inactivo)
 *           example: true
 *     ConfiguracionAspectoConDetalles:
 *       type: object
 *       properties:
 *         ID:
 *           type: integer
 *           description: ID único de la configuración del aspecto
 *           example: 1
 *         CONFIGURACION_EVALUACION_ID:
 *           type: integer
 *           description: ID de la configuración de evaluación
 *           example: 2
 *         ASPECTO_ID:
 *           type: integer
 *           description: ID del aspecto de evaluación relacionado
 *           example: 5
 *         ETIQUETA:
 *           type: string
 *           description: Etiqueta del aspecto (información de tabla relacionada)
 *           example: "Aspecto 1"
 *         DESCRIPCION:
 *           type: string
 *           description: Descripción del aspecto (información de tabla relacionada)
 *           example: "Descripción del aspecto 1"
 *         ORDEN:
 *           type: number
 *           format: decimal
 *           description: Orden o peso del aspecto en la configuración de evaluación
 *           example: 1.00
 *         ACTIVO:
 *           type: boolean
 *           description: Estado del aspecto (true para activo, false para inactivo)
 *           example: true
 *     ConfiguracionAspectoInput:
 *       type: object
 *       required:
 *         - CONFIGURACION_EVALUACION_ID
 *         - ASPECTO_ID
 *         - ORDEN
 *         - ACTIVO
 *       properties:
 *         CONFIGURACION_EVALUACION_ID:
 *           type: integer
 *           description: ID de la configuración de evaluación
 *           example: 2
 *         ASPECTO_ID:
 *           type: integer
 *           description: ID del aspecto de evaluación relacionado
 *           example: 5
 *         ORDEN:
 *           type: number
 *           format: decimal
 *           description: Orden o peso del aspecto en la configuración de evaluación
 *           example: 1.00
 *         ACTIVO:
 *           type: boolean
 *           description: Estado del aspecto (true para activo, false para inactivo)
 *           example: true
 *     PaginatedConfiguracionAspectoResponse:
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
 *             $ref: '#/components/schemas/ConfiguracionAspectoConDetalles'
 *         pagination:
 *           $ref: '#/components/schemas/PaginationInfo'
 */

/**
 * @swagger
 * /configuracion-aspecto:
 *   get:
 *     summary: Obtener todos los aspectos configurados en la evaluación
 *     description: Obtiene una lista paginada de todas las configuraciones de aspecto
 *     tags: [Configuración Aspecto]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - $ref: '#/components/parameters/OffsetParam'
 *     responses:
 *       200:
 *         description: Lista paginada de configuraciones de aspecto
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedConfiguracionAspectoResponse'
 *             examples:
 *               success:
 *                 summary: Respuesta exitosa con paginación
 *                 value:
 *                   success: true
 *                   message: "Datos obtenidos exitosamente"
 *                   data:
 *                     - ID: 1
 *                       CONFIGURACION_EVALUACION_ID: 2
 *                       ASPECTO_ID: 5
 *                       ETIQUETA: "Aspecto 1"
 *                       DESCRIPCION: "Descripción del aspecto 1"
 *                       ORDEN: 1.00
 *                       ACTIVO: true
 *                     - ID: 2
 *                       CONFIGURACION_EVALUACION_ID: 2
 *                       ASPECTO_ID: 3
 *                       ETIQUETA: "Aspecto 2"
 *                       DESCRIPCION: "Descripción del aspecto 2"
 *                       ORDEN: 2.00
 *                       ACTIVO: true
 *                   pagination:
 *                     currentPage: 1
 *                     totalPages: 3
 *                     totalItems: 25
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
 *     summary: Crear una nueva configuración de aspecto
 *     description: Crea una nueva configuración de aspecto en el sistema
 *     tags: [Configuración Aspecto]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfiguracionAspectoInput'
 *           examples:
 *             example1:
 *               summary: Ejemplo de creación
 *               value:
 *                 CONFIGURACION_EVALUACION_ID: 2
 *                 ASPECTO_ID: 5
 *                 ORDEN: 1.00
 *                 ACTIVO: true
 *     responses:
 *       201:
 *         description: Configuración de aspecto creada correctamente
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
 *                   example: "Configuración de aspecto creada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/ConfiguracionAspecto'
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
 * /configuracion-aspecto/{id}:
 *   get:
 *     summary: Obtener una configuración de aspecto por ID
 *     tags: [Configuración Aspecto]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la configuración del aspecto
 *     responses:
 *       200:
 *         description: Datos de la configuración de aspecto
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
 *                   $ref: '#/components/schemas/ConfiguracionAspectoConDetalles'
 *             examples:
 *               success:
 *                 summary: Respuesta exitosa
 *                 value:
 *                   success: true
 *                   message: "Datos obtenidos exitosamente"
 *                   data:
 *                     ID: 1
 *                     CONFIGURACION_EVALUACION_ID: 2
 *                     ASPECTO_ID: 5
 *                     ETIQUETA: "Aspecto 1"
 *                     DESCRIPCION: "Descripción del aspecto 1"
 *                     ORDEN: 1.00
 *                     ACTIVO: true
 *       404:
 *         description: Configuración de aspecto no encontrada
 *       500:
 *         description: Error del servidor
 *   put:
 *     summary: Actualizar una configuración de aspecto
 *     tags: [Configuración Aspecto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la configuración del aspecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConfiguracionAspectoInput'
 *     responses:
 *       200:
 *         description: Configuración de aspecto actualizada correctamente
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
 *                   example: "Configuración actualizada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/ConfiguracionAspecto'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Configuración de aspecto no encontrada
 *       500:
 *         description: Error del servidor
 *   delete:
 *     summary: Eliminar una configuración de aspecto
 *     tags: [Configuración Aspecto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la configuración del aspecto
 *     responses:
 *       200:
 *         description: Configuración de aspecto eliminada correctamente
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
 *                   example: "Configuración de aspecto eliminada correctamente"
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Configuración de aspecto no encontrada
 *       500:
 *         description: Error del servidor
 */

/**
 * @swagger
 * /configuracion-aspecto/{id}/estado:
 *   patch:
 *     summary: Actualizar el estado (activo/inactivo) de una configuración de aspecto
 *     tags: [Configuración Aspecto]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID de la configuración de aspecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - activo
 *             properties:
 *               activo:
 *                 type: boolean
 *                 description: Nuevo estado de la configuración de aspecto
 *                 example: false
 *     responses:
 *       200:
 *         description: Estado actualizado correctamente
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
 *                   example: "Estado actualizado correctamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     activo:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Valor inválido para el estado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Sin permisos suficientes
 *       404:
 *         description: Configuración de aspecto no encontrada
 *       500:
 *         description: Error del servidor
 */