// src/api/v1/routes/evaluacion/configuracionPregunta.routes.js
const express = require('express');
const {
  getConfiguracionPreguntas,
  getConfiguracionPreguntaById,
  getConfiguracionPreguntasByConfiguracionId,
  createConfiguracionPregunta,
  updateConfiguracionPregunta,
  updateEstadoConfiguracionPregunta,
  deleteConfiguracionPregunta
} = require('../../controllers/evaluacion/configuracionPregunta.controller');

const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');
const pagination = require('../../middlewares/pagination');
const { ADMIN_ROLES } = require('../../../../constants/roles');

const router = express.Router();

// Aplicar paginación solo al endpoint GET principal
router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), getConfiguracionPreguntas);
router.get('/configuracion/:configuracionId', verifyToken, checkRole(ADMIN_ROLES), getConfiguracionPreguntasByConfiguracionId);
router.post('/', verifyToken, checkRole(ADMIN_ROLES), createConfiguracionPregunta);
router.get('/:id', verifyToken, checkRole(ADMIN_ROLES), getConfiguracionPreguntaById);
router.put('/:id', verifyToken, checkRole(ADMIN_ROLES), updateConfiguracionPregunta);
router.put('/:id/estado', verifyToken, checkRole(ADMIN_ROLES), updateEstadoConfiguracionPregunta);
router.delete('/:id', verifyToken, checkRole(ADMIN_ROLES), deleteConfiguracionPregunta);

module.exports = router;
