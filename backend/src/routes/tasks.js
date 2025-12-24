import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createTaskController,
  listTasksController,
  updateTaskStatusController,
  updateTaskController,
  deleteTaskController,
} from '../controllers/taskController.js';

const router = Router();

router.use(authenticate);

router.post('/projects/:projectId/tasks', createTaskController);
router.get('/projects/:projectId/tasks', listTasksController);
router.patch('/tasks/:taskId/status', updateTaskStatusController);
router.put('/tasks/:taskId', updateTaskController);
router.delete('/tasks/:taskId', deleteTaskController);

export default router;
