import { Router } from 'express';
import authRoutes from './auth.js';
import tenantRoutes from './tenants.js';
import userRoutes from './users.js';
import projectRoutes from './projects.js';
import taskRoutes from './tasks.js';
import { checkHealth } from '../utils/health.js';

const router = Router();

router.get('/health', async (_req, res) => {
  const status = await checkHealth();
  if (!status.ok) {
    return res.status(503).json({ success: false, message: 'Service not ready', data: { status: 'degraded' } });
  }
  return res.status(200).json({ success: true, data: { status: 'ok', database: 'connected' } });
});

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);
router.use('/', userRoutes);
router.use('/', projectRoutes);
router.use('/', taskRoutes);

export default router;
