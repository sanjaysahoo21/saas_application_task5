import bcrypt from 'bcryptjs';
import db from '../config/db.js';

const VALID_ROLES = new Set(['tenant_admin', 'user']);

function ensureTenantMatch({ requester, tenantId }) {
  if (requester.role === 'super_admin') return; // super_admin can manage any tenant
  if (!requester.tenantId || requester.tenantId !== tenantId) {
    const err = new Error('Forbidden: tenant mismatch');
    err.status = 403;
    throw err;
  }
}

function sanitizeUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

export async function createUser({ tenantId, requester, payload }) {
  // Ensure requester is tenant_admin of the target tenant
  if (requester.role !== 'tenant_admin' && requester.role !== 'super_admin') {
    const err = new Error('Forbidden: only tenant_admin can create users');
    err.status = 403;
    throw err;
  }
  ensureTenantMatch({ requester, tenantId });

  const { email, password, role = 'user', firstName, lastName } = payload || {};
  if (!email || !password) {
    const err = new Error('Missing required fields: email, password');
    err.status = 400;
    throw err;
  }

  if (!VALID_ROLES.has(role)) {
    const err = new Error('Invalid role');
    err.status = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    // Check tenant exists
    const tenant = await trx('tenants').where({ id: tenantId }).first();
    if (!tenant) {
      const err = new Error('Tenant not found');
      err.status = 404;
      throw err;
    }

    // Enforce max_users limit
    const [countRow] = await trx('users').where({ tenant_id: tenantId }).count('id as count');
    const currentUsers = Number(countRow.count || 0);
    if (currentUsers >= tenant.max_users) {
      const err = new Error('Max users limit reached for this tenant');
      err.status = 403;
      throw err;
    }

    // Check email uniqueness within tenant
    const existing = await trx('users').where({ tenant_id: tenantId, email }).first();
    if (existing) {
      const err = new Error('Email already exists in this tenant');
      err.status = 409;
      throw err;
    }

    const password_hash = await bcrypt.hash(password, 12);

    const [user] = await trx('users')
      .insert({
        tenant_id: tenantId,
        email,
        password_hash,
        role,
        first_name: firstName || null,
        last_name: lastName || null,
      })
      .returning(['id', 'tenant_id', 'email', 'role', 'first_name', 'last_name', 'created_at', 'updated_at']);

    await trx('audit_logs').insert({
      tenant_id: tenantId,
      table_name: 'users',
      record_id: user.id,
      action: 'CREATE',
      actor_user_id: requester.userId,
      metadata: { email: user.email, role: user.role },
    });

    return sanitizeUser(user);
  });
}

export async function listUsers({ tenantId, requester }) {
  // Ensure requester is tenant_admin or user of the target tenant
  if (requester.role !== 'super_admin') {
    ensureTenantMatch({ requester, tenantId });
  }

  const users = await db('users')
    .select('id', 'tenant_id', 'email', 'role', 'first_name', 'last_name', 'created_at', 'updated_at')
    .where({ tenant_id: tenantId })
    .orderBy('created_at', 'asc');

  return users.map(sanitizeUser);
}

export async function updateUser({ userId, requester, payload }) {
  const user = await db('users')
    .select('id', 'tenant_id', 'email', 'role', 'first_name', 'last_name', 'created_at', 'updated_at')
    .where({ id: userId })
    .first();

  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // Self-update: users can update their own firstName/lastName
  const isSelf = requester.userId === userId;
  const isTenantAdmin = requester.role === 'tenant_admin' && requester.tenantId === user.tenant_id;
  const isSuperAdmin = requester.role === 'super_admin';

  if (!isSelf && !isTenantAdmin && !isSuperAdmin) {
    const err = new Error('Forbidden');
    err.status = 403;
    throw err;
  }

  const updates = {};

  if (isSelf) {
    // Self-update: only firstName, lastName
    if (payload.firstName !== undefined) updates.first_name = payload.firstName;
    if (payload.lastName !== undefined) updates.last_name = payload.lastName;
  } else if (isTenantAdmin || isSuperAdmin) {
    // tenant_admin or super_admin can update firstName, lastName, role
    if (payload.firstName !== undefined) updates.first_name = payload.firstName;
    if (payload.lastName !== undefined) updates.last_name = payload.lastName;
    if (payload.role !== undefined) {
      if (!VALID_ROLES.has(payload.role)) {
        const err = new Error('Invalid role');
        err.status = 400;
        throw err;
      }
      updates.role = payload.role;
    }
  }

  if (Object.keys(updates).length === 0) {
    const err = new Error('No fields to update');
    err.status = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    const [updated] = await trx('users')
      .where({ id: userId })
      .update({ ...updates, updated_at: trx.fn.now() })
      .returning(['id', 'tenant_id', 'email', 'role', 'first_name', 'last_name', 'created_at', 'updated_at']);

    await trx('audit_logs').insert({
      tenant_id: user.tenant_id,
      table_name: 'users',
      record_id: userId,
      action: 'UPDATE',
      actor_user_id: requester.userId,
      metadata: { before: user, after: { ...user, ...updates } },
    });

    return sanitizeUser(updated);
  });
}

export async function deleteUser({ userId, requester }) {
  if (requester.role !== 'tenant_admin' && requester.role !== 'super_admin') {
    const err = new Error('Forbidden: only tenant_admin can delete users');
    err.status = 403;
    throw err;
  }

  const user = await db('users')
    .select('id', 'tenant_id', 'email', 'role', 'first_name', 'last_name')
    .where({ id: userId })
    .first();

  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }

  // tenant_admin cannot delete themselves
  if (requester.userId === userId) {
    const err = new Error('Forbidden: cannot delete yourself');
    err.status = 403;
    throw err;
  }

  // Ensure tenant match (except super_admin)
  if (requester.role !== 'super_admin') {
    ensureTenantMatch({ requester, tenantId: user.tenant_id });
  }

  return db.transaction(async (trx) => {
    await trx('audit_logs').insert({
      tenant_id: user.tenant_id,
      table_name: 'users',
      record_id: userId,
      action: 'DELETE',
      actor_user_id: requester.userId,
      metadata: { deletedUser: sanitizeUser(user) },
    });

    await trx('users').where({ id: userId }).delete();

    return { id: userId, email: user.email };
  });
}
