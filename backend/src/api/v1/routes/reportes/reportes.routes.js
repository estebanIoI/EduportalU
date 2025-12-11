/**
 * @fileoverview Rutas de Reportes para el módulo de administrador
 * @description Define todas las rutas del API de reportes
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const reportesController = require('../../controllers/reportes/reportes.controller');

// ======================================
// RUTAS DE ESTRUCTURA ORGANIZACIONAL
// ======================================

/**
 * @swagger
 * /api/v1/reportes/facultades:
 *   get:
 *     summary: Obtiene todas las facultades activas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de facultades
 */
router.get('/facultades', reportesController.getFacultades);

/**
 * @swagger
 * /api/v1/reportes/programas:
 *   get:
 *     summary: Obtiene todos los programas
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: facultadId
 *         schema:
 *           type: integer
 *         description: Filtrar por facultad (opcional)
 *     responses:
 *       200:
 *         description: Lista de programas
 */
router.get('/programas', reportesController.getProgramas);

// ======================================
// RUTAS DE REPORTES PRINCIPALES
// ======================================

/**
 * @swagger
 * /api/v1/reportes/programa/{id}:
 *   get:
 *     summary: Obtiene el reporte completo de un programa
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del programa
 *       - in: query
 *         name: idConfiguracion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración de evaluación
 *       - in: query
 *         name: incluirIA
 *         schema:
 *           type: boolean
 *         description: Incluir análisis de IA (default false)
 *     responses:
 *       200:
 *         description: Reporte del programa con docentes, materias y estadísticas
 *       404:
 *         description: Programa no encontrado
 */
router.get('/programa/:id', reportesController.getReportePrograma);

/**
 * @swagger
 * /api/v1/reportes/facultad/{id}:
 *   get:
 *     summary: Obtiene el reporte consolidado de una facultad
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la facultad
 *       - in: query
 *         name: idConfiguracion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración de evaluación
 *       - in: query
 *         name: incluirIA
 *         schema:
 *           type: boolean
 *         description: Incluir análisis de IA (default false)
 *     responses:
 *       200:
 *         description: Reporte consolidado de la facultad
 *       404:
 *         description: Facultad no encontrada
 */
router.get('/facultad/:id', reportesController.getReporteFacultad);

/**
 * @swagger
 * /api/v1/reportes/institucional:
 *   get:
 *     summary: Obtiene el reporte institucional consolidado
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: idConfiguracion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración de evaluación
 *       - in: query
 *         name: incluirIA
 *         schema:
 *           type: boolean
 *         description: Incluir análisis de IA y tendencias (default false)
 *     responses:
 *       200:
 *         description: Reporte institucional completo
 */
router.get('/institucional', reportesController.getReporteInstitucional);

// ======================================
// RUTAS DE DETALLE
// ======================================

/**
 * @swagger
 * /api/v1/reportes/docente/{documento}:
 *   get:
 *     summary: Obtiene el detalle completo de un docente
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documento
 *         required: true
 *         schema:
 *           type: string
 *         description: Documento del docente
 *       - in: query
 *         name: idConfiguracion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración de evaluación
 *       - in: query
 *         name: incluirIA
 *         schema:
 *           type: boolean
 *         description: Incluir análisis de IA por materia (default false)
 *     responses:
 *       200:
 *         description: Detalle del docente con todas sus materias
 */
router.get('/docente/:documento', reportesController.getDetalleDocente);

/**
 * @swagger
 * /api/v1/reportes/rankings:
 *   get:
 *     summary: Obtiene los rankings de docentes
 *     tags: [Reportes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: idConfiguracion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración de evaluación
 *       - in: query
 *         name: tipo
 *         schema:
 *           type: string
 *           enum: [programa, facultad, institucional]
 *         description: Tipo de ranking (default institucional)
 *       - in: query
 *         name: programaId
 *         schema:
 *           type: integer
 *         description: ID del programa (requerido si tipo=programa)
 *       - in: query
 *         name: facultadId
 *         schema:
 *           type: integer
 *         description: ID de la facultad (requerido si tipo=facultad)
 *       - in: query
 *         name: limite
 *         schema:
 *           type: integer
 *         description: Número de docentes a mostrar (default 5)
 *     responses:
 *       200:
 *         description: Rankings de docentes positivos y con aspectos de mejora
 */
router.get('/rankings', reportesController.getRankings);

// ======================================
// RUTAS DE COMENTARIOS
// ======================================

/**
 * @swagger
 * /api/v1/reportes/comentarios/docente/{documento}:
 *   get:
 *     summary: Obtiene comentarios de un docente para análisis
 *     tags: [Reportes - Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: documento
 *         required: true
 *         schema:
 *           type: string
 *         description: Documento del docente
 *       - in: query
 *         name: idConfiguracion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración de evaluación
 *       - in: query
 *         name: codigoMateria
 *         schema:
 *           type: string
 *         description: Código de materia específica (opcional)
 *       - in: query
 *         name: analizarIA
 *         schema:
 *           type: boolean
 *         description: Incluir análisis de IA
 *     responses:
 *       200:
 *         description: Comentarios del docente
 */
router.get('/comentarios/docente/:documento', reportesController.getComentariosDocente);

/**
 * @swagger
 * /api/v1/reportes/comentarios/programa/{id}:
 *   get:
 *     summary: Obtiene comentarios de un programa para análisis
 *     tags: [Reportes - Comentarios]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del programa
 *       - in: query
 *         name: idConfiguracion
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la configuración de evaluación
 *       - in: query
 *         name: analizarIA
 *         schema:
 *           type: boolean
 *         description: Incluir análisis de IA
 *     responses:
 *       200:
 *         description: Comentarios del programa
 */
router.get('/comentarios/programa/:id', reportesController.getComentariosPrograma);

// ======================================
// RUTAS DE IA
// ======================================

/**
 * @swagger
 * /api/v1/reportes/ia/status:
 *   get:
 *     summary: Verifica el estado del servicio de IA (Ollama)
 *     tags: [Reportes - IA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estado del servicio de IA
 */
router.get('/ia/status', reportesController.getIAStatus);

/**
 * @swagger
 * /api/v1/reportes/ia/resumen:
 *   post:
 *     summary: Genera resumen IA bajo demanda
 *     tags: [Reportes - IA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - comentarios
 *               - tipo
 *             properties:
 *               comentarios:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de comentarios a analizar
 *               tipo:
 *                 type: string
 *                 enum: [fortalezas_mejora, polaridad, clustering]
 *                 description: Tipo de análisis a realizar
 *           example:
 *             comentarios: ["Excelente profesor", "Muy claro en sus explicaciones", "Debe mejorar la puntualidad"]
 *             tipo: "fortalezas_mejora"
 *     responses:
 *       200:
 *         description: Resumen generado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     fortalezas:
 *                       type: array
 *                       items:
 *                         type: string
 *                     aspectos_mejora:
 *                       type: array
 *                       items:
 *                         type: string
 *                     frases_representativas:
 *                       type: object
 *                       properties:
 *                         positivas:
 *                           type: array
 *                           items:
 *                             type: string
 *                         negativas:
 *                           type: array
 *                           items:
 *                             type: string
 */
router.post('/ia/resumen', reportesController.generarResumenIA);

module.exports = router;
