import { boolean, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const created = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updated = timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
export const userRoleEnum = pgEnum("user_role", ["customer", "technician", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "suspended", "pending"]);
export const technicianApprovalEnum = pgEnum("technician_approval", ["pending", "approved", "rejected", "suspended"]);
export const requestStatusEnum = pgEnum("request_status", ["submitted", "under_review", "assigned", "accepted", "in_progress", "completed", "closed", "rejected", "cancelled", "unable_to_complete", "reassignment_required"]);
export const notificationTypeEnum = pgEnum("notification_type", ["request", "technician", "admin", "system"]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(), email: text("email").unique(), phone: text("phone").unique(),
  passwordHash: text("password_hash").notNull(), role: userRoleEnum("role").notNull(), status: userStatusEnum("status").default("active").notNull(), displayName: text("display_name").notNull(), createdAt: created, updatedAt: updated,
}, (t) => [index("users_role_status_idx").on(t.role, t.status)]);

export const authSessions = pgTable("auth_sessions", {
  id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), tokenHash: text("token_hash").notNull().unique(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(), createdAt: created,
}, (t) => [index("auth_sessions_user_idx").on(t.userId), index("auth_sessions_expiry_idx").on(t.expiresAt)]);

export const customerProfiles = pgTable("customer_profiles", { userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }), state: text("state"), city: text("city"), address: text("address"), createdAt: created, updatedAt: updated });
export const serviceCategories = pgTable("service_categories", {
  id: uuid("id").defaultRandom().primaryKey(), slug: text("slug").notNull().unique(), nameAr: text("name_ar").notNull(), nameEn: text("name_en").notNull(), descriptionAr: text("description_ar").notNull(), descriptionEn: text("description_en").notNull(), icon: text("icon").default("wrench").notNull(), sortOrder: integer("sort_order").default(0).notNull(), isEnabled: boolean("is_enabled").default(true).notNull(), createdAt: created, updatedAt: updated,
}, (t) => [index("service_categories_enabled_order_idx").on(t.isEnabled, t.sortOrder)]);
export const technicianProfiles = pgTable("technician_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }), bio: text("bio").notNull(), yearsExperience: integer("years_experience").default(0).notNull(), location: text("location").notNull(), approval: technicianApprovalEnum("approval").default("pending").notNull(), isAvailable: boolean("is_available").default(true).notNull(), verificationNotes: text("verification_notes"), createdAt: created, updatedAt: updated,
}, (t) => [index("technician_profiles_approval_idx").on(t.approval)]);
export const technicianSpecialties = pgTable("technician_specialties", {
  technicianId: uuid("technician_id").references(() => technicianProfiles.userId, { onDelete: "cascade" }).notNull(), categoryId: uuid("category_id").references(() => serviceCategories.id, { onDelete: "restrict" }).notNull(), createdAt: created, updatedAt: updated,
}, (t) => [primaryKey({ columns: [t.technicianId, t.categoryId] }), index("technician_specialties_category_idx").on(t.categoryId)]);
export const technicianServiceAreas = pgTable("technician_service_areas", {
  id: uuid("id").defaultRandom().primaryKey(), technicianId: uuid("technician_id").references(() => technicianProfiles.userId, { onDelete: "cascade" }).notNull(), state: text("state").notNull(), city: text("city"), createdAt: created, updatedAt: updated,
}, (t) => [uniqueIndex("technician_service_area_unique").on(t.technicianId, t.state, t.city)]);
export const maintenanceRequests = pgTable("maintenance_requests", {
  id: uuid("id").defaultRandom().primaryKey(), referenceCode: text("reference_code").notNull().unique(), customerId: uuid("customer_id").references(() => users.id, { onDelete: "restrict" }).notNull(), categoryId: uuid("category_id").references(() => serviceCategories.id, { onDelete: "restrict" }).notNull(), assignedTechnicianId: uuid("assigned_technician_id").references(() => users.id, { onDelete: "set null" }), title: text("title").notNull(), description: text("description").notNull(), state: text("state").notNull(), city: text("city").notNull(), address: text("address"), preferredDate: timestamp("preferred_date", { withTimezone: true }), status: requestStatusEnum("status").default("submitted").notNull(), cancellationReason: text("cancellation_reason"), completedAt: timestamp("completed_at", { withTimezone: true }), createdAt: created, updatedAt: updated,
}, (t) => [index("requests_customer_status_idx").on(t.customerId, t.status), index("requests_technician_status_idx").on(t.assignedTechnicianId, t.status), index("requests_category_idx").on(t.categoryId), index("requests_created_at_idx").on(t.createdAt)]);
export const requestStatusHistory = pgTable("request_status_history", {
  id: uuid("id").defaultRandom().primaryKey(), requestId: uuid("request_id").references(() => maintenanceRequests.id, { onDelete: "cascade" }).notNull(), fromStatus: requestStatusEnum("from_status"), toStatus: requestStatusEnum("to_status").notNull(), actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }), note: text("note"), createdAt: created,
}, (t) => [index("request_history_request_idx").on(t.requestId, t.createdAt)]);
export const requestNotes = pgTable("request_notes", { id: uuid("id").defaultRandom().primaryKey(), requestId: uuid("request_id").references(() => maintenanceRequests.id, { onDelete: "cascade" }).notNull(), authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }), body: text("body").notNull(), isInternal: boolean("is_internal").default(false).notNull(), createdAt: created }, (t) => [index("request_notes_request_idx").on(t.requestId, t.createdAt)]);
export const attachments = pgTable("attachments", { id: uuid("id").defaultRandom().primaryKey(), requestId: uuid("request_id").references(() => maintenanceRequests.id, { onDelete: "cascade" }).notNull(), uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }), storageKey: text("storage_key").notNull().unique(), originalName: text("original_name").notNull(), mimeType: text("mime_type").notNull(), sizeBytes: integer("size_bytes").notNull(), createdAt: created }, (t) => [index("attachments_request_idx").on(t.requestId)]);
export const notifications = pgTable("notifications", { id: uuid("id").defaultRandom().primaryKey(), userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), type: notificationTypeEnum("type").notNull(), titleAr: text("title_ar").notNull(), bodyAr: text("body_ar").notNull(), referenceId: uuid("reference_id"), readAt: timestamp("read_at", { withTimezone: true }), createdAt: created }, (t) => [index("notifications_user_read_idx").on(t.userId, t.readAt, t.createdAt)]);
export const auditLogs = pgTable("audit_logs", { id: uuid("id").defaultRandom().primaryKey(), actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }), action: text("action").notNull(), entityType: text("entity_type").notNull(), entityId: uuid("entity_id"), metadata: text("metadata"), createdAt: created }, (t) => [index("audit_logs_entity_idx").on(t.entityType, t.entityId), index("audit_logs_actor_idx").on(t.actorId, t.createdAt)]);

export type User = typeof users.$inferSelect;
export type ServiceCategory = typeof serviceCategories.$inferSelect;
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type TechnicianProfile = typeof technicianProfiles.$inferSelect;
