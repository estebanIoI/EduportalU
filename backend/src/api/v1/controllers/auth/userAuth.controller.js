// src/api/v1/controllers/auth/userAuth.controller.js
const UserAuthService = require('../../services/auth/userAuth.service');
const { successResponse, errorResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const login = async (req, res, next) => {
  try {
    console.log('🔐 Login request recibido');
    console.log('📨 Body:', JSON.stringify(req.body, null, 2));
    console.log('📨 Headers:', JSON.stringify(req.headers, null, 2));
    
    const { user_username, user_password } = req.body;
    
    if (!user_username || !user_password) {
      console.log('❌ Campos faltantes');
      return errorResponse(res, {
        code: 400,
        message: MESSAGES.GENERAL.MISSING_FIELDS,
        error: 'Usuario y contraseña son requeridos'
      });
    }
    
    console.log(`🔍 Intentando autenticar usuario: ${user_username}`);
    const loginResult = await UserAuthService.authenticateUser(user_username, user_password);
    
    console.log('✅ Login exitoso');
    return successResponse(res, {
      code: 200,
      message: loginResult.message,
      data: loginResult.data
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error message:', error.message);
    
    // Manejar errores específicos del servicio
    if (error.code) {
      return errorResponse(res, {
        code: error.code,
        message: error.message,
        error: error.error
      });
    }
    
    return errorResponse(res, {
      code: 500,
      message: MESSAGES.GENERAL.ERROR,
      error: error.message
    });
  }
};

const getProfile = async (req, res, next) => {
  try {
    const { userId, roleId, roleName } = req.user;
    
    const profileData = await UserAuthService.getUserProfile(userId);
    
    return successResponse(res, {
      code: 200,
      message: MESSAGES.USER.PROFILE_FETCHED,
      data: profileData
    });
  } catch (error) {
    console.error('Error en getProfile:', error);
    
    // Manejar errores específicos del servicio
    // Solo usar error.code si es un número válido de HTTP (100-599)
    if (error.code && typeof error.code === 'number' && error.code >= 100 && error.code < 600) {
      return errorResponse(res, {
        code: error.code,
        message: error.message,
        error: error.error
      });
    }
    
    // Para errores de conexión u otros errores no HTTP
    return errorResponse(res, {
      code: 500,
      message: error.message || MESSAGES.GENERAL.ERROR,
      error: error.code || error.message
    });
  }
};

module.exports = {
  login,
  getProfile,
};