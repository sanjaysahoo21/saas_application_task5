# Technical Specification
### Multi-Tenant SaaS Platform

---

## 1. Purpose of This Document

This document explains the technical structure of the project. It covers the folder layout, the technologies we'll use, and the steps required to get the project running on a local machine. Its goal is to help developers get started quickly.

---

## 2. Technology Stack

### Backend
*   Node.js 18+
*   Express.js
*   PostgreSQL 15
*   JWT for authentication (jsonwebtoken)
*   bcryptjs for password hashing
*   Knex.js for SQL query building

### DevOps
*   Docker
*   Docker Compose
*   Automatic database migrations on startup

---

## 3. Backend Project Structure

```
backend/
├── migrations/
│   ├── 001_create_tenants.sql
│   ├── 002_create_users.sql
│   ├── 003_create_projects.sql
│   ├── 004_create_tasks.sql
│   ├── 005_create_audit_logs.sql
│   ├── 006_alter_tenants_add_status.sql
│   ├── 007_alter_projects_add_status.sql
│   ├── 008_alter_tasks_status_priority.sql
│   └── 009_tasks_add_priority.sql
├── seeds/
│   └── seed.sql
├── scripts/
│   ├── bootstrap.js
│   └── initDb.js
├── src/
│   ├── config/
│   │   ├── db.js
│   │   └── env.js
│   ├── controller/
│   │   ├── auth/
│   │   ├── tenant/
│   │   ├── user/
│   │   ├── project/
│   │   └── task/
│   ├── service/
│   │   ├── authService.js
│   │   ├── tenantService.js
│   │   ├── userService.js
│   │   ├── projectService.js
│   │   └── taskService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── roles.js
│   │   └── tenant.js
│   ├── routes/
│   │   ├── index.js
│   │   ├── auth.js
│   │   ├── tenants.js
│   │   ├── users.js
│   │   ├── projects.js
│   │   └── tasks.js
│   ├── utils/
│   │   └── health.js
│   ├── app.js
│   └── server.js
├── Dockerfile
├── package.json
└── .env.example
```

### Folder Explanation

*   **migrations:** SQL scripts for database schema creation and evolution (001-009).
*   **seeds:** Demo data for testing (superadmin, demo tenant, users, projects, tasks).
*   **scripts:** Bootstrap and database initialization scripts that run on startup.
*   **config:** Database connection and environment variable loaders.
*   **controller:** HTTP request handlers that call service layer functions.
*   **service:** Core business logic for auth, tenants, users, projects, and tasks.
*   **middleware:** JWT authentication, role-based access control, and tenant context.
*   **routes:** API endpoint definitions mounted under `/api`.
*   **utils:** Health check and utility functions.
*   **app.js:** Express app configuration with middleware and routes.
*   **server.js:** HTTP server startup and error handling.

---

## 4. Environment Variables

The application is configured using environment variables.

### Backend (`.env` or `docker-compose.yml`)
```
NODE_ENV=production
PORT=5000

DB_HOST=database
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=vinay2122@

JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=1d
```

---

## 5. Development Setup Guide

### Prerequisites
*   Node.js 18+
*   Docker and Docker Compose
*   Git

### How to Run (Recommended)

The easiest way to run the backend is with Docker Compose.

```bash
# From the project root directory
docker-compose up -d
```

This command will:
1. Build the backend Docker image
2. Start PostgreSQL database container
3. Start backend container
4. Automatically run all migrations (001-009)
5. Load seed data (demo tenant, users, projects, tasks)

### Health Check

Once running, verify the system is healthy:

```bash
curl http://localhost:5000/api/health
# Expected: {"success":true,"data":{"status":"ok","database":"connected"}}
```

### Access URLs

*   **Frontend:** `http://localhost:3000`
*   **Backend API:** `http://localhost:5000`
*   **Health Check:** `http://localhost:5000/api/health`

---

## 7. Database Migrations

Database setup is handled automatically. When the backend server starts, it will use scripts in the `db/migration` folder to create the necessary tables. It will also seed the database with initial data, including a super admin account and a demo tenant to get you started.

---

## 8. Conclusion

This specification provides a clear technical blueprint for the project. It defines the structure and setup process, ensuring that all developers are working from a consistent foundation.
