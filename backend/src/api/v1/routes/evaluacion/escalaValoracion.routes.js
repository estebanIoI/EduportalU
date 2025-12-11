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
const { ADMIN_ROLES } = require('../../../../constants/roles');
const router = express.Router();

router.get('/', pagination({ defaultLimit: 10, maxLimit: 50 }), getEscalas);
router.post('/', verifyToken, checkRole(ADMIN_ROLES), createEscala);
router.get('/:id', verifyToken, checkRole(ADMIN_ROLES), getEscalaById);
router.put('/:id', verifyToken, checkRole(ADMIN_ROLES), updateEscala);
router.delete('/:id', verifyToken, checkRole(ADMIN_ROLES), deleteEscala);

module.exports = router;
