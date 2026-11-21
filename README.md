# FixMate

FixMate is an Arabic-first, RTL maintenance-services marketplace for Sudan and future markets. It connects customers with technicians and service providers while keeping administration, request history, and permissions under platform control.

## Current implementation

The repository contains a React/Vite frontend connected to an active PostgreSQL/Drizzle/Express backend. The backend includes real schema migrations, seeded categories, secure password hashing, server-managed sessions, role middleware, authentication routes, request APIs, assignment, validated status transitions, notifications, attachments, and audit records. Customer, technician, and administrator screens now use the API instead of operational localStorage state.

## Stack

React, TypeScript, Vite, Express, PostgreSQL, Drizzle ORM, Zod, pnpm workspaces, and Arabic RTL styling. The project avoids paid integrations for core development.

## Local setup

Read [docs/INSTALLATION.md](docs/INSTALLATION.md), copy `.env.example` to `.env`, run the database migration and seed commands, then run type checks and the API/frontend development servers.

## Documentation

Architecture is described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Database, API, security, testing, deployment, and roadmap notes are under `docs/`. A live PostgreSQL run and automated lifecycle tests are still required before public release.

## License

MIT. See [LICENSE](LICENSE).
