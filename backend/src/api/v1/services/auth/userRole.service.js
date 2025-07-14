const UserRoleModel = require('../../models/auth/userRole.model');

const getUserRoles = async (userId) => {
  try {
    const roles = await UserRoleModel.getUserRoles(userId);
    return roles;
  } catch (error) {
    throw error;
  }
};

const getAllUserRoles = async () => {
  try {
    const allRoles = await UserRoleModel.getAllUserRoles();
    return allRoles;
  } catch (error) {
    throw error;
  }
};

const searchUser = async (username) => {
  try {
    if (!username) {
      const error = new Error('Username is required');
      error.statusCode = 400;
      throw error;
    }
    const user = await UserRoleModel.searchUser(username);
    return user;
  } catch (error) {
    throw error;
  }
};

const assignRole = async (userId, roleId) => {
  try {
    const hasRole = await UserRoleModel.hasRole(userId, roleId);
    if (hasRole) {
      const error = new Error('El usuario ya tiene asignado este rol');
      error.statusCode = 409;
      throw error;
    }
    const newRole = await UserRoleModel.assignRole(userId, roleId);
    return newRole;
  } catch (error) {
    throw error;
  }
};

const updateRole = async (id, roleId) => {
  try {
    const updatedRole = await UserRoleModel.updateRoleAssignment(id, roleId);
    return updatedRole;
  } catch (error) {
    throw error;
  }
};

const removeRole = async (id) => {
  try {
    await UserRoleModel.removeRole(id);
    return { message: 'Rol removido correctamente' };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getUserRoles,
  getAllUserRoles,
  searchUser,
  assignRole,
  updateRole,
  removeRole
};