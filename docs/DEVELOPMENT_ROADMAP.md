# Development Roadmap

## Delivered in this execution stage

- Repository audit and branch isolation.
- Architecture and technical decisions documented.
- PostgreSQL/Drizzle domain schema foundation.
- Seed data and environment template.
- API error/configuration foundations.
- Authentication/session primitives and protected route structure.

## Next implementation stages

1. Complete migration generation and seed execution against a clean PostgreSQL database.
2. Add registration/login/logout/current-user routes and integration tests.
3. Add category, technician, and request REST modules.
4. Add status transitions, notes, notifications, and audit records.
5. Replace frontend demo store calls with API hooks, retaining only UI preferences in localStorage.
6. Add attachment storage adapter and ownership checks.
7. Add English localization with LTR switching.
8. Add backend, frontend, and lifecycle end-to-end tests.
9. Finish release documentation and verify a clean installation.

## Release gates

The project is not production-ready until clean database setup, authentication, authorization, request lifecycle, frontend/API integration, tests, and deployment instructions have all been verified.
