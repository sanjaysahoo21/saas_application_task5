# API Documentation
## Multi-Tenant SaaS Platform

Base URL: `http://localhost:5000/api`

All API responses follow this format:
```json
{
  "success": true,
  "message": "Optional message",
  "data": { ... }
}
```

Error responses:
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. Health Check

### Check System Health
```
GET /api/health
```

**Auth Required:** No

**Description:** Verifies database connectivity and migration status.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "database": "connected"
  }
}
```

---

## 2. Authentication APIs

### Register New Tenant
```
POST /api/auth/register-tenant
```

**Auth Required:** No

**Description:** Creates a new tenant organization and its first admin user.

**Request Body:**
```json
{
  "tenantName": "Acme Corp",
  "subdomain": "acme",
  "plan": "pro",
  "firstName": "John",
  "lastName": "Doe",
  "email": "admin@acme.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant registered successfully",
  "data": {
    "tenant": { "id": "uuid", "name": "Acme Corp", ... },
    "user": { "id": "uuid", "email": "admin@acme.com", ... }
  }
}
```

---

### Login
```
POST /api/auth/login
```

**Auth Required:** No

**Description:** Authenticates a user and returns a JWT token.

**Request Body:**
```json
{
  "email": "admin@demo.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "role": "tenant_admin",
      "tenantId": "uuid"
    }
  }
}
```

---

### Get Current User
```
GET /api/auth/me
```

**Auth Required:** Yes

**Description:** Returns the currently authenticated user's profile.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "admin@demo.com",
    "role": "tenant_admin",
    "firstName": "Demo",
    "lastName": "Admin",
    "tenantId": "uuid"
  }
}
```

---

### Logout
```
POST /api/auth/logout
```

**Auth Required:** Yes

**Description:** Logout endpoint (currently stateless, client should discard token).

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 3. Tenant Management APIs

### List All Tenants
```
GET /api/tenants
```

**Auth Required:** Yes (Super Admin only)

**Description:** Returns all tenants in the system with usage statistics.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Demo Tenant",
      "subdomain": "demo",
      "plan": "pro",
      "status": "active",
      "userCount": 3,
      "projectCount": 2,
      "maxUsers": 25,
      "maxProjects": 50
    }
  ]
}
```

---

### Get Tenant Details
```
GET /api/tenants/:tenantId
```

**Auth Required:** Yes (Tenant Admin/User for their own tenant, Super Admin for any)

**Description:** Returns detailed information about a specific tenant.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Demo Tenant",
    "subdomain": "demo",
    "plan": "pro",
    "status": "active",
    "maxUsers": 25,
    "maxProjects": 50,
    "userCount": 3,
    "projectCount": 2,
    "createdAt": "2025-12-25T..."
  }
}
```

---

### Update Tenant
```
PUT /api/tenants/:tenantId
```

**Auth Required:** Yes (Tenant Admin for their tenant, Super Admin for any)

**Description:** Updates tenant information (name, plan, limits, status).

**Request Body:**
```json
{
  "name": "Updated Tenant Name",
  "plan": "enterprise",
  "maxUsers": 100,
  "maxProjects": 200,
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Tenant Name",
    ...
  }
}
```

---

## 4. User Management APIs

### Create User
```
POST /api/tenants/:tenantId/users
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Creates a new user within the tenant (enforces max_users limit).

**Request Body:**
```json
{
  "email": "newuser@demo.com",
  "password": "SecurePass123",
  "firstName": "New",
  "lastName": "User",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "newuser@demo.com",
    "role": "user",
    "tenantId": "uuid"
  }
}
```

---

### List Users
```
GET /api/tenants/:tenantId/users
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Returns all users belonging to the tenant.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "admin@demo.com",
      "firstName": "Demo",
      "lastName": "Admin",
      "role": "tenant_admin",
      "createdAt": "2025-12-25T..."
    }
  ]
}
```

---

### Update User
```
PUT /api/users/:userId
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Updates user information (name, email, role).

