# Research Document

## 1. Multi-Tenancy Analysis

Multi-tenancy is an architecture where a single app serves many customers, called "tenants." Even though everyone uses the same system, each tenant's data is kept completely separate and private. Think of it like an apartment building: many residents live in one building, but each has their own private apartment.

### Multi-Tenancy Approaches

There are a few ways to set up a multi-tenant application. Here are the three main ones.

#### Approach 1: Shared Database, Shared Tables

This is the most common and practical approach. Everyone's data lives in the same database and in the same set of tables. A special `tenant_id` column is added to each table to mark who owns what data. When a user requests their data, we just filter everything by their `tenant_id`.

*   **Pros:** It's cheap, simple to manage, and easy to scale. Adding a new customer is quick and easy.
*   **Cons:** You have to be very careful in your code to always filter by the tenant's ID, or you might accidentally show one customer's data to another.

#### Approach 2: Shared Database, Separate Schemas

In this model, everyone still shares one big database, but each tenant gets their own private group of tables (called a schema). It's like having separate, locked filing cabinets for each customer inside one big warehouse.

*   **Pros:** This offers better data separation than the first approach.
*   **Cons:** It's more complex to manage. Simple updates have to be applied to every single tenant's schema, which can be slow and complicated.

#### Approach 3: Separate Database for Each Tenant

This is the most isolated approach. Every tenant gets their own dedicated database. It’s like giving each customer their own private house.

*   **Pros:** It offers the best possible security and isolation.
*   **Cons:** This method is extremely expensive and very difficult to manage, especially if you have a lot of customers. It's not practical for most SaaS projects.

### Comparison Table

| Approach                    | Isolation | Complexity | Scalability | Cost   | Our Choice |
| --------------------------- | --------- | ---------- | ----------- | ------ | ---------- |
| Shared DB + Shared Schema   | Medium    | Low        | High        | Low    | ✅ **Best** |
| Shared DB + Separate Schema | High      | Medium     | Medium      | Medium | ❌         |
| Separate Database           | Very High | High       | Low         | High   | ❌         |

### Our Choice

We're going with the **Shared Database + Shared Schema** approach.

It hits the sweet spot. It's affordable, scalable, and easy to manage, which is exactly what we need. It's the industry standard for modern SaaS apps and works perfectly with the technologies we're using.

---

## 2. Technology Stack

Here’s a look at the tools we've chosen and why.

### Backend: Spring Boot

We're using Spring Boot (with Java) for our backend. It’s a powerful and popular framework for building large, reliable applications. It has great tools for security and database work, which is perfect for a multi-tenant system.

**Alternatives we considered:** Node.js and Django. They are good, but Spring Boot is a better fit for the kind of structured, enterprise-level application we're building.

### Frontend: React

For the user interface, we're using React. It lets us build the UI out of small, reusable "components," like LEGO blocks. It's very popular, fast, and works great with a Spring Boot backend.

**Alternatives we considered:** Angular and Vue. Both are great, but React has a bigger community and ecosystem, making it a safe and solid choice.

### Database: PostgreSQL

PostgreSQL will be our database. It's a free, open-source database that's known for being extremely reliable and powerful. It handles complex data well and has features that will help us keep our tenants' data properly separated.

**Alternatives we considered:** MySQL and MongoDB. MySQL is a solid choice, but PostgreSQL is often favored for complex apps. MongoDB is a NoSQL database, which isn't a good fit for our highly structured, relational data.

### Authentication: JWT (JSON Web Tokens)

To log users in, we'll use JWTs. When a user logs in, we give them a signed token. They show us this token every time they make a request, which proves who they are. It's a stateless, modern approach that's easy to scale.

**Alternatives we considered:** Traditional session-based login. That method requires storing session data on the server, which is harder to scale.

### Deployment: Docker

We will use Docker to containerize our application. This means we package our backend, frontend, and database into "containers" that can run anywhere, ensuring the app works the same for developers and in production. We'll use Docker Compose to run all the containers together with a single command.

**Alternatives we considered:** Installing everything manually on a server. This is harder to reproduce and leads to the classic "it works on my machine" problem, which Docker solves.

---

## 3. Security Measures

Security is critical in a multi-tenant app. Here’s how we'll handle it.

### Data Isolation

Our main security promise is keeping customer data separate. We will enforce this by using the `tenant_id` on every database query. The server will automatically add this filter based on the logged-in user, so it's impossible for a user to access another tenant's data.

### Authentication & Authorization

We will use JWTs to confirm a user's identity for every request. The token will also include the user's role (like "admin" or "member"). This allows us to check not only *who* a user is, but also *what* they are allowed to do.

### Password Security

We will never store passwords in plain text. All passwords will be securely hashed using **bcrypt**. This algorithm turns the password into a long, irreversible string. This means that even if someone gained access to our database, they would not be able to read anyone's password.

### API Security

We will validate all data sent from the client to prevent malicious input. We will also configure CORS (Cross-Origin Resource Sharing) to make sure our backend only accepts requests from our own frontend application, blocking requests from unauthorized sources.

### Audit Logging

We'll keep a log of important events in the system. This includes things like user logins, project creation, or when a user's role is changed. This audit trail is useful for tracking down issues and monitoring for any unusual activity on the platform.