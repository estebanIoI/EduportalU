const express = require('express');
const {
  getConfiguraciones,
  getConfiguracionById,
  createConfiguracion,
  updateConfiguracion,
  deleteConfiguracion,
  updateEstadoConfiguracion
} = require('../../controllers/evaluacion/configuracionEvaluacion.controller');

const configuracionEvaluacionSchema = require('../../validations/evaluacion/configuracionEvaluacion.validation');
const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');
const validate = require('../../middlewares/validate');
const pagination = require('../../middlewares/pagination');
const { ADMIN_ROLES } = require('../../../../constants/roles');

const router = express.Router();

// Rutas con autenticación y control de acceso
router.patch('/:id/estado', verifyToken, checkRole(ADMIN_ROLES), updateEstadoConfiguracion);
router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), verifyToken, checkRole([...ADMIN_ROLES, 'Estudiante']), getConfiguraciones);
router.post('/', verifyToken, checkRole(ADMIN_ROLES), validate(configuracionEvaluacionSchema), createConfiguracion);
router.get('/:id', verifyToken, checkRole(ADMIN_ROLES), getConfiguracionById);
router.put('/:id', verifyToken, checkRole(ADMIN_ROLES), validate(configuracionEvaluacionSchema), updateConfiguracion);
router.delete('/:id', verifyToken, checkRole(ADMIN_ROLES), deleteConfiguracion);

module.exports = router;
