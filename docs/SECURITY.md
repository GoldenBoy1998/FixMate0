# Security

Passwords are hashed with Node.js `scrypt` and never returned by the API. Sessions use random opaque tokens; only a SHA-256 token hash is stored in PostgreSQL, while the raw token is sent in an HttpOnly cookie.

Role and ownership checks run on the backend. Customer and technician request visibility is restricted by the request owner or assignment. Categories and users are designed for disabling/archive semantics rather than destructive deletion.

Before public release, add rate limiting for authentication, CSRF protection appropriate to the final deployment topology, structured request validation for every endpoint, secure upload scanning and private storage, dependency auditing, secret rotation, HTTPS enforcement, backup/restore drills, and a penetration/security review.
