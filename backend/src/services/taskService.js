import db from '../config/db.js';

const VALID_STATUS = new Set(['todo', 'in_progress', 'completed']);
const VALID_PRIORITY = new Set(['low', 'medium', 'high']);

function ensureTenantMatch(reqUser, tenantId) {
  if (reqUser.role === 'super_admin') return;
  if (!reqUser.tenantId || reqUser.tenantId !== tenantId) {
    const err = new Error('Forbidden: tenant mismatch');
    err.status = 403;
    throw err;
  }
}

async function getProjectForUser(projectId, requester) {
  const project = await db('projects')
    .select('id', 'tenant_id', 'name', 'created_by')
    .where({ id: projectId })
    .first();
  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }
  ensureTenantMatch(requester, project.tenant_id);
  return project;
}

async function validateAssignee(tenantId, assignedTo) {
  if (!assignedTo) return null;
  const user = await db('users')
    .select('id', 'tenant_id')
    .where({ id: assignedTo })
    .first();
  if (!user || user.tenant_id !== tenantId) {
    const err = new Error('Assigned user must belong to the same tenant');
    err.status = 400;
    throw err;
  }
  return user.id;
}

function sanitizeTask(task) {
  return task;
}

export async function createTask({ projectId, requester, payload }) {
  const project = await getProjectForUser(projectId, requester);

  const { title, description, assignedTo, status = 'todo', priority = 'medium' } = payload || {};
  if (!title) {
    const err = new Error('Title is required');
    err.status = 400;
    throw err;
  }
  if (!VALID_STATUS.has(status)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }
  if (!VALID_PRIORITY.has(priority)) {
    const err = new Error('Invalid priority');
    err.status = 400;
    throw err;
  }

  const assigneeId = await validateAssignee(project.tenant_id, assignedTo);

  const [task] = await db('tasks')
    .insert({
      tenant_id: project.tenant_id,
      project_id: project.id,
      title,
      description: description || null,
      status,
      priority,
      assigned_to: assigneeId,
      created_by: requester.userId,
    })
    .returning([
      'id',
      'tenant_id',
      'project_id',
      'title',
      'description',
      'status',
      'priority',
      'assigned_to',
      'created_by',
      'created_at',
      'updated_at',
    ]);

  await db('audit_logs').insert({
    tenant_id: project.tenant_id,
    table_name: 'tasks',
    record_id: task.id,
    action: 'CREATE',
    actor_user_id: requester.userId,
    metadata: { title: task.title, status: task.status, priority: task.priority },
  });

  return sanitizeTask(task);
}

export async function listTasks({ projectId, requester, filters = {} }) {
  const project = await getProjectForUser(projectId, requester);

  const { status, assignedTo, priority, search, page = 1, pageSize = 20 } = filters;
  const limit = Math.min(Number(pageSize) || 20, 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const query = db('tasks')
    .select(
      'id',
      'tenant_id',
      'project_id',
      'title',
      'description',
      'status',
      'priority',
      'assigned_to',
      'created_by',
      'created_at',
      'updated_at'
    )
    .where({ project_id: project.id })
    .andWhere({ tenant_id: project.tenant_id });

  if (status) query.andWhere({ status });
  if (assignedTo !== undefined) query.andWhere({ assigned_to: assignedTo || null });
  if (priority) query.andWhere({ priority });
  if (search) query.andWhere((qb) => {
    qb.whereILike('title', `%${search}%`).orWhereILike('description', `%${search}%`);
  });

  const totalRow = await query.clone().count('* as count').first();

  const tasks = await query.orderBy('created_at', 'asc').limit(limit).offset(offset);

  return {
    data: tasks.map(sanitizeTask),
    page: Number(page) || 1,
    pageSize: limit,
    total: Number(totalRow?.count || 0),
  };
}

export async function updateTaskStatus({ taskId, requester, status }) {
  if (!VALID_STATUS.has(status)) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }

  const task = await db('tasks')
    .select('id', 'tenant_id', 'project_id', 'status', 'priority', 'assigned_to', 'created_by')
    .where({ id: taskId })
    .first();
  if (!task) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  const project = await db('projects').select('id', 'tenant_id').where({ id: task.project_id }).first();
  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }

  ensureTenantMatch(requester, project.tenant_id);

  // Any tenant user can update status
  await db.transaction(async (trx) => {
    await trx('tasks')
      .where({ id: taskId })
      .update({ status, updated_at: trx.fn.now() });

    await trx('audit_logs').insert({
      tenant_id: project.tenant_id,
      table_name: 'tasks',
      record_id: taskId,
      action: 'UPDATE',
      actor_user_id: requester.userId,
      metadata: { before: task, after: { ...task, status } },
    });
  });

  return { ...task, status };
}

