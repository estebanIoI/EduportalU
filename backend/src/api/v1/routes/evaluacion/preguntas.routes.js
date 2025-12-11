// src/api/v1/routes/evaluacion/preguntas.routes.js
const express = require('express');
const {
  getPreguntas,
  getPreguntaById,
  createPregunta,
  updatePregunta,
  deletePregunta
} = require('../../controllers/evaluacion/preguntas.controller');

const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');
const pagination = require('../../middlewares/pagination');
const { ADMIN_ROLES } = require('../../../../constants/roles');

const router = express.Router();

// Aplicar paginación solo al endpoint GET principal
router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), getPreguntas);
router.post('/', verifyToken, checkRole(ADMIN_ROLES), createPregunta);
router.get('/:id', verifyToken, checkRole(ADMIN_ROLES), getPreguntaById);
router.put('/:id', verifyToken, checkRole(ADMIN_ROLES), updatePregunta);
router.delete('/:id', verifyToken, checkRole(ADMIN_ROLES), deletePregunta);

module.exports = router;
