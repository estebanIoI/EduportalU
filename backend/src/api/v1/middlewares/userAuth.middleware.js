const jwt = require('jsonwebtoken');
const { JWT_SECRET } = process.env;
const { getPool, getSecurityPool } = require('../../../db');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(403).json({ success: false, message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(403).json({ success: false, message: 'Formato de token inválido' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'Token inválido o expirado' });
    }

    req.user = decoded;
    next();
  });
};

// Middleware para verificar roles permitidos
const checkRole = (allowedRoles) => async (req, res, next) => {
  try {
    if (!req.user || !req.user.userId) {
      console.log('❌ checkRole: Usuario no autenticado');
      return res.status(401).json({ success: false, message: 'No estás autenticado' });
    }

    const userId = req.user.userId;
    const pool = await getPool();
    const securityPool = await getSecurityPool();

    // Primero verificamos en DATALOGIN
    const [dataloginRows] = await securityPool.query(
      `SELECT user_idrole, role_name 
       FROM datalogin 
       WHERE user_id = ?`,
      [userId]
    );

    if (dataloginRows.length === 0) {
      console.log(`❌ checkRole: Usuario ${userId} no encontrado en DATALOGIN`);
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const mainRoleId = dataloginRows[0].user_idrole;
    const mainRoleName = dataloginRows[0].role_name;

    // Ahora obtenemos los roles adicionales desde users_roles
    const [userRolesRows] = await pool.query(
      `SELECT r.ID, r.NOMBRE_ROL 
       FROM users_roles ur 
       JOIN ROLES r ON ur.rol_id = r.ID 
       WHERE ur.user_id = ?`,
      [userId]
    );

    // Crear un arreglo de roles que contenga tanto el rol principal como los roles adicionales
    const roles = [mainRoleName, ...userRolesRows.map(row => row.NOMBRE_ROL)];

    // Guardamos los roles en el objeto `req.user`
    req.user.roles = roles;

    console.log(`🔍 checkRole Debug:
      Usuario ID: ${userId}
      Rol principal: ${mainRoleName}
      Roles adicionales: ${userRolesRows.map(row => row.NOMBRE_ROL).join(', ') || 'ninguno'}
      Roles totales: ${roles.join(', ')}
      Roles permitidos: ${allowedRoles.join(', ')}
    `);

    // Verificamos si el rol principal o alguno de los roles adicionales está permitido
    const hasPermission = allowedRoles.includes(mainRoleName) || userRolesRows.some(row => allowedRoles.includes(row.NOMBRE_ROL));
    
    if (hasPermission) {
      console.log(`✅ checkRole: Acceso permitido`);
      return next();
    }

    console.log(`❌ checkRole: Acceso denegado - No tiene rol requerido`);
    return res.status(403).json({
      success: false,
      message: 'No tienes permiso para acceder a este recurso',
      debug: {
        userRoles: roles,
        requiredRoles: allowedRoles
      }
    });

  } catch (error) {
    console.error('❌ Error en checkRole:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al verificar roles',
      error: error.message
    });
  }
};

module.exports = { verifyToken, checkRole };
