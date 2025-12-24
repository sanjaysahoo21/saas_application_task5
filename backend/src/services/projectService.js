import db from '../config/db.js';

const VALID_STATUS = new Set(['active', 'archived', 'completed']);

function ensureTenant(reqUserTenantId, targetTenantId, role) {
  if (role === 'super_admin') return;
  if (!reqUserTenantId || reqUserTenantId !== targetTenantId) {
    const err = new Error('Forbidden: tenant mismatch');
    err.status = 403;
    throw err;
  }
}

async function getTaskCounts(trx, projectId) {
  const [totalRow] = await trx('tasks').where({ project_id: projectId }).count('id as count');
  const [doneRow] = await trx('tasks').where({ project_id: projectId, status: 'done' }).count('id as count');
  return {
    taskCount: Number(totalRow.count || 0),
    completedTaskCount: Number(doneRow.count || 0),
  };
}

export async function createProject({ requester, payload }) {
  const tenantId = requester.tenantId;
  if (!tenantId) {
    const err = new Error('Forbidden: tenant required');
    err.status = 403;
    throw err;
  }

  const { name, description } = payload || {};
  if (!name) {
    const err = new Error('Project name is required');
    err.status = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    // Ensure tenant exists
    const tenant = await trx('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      const err = new Error('Tenant not found');
      err.status = 404;
      throw err;
    }

    // Enforce max_projects
    const [countRow] = await trx('projects').where({ tenant_id: tenantId }).count('id as count');
    const currentProjects = Number(countRow.count || 0);
    if (currentProjects >= tenant.max_projects) {
      const err = new Error('Max projects limit reached for this tenant');
      err.status = 403;
      throw err;
    }

    const [project] = await trx('projects')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        created_by: requester.userId,
        status: 'active',
      })
      .returning(['id', 'tenant_id', 'name', 'description', 'status', 'created_by', 'created_at', 'updated_at']);

    await trx('audit_logs').insert({
      tenant_id: tenantId,
      table_name: 'projects',
      record_id: project.id,
      action: 'CREATE',
      actor_user_id: requester.userId,
      metadata: { name: project.name, status: project.status },
    });

    const counts = await getTaskCounts(trx, project.id);

    return { ...project, ...counts };
  });
}

export async function listProjects({ requester }) {
  const tenantId = requester.tenantId;
  if (!tenantId && requester.role !== 'super_admin') {
    const err = new Error('Forbidden: tenant required');
    err.status = 403;
    throw err;
  }

  const projects = await db('projects')
    .select('id', 'tenant_id', 'name', 'description', 'status', 'created_by', 'created_at', 'updated_at')
    .modify((qb) => {
      if (requester.role !== 'super_admin') {
        qb.where({ tenant_id: tenantId });
      }
    })
    .orderBy('created_at', 'asc');

  const results = [];
  for (const project of projects) {
    ensureTenant(requester.tenantId, project.tenant_id, requester.role);
    const counts = await getTaskCounts(db, project.id);
    results.push({ ...project, ...counts });
  }
  return results;
}

export async function updateProject({ projectId, requester, payload }) {
  const project = await db('projects')
    .select('id', 'tenant_id', 'name', 'description', 'status', 'created_by', 'created_at', 'updated_at')
    .where({ id: projectId })
    .first();

  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }

  ensureTenant(requester.tenantId, project.tenant_id, requester.role);

  const isOwner = requester.userId === project.created_by;
  const isTenantAdmin = requester.role === 'tenant_admin' && requester.tenantId === project.tenant_id;
  const isSuper = requester.role === 'super_admin';

  if (!isOwner && !isTenantAdmin && !isSuper) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const updates = {};
  if (payload.name !== undefined) updates.name = payload.name;
  if (payload.description !== undefined) updates.description = payload.description;
  if (payload.status !== undefined) {
    if (!VALID_STATUS.has(payload.status)) {
      const err = new Error('Invalid status');
      err.status = 400;
      throw err;
    }
    updates.status = payload.status;
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error('No fields to update');
    err.status = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [updated] = await trx('projects')
      .where({ id: projectId })
      .update({ ...updates, updated_at: trx.fn.now() })
      .returning(['id', 'tenant_id', 'name', 'description', 'status', 'created_by', 'created_at', 'updated_at']);

    await trx('audit_logs').insert({
      tenant_id: project.tenant_id,
      table_name: 'projects',
      record_id: projectId,
      action: 'UPDATE',
      actor_user_id: requester.userId,
      metadata: { before: project, after: { ...project, ...updates } },
    });

    const counts = await getTaskCounts(trx, projectId);

    return { ...updated, ...counts };
  });
}

export async function deleteProject({ projectId, requester }) {
  const project = await db('projects')
    .select('id', 'tenant_id', 'name', 'description', 'status', 'created_by')
    .where({ id: projectId })
    .first();

  if (!project) {
    const err = new Error('Project not found');
    err.status = 404;
    throw err;
  }

  ensureTenant(requester.tenantId, project.tenant_id, requester.role);

  const isOwner = requester.userId === project.created_by;
  const isTenantAdmin = requester.role === 'tenant_admin' && requester.tenantId === project.tenant_id;
  const isSuper = requester.role === 'super_admin';

  if (!isOwner && !isTenantAdmin && !isSuper) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return db.transaction(async (trx) => {
    await trx('audit_logs').insert({
      tenant_id: project.tenant_id,
      table_name: 'projects',
      record_id: projectId,
      action: 'DELETE',
      actor_user_id: requester.userId,
      metadata: { name: project.name },
    });

    await trx('projects').where({ id: projectId }).delete();

    return { id: projectId, name: project.name };
  });
}
