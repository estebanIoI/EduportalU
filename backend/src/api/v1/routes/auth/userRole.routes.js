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

router.get('/search/:username', checkRole(['Admin']), searchUser);

// Obtener todos los roles asignados (solo Admin)
router.get('/', checkRole(['Admin']), getAllUserRoles);

// Obtener roles de un usuario específico (Admin o el mismo usuario)
router.get('/:userId', checkRole(['Admin']), getUserRoles);

// Asignar un rol (solo Admin)
router.post('/', checkRole(['Admin']), assignRole);

// Actualizar un rol asignado (solo Admin)
router.put('/:id', checkRole(['Admin']), updateRole);

// Eliminar un rol asignado (solo Admin)
router.delete('/:id', checkRole(['Admin']), removeRole);

module.exports = router;
