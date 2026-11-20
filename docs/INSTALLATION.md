# Installation

## Requirements

Node.js 20 or newer, pnpm 11, and PostgreSQL 14 or newer are required. Docker may be used to run PostgreSQL locally, but the application itself does not require Docker.

## Setup

```bash
pnpm install
cp .env.example .env
# Edit DATABASE_URL, ADMIN_EMAIL, and ADMIN_PASSWORD
```

Create the database, then run:

```bash
pnpm --filter @workspace/db run migrate
pnpm --filter @workspace/db run seed
pnpm run typecheck
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/fixmate run build
```

The API starts with `DATABASE_URL` and `PORT` configured:

```bash
pnpm --filter @workspace/api-server run dev
```

The frontend development server is separate:

```bash
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/fixmate run dev
```

## Current status

The backend foundation and request APIs are implemented. The existing frontend still contains demo screens and must be migrated screen by screen to the authenticated API before public release.