**Request Body:**
```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "email": "updated@demo.com",
  "role": "user"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "uuid",
    "email": "updated@demo.com",
    ...
  }
}
```

---

### Delete User
```
DELETE /api/users/:userId
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Soft or hard deletes a user (logged in audit_logs).

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

## 5. Project Management APIs

### Create Project
```
POST /api/projects
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Creates a new project within the tenant (enforces max_projects limit).

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "status": "active"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project created successfully",
  "data": {
    "id": "uuid",
    "name": "New Project",
    "tenantId": "uuid",
    "status": "active",
    "createdBy": "uuid"
  }
}
```

---

### List Projects
```
GET /api/projects
```

**Auth Required:** Yes

**Description:** Returns all projects for the user's tenant with task statistics.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Project Alpha",
      "description": "Initial alpha project",
      "status": "active",
      "taskCount": 4,
      "completedTaskCount": 1,
      "createdAt": "2025-12-25T..."
    }
  ]
}
```

---

### Update Project
```
PUT /api/projects/:projectId
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Updates project information.

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "New description",
  "status": "archived"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully",
  "data": {
    "id": "uuid",
    "name": "Updated Project Name",
    ...
  }
}
```

---

### Delete Project
```
DELETE /api/projects/:projectId
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Deletes a project and all its tasks (logged in audit_logs).

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

---

## 6. Task Management APIs

### Create Task
```
POST /api/projects/:projectId/tasks
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Creates a new task within a project.

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "todo",
  "priority": "high",
  "assignedTo": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "uuid",
    "title": "New Task",
    "status": "todo",
    "priority": "high",
    "projectId": "uuid",
    "assignedTo": "uuid"
  }
}
```

---

### List Tasks
```
GET /api/projects/:projectId/tasks?status=todo&priority=high&assignedTo=uuid
```

**Auth Required:** Yes

**Description:** Returns tasks for a project with optional filtering and pagination.

**Query Parameters:**
- `status` - Filter by task status (todo, in_progress, completed)
- `priority` - Filter by priority (low, medium, high)
- `assignedTo` - Filter by assigned user ID
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Design schema",
      "description": "Model core multi-tenant tables",
      "status": "in_progress",
      "priority": "medium",
      "assignedTo": "uuid",
      "createdBy": "uuid",
      "createdAt": "2025-12-25T..."
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 4
  }
}
```

---

### Update Task Status
```
PATCH /api/tasks/:taskId/status
```

**Auth Required:** Yes

**Description:** Updates only the status of a task (allows regular users to update their assigned tasks).

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task status updated successfully",
  "data": {
    "id": "uuid",
    "status": "completed",
    ...
  }
}
```

---

### Update Task
```
PUT /api/tasks/:taskId
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Full update of task information.

**Request Body:**
```json
{
  "title": "Updated Task Title",
  "description": "New description",
  "status": "in_progress",
  "priority": "high",
  "assignedTo": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task updated successfully",
  "data": {
    "id": "uuid",
    "title": "Updated Task Title",
    ...
  }
}
```

---

### Delete Task
```
DELETE /api/tasks/:taskId
```

**Auth Required:** Yes (Tenant Admin)

**Description:** Deletes a task (logged in audit_logs).

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

---

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing or invalid token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 409 | Conflict (duplicate resource) |
| 500 | Internal Server Error |

---

## Common Error Responses

### Authentication Error
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

### Authorization Error
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed: email is required"
}
```

### Resource Not Found
```json
{
  "success": false,
  "message": "Project not found"
}
```

---

## Testing with cURL

### Example: Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Admin@123"}'
```

### Example: Get Projects (with token)
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Example: Create Task
```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Task",
    "description": "Task description",
    "status": "todo",
    "priority": "medium",
    "assignedTo": "USER_ID"
  }'
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider adding rate limiting middleware.

---

## API Versioning

Current API version is v1 (implicit). Future versions may be prefixed with `/api/v2/` etc.
