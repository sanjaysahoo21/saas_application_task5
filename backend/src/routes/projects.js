import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createProjectController,
  listProjectsController,
  updateProjectController,
  deleteProjectController,
} from '../controllers/projectController.js';

const router = Router();

router.use(authenticate);

router.post('/projects', createProjectController);
router.get('/projects', listProjectsController);
router.put('/projects/:projectId', updateProjectController);
router.delete('/projects/:projectId', deleteProjectController);

export default router;
