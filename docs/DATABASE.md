# Database

FixMate uses PostgreSQL with Drizzle ORM. The schema is in `lib/db/src/schema/index.ts`; generated SQL migrations are in `lib/db/drizzle`.

The initial schema includes users, sessions, customer profiles, technician profiles, specialties, service areas, categories, maintenance requests, request status history, notes, attachments, notifications, and audit logs.

Commands:

```bash
DATABASE_URL=... pnpm --filter @workspace/db run generate
DATABASE_URL=... pnpm --filter @workspace/db run migrate
DATABASE_URL=... ADMIN_EMAIL=... ADMIN_PASSWORD=... pnpm --filter @workspace/db run seed
```

The seed is idempotent for category slugs and the administrator email. Do not run destructive schema commands against production. Back up the database before applying production migrations.
