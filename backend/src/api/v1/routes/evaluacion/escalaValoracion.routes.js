const express = require('express');
const {
  getEscalas,
  getEscalaById,
  createEscala,
  updateEscala,
  deleteEscala
} = require('../../controllers/evaluacion/escalaValoracion.controller');

const escalaValoracionSchema = require('../../validations/evaluacion/escalaValoracion.validation');
const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');
const validate = require('../../middlewares/validate');
const pagination = require('../../middlewares/pagination');
const router = express.Router();

router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), getEscalas);
router.post('/', verifyToken, checkRole(['Admin']), createEscala);
router.get('/:id', verifyToken, checkRole(['Admin']), getEscalaById);
router.put('/:id', verifyToken, checkRole(['Admin']), updateEscala);
router.delete('/:id', verifyToken, checkRole(['Admin']), deleteEscala);

module.exports = router;
