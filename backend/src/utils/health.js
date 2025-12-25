import db from '../config/db.js';

const EXPECTED = [
  'migration:001_create_tenants.sql',
  'migration:002_create_users.sql',
  'migration:003_create_projects.sql',
  'migration:004_create_tasks.sql',
  'migration:005_create_audit_logs.sql',
  'migration:006_alter_tenants_add_status.sql',
  'migration:007_alter_projects_add_status.sql',
  'migration:008_alter_tasks_status_priority.sql',
  'seed:seed.sql',
];

export async function checkHealth() {
  try {
    await db.raw('SELECT 1');
    const rows = await db('migrations_run').select('name');
    const done = new Set(rows.map((r) => r.name));
    const allDone = EXPECTED.every((name) => done.has(name));
    if (!allDone) {
      return { ok: false, reason: 'pending migrations or seeds' };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: err.message };
  }
}
