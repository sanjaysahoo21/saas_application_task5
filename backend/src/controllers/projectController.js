import { createProject, listProjects, updateProject, deleteProject } from '../services/projectService.js';

export async function createProjectController(req, res) {
  try {
    const data = await createProject({ requester: req.user, payload: req.body || {} });
    return res.status(201).json({ success: true, message: 'Project created', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to create project' });
  }
}

export async function listProjectsController(req, res) {
  try {
    const data = await listProjects({ requester: req.user });
    return res.status(200).json({ success: true, data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to fetch projects' });
  }
}

export async function updateProjectController(req, res) {
  try {
    const { projectId } = req.params;
    const data = await updateProject({ projectId, requester: req.user, payload: req.body || {} });
    return res.status(200).json({ success: true, message: 'Project updated', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to update project' });
  }
}

export async function deleteProjectController(req, res) {
  try {
    const { projectId } = req.params;
    const data = await deleteProject({ projectId, requester: req.user });
    return res.status(200).json({ success: true, message: 'Project deleted', data });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ success: false, message: err.message || 'Failed to delete project' });
  }
}
