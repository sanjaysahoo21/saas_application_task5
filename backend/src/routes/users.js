import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createUserController,
  listUsersController,
  updateUserController,
  deleteUserController,
} from '../controllers/userController.js';

const router = Router();

// All routes authenticated
router.use(authenticate);

// User management under tenants
router.post('/tenants/:tenantId/users', createUserController);
router.get('/tenants/:tenantId/users', listUsersController);

// User update/delete by userId
router.put('/users/:userId', updateUserController);
router.delete('/users/:userId', deleteUserController);

export default router;
