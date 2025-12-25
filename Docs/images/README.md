# Images Directory

This directory should contain the following diagrams:

## 1. system-architecture.png

**System Architecture Diagram** showing:
- User/Browser layer
- Backend API (Node.js + Express) on port 5000
- PostgreSQL Database on port 5432
- Docker containers (backend and database services)
- JWT authentication flow
- Multi-tenant isolation mechanism
- Request/Response flow

**Recommended content:**
```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP Requests
       │ (JWT in header)
       ↓
┌─────────────────────────────┐
│  Docker: Backend Container  │
│  Node.js + Express (5000)   │
│  ┌───────────────────────┐  │
│  │  JWT Middleware       │  │
│  │  Tenant Context       │  │
│  │  Route Handlers       │  │
│  │  Service Layer        │  │
│  └───────────────────────┘  │
└──────────┬──────────────────┘
           │ SQL Queries
           │ (with tenant_id filter)
           ↓
┌─────────────────────────────┐
│ Docker: Database Container  │
│ PostgreSQL 15 (5432)        │
│ ┌───────────────────────┐   │
│ │ Tenants               │   │
│ │ Users (tenant_id)     │   │
│ │ Projects (tenant_id)  │   │
│ │ Tasks (tenant_id)     │   │
│ │ Audit Logs            │   │
│ └───────────────────────┘   │
└─────────────────────────────┘
```

**Create using:** draw.io, Lucidchart, PlantUML, Mermaid, or any diagramming tool

---

## 2. database-erd.png

**Entity-Relationship Diagram (ERD)** showing:

### Tables:
1. **tenants**
   - id (UUID, PK)
   - name (TEXT)
   - subdomain (CITEXT, UNIQUE)
   - plan (plan_type ENUM)
   - status (tenant_status ENUM)
   - max_users (INTEGER)
   - max_projects (INTEGER)

2. **users**
   - id (UUID, PK)
   - tenant_id (UUID, FK → tenants.id, nullable for super_admin)
   - email (CITEXT, UNIQUE with tenant_id)
   - password_hash (TEXT)
   - role (user_role ENUM)
   - first_name (TEXT)
   - last_name (TEXT)

3. **projects**
   - id (UUID, PK)
   - tenant_id (UUID, FK → tenants.id)
   - name (TEXT)
   - description (TEXT)
   - status (project_status ENUM)
   - created_by (UUID, FK → users.id)

4. **tasks**
   - id (UUID, PK)
   - tenant_id (UUID, FK → tenants.id)
   - project_id (UUID, FK → projects.id)
   - title (TEXT)
   - description (TEXT)
   - status (task_status ENUM)
   - priority (task_priority ENUM)
   - assigned_to (UUID, FK → users.id)
   - created_by (UUID, FK → users.id)

5. **audit_logs**
   - id (UUID, PK)
   - tenant_id (UUID, FK → tenants.id, nullable)
   - user_id (UUID, FK → users.id, nullable)
   - action (audit_action ENUM)
   - entity_type (TEXT)
   - entity_id (UUID)
   - metadata (JSONB)

### ENUM Types:
- plan_type: starter, pro, enterprise
- user_role: super_admin, tenant_admin, user
- tenant_status: active, suspended, trial
- project_status: active, archived, completed
- task_status: todo, in_progress, completed
- task_priority: low, medium, high
- audit_action: CREATE, UPDATE, DELETE

### Relationships:
- users.tenant_id → tenants.id (many-to-one)
- projects.tenant_id → tenants.id (many-to-one)
- projects.created_by → users.id (many-to-one)
- tasks.tenant_id → tenants.id (many-to-one)
- tasks.project_id → projects.id (many-to-one)
- tasks.assigned_to → users.id (many-to-one)
- tasks.created_by → users.id (many-to-one)
- audit_logs.tenant_id → tenants.id (many-to-one, nullable)
- audit_logs.user_id → users.id (many-to-one, nullable)

**Create using:** dbdiagram.io, ERDPlus, draw.io, MySQL Workbench, or any database design tool

---

## How to Add Diagrams

1. Create the diagrams using your preferred tool
2. Export as PNG format
3. Save files in this directory:
   - `system-architecture.png`
   - `database-erd.png`
4. Ensure the files are named exactly as specified
5. Commit and push to repository

## Online Tools (No Installation Required)

- **draw.io** - https://app.diagrams.net/
- **dbdiagram.io** - https://dbdiagram.io/
- **Lucidchart** - https://www.lucidchart.com/
- **Mermaid Live Editor** - https://mermaid.live/

## Example SQL for ERD Generation

If using a database design tool, you can use these migrations:
- See `backend/migrations/001_create_tenants.sql` through `009_tasks_add_priority.sql`
- Import into your tool to auto-generate ERD
