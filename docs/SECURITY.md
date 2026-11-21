# Security

Passwords are hashed with Node.js `scrypt` and never returned by the API. Sessions use random opaque tokens; only a SHA-256 token hash is stored in PostgreSQL, while the raw token is sent in an HttpOnly cookie.

Role and ownership checks run on the backend. Customer and technician request visibility is restricted by the request owner or assignment. Categories and users are designed for disabling/archive semantics rather than destructive deletion.

Session cookies are HttpOnly and configurable for local HTTP or public HTTPS. The configuration rejects `SESSION_COOKIE_SAME_SITE=none` unless `SESSION_COOKIE_SECURE=true`. Attachments use generated storage keys, a MIME allowlist, a 5 MiB limit, and request ownership checks; the current `.data/uploads` adapter is for development and must be replaced by private durable storage before production.

Before public release, add rate limiting for authentication, CSRF protection appropriate to the final deployment topology, structured request validation for every endpoint, secure upload scanning and private storage, dependency auditing, secret rotation, HTTPS enforcement, backup/restore drills, and a penetration/security review.
