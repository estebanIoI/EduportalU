const RolesModel = require('../../models/auth/roles.model');

const getAllRoles = async () => {
  try {
    return await RolesModel.getAllRoles();
  } catch (error) {
    throw error;
  }
};

const getRolById = async (id) => {
  try {
    const rol = await RolesModel.getRolById(id);
    if (!rol) {
      const error = new Error('Rol no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return rol;
  } catch (error) {
    throw error;
  }
};

const createRol = async (rolData) => {
  try {
    return await RolesModel.createRol(rolData);
  } catch (error) {
    throw error;
  }
};

const updateRol = async (id, rolData) => {
  try {
    await getRolById(id);
    return await RolesModel.updateRol(id, rolData);
  } catch (error) {
    throw error;
  }
};

const deleteRol = async (id) => {
  try {
    await getRolById(id);
    await RolesModel.deleteRol(id);
    return { message: 'Rol eliminado correctamente' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol
};