import { createUser, listUsers, updateUser, deleteUser } from '../services/userService.js';

export async function createUserController(req, res) {
  try {
    const { tenantId } = req.params;
    const data = await createUser({ tenantId, requester: req.user, payload: req.body || {} });
    return res.status(201).json({ success: true, message: 'User created', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to create user' });
  }
}

export async function listUsersController(req, res) {
  try {
    const { tenantId } = req.params;
    const data = await listUsers({ tenantId, requester: req.user });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to list users' });
  }
}

export async function updateUserController(req, res) {
  try {
    const { userId } = req.params;
    const data = await updateUser({ userId, requester: req.user, payload: req.body || {} });
    return res.status(200).json({ success: true, message: 'User updated', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to update user' });
  }
}

export async function deleteUserController(req, res) {
  try {
    const { userId } = req.params;
    const data = await deleteUser({ userId, requester: req.user });
    return res.status(200).json({ success: true, message: 'User deleted', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to delete user' });
  }
}
