import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { registerTenant, login, me, logout } from '../controllers/authController.js';

const router = Router();

// 1. Register tenant (transactional)
router.post('/register-tenant', registerTenant);

// 2. Login
router.post('/login', login);

// 3. Me
router.get('/me', authenticate, me);

// 4. Logout (stateless)
router.post('/logout', authenticate, logout);

export default router;
