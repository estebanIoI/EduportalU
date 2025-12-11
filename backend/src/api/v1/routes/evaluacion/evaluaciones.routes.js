// evaluaciones.routes.js

const express = require('express');
const {
  getEvaluaciones,
  getEvaluacionById,
  createEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
  createEvaluacionU,
  getEvaluacionesByEstudiante,
  getEvaluacionesByEstudianteByConfiguracion,
  getEvaluacionesByDocente,
  getEvaluacionesByEstudianteAsignatura,
  getResultadosEvaluacionDocente,
  getAutoevaluacionDocente,
  createAutoevaluacionDocente
} = require('../../controllers/evaluacion/evaluaciones.controller');

const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');
const pagination = require('../../middlewares/pagination');

const router = express.Router();

router.post('/insitu/crear', verifyToken, checkRole(['Admin', 'Estudiante']), createEvaluacionU);
router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), getEvaluaciones);
router.post('/', verifyToken, createEvaluacion);
router.get('/:id', getEvaluacionById);
router.put('/:id', verifyToken, updateEvaluacion);
router.delete('/:id', verifyToken, deleteEvaluacion);
router.get('/estudiante/:documentoEstudiante', getEvaluacionesByEstudiante);
router.get('/estudiante/:documentoEstudiante/configuracion/:configuracionId', getEvaluacionesByEstudianteByConfiguracion);
router.get('/estudiante/:documentoEstudiante/asignatura/:codigoAsignatura', getEvaluacionesByEstudianteAsignatura);
router.get('/docente/:documentoDocente', getEvaluacionesByDocente);
router.get('/docente/:documentoDocente/resultados', verifyToken, getResultadosEvaluacionDocente);
router.get('/docente/:documentoDocente/autoevaluacion', verifyToken, getAutoevaluacionDocente);
router.post('/docente/:documentoDocente/autoevaluacion', verifyToken, createAutoevaluacionDocente);

module.exports = router;
