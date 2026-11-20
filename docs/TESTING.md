# Testing

Current verified checks:

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm run typecheck
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/fixmate run build
DATABASE_URL=postgresql://... pnpm --filter @workspace/db run generate
```

TypeScript checks currently cover the workspace packages. The next required quality stage is an automated API test suite covering registration, sessions, role enforcement, ownership, status transitions, technician approval, and the complete customer-to-completion lifecycle. Frontend component and browser tests must be added before the project is considered release-ready.