export async function updateTask({ taskId, requester, payload }) {
  const task = await db('tasks')
    .select('id', 'tenant_id', 'project_id', 'title', 'description', 'status', 'priority', 'assigned_to', 'created_by')
    .where({ id: taskId })
    .first();

  if (!task) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  const project = await db('projects').select('id', 'tenant_id').where({ id: task.project_id }).first();
  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }

  ensureTenantMatch(requester, project.tenant_id);

  const isCreator = requester.userId === task.created_by;
  const isTenantAdmin = requester.role === 'tenant_admin' && requester.tenantId === project.tenant_id;
  const isSuper = requester.role === 'super_admin';

  if (!isCreator && !isTenantAdmin && !isSuper) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const updates = {};
  if (payload.title !== undefined) updates.title = payload.title;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.status !== undefined) {
    if (!VALID_STATUS.has(payload.status)) {
      const err = new Error('Invalid status');
      err.status = 400;
      throw err;
    }
    updates.status = payload.status;
  }
  if (payload.priority !== undefined) {
    if (!VALID_PRIORITY.has(payload.priority)) {
      const err = new Error('Invalid priority');
      err.status = 400;
      throw err;
    }
    updates.priority = payload.priority;
  }
  if (payload.assignedTo !== undefined) {
    const assigneeId = await validateAssignee(project.tenant_id, payload.assignedTo);
    updates.assigned_to = assigneeId; // can be null
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error('No fields to update');
    err.status = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [updated] = await trx('tasks')
      .where({ id: taskId })
      .update({ ...updates, updated_at: trx.fn.now() })
      .returning([
        'id',
        'tenant_id',
        'project_id',
        'title',
        'description',
        'status',
        'priority',
        'assigned_to',
        'created_by',
        'created_at',
        'updated_at',
      ]);

    await trx('audit_logs').insert({
      tenant_id: project.tenant_id,
      table_name: 'tasks',
      record_id: taskId,
      action: 'UPDATE',
      actor_user_id: requester.userId,
      metadata: { before: task, after: { ...task, ...updates } },
    });

    return sanitizeTask(updated);
  });
}

export async function deleteTask({ taskId, requester }) {
  const task = await db('tasks')
    .select('id', 'tenant_id', 'project_id', 'title', 'description', 'status', 'priority', 'assigned_to', 'created_by')
    .where({ id: taskId })
    .first();

  if (!task) {
    const err = new Error('Task not found');
    err.status = 404;
    throw err;
  }

  const project = await db('projects').select('id', 'tenant_id').where({ id: task.project_id }).first();
  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }

  ensureTenantMatch(requester, project.tenant_id);

  const isCreator = requester.userId === task.created_by;
  const isTenantAdmin = requester.role === 'tenant_admin' && requester.tenantId === project.tenant_id;
  const isSuper = requester.role === 'super_admin';

  if (!isCreator && !isTenantAdmin && !isSuper) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return db.transaction(async (trx) => {
    await trx('audit_logs').insert({
      tenant_id: project.tenant_id,
      table_name: 'tasks',
      record_id: taskId,
      action: 'DELETE',
      actor_user_id: requester.userId,
      metadata: { title: task.title, status: task.status },
    });

    await trx('tasks').where({ id: taskId }).delete();

    return { id: taskId, title: task.title };
  });
}
