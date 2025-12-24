import db from '../config/db.js';

const ALLOWED_PLANS = new Set(['free', 'pro', 'enterprise']);
const ALLOWED_STATUS = new Set(['active', 'suspended', 'trial']);

function ensureTenantAccess({ requester, tenantId }) {
  if (requester.role === 'super_admin') return;
  if (!requester.tenantId || requester.tenantId !== tenantId) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
}

async function getTenantStats(trx, tenantId) {
  const [usersRow] = await trx('users').where({ tenant_id: tenantId }).count('id as count');
  const [projectsRow] = await trx('projects').where({ tenant_id: tenantId }).count('id as count');
  const [tasksRow] = await trx('tasks').where({ tenant_id: tenantId }).count('id as count');
  return {
    totalUsers: Number(usersRow.count || 0),
    totalProjects: Number(projectsRow.count || 0),
    totalTasks: Number(tasksRow.count || 0),
  };
}

export async function getTenantById({ tenantId, requester }) {
  const tenant = await db('tenants')
    .select('id', 'name', 'subdomain', 'plan', 'status', 'max_users', 'max_projects', 'created_at', 'updated_at')
    .where({ id: tenantId })
    .first();
  if (!tenant) {
    const err = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  ensureTenantAccess({ requester, tenantId });

  const stats = await getTenantStats(db, tenantId);
  return { ...tenant, stats };
}

export async function listTenants({ requester }) {
  if (requester.role !== 'super_admin') {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }
  const tenants = await db('tenants')
    .select('id', 'name', 'subdomain', 'plan', 'status', 'max_users', 'max_projects', 'created_at', 'updated_at')
    .orderBy('created_at', 'asc');

  const results = [];
  for (const tenant of tenants) {
    const stats = await getTenantStats(db, tenant.id);
    results.push({ ...tenant, stats });
  }
  return results;
}

export async function updateTenant({ tenantId, requester, payload }) {
  const tenant = await db('tenants')
    .select('id', 'name', 'subdomain', 'plan', 'status', 'max_users', 'max_projects', 'created_at', 'updated_at')
    .where({ id: tenantId })
    .first();
  if (!tenant) {
    const err = new Error('Tenant not found');
    err.status = 404;
    throw err;
  }

  ensureTenantAccess({ requester, tenantId });

  const isSuper = requester.role === 'super_admin';
  const updates = {};

  if (requester.role === 'tenant_admin') {
    if (payload.name) updates.name = payload.name;
    if (Object.keys(updates).length === 0) {
      const err = new Error('No permitted fields to update');
      err.status = 403;
      throw err;
    }
  } else if (isSuper) {
    if (payload.name) updates.name = payload.name;
    if (payload.plan) {
      if (!ALLOWED_PLANS.has(payload.plan)) {
        const err = new Error('Invalid plan');
        err.status = 400;
        throw err;
      }
      updates.plan = payload.plan;
    }
    if (payload.status) {
      if (!ALLOWED_STATUS.has(payload.status)) {
        const err = new Error('Invalid status');
        err.status = 400;
        throw err;
      }
      updates.status = payload.status;
    }
    if (payload.max_users !== undefined) updates.max_users = payload.max_users;
    if (payload.max_projects !== undefined) updates.max_projects = payload.max_projects;
    if (Object.keys(updates).length === 0) {
      const err = new Error('No fields to update');
      err.status = 400;
      throw err;
    }
  } else {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [updated] = await trx('tenants')
      .where({ id: tenantId })
      .update({ ...updates, updated_at: trx.fn.now() })
      .returning('id');

    await trx('audit_logs').insert({
      tenant_id: tenantId,
      table_name: 'tenants',
      record_id: tenantId,
      action: 'UPDATE',
      actor_user_id: requester.userId,
      metadata: { before: tenant, after: { ...tenant, ...updates } },
    });

    const refreshed = await trx('tenants')
      .select('id', 'name', 'subdomain', 'plan', 'status', 'max_users', 'max_projects', 'created_at', 'updated_at')
      .where({ id: updated.id })
      .first();

    const stats = await getTenantStats(trx, tenantId);
    return { ...refreshed, stats };
  });
}
