# FixMate Architecture

## Principles

FixMate uses a portable modular-monolith architecture. The existing React/Vite frontend remains the presentation layer, while the Express API becomes the only authority for identity, permissions, and business data. PostgreSQL is the source of truth; Drizzle owns the schema and migrations.

## Workspace responsibilities

- `artifacts/fixmate`: React/Vite Arabic-first web client.
- `artifacts/api-server`: Express REST API, middleware, route handlers, and business orchestration.
- `lib/db`: PostgreSQL connection, Drizzle schema, migrations, and seed data.
- `lib/api-spec`: OpenAPI source of truth.
- `lib/api-zod`: shared runtime schemas and generated API types.
- `lib/api-client-react`: generated/handwritten client used by the frontend.

## Security model

The API uses an opaque random session token stored as a hash in PostgreSQL. The raw token is sent only in an HttpOnly cookie. Every protected route loads the session and user from the database, then applies role and status checks. The browser role selector is removed from the authority model and may remain only in a demo-only development surface until frontend integration is complete.

## Core request lifecycle

`submitted -> under_review -> assigned -> accepted -> in_progress -> completed -> closed`

Alternative terminal or recovery states are `cancelled`, `rejected`, `unable_to_complete`, and `reassignment_required`. Every transition is validated server-side and written to `request_status_history` with actor and timestamp.

## Data flow

1. A browser submits a validated request to the API.
2. The API authenticates the session and authorizes the action.
3. A service function validates business rules and writes within a transaction.
4. A notification and audit record are created where relevant.
5. The frontend invalidates the relevant query and renders the server response.

## Deployment shape

The same workspace can run locally with a PostgreSQL `DATABASE_URL`, an API process, and the Vite client. Production may place the static frontend behind a CDN/reverse proxy and the API behind HTTPS. No provider-specific SDK is required for core functionality.
