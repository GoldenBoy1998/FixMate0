# FixMate Implementation TODO

- [ ] Initialize PostgreSQL from a clean database using Drizzle migrations and seed data.
- [x] Implement customer and technician registration with validation and password hashing; administrators must not be self-assignable.
- [x] Implement secure login, logout, current-user lookup, session expiry, and protected API middleware.
- [x] Implement backend-enforced customer, technician, and administrator permissions.
- [x] Implement category CRUD with Arabic/English fields, ordering, enable/disable, and historical safety.
- [x] Implement technician profiles, specialties, service areas, verification status, and administrative approval.
- [x] Implement maintenance request creation, review, assignment, acceptance/rejection, progress, completion, cancellation, and status history.
- [x] Implement internal notifications with read/unread state.
- [x] Implement audit logging for sensitive administrative actions.
- [x] Connect the React customer, technician, and administration screens to the API and remove core localStorage business state.
- [x] Add safe attachment handling with authorization and size/type limits.
- [x] Add English LTR localization without weakening the Arabic RTL experience.
- [ ] Add automated backend, frontend, and full lifecycle tests.
- [ ] Complete installation, configuration, database, API, security, testing, deployment, and contribution documentation.
