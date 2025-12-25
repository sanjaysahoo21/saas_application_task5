# Multi-Tenant SaaS Application

A production-ready multi-tenant SaaS backend built with Node.js, Express, and PostgreSQL, featuring comprehensive tenant isolation, role-based access control, and complete project/task management capabilities.

## Features

- **Multi-Tenant Architecture**: Complete data isolation using tenant_id with shared schema approach
- **Authentication & Authorization**: JWT-based authentication with role-based access control (super_admin, tenant_admin, user)
- **User Management**: Full CRUD operations with tenant-scoped access
- **Project Management**: Create, update, delete projects with tenant limits enforcement
- **Task Management**: Comprehensive task tracking with status, priority, and assignee management
- **Audit Logging**: Complete audit trail for all operations
- **Docker Support**: Containerized deployment with automatic migrations

## Tech Stack

- **Backend**: Node.js 18+, Express.js
- **Database**: PostgreSQL 15
- **Authentication**: JWT (jsonwebtoken), bcryptjs
- **Security**: Helmet, CORS
- **DevOps**: Docker, Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 15 (for local development)

### Running with Docker

```bash
docker-compose up -d
```

The backend will be available at `http://localhost:5000`

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=your-secret-key
DB_HOST=database
DB_PORT=5432
DB_NAME=saas_db
DB_USER=postgres
DB_PASSWORD=postgres
```

## API Documentation

See [Docs/API.md](Docs/API.md) for complete API documentation with 19 authenticated endpoints.

### Key Endpoints

- `POST /api/auth/register-tenant` - Register new tenant
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `GET /api/users` - List users (tenant-scoped)
- `POST /api/projects` - Create project
- `GET /api/projects` - List projects
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/projects/:projectId/tasks` - List tasks with filtering

## Architecture

The application follows a layered architecture:

- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic and data operations
- **Middleware**: Authentication, authorization, tenant isolation
- **Routes**: API endpoint definitions
- **Migrations**: Database schema management

See [Docs/architecture.md](Docs/architecture.md) for detailed architecture documentation.

## Database Schema

The database includes:
- `tenants` - Multi-tenant organizations
- `users` - User accounts with roles
- `projects` - Project management
- `tasks` - Task tracking
- `audit_logs` - Audit trail

See [Docs/images/database-erd.drawio.png](Docs/images/database-erd.drawio.png) for the ERD diagram.

## Security

- JWT-based stateless authentication
- Password hashing with bcryptjs (10 rounds)
- Tenant isolation enforced at middleware level
- Role-based access control
- SQL injection prevention via parameterized queries
- Helmet for security headers
- CORS enabled

## Development

### Local Development

```bash
cd backend
npm install
npm run dev
```

### Running Migrations

Migrations run automatically on Docker startup. For manual execution:

```bash
cd backend
node scripts/bootstrap.js
```

## Testing

Test the APIs using the provided examples in [Docs/API.md](Docs/API.md)

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, roles, tenant
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   ├── migrations/          # Database migrations
│   ├── seeds/              # Seed data
│   └── Dockerfile
├── Docs/                   # Documentation
└── docker-compose.yml
```

## License

MIT

## Author

Sanjay Sahoo
