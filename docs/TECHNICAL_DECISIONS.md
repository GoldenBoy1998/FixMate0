# Technical Decisions

## T-001: PostgreSQL + Drizzle

PostgreSQL is retained because the domain has relational ownership, status history, many-to-many specialties, and audit requirements. Drizzle matches the existing workspace and keeps migrations/type inference close to the schema.

## T-002: Modular monolith

A single Express API is preferred over microservices for the first release. It reduces operational cost and keeps request lifecycle transactions straightforward while leaving module boundaries explicit.

## T-003: Server-managed opaque sessions

The first release uses random opaque session tokens with hashed database records rather than putting roles and mutable authorization claims in a browser-controlled token. Cookies are HttpOnly; secure and SameSite behavior is controlled by environment configuration.

## T-004: Role enforcement on the API

Customer, technician, and administrator permissions are enforced in middleware and service functions. Frontend route guards are usability features only.

## T-005: Soft disable instead of destructive deletion

Categories, users, and technicians are disabled/suspended or archived. Historical requests retain their relationships and labels.

## T-006: Internal notifications first

Database-backed in-app notifications are included before SMS, WhatsApp, email automation, or push integrations. External providers must not block the core release.

## T-007: Local development without paid services

A local PostgreSQL instance or Docker Compose is the default development path. Object storage is abstracted; local uploads can be used in development and replaced by private object storage in production.
