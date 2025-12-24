import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { signToken } from '../middleware/auth.js';

const VALID_PLANS = new Set(['free', 'pro', 'enterprise']);

export async function registerTenantService({ name, subdomain, plan = 'pro', admin }) {
  if (!name || !subdomain || !admin?.email || !admin?.password) {
    const err = new Error('Missing required fields');
    err.status = 400;
    throw err;
  }
  if (!VALID_PLANS.has(plan)) {
    const err = new Error('Invalid plan');
    err.status = 400;
    throw err;
  }

  return db.transaction(async (trx) => {
    // Ensure subdomain unique
    const existingTenant = await trx('tenants').where({ subdomain }).first();
    if (existingTenant) {
      const err = new Error('Subdomain already in use');
      err.status = 409;
      throw err;
    }

    // Create tenant
    const [tenant] = await trx('tenants')
      .insert({ name, subdomain, plan })
      .returning(['id', 'name', 'subdomain', 'plan', 'created_at']);

    // Ensure email not used within tenant
    const existingEmail = await trx('users')
      .where({ tenant_id: tenant.id, email: admin.email })
      .first();
    if (existingEmail) {
      const err = new Error('Email already exists in tenant');
      err.status = 409;
      throw err;
    }

    // Hash password
    const password_hash = await bcrypt.hash(admin.password, 12);

    // Create tenant admin user
    const [user] = await trx('users')
      .insert({
        tenant_id: tenant.id,
        email: admin.email,
        password_hash,
        role: 'tenant_admin',
        first_name: admin.firstName || null,
        last_name: admin.lastName || null,
      })
      .returning(['id', 'tenant_id', 'email', 'role', 'first_name', 'last_name', 'created_at']);

    // Audit logs
    await trx('audit_logs').insert({
      tenant_id: tenant.id,
      table_name: 'tenants',
      record_id: tenant.id,
      action: 'CREATE',
      actor_user_id: user.id,
      metadata: { subdomain: tenant.subdomain, plan: tenant.plan },
    });
    await trx('audit_logs').insert({
      tenant_id: tenant.id,
      table_name: 'users',
      record_id: user.id,
      action: 'CREATE',
      actor_user_id: user.id,
      metadata: { email: user.email, role: user.role },
    });

    const token = signToken({ userId: user.id, tenantId: tenant.id, role: user.role });

    return {
      token,
      user: { id: user.id, email: user.email, role: user.role, tenantId: tenant.id },
      tenant: { id: tenant.id, name: tenant.name, subdomain: tenant.subdomain, plan: tenant.plan },
    };
  });
}

export async function loginService({ email, password, subdomain }) {
  if (!email || !password) {
    const err = new Error('Missing credentials');
    err.status = 400;
    throw err;
  }

  let tenantId = null;
  if (subdomain) {
    const tenant = await db('tenants').where({ subdomain }).first();
    if (!tenant) {
      const err = new Error('Tenant not found');
      err.status = 404;
      throw err;
    }
    tenantId = tenant.id;
  }

  const user = await db('users')
    .where({ email, tenant_id: tenantId })
    .first();
  if (!user) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid email or password');
    err.status = 401;
    throw err;
  }

  const token = signToken({ userId: user.id, tenantId: user.tenant_id, role: user.role });

  return {
    token,
    user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id },
  };
}

export async function meService({ userId }) {
  const user = await db('users')
    .select('id', 'tenant_id', 'email', 'role', 'first_name', 'last_name', 'created_at')
    .where({ id: userId })
    .first();
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  let tenant = null;
  if (user.tenant_id) {
    tenant = await db('tenants')
      .select('id', 'name', 'subdomain', 'plan', 'created_at')
      .where({ id: user.tenant_id })
      .first();
  }
  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      tenantId: user.tenant_id,
      createdAt: user.created_at,
    },
    tenant,
  };
}
