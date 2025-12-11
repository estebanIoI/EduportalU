// src/api/v1/services/auth/userAuth.service.js
const jwt = require('jsonwebtoken');
const md5 = require('md5');
const UserAuthModel = require('../../models/auth/userAuth.model');
const VistaProfileModel = require('../../models/vista/vistaProfile.model');
const { JWT_SECRET } = process.env;
const MESSAGES = require('../../../../constants/messages');

// Caché simple en memoria para perfiles de usuario
const profileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Función para limpiar caché expirado
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of profileCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      profileCache.delete(key);
    }
  }
};

// Limpiar caché cada minuto
setInterval(cleanExpiredCache, 60 * 1000);

const authenticateUser = async (username, password) => {
  try {
    // Buscar usuario por username
    const user = await UserAuthModel.getUserByUsername(username);
    if (!user) {
      const error = new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
      error.code = 401;
      error.error = 'Usuario no encontrado';
      throw error;
    }
    
    // Verificar contraseña encriptada en MD5
    const hashedPassword = md5(password);
    if (user.user_password !== hashedPassword) {
      const error = new Error(MESSAGES.AUTH.INVALID_CREDENTIALS);
      error.code = 401;
      error.error = 'Contraseña incorrecta';
      throw error;
    }
    
    // Verificar si el usuario está activo
    if (user.user_statusid !== '1') {
      const error = new Error(MESSAGES.AUTH.USER_INACTIVE);
      error.code = 403;
      error.error = 'Usuario inactivo';
      throw error;
    }
    
    // Obtener roles adicionales del usuario
    const additionalRoles = await VistaProfileModel.getRolesAdicionales(user.user_id);
    
    // Preparar array de nombres de roles adicionales
    const additionalRoleNames = additionalRoles.map(role => role.NOMBRE_ROL);
    
    // Generar JWT incluyendo roles adicionales y documento
    const token = jwt.sign(
      { 
        userId: user.user_id,
        username: user.user_username,
        documento: user.user_username, // Agregar documento (username es el documento)
        roleId: user.user_idrole,
        roleName: user.role_name,
        additionalRoles: additionalRoleNames
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // Formatear nombre del usuario
    const userName = user.user_name
      .split(' ') // Divide el nombre completo en partes
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitaliza cada palabra
      .join(' '); // Vuelve a juntar las palabras con un espacio
    
    // Retornar datos de autenticación exitosa
    return {
      message: `${userName} 👋`,
      data: { 
        token,
        user: {
          id: user.user_id,
          name: userName,
          username: user.user_username,
          primaryRole: user.role_name,
          additionalRoles: additionalRoleNames
        }
      }
    };
  } catch (error) {
    throw error;
  }
};

const getUserProfile = async (userId) => {
  try {
    const startTime = Date.now();
    console.log(`🔍 [getUserProfile] Obteniendo perfil para userId: ${userId}`);
    
    // Verificar caché primero
    const cacheKey = `profile_${userId}`;
    const cachedProfile = profileCache.get(cacheKey);
    if (cachedProfile && (Date.now() - cachedProfile.timestamp) < CACHE_TTL) {
      console.log(`📦 [getUserProfile] Perfil obtenido del caché en ${Date.now() - startTime}ms`);
      return cachedProfile.data;
    }
    
    // Obtener información básica del usuario desde DATALOGIN
    const userInfo = await UserAuthModel.getUserById(userId);
    if (!userInfo) {
      console.error(`❌ [getUserProfile] Usuario no encontrado con userId: ${userId}`);
      const error = new Error(MESSAGES.USER.USER_NOT_FOUND);
      error.code = 404;
      error.error = 'Usuario no encontrado';
      throw error;
    }
    
    console.log(`✅ [getUserProfile] UserInfo obtenido en ${Date.now() - startTime}ms:`, {
      user_id: userInfo.user_id,
      user_username: userInfo.user_username,
      user_idrole: userInfo.user_idrole,
      role_name: userInfo.role_name
    });

    // Obtener roles adicionales del usuario
    const rolesAdicionales = await VistaProfileModel.getRolesAdicionales(userInfo.user_id);
    const rolesAdicionalesNombres = rolesAdicionales.map(role => role.NOMBRE_ROL);
    console.log(`✅ [getUserProfile] Roles adicionales obtenidos en ${Date.now() - startTime}ms:`, rolesAdicionalesNombres);

    let profileData = {
      user_id: userInfo.user_id,
      user_name: userInfo.user_name,
      user_email: userInfo.user_email,
      roles: {
        principal: {
          id: userInfo.user_idrole,
          nombre: userInfo.role_name
        },
        adicionales: []
      }
    };

    // Determinar el tipo efectivo del usuario basándose en roles adicionales prioritarios
    // Prioridad: Admin > Director Programa > Docente > Estudiante
    let tipoEfectivo = null;
    
    if (rolesAdicionalesNombres.includes('Admin')) {
      tipoEfectivo = 'admin';
    } else if (rolesAdicionalesNombres.includes('Director Programa')) {
      tipoEfectivo = 'docente'; // Director de Programa usa la vista de docente
    } else if (userInfo.user_idrole === 2) {
      tipoEfectivo = 'docente';
    } else if (userInfo.user_idrole === 1) {
      tipoEfectivo = 'estudiante';
    }

    // Si es estudiante (user_idrole = 1) pero NO tiene roles administrativos
    if (userInfo.user_idrole === 1 && !rolesAdicionalesNombres.includes('Admin') && !rolesAdicionalesNombres.includes('Director Programa')) {
      console.log(`📚 [getUserProfile] Obteniendo perfil de ESTUDIANTE`);
      profileData = await _getEstudianteProfile(userInfo, rolesAdicionales);
    }
    // Si es docente (user_idrole = 2) O tiene rol de Director Programa
    else if (userInfo.user_idrole === 2 || rolesAdicionalesNombres.includes('Director Programa')) {
      console.log(`👨‍🏫 [getUserProfile] Obteniendo perfil de DOCENTE`);
      profileData = await _getDocenteProfile(userInfo, rolesAdicionales, tipoEfectivo);
    }
    // Si es Admin, intentar obtener perfil de docente, si no existe, usar perfil básico
    else if (rolesAdicionalesNombres.includes('Admin')) {
      console.log(`👑 [getUserProfile] Obteniendo perfil de ADMIN`);
      try {
        profileData = await _getDocenteProfile(userInfo, rolesAdicionales, tipoEfectivo);
      } catch (error) {
        console.log(`⚠️ [getUserProfile] Admin sin perfil de docente, usando perfil básico`);
        // Si no tiene perfil de docente, usar perfil básico de admin
        profileData = {
          tipo: 'admin',
          user_id: userInfo.user_id,
          nombre_completo: userInfo.user_name,
          email: userInfo.user_email,
          documento: userInfo.user_username,
          roles: {
            principal: {
              id: userInfo.user_idrole,
              nombre: userInfo.role_name
            },
            adicionales: rolesAdicionales.map(role => ({
              id: role.ID,
              nombre: role.NOMBRE_ROL
            }))
          }
        };
      }
    }

    // Guardar en caché
    profileCache.set(cacheKey, {
      data: profileData,
      timestamp: Date.now()
    });

    console.log(`✅ [getUserProfile] Perfil obtenido exitosamente para userId: ${userId} en ${Date.now() - startTime}ms`);
    return profileData;
  } catch (error) {
    console.error(`❌ [getUserProfile] Error obteniendo perfil para userId: ${userId}`, {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    throw error;
  }
};

const _getEstudianteProfile = async (userInfo, rolesAdicionales) => {
  try {
    console.log(`📚 [_getEstudianteProfile] Obteniendo info para username: ${userInfo.user_username}`);
    
    const estudianteData = await VistaProfileModel.getEstudianteAcademicInfo(userInfo.user_username);
    if (!estudianteData) {
      console.warn(`⚠️ [_getEstudianteProfile] No se encontró información académica del estudiante en vista_estudiantes, usando perfil básico`);
      
      // Procesar roles adicionales
      const rolesAdicionalesFormatted = rolesAdicionales.map(rol => ({
        id: rol.ID,
        nombre: rol.NOMBRE_ROL
      }));

      // Retornar perfil básico sin información académica
      return {
        tipo: 'estudiante',
        sede: null,
        nombre_completo: userInfo.user_name,
        tipo_doc: null,
        documento: userInfo.user_username,
        estado_matricula: null,
        programa: null,
        periodo: null,
        semestre: null,
        grupo: null,
        materias: [],
        roles: {
          principal: {
            id: userInfo.user_idrole,
            nombre: userInfo.role_name
          },
          adicionales: rolesAdicionalesFormatted
        },
        permisos: ['ver_evaluaciones', 'responder_evaluaciones'],
        _advertencia: 'Información académica no disponible en el sistema externo'
      };
    }
    
    const { infoBase, materias } = estudianteData;
    
    console.log(`✅ [_getEstudianteProfile] Info básica obtenida:`, infoBase);
    console.log(`✅ [_getEstudianteProfile] ${materias.length} materias encontradas`);

    // Procesar roles adicionales
    const rolesAdicionalesFormatted = rolesAdicionales.map(rol => ({
        id: rol.ID,
        nombre: rol.NOMBRE_ROL
    }));

    return {
      tipo: 'estudiante',
      sede: infoBase.SEDE,
      nombre_completo: userInfo.user_name, // Usar nombre de userInfo (datalogin)
      tipo_doc: infoBase.TIPO_DOC,
      documento: infoBase.DOCUMENTO_ESTUDIANTE,
      estado_matricula: infoBase.ESTADO_MATRICULA,
      programa: infoBase.NOM_PROGRAMA,
      periodo: infoBase.SEMESTRE_MATRICULA,
      semestre: infoBase.SEMESTRE,
      grupo: infoBase.GRUPO,
      materias: materias.map((materia, index) => ({
        id: index + 1,
        codigo: materia.CODIGO_MATERIA,
        nombre: materia.NOMBRE_MATERIA,
        docente: {
          documento: materia.DOCUMENTO_DOCENTE,
          nombre: materia.NOMBRE_DOCENTE
        }
      })),
      roles: {
        principal: {
          id: userInfo.user_idrole,
          nombre: userInfo.role_name
        },
        adicionales: rolesAdicionalesFormatted
      }
    };
  } catch (error) {
    throw error;
  }
};

const _getDocenteProfile = async (userInfo, rolesAdicionales, tipoEfectivo = 'docente') => {
  try {
    console.log(`👨‍🏫 [_getDocenteProfile] Obteniendo info para username: ${userInfo.user_username}`);
    
    const docenteInfo = await VistaProfileModel.getDocenteAcademicInfo(userInfo.user_username);
    
    // Si no existe info de docente, intentar crear un perfil básico con roles adicionales
    if (!docenteInfo || docenteInfo.length === 0) {
      console.log(`⚠️ [_getDocenteProfile] No se encontró info de docente, verificando roles especiales`);
      
      // Si tiene rol de Director Programa o Admin, crear perfil básico
      const tieneRolEspecial = rolesAdicionales.some(role => 
        role.NOMBRE_ROL === 'Director Programa' || role.NOMBRE_ROL === 'Admin'
      );
      
      if (tieneRolEspecial) {
        return {
          tipo: tipoEfectivo,
          email: userInfo.user_email,
          documento: userInfo.user_username,
          nombre_completo: userInfo.user_name,
          sede: 'N/A',
          periodo: 'N/A',
          materias: [],
          roles: {
            principal: {
              id: userInfo.user_idrole,
              nombre: userInfo.role_name || 'Estudiante'
            },
            adicionales: rolesAdicionales.map(role => ({
              id: role.ID,
              nombre: role.NOMBRE_ROL
            }))
          }
        };
      }
      
      // Si no tiene rol especial, lanzar error
      const error = new Error(MESSAGES.USER.USER_NOT_FOUND);
      error.code = 404;
      error.error = 'Información del docente no encontrada';
      throw error;
    }

    const materias = await VistaProfileModel.getMateriasDocente(userInfo.user_username);

    // Procesar roles adicionales
    const rolesAdicionalesFormatted = rolesAdicionales.map(rol => ({
        id: rol.ID,
        nombre: rol.NOMBRE_ROL
    }));

    // Usar la primera fila para la información básica
    const infoBase = docenteInfo[0];
    
    return {
      tipo: tipoEfectivo,
      email: userInfo.user_email,
      documento: infoBase.DOCUMENTO_DOCENTE,
      nombre_completo: infoBase.NOMBRE_DOCENTE,
      sede: infoBase.SEDE,
      periodo: infoBase.PERIODO,
      materias: materias.map((materia, index) => ({
        id: index + 1,
        codigo: materia.COD_ASIGNATURA,
        nombre: materia.ASIGNATURA,
        semestre: materia.SEMESTRE_PREDOMINANTE,
        programa: materia.PROGRAMA_PREDOMINANTE
      })),
      roles: {
        principal: {
          id: userInfo.user_idrole,
          nombre: userInfo.role_name
        },
        adicionales: rolesAdicionalesFormatted
      }
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateUser,
  getUserProfile
};