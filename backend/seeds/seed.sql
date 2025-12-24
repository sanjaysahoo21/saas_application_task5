BEGIN;

-- Demo tenant
WITH demo_tenant AS (
    INSERT INTO tenants (name, subdomain, plan, max_users, max_projects)
    VALUES ('Demo Tenant', 'demo', 'pro', 25, 50)
    RETURNING id
),
-- Super admin user (tenant_id NULL)
super_admin AS (
    INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name)
    VALUES (NULL, 'superadmin@system.com', '$2a$12$zfg7QOiXJw8mRHY5pwStQOn8LDndsBmqD/Eov33mrAf1B/nIIaQiq', 'super_admin', 'Super', 'Admin')
    RETURNING id
),
-- Tenant admin for demo
tenant_admin AS (
    INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name)
    SELECT dt.id, 'admin@demo.com', '$2a$12$zfg7QOiXJw8mRHY5pwStQOn8LDndsBmqD/Eov33mrAf1B/nIIaQiq', 'tenant_admin', 'Demo', 'Admin'
    FROM demo_tenant dt
    RETURNING id
),
-- Two demo users
user_one AS (
    INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name)
    SELECT dt.id, 'user1@demo.com', '$2a$12$zfg7QOiXJw8mRHY5pwStQOn8LDndsBmqD/Eov33mrAf1B/nIIaQiq', 'user', 'User', 'One'
    FROM demo_tenant dt
    RETURNING id
),
user_two AS (
    INSERT INTO users (tenant_id, email, password_hash, role, first_name, last_name)
    SELECT dt.id, 'user2@demo.com', '$2a$12$zfg7QOiXJw8mRHY5pwStQOn8LDndsBmqD/Eov33mrAf1B/nIIaQiq', 'user', 'User', 'Two'
    FROM demo_tenant dt
    RETURNING id
),
-- Two projects created by tenant admin
project_alpha AS (
    INSERT INTO projects (tenant_id, name, description, created_by)
    SELECT dt.id, 'Project Alpha', 'Initial alpha project', ta.id
    FROM demo_tenant dt, tenant_admin ta
    RETURNING id
),
project_beta AS (
    INSERT INTO projects (tenant_id, name, description, created_by)
    SELECT dt.id, 'Project Beta', 'Secondary beta project', ta.id
    FROM demo_tenant dt, tenant_admin ta
    RETURNING id
)
-- Sample tasks for the projects
INSERT INTO tasks (tenant_id, project_id, title, description, status, assigned_to, created_by)
SELECT dt.id, pa.id, 'Design schema', 'Model core multi-tenant tables', 'in_progress', u1.id, ta.id
FROM demo_tenant dt, project_alpha pa, tenant_admin ta, user_one u1;

INSERT INTO tasks (tenant_id, project_id, title, description, status, assigned_to, created_by)
SELECT dt.id, pa.id, 'Set up CI', 'Configure pipeline for tests and lint', 'todo', u2.id, ta.id
FROM demo_tenant dt, project_alpha pa, tenant_admin ta, user_two u2;

INSERT INTO tasks (tenant_id, project_id, title, description, status, assigned_to, created_by)
SELECT dt.id, pb.id, 'Implement auth', 'JWT auth and RBAC', 'todo', u1.id, ta.id
FROM demo_tenant dt, project_beta pb, tenant_admin ta, user_one u1;

INSERT INTO tasks (tenant_id, project_id, title, description, status, assigned_to, created_by)
SELECT dt.id, pb.id, 'Write docs', 'Add README and API docs', 'done', u2.id, ta.id
FROM demo_tenant dt, project_beta pb, tenant_admin ta, user_two u2;

COMMIT;
