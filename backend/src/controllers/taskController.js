import {
  createTask,
  listTasks,
  updateTaskStatus,
  updateTask,
  deleteTask,
} from '../services/taskService.js';

export async function createTaskController(req, res) {
  try {
    const { projectId } = req.params;
    const data = await createTask({ projectId, requester: req.user, payload: req.body || {} });
    return res.status(201).json({ success: true, message: 'Task created', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to create task' });
  }
}

export async function listTasksController(req, res) {
  try {
    const { projectId } = req.params;
    const filters = {
      status: req.query.status,
      assignedTo: req.query.assignedTo ?? undefined,
      priority: req.query.priority,
      search: req.query.search,
      page: req.query.page,
      pageSize: req.query.pageSize,
    };
    const data = await listTasks({ projectId, requester: req.user, filters });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to fetch tasks' });
  }
}

export async function updateTaskStatusController(req, res) {
  try {
    const { taskId } = req.params;
    const { status } = req.body || {};
    const data = await updateTaskStatus({ taskId, requester: req.user, status });
    return res.status(200).json({ success: true, message: 'Task status updated', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to update task status' });
  }
}

export async function updateTaskController(req, res) {
  try {
    const { taskId } = req.params;
    const data = await updateTask({ taskId, requester: req.user, payload: req.body || {} });
    return res.status(200).json({ success: true, message: 'Task updated', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to update task' });
  }
}

export async function deleteTaskController(req, res) {
  try {
    const { taskId } = req.params;
    const data = await deleteTask({ taskId, requester: req.user });
    return res.status(200).json({ success: true, message: 'Task deleted', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to delete task' });
  }
}
