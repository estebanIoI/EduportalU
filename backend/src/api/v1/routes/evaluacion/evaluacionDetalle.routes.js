// src/api/v1/routes/evaluacion/evaluacionDetalle.routes.js
const express = require('express');
const {
  getDetalles,
  getDetalleById,
  createDetalle,
  updateDetalle,
  deleteDetalle,
  createDetallesEvaluacion
} = require('../../controllers/evaluacion/evaluacionDetalle.controller');

const { verifyToken } = require('../../middlewares/userAuth.middleware');
const pagination = require('../../middlewares/pagination');

const router = express.Router();

router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), getDetalles);
router.post('/', createDetalle);
router.post('/bulk', verifyToken, createDetallesEvaluacion);
router.get('/:id', getDetalleById);
router.put('/:id', updateDetalle);
router.delete('/:id', deleteDetalle);

module.exports = router;
