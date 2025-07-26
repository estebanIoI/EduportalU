const express = require('express');
const {
  getConfiguracionDetalles,
  updateEstadoTipo,
  getTipos,
  getTipoById,
  createTipo,
  updateTipo,
  deleteTipo
} = require('../../controllers/evaluacion/tiposEvaluaciones.controller');

const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');
const pagination = require('../../middlewares/pagination');

const router = express.Router();

router.get('/configuracion/:id', verifyToken, checkRole(['Admin', 'Estudiante']), getConfiguracionDetalles);
router.patch('/:id/estado', updateEstadoTipo);
router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), getTipos);
router.get('/:id', getTipoById);
router.post('/', createTipo);
router.put('/:id', updateTipo);
router.delete('/:id', deleteTipo);

module.exports = router;
