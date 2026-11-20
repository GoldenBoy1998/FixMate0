import { Router, type IRouter } from "express";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, auditLogs, maintenanceRequests, notifications, requestStatusHistory, serviceCategories, technicianProfiles, users } from "@workspace/db";
import { asyncRoute, HttpError } from "../lib/http";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();
const createSchema = z.object({ title: z.string().trim().min(3).max(160), description: z.string().trim().min(12).max(5000), categoryId: z.string().uuid(), state: z.string().trim().min(2).max(120), city: z.string().trim().min(2).max(120), address: z.string().trim().max(300).optional(), preferredDate: z.coerce.date().optional() });
const assignSchema = z.object({ technicianId: z.string().uuid() });
const statusSchema = z.object({ status: z.enum(["accepted", "in_progress", "completed", "closed", "rejected", "cancelled", "unable_to_complete", "reassignment_required"]), note: z.string().trim().max(1000).optional() });

router.get("/categories", asyncRoute(async (_req, res) => {
  res.json({ categories: await db.select().from(serviceCategories).where(eq(serviceCategories.isEnabled, true)).orderBy(serviceCategories.sortOrder) });
}));

router.get("/requests", requireAuth, asyncRoute(async (req, res) => {
  const user = req.user!;
  const rows = user.role === "customer"
    ? await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.customerId, user.id)).orderBy(desc(maintenanceRequests.createdAt))
    : user.role === "technician"
      ? await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.assignedTechnicianId, user.id)).orderBy(desc(maintenanceRequests.createdAt))
      : await db.select().from(maintenanceRequests).orderBy(desc(maintenanceRequests.createdAt));
  res.json({ requests: rows });
}));

router.post("/requests", requireAuth, requireRole("customer"), asyncRoute(async (req, res) => {
  const input = createSchema.parse(req.body);
  const [category] = await db.select({ id: serviceCategories.id }).from(serviceCategories).where(and(eq(serviceCategories.id, input.categoryId), eq(serviceCategories.isEnabled, true))).limit(1);
  if (!category) throw new HttpError(400, "فئة الخدمة غير متاحة", "CATEGORY_UNAVAILABLE");
  const referenceCode = `FM-${Date.now().toString(36).toUpperCase()}`;
  const [request] = await db.insert(maintenanceRequests).values({ ...input, customerId: req.user!.id, referenceCode, status: "submitted" }).returning();
  if (!request) throw new HttpError(500, "تعذر إنشاء الطلب");
  await db.insert(requestStatusHistory).values({ requestId: request.id, toStatus: "submitted", actorId: req.user!.id });
  res.status(201).json({ request });
}));

router.get("/requests/:id", requireAuth, asyncRoute(async (req, res) => {
  const requestId = String(req.params.id);
  const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, requestId)).limit(1);
  if (!request) throw new HttpError(404, "الطلب غير موجود", "NOT_FOUND");
  const user = req.user!;
  if (user.role === "customer" && request.customerId !== user.id) throw new HttpError(403, "لا يمكنك الوصول إلى هذا الطلب", "FORBIDDEN");
  if (user.role === "technician" && request.assignedTechnicianId !== user.id) throw new HttpError(403, "لا يمكنك الوصول إلى هذا الطلب", "FORBIDDEN");
  const history = await db.select().from(requestStatusHistory).where(eq(requestStatusHistory.requestId, request.id)).orderBy(desc(requestStatusHistory.createdAt));
  res.json({ request, history });
}));

router.post("/requests/:id/assign", requireAuth, requireRole("admin"), asyncRoute(async (req, res) => {
  const { technicianId } = assignSchema.parse(req.body);
  const [technician] = await db.select({ id: users.id }).from(users).innerJoin(technicianProfiles, eq(technicianProfiles.userId, users.id)).where(and(eq(users.id, technicianId), eq(users.role, "technician"), eq(technicianProfiles.approval, "approved"))).limit(1);
  if (!technician) throw new HttpError(400, "الفني غير معتمد أو غير موجود", "TECHNICIAN_UNAVAILABLE");
  const requestId = String(req.params.id);
  const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, requestId)).limit(1);
  if (!request) throw new HttpError(404, "الطلب غير موجود", "NOT_FOUND");
  const [updated] = await db.update(maintenanceRequests).set({ assignedTechnicianId: technicianId, status: "assigned", updatedAt: new Date() }).where(eq(maintenanceRequests.id, request.id)).returning();
  await db.insert(requestStatusHistory).values({ requestId: request.id, fromStatus: request.status, toStatus: "assigned", actorId: req.user!.id });
  await db.insert(notifications).values({ userId: technicianId, type: "request", titleAr: "تم إسناد طلب جديد", bodyAr: `تم إسناد الطلب ${request.referenceCode} إليك`, referenceId: request.id });
  await db.insert(auditLogs).values({ actorId: req.user!.id, action: "assign_request", entityType: "maintenance_request", entityId: request.id, metadata: JSON.stringify({ technicianId }) });
  res.json({ request: updated });
}));

router.post("/requests/:id/status", requireAuth, asyncRoute(async (req, res) => {
  const { status, note } = statusSchema.parse(req.body);
  const requestId = String(req.params.id);
  const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, requestId)).limit(1);
  if (!request) throw new HttpError(404, "الطلب غير موجود", "NOT_FOUND");
  const user = req.user!;
  if (user.role === "customer" && (request.customerId !== user.id || status !== "cancelled")) throw new HttpError(403, "لا يمكنك تغيير حالة هذا الطلب", "FORBIDDEN");
  if (user.role === "technician" && (request.assignedTechnicianId !== user.id || !["accepted", "rejected", "in_progress", "completed", "unable_to_complete", "reassignment_required"].includes(status))) throw new HttpError(403, "لا يمكنك تغيير حالة هذا الطلب", "FORBIDDEN");
  const allowed: Record<string, string[]> = { submitted: ["under_review", "cancelled"], under_review: ["assigned", "rejected", "cancelled"], assigned: ["accepted", "rejected", "reassignment_required"], accepted: ["in_progress", "cancelled"], in_progress: ["completed", "unable_to_complete", "reassignment_required"], completed: ["closed"], reassignment_required: ["assigned", "cancelled"] };
  if (!allowed[request.status]?.includes(status) && user.role !== "admin") throw new HttpError(409, "انتقال الحالة غير مسموح", "INVALID_TRANSITION");
  const [updated] = await db.update(maintenanceRequests).set({ status, updatedAt: new Date(), completedAt: status === "completed" ? new Date() : request.completedAt }).where(eq(maintenanceRequests.id, request.id)).returning();
  await db.insert(requestStatusHistory).values({ requestId: request.id, fromStatus: request.status, toStatus: status, actorId: user.id, note });
  await db.insert(notifications).values({ userId: request.customerId, type: "request", titleAr: "تم تحديث حالة طلبك", bodyAr: `أصبحت حالة الطلب ${request.referenceCode}: ${status}`, referenceId: request.id });
  res.json({ request: updated });
}));

export default router;
