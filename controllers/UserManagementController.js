import { getAllUsers, updateUserRole } from './users/list.js';
import { deactivateUser, reactivateUser } from './users/activation.js';
import { deleteUser, deleteSelfAccount } from './users/delete.js';

const UserManagementController = {
  getAllUsers,
  updateUserRole,
  deactivateUser,
  reactivateUser,
  deleteUser,
  deleteSelfAccount,
};

export default UserManagementController;
