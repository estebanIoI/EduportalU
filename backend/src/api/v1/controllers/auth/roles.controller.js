const RolesService = require('../../services/auth/roles.service');
const { successResponse } = require('../../utils/responseHandler');
const MESSAGES = require('../../../../constants/messages');

const getRoles = async (req, res, next) => {
  try {
    const roles = await RolesService.getAllRoles();
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: roles,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const getRolById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rol = await RolesService.getRolById(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.FETCH_SUCCESS,
      data: rol,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.FETCH_ERROR;
    next(error);
  }
};

const createRol = async (req, res, next) => {
  try {
    const rolData = req.body;
    const newRol = await RolesService.createRol(rolData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.CREATED,
      data: newRol,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.CREATED_ERROR;
    next(error);
  }
};

const updateRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    const rolData = req.body;
    const updatedRol = await RolesService.updateRol(id, rolData);
    return successResponse(res, {
      message: MESSAGES.GENERAL.UPDATED,
      data: updatedRol,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.UPDATED_ERROR;
    next(error);
  }
};

const deleteRol = async (req, res, next) => {
  try {
    const { id } = req.params;
    await RolesService.deleteRol(id);
    return successResponse(res, {
      message: MESSAGES.GENERAL.DELETED,
    });
  } catch (error) {
    error.message = MESSAGES.GENERAL.DELETED_ERROR;
    next(error);
  }
};

module.exports = {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol,
};
