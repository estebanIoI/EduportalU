// src/api/v1/routes/evaluacion/evaluacionesGenericas.routes.js
const express = require('express');
const {
  createBulk,
  getByEstudianteAndConfiguracion,
  getDetalleById,
  getAllEvaluaciones,
  generarInformePDF,
  generarInformeConsolidado,
  getCompletadasByEstudiantes
} = require('../../controllers/evaluacion/evaluacionesGenericas.controller');

const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');

const router = express.Router();

// Crear una evaluación genérica (bulk con aspectos y respuestas)
router.post('/bulk', verifyToken, checkRole(['Estudiante']), createBulk);

// Obtener evaluaciones completadas por lista de estudiantes (para docentes)
router.post('/completadas/:configuracionId', verifyToken, checkRole(['Docente', 'Director Programa', 'Admin']), getCompletadasByEstudiantes);

// Obtener evaluaciones de un estudiante para una configuración específica
router.get('/estudiante/configuracion/:configuracionId', verifyToken, checkRole(['Estudiante', 'Admin']), getByEstudianteAndConfiguracion);

// Obtener todas las evaluaciones genéricas (solo admin)
router.get('/todas', verifyToken, checkRole(['Admin']), getAllEvaluaciones);

// Generar informe consolidado en Excel de todas las evaluaciones (debe ir antes de /:id/informe)
router.get('/informe/todos', verifyToken, checkRole(['Admin']), generarInformeConsolidado);

// Generar informe PDF de una evaluación específica
router.get('/:id/informe', verifyToken, checkRole(['Admin']), generarInformePDF);

// Obtener detalle completo de una evaluación genérica
router.get('/:id/detalle', verifyToken, checkRole(['Admin', 'Docente']), getDetalleById);

module.exports = router;
