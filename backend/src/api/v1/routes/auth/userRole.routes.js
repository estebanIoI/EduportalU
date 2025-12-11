const express = require('express');
const router = express.Router();
const { verifyToken, checkRole } = require('../../middlewares/userAuth.middleware');

const {
  getUserRoles,
  getAllUserRoles,
  searchUser,
  assignRole,
  updateRole,
  removeRole
} = require('../../controllers/auth/userRole.controller');

// Aplicar verificación de token a todas las rutas
router.use(verifyToken);

router.get('/search/:username', checkRole(['Admin', 'Director Programa']), searchUser);

// Obtener todos los roles asignados (Admin y Director Programa)
router.get('/', checkRole(['Admin', 'Director Programa']), getAllUserRoles);

// Obtener roles de un usuario específico (Admin, Director Programa o el mismo usuario)
router.get('/:userId', checkRole(['Admin', 'Director Programa']), getUserRoles);

// Asignar un rol (Admin y Director Programa)
router.post('/', checkRole(['Admin', 'Director Programa']), assignRole);

// Actualizar un rol asignado (Admin y Director Programa)
router.put('/:id', checkRole(['Admin', 'Director Programa']), updateRole);

// Eliminar un rol asignado (Admin y Director Programa)
router.delete('/:id', checkRole(['Admin', 'Director Programa']), removeRole);

module.exports = router;
