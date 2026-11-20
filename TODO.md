# FixMate Implementation TODO

- [ ] Initialize PostgreSQL from a clean database using Drizzle migrations and seed data.
- [ ] Implement customer and technician registration with validation and password hashing; administrators must not be self-assignable.
- [ ] Implement secure login, logout, current-user lookup, session expiry, and protected API middleware.
- [ ] Implement backend-enforced customer, technician, and administrator permissions.
- [ ] Implement category CRUD with Arabic/English fields, ordering, enable/disable, and historical safety.
- [ ] Implement technician profiles, specialties, service areas, verification status, and administrative approval.
- [ ] Implement maintenance request creation, review, assignment, acceptance/rejection, progress, completion, cancellation, and status history.
- [ ] Implement internal notifications with read/unread state.
- [ ] Implement audit logging for sensitive administrative actions.
- [ ] Connect the existing React customer, technician, and administration screens to the API and remove core localStorage business state.
- [ ] Add safe attachment handling with authorization and size/type limits.
- [ ] Add English LTR localization without weakening the Arabic RTL experience.
- [ ] Add automated backend, frontend, and full lifecycle tests.
- [ ] Complete installation, configuration, database, API, security, testing, deployment, and contribution documentation.
