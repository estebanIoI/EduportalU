const express = require('express');
const router = express.Router();
const {
    getDocentesAsignaturasController,
    getEstudiantesEvaluadosController,
    getAspectosPuntajeController,
    getComentariosController
} = require('../../controllers/reportes/docentes.controller');
const pagination = require('../../middlewares/pagination');

// Obtener lista de docentes con sus asignaturas y progreso
router.get('/asignaturas', pagination({ defaultLimit: 10, maxLimit: 50 }), getDocentesAsignaturasController);

// Obtener estudiantes evaluados por docente, materia y grupo
router.get('/estudiantes-evaluados/:idDocente/:codAsignatura/:grupo', getEstudiantesEvaluadosController);

// Obtener aspectos y puntajes promedio por docente
router.get('/aspectos-puntaje/', getAspectosPuntajeController);

// Obtener comentarios por docente
router.get('/comentarios/:idDocente', getComentariosController);

module.exports = router; 