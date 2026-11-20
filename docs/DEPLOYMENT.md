# Deployment

The application is portable: provision PostgreSQL, configure environment variables, run migrations, build the frontend, and run the API behind HTTPS. Keep the API and database on private networking where possible. Store uploads privately and expose them only through authorized API responses.

A production deployment must include automated database backups, restore testing, log collection, health checks, secret management, TLS, a migration approval process, and a rollback plan. The repository currently documents the deployment shape but does not claim a live production deployment.
