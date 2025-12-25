import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRoles } from '../middleware/roles.js';
import { getTenant, listAllTenants, updateTenantController } from '../controllers/tenantController.js';

const router = Router();

// All routes authenticated
router.use(authenticate);

router.get('/', requireRoles('super_admin'), listAllTenants);
router.get('/:tenantId', getTenant);
router.put('/:tenantId', updateTenantController);

export default router;
