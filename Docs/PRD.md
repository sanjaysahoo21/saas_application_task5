# Product Requirements Document (PRD)
## Project & Task Management SaaS Platform

---

## 1. Introduction

This document outlines the features and requirements for our multi-tenant SaaS application. It explains what the system will do, who it is for, and how it should perform. This PRD will guide the development process.

---

## 2. User Personas

We have three main types of users on this platform.

### 2.1. Super Admin

*   **Role:** The system-level administrator who oversees the entire platform.
*   **Key Responsibilities:** Manages all tenant accounts, handles subscription plans, and monitors the health of the system.
*   **Main Goals:** To keep the platform stable, secure, and running smoothly for all tenants.
*   **Pain Points:** Needs a simple way to view and manage all tenants without interfering with their private data.

### 2.2. Tenant Admin

*   **Role:** The administrator for a single organization (a tenant).
*   **Key Responsibilities:** Invites and manages users within their team, creates projects, and oversees their organization's workflow.
*   **Main Goals:** To organize the team's work effectively and manage user access within their subscription limits.
*   **Pain Points:** Cannot add more users or projects than their subscription plan allows.

### 2.3. End User

*   **Role:** A regular team member within an organization.
*   **Key Responsibilities:** Works on tasks assigned to them and updates their progress.
*   **Main Goals:** To see what work they need to do and complete it efficiently.
*   **Pain Points:** Has limited permissions and cannot manage projects or other users.

---

## 3. Functional Requirements

These are the specific features the system must have.

### Authentication
*   **FR-001:** The system shall allow new organizations to register for an account.
*   **FR-002:** The system shall allow users to log in with their email and password.
*   **FR-003:** The system shall use JWTs (JSON Web Tokens) for authenticating API requests.
*   **FR-004:** The system shall require a valid token for all protected endpoints.

### Tenant Management
*   **FR-005:** The system shall ensure data from one tenant is never visible to another.
*   **FR-006:** The system shall allow the Super Admin to view a list of all tenants.
*   **FR-007:** The system shall allow the Super Admin to change a tenant's subscription plan.

### User Management
*   **FR-008:** The system shall allow a Tenant Admin to invite new users to their organization.
*   **FR-009:** The system shall prevent a Tenant Admin from adding more users than their plan allows.
*   **FR-010:** The system shall allow a Tenant Admin to deactivate users in their organization.

### Project Management
*   **FR-011:** The system shall allow users to create projects within their tenant.
*   **FR-012:** The system shall enforce project limits based on the tenant's subscription plan.
*   **FR-013:** The system shall allow users to view all projects within their own tenant.
*   **FR-014:** The system shall allow a project's creator to update or delete it.

### Task Management
*   **FR-015:** The system shall allow users to create tasks inside a project.
*   **FR-016:** The system shall allow users to assign tasks to other users within the same tenant.
*   **FR-017:** The system shall allow users to change the status of a task (e.g., "To Do", "In Progress", "Done").
*   **FR-018:** The system shall allow users to view all tasks assigned to them.

---

## 4. Non-Functional Requirements

These requirements define how the system should operate.

### Performance
*   **NFR-001:** The system's API should respond to 90% of requests in under 200 milliseconds.

### Security
*   **NFR-002:** The system shall hash all user passwords using the bcrypt algorithm.
*   **NFR-003:** The system shall set JWTs to automatically expire after 24 hours.

### Scalability
*   **NFR-004:** The system shall be able to support at least 100 users logged in and using the app at the same time.

### Availability
*   **NFR-005:** The system shall aim for 99% uptime.
*   **NFR-006:** The system shall have a public health check endpoint to monitor its status.

### Usability
*   **NFR-007:** The user interface shall be responsive and work well on both desktop and mobile browsers.

---

## 5. Assumptions

*   The application will be deployed using Docker.
*   The database will be PostgreSQL.
*   Communication between the frontend and backend will be through REST APIs.
