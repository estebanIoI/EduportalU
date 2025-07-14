const userRoleService = require('../../services/auth/userRole.service');
const { successResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getUserRoles = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const roles = await userRoleService.getUserRoles(userId);

    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: roles,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getAllUserRoles = async (req, res, next) => {
  try {
    const allRoles = await userRoleService.getAllUserRoles();

    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: allRoles,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const searchUser = async (req, res, next) => {
  try {
    const { username } = req.params;
    const user = await userRoleService.searchUser(username);

    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: user,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const assignRole = async (req, res, next) => {
  try {
    const { userId, roleId } = req.body;
    const newRole = await userRoleService.assignRole(userId, roleId);

    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: newRole,
    }, 201);
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    const updatedRole = await userRoleService.updateRole(id, roleId);

    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updatedRole,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const removeRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    await userRoleService.removeRole(id);

    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
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
