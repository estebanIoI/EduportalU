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

const router = express.Router();

router.patch('/:id/estado', updateEstadoConfiguracion);
router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), verifyToken, checkRole(['Admin', 'Estudiante']), getConfiguraciones);
router.post('/', verifyToken, checkRole(['Admin']), validate(configuracionEvaluacionSchema), createConfiguracion);
router.get('/:id', verifyToken, checkRole(['Admin']), getConfiguracionById);
router.put('/:id', verifyToken, checkRole(['Admin']), validate(configuracionEvaluacionSchema), updateConfiguracion);
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteConfiguracion);

module.exports = router;
