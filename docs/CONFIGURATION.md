# Configuration

Copy `.env.example` to `.env` for local development. Never commit `.env` or production credentials.

`DATABASE_URL` is the PostgreSQL connection string. `PORT` controls the API or Vite process port. `BASE_PATH` controls the Vite base path and is normally `/` for local development. `SESSION_COOKIE_NAME`, `SESSION_TTL_DAYS`, `SESSION_COOKIE_SECURE`, and `SESSION_COOKIE_SAME_SITE` control server-managed sessions. In production, use HTTPS and set `SESSION_COOKIE_SECURE=true`; if the frontend and API are embedded cross-site, use the documented HTTPS cookie policy and test browser third-party cookie behavior.

`ADMIN_EMAIL` and `ADMIN_PASSWORD` are consumed by the local seed command to create the initial administrator. Use a unique long password and rotate it through the future administration workflow.
