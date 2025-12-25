# System Architecture Document
### Multi-Tenant SaaS Platform

---

## 1. High-Level System Architecture

### 1.1. Architecture Overview

Our system uses a classic client-server architecture. It has three main parts that work together:

1.  **The Frontend:** This is the web application that users interact with in their browser.
2.  **The Backend:** This is the server that holds all the logic and connects to the database.
3.  **The Database:** This is where all the application data is stored.

To make development and deployment easy and consistent, all three parts will be run in **Docker** containers, managed by a single **Docker Compose** file.

### 1.2. Architecture Components

#### Frontend Application
*   **Technology:** A React single-page application.
*   **Port:** Runs on port `3000`.
*   **Responsibilities:** It handles what the user sees and does, manages page navigation, and communicates with the backend by sending API requests. When a user logs in, it saves the authentication token.

#### Backend API Server
*   **Technology:** A Node.js application built with Express.js.
*   **Port:** Runs on port `5000`.
*   **Responsibilities:** It provides REST APIs for the frontend to use. It manages user authentication, checks permissions, enforces tenant data separation, and contains all the core business logic.

#### Database
*   **Technology:** A PostgreSQL database.
*   **Port:** Runs on port `5432`.
*   **Responsibilities:** It stores all data for the application, including users, projects, and tasks. It uses a `tenant_id` column in its tables to keep each organization's data separate.

### 1.3. Authentication Flow

1.  A user enters their credentials on the frontend login page.
2.  The frontend sends these details to the backend `/login` API.
3.  The backend checks the credentials against the database.
4.  If correct, the backend creates a signed JWT token and sends it back.
5.  The frontend saves this token and includes it in the header of all future requests to protected APIs.

### 1.4. Multi-Tenancy Flow

Keeping tenant data separate is critical. Here is how it works:

*   Every API request from a logged-in user includes their JWT token in the `Authorization: Bearer <token>` header.
*   Middleware on the backend reads the `tenantId` from the JWT token before any route handler logic runs.
*   All database queries automatically include a `WHERE tenant_id = ?` clause, using the ID from the token.
*   This ensures a user can only ever access data belonging to their own organization.
*   Super admins (with `tenant_id = NULL`) have cross-tenant access for system management.

### 1.5. System Architecture Diagram

**TODO: Add system architecture diagram**

Create a diagram illustrating the complete system architecture and save it as:
`Docs/images/system-architecture.png`

The diagram should show:
- User/Browser layer
- Backend API (Node.js + Express) on port 5000
- PostgreSQL Database on port 5432
- Docker containers for backend and database
- JWT token flow (login → token → authenticated requests)
- Multi-tenant data isolation via tenant_id
- Request/Response flow between components

**Recommended tools:** draw.io, Lucidchart, PlantUML, or any diagramming tool

---

## 2. Database Schema Design

### 2.1. Database Design Overview

We are using the **"Shared Database, Shared Schema"** model. This means all data for all tenants lives in one PostgreSQL database instance. We use a `tenant_id` column (UUID) on each relevant table to enforce strict data isolation.

Users who are Super Admins are not part of any tenant, so their `tenant_id` will be `NULL`. All other users must belong to exactly one tenant.

The database is automatically initialized via **migration scripts** (001-009) on first startup using Docker Compose.

### 2.2. Core Tables

Here are the main tables in our database:

*   **tenants:** Stores information about each organization (UUID id, name, subdomain, plan, status, max_users, max_projects)
*   **users:** Stores all user accounts with tenant_id (UUID), email (unique per tenant), password_hash, role (super_admin, tenant_admin, user), first_name, last_name
*   **projects:** Stores project information (UUID id, tenant_id, name, description, status, created_by foreign key to users)
*   **tasks:** Stores tasks (UUID id, tenant_id, project_id, title, description, status, priority, assigned_to, created_by)
*   **audit_logs:** Records all CREATE/UPDATE/DELETE actions (UUID id, tenant_id, user_id, action, entity_type, entity_id, metadata JSONB)

All tables use UUID primary keys. All tenant-specific tables have a `tenant_id` column with CASCADE foreign key to tenants table.

### 2.3. Database ERD Diagram

**TODO: Add database ERD diagram**

Create an Entity-Relationship Diagram (ERD) and save it as:
`Docs/images/database-erd.png`

The diagram should show:
- All 5 tables (tenants, users, projects, tasks, audit_logs)
- Primary keys (UUID)
- Foreign key relationships:
  - users.tenant_id → tenants.id
  - projects.tenant_id → tenants.id
  - projects.created_by → users.id
  - tasks.tenant_id → tenants.id
  - tasks.project_id → projects.id
  - tasks.assigned_to → users.id
  - tasks.created_by → users.id
  - audit_logs.tenant_id → tenants.id
  - audit_logs.user_id → users.id
- ENUM types: plan_type, user_role, tenant_status, project_status, task_status, task_priority, audit_action
- Unique constraints: users(tenant_id, email), tenants(subdomain)
- Indexes on tenant_id, created_by, assigned_to columns

**Recommended tools:** dbdiagram.io, ERDPlus, draw.io, or any database design tool

---

## 3. API Architecture

### 3.1. API Structure

The backend will expose a set of RESTful APIs. All communication will use JSON for requests and responses, and the API endpoints will follow a consistent and predictable structure.

The base URL for all API endpoints will be `/api`.

### 3.2. API Endpoints

Here is a preliminary list of the main API endpoints, grouped by function:

#### Authentication APIs
*   `POST /api/auth/register-tenant`
*   `POST /api/auth/login`
*   `GET /api/auth/me`

#### Tenant APIs (for Super Admins)
*   `GET /api/tenants`
*   `GET /api/tenants/{tenantId}`
*   `PUT /api/tenants/{tenantId}`

#### User APIs (for Tenant Admins)
*   `POST /api/users`
*   `GET /api/users`
*   `PUT /api/users/{userId}`
*   `DELETE /api/users/{userId}`

#### Project APIs
*   `POST /api/projects`
*   `GET /api/projects`
*   `PUT /api/projects/{projectId}`
*   `DELETE /api/projects/{projectId}`

#### Task APIs
*   `POST /api/tasks`
*   `GET /api/tasks`
*   `PUT /api/tasks/{taskId}`
*   `PATCH /api/tasks/{taskId}/status`

### 3.3. API Security

Security is enforced at multiple levels:

*   All protected endpoints will require a valid JWT token.
*   The backend will check the user's role before allowing them to perform sensitive actions.
*   Tenant isolation is automatically enforced at the database level.
*   All incoming data will be validated to prevent invalid or malicious payloads.

---

## Conclusion

This architecture provides a solid foundation for our application. It ensures a clean separation between the frontend and backend, provides a secure way to handle data for multiple tenants, and uses industry-standard technologies that are scalable and maintainable.
