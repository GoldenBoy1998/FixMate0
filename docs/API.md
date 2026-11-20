# API

The API is mounted under `/api` and returns JSON. Protected routes use the HttpOnly session cookie configured by `SESSION_COOKIE_NAME`.

## Public endpoints

- `GET /api/healthz` returns `{ "status": "ok" }`.
- `GET /api/categories` returns enabled service categories.
- `POST /api/auth/register` creates a customer or technician account. Technician accounts start pending.
- `POST /api/auth/login` creates a server-managed session.
- `POST /api/auth/logout` revokes the current session.

## Protected endpoints

- `GET /api/auth/me` returns the current user.
- `GET /api/requests` returns requests visible to the current role.
- `POST /api/requests` creates a customer request.
- `GET /api/requests/:id` returns a permitted request and its status history.
- `POST /api/requests/:id/status` performs a validated status transition.
- `POST /api/requests/:id/assign` lets an administrator assign an approved technician.

All writes validate input with Zod. The API rejects cross-user request access and prevents technicians that are not approved from receiving assignments. The contract will be expanded as the frontend migration proceeds.
