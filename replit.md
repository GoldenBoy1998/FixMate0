# FixMate

FixMate is an Arabic-first maintenance-services marketplace demo connecting customers with technicians in Sudan.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- FixMate runs through the managed `artifacts/fixmate: web` workflow.
- `pnpm --filter @workspace/fixmate run typecheck` — check the FixMate web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

The current FixMate MVP does not use the API server or database.

## Stack

- pnpm workspaces, React, TypeScript, Vite, Wouter, and Tailwind CSS
- FixMate forms use React Hook Form and Zod validation.
- FixMate demo state is stored in browser localStorage.
- Existing shared scaffolds include an Express API, PostgreSQL/Drizzle, Zod, and Orval code generation; they are not part of the current FixMate flow.

## Where things live

- `artifacts/fixmate/src/App.tsx` — FixMate routes, demo data, state, and UI flows
- `artifacts/fixmate/src/index.css` — FixMate visual system and responsive styles
- `artifacts/fixmate/README.md` — Arabic instructions for trying the demo workflow
- `lib/api-spec/openapi.yaml` — shared API contract, currently only the health check

## Architecture decisions

- Demo roles are simulated; there is no real sign-in or access control.
- Customer requests, technician applications, and admin updates stay in the current browser.
- The API and database are intentionally deferred for this first MVP.

## Product

Customers can browse maintenance categories, submit and track demo requests, and apply as technicians. Simulated technicians can accept or decline requests, while an admin can review technician applications, manage categories, and change request statuses.

## User preferences

- Keep FixMate independent from Al-Ikhwa Engineering and available beyond any physical workshop.
- Prioritize Sudan and Arabic RTL; keep English LTR support possible for later activation.
- Prefer free/open-source tools and avoid paid APIs or integrations for this MVP.

## Gotchas

- localStorage is not shared across browsers or devices; clearing site data resets the demo.
- Do not describe demo requests, technician approvals, payments, notifications, or identity checks as real services.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
