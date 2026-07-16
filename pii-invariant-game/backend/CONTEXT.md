# CONTEXT.md

# Database Testing Seminar Backend

## Project Overview

This project is the backend system for an in-class activity developed for the Software Testing seminar.

The seminar topic is **Database Testing**.

Students will participate in an interactive web-based game where they answer questions related to database testing concepts such as:

- Constraints
- Primary Keys
- Foreign Keys
- Candidate Keys
- Composite Keys
- Check Constraints
- Unique Constraints
- NULL Constraints
- Transactions
- Isolation Levels
- Triggers
- Stored Procedures
- Database Testing
- Invariant Testing

The primary objective of this backend is **correctness**, **maintainability**, **consistency**, and **clean architecture** rather than handling massive traffic.

---

# Tech Stack

Backend

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- SQLite

Validation

- Zod

Authentication

- JWT

Development

- ESLint
- Prettier

---

# Architecture

This project follows **Feature-first Modular Architecture**.

DO NOT organize source code by:

- controllers/
- services/
- repositories/

Instead, organize by feature/module.

Example:

src/

modules/

auth/

game/

leaderboard/

feedback/

health/

shared/

config/

middlewares/

prisma/

utils/

Each module is self-contained.

---

# Module Structure

Every module should follow the same internal structure.

Example:

modules/game/

controller.ts

service.ts

repository.ts

route.ts

schema.ts

types.ts

dto.ts

index.ts

If a file is unnecessary, do not create it.

Avoid empty placeholder files.

---

# Layer Responsibilities

Route

- Register Express routes only.
- Never implement business logic.

Controller

- Parse HTTP requests.
- Call services.
- Return responses.
- Never access Prisma directly.

Service

- Contains business logic.
- Can call multiple repositories.
- Responsible for transactions.

Repository

- Handles database operations only.
- Never contains business logic.

Schema

- Zod validation schemas.

DTO

- Request/Response DTOs.

Types

- Local module types.

---

# Database Access Rules

Only repositories may access Prisma Client.

Controllers MUST NEVER access Prisma directly.

Services MUST NEVER contain raw SQL.

Never duplicate database queries.

---

# Coding Principles

Always follow:

- SOLID
- DRY
- KISS
- Separation of Concerns

Prefer readability over clever code.

Avoid unnecessary abstraction.

---

# Code Style

Use

- async/await

instead of

- Promise.then()

Never use:

- any

Prefer:

- unknown
- generics
- inferred types

Enable strict typing.

---

# Error Handling

Never expose internal errors.

Return consistent API responses.

Unexpected errors should be handled by a global error middleware.

Business errors should use custom Error classes.

---

# Validation

All incoming requests MUST be validated using Zod.

Controllers should never manually validate request bodies.

---

# Naming Convention

Files

camelCase

Variables

camelCase

Functions

camelCase

Classes

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Constants

UPPER_SNAKE_CASE

Database Tables

snake_case

Database Columns

snake_case

---

# API Design

Follow REST principles.

Examples

GET

POST

PUT

PATCH

DELETE

Do not create RPC-style APIs.

Bad

POST /startGame

Good

POST /games

---

# Response Format

Every successful response should follow

{
"success": true,
"message": "...",
"data": {}
}

Errors

{
"success": false,
"message": "...",
"errors": []
}

---

# Logging

Never use console.log except during development.

Create a centralized logger utility.

---

# Configuration

Environment variables must be accessed through a centralized config module.

Never access process.env directly throughout the project.

---

# Authentication

JWT authentication.

Passwords must always be hashed.

Never store plain text passwords.

---

# Prisma Rules

Never duplicate Prisma queries.

Prefer transactions whenever multiple writes are required.

Never disable foreign keys.

Always define relations explicitly.

Always define indexes when appropriate.

---

# Database Philosophy

The database is the single source of truth.

Whenever possible:

- enforce constraints in the database
- do not rely only on application validation

Use

- Primary Keys
- Foreign Keys
- Unique Constraints
- Check Constraints

instead of validating everything in TypeScript.

This project is about Database Testing.

Database integrity is more important than convenience.

---

# Clean Code

Functions should generally stay under 40 lines.

Controllers should remain thin.

Services should remain focused.

Repositories should contain only persistence logic.

Avoid nested conditionals.

Prefer early return.

---

# AI Agent Rules

When implementing features:

1. Read existing code first.
2. Preserve project architecture.
3. Never rewrite unrelated files.
4. Never rename files unless requested.
5. Do not introduce new libraries unless explicitly approved.
6. Follow existing naming conventions.
7. Keep implementations simple.
8. Explain major architectural decisions in comments only when necessary.
9. Never generate placeholder TODO implementations.
10. Generated code must compile successfully.

---

# Development Strategy

Implement the backend incrementally.

Preferred order:

1. Database schema
2. Prisma migration
3. Shared infrastructure
4. Authentication
5. Game APIs
6. Leaderboard
7. Feedback
8. Admin APIs
9. Testing
10. Refactoring

Never skip dependencies.

---

# Priority

When making implementation decisions, prioritize:

1. Correctness
2. Simplicity
3. Maintainability
4. Readability
5. Performance

Premature optimization is discouraged.

---

# Important

The AI assistant should behave as a Senior Backend Engineer.

When requirements are ambiguous:

- ask for clarification

Do NOT invent business rules.

Do NOT assume unspecified behavior.

Keep the implementation deterministic and maintainable.
