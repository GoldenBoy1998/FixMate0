import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auditLogs, serviceCategories, technicianProfiles, technicianSpecialties, users } from "@workspace/db";
import { db } from "@workspace/db";
import { asyncRoute, HttpError } from "../lib/http";
import { requireAuth, requireRole } from "../middlewares/auth";

const router: IRouter = Router();
router.use(requireAuth, requireRole("admin"));
const categorySchema = z.object({ slug: z.string().trim().min(2).max(80), nameAr: z.string().trim().min(2).max(160), nameEn: z.string().trim().min(2).max(160), descriptionAr: z.string().trim().min(2).max(500), descriptionEn: z.string().trim().min(2).max(500), icon: z.string().trim().max(40).default("wrench"), sortOrder: z.number().int().min(0).default(0) });

router.get("/admin/technicians", asyncRoute(async (_req, res) => {
  const technicians = await db.select({ user: users, profile: technicianProfiles }).from(users).innerJoin(technicianProfiles, eq(users.id, technicianProfiles.userId)).orderBy(desc(technicianProfiles.createdAt));
  res.json({ technicians });
}));
router.post("/admin/technicians/:id/approval", asyncRoute(async (req, res) => {
  const approval = z.object({ approval: z.enum(["approved", "rejected", "suspended"]), notes: z.string().max(1000).optional() }).parse(req.body);
  const technicianId = String(req.params.id);
  const [profile] = await db.update(technicianProfiles).set({ approval: approval.approval, verificationNotes: approval.notes, updatedAt: new Date() }).where(eq(technicianProfiles.userId, technicianId)).returning();
  if (!profile) throw new HttpError(404, "ملف الفني غير موجود", "NOT_FOUND");
  await db.insert(auditLogs).values({ actorId: req.user!.id, action: `technician_${approval.approval}`, entityType: "technician_profile", entityId: technicianId, metadata: JSON.stringify({ notes: approval.notes }) });
  res.json({ profile });
}));
router.get("/admin/categories", asyncRoute(async (_req, res) => { res.json({ categories: await db.select().from(serviceCategories).orderBy(serviceCategories.sortOrder) }); }));
router.post("/admin/categories", asyncRoute(async (req, res) => { const input = categorySchema.parse(req.body); const [category] = await db.insert(serviceCategories).values(input).returning(); if (!category) throw new HttpError(500, "تعذر إنشاء الفئة"); res.status(201).json({ category }); }));
router.patch("/admin/categories/:id", asyncRoute(async (req, res) => { const input = categorySchema.partial().parse(req.body); const [category] = await db.update(serviceCategories).set({ ...input, updatedAt: new Date() }).where(eq(serviceCategories.id, String(req.params.id))).returning(); if (!category) throw new HttpError(404, "الفئة غير موجودة", "NOT_FOUND"); res.json({ category }); }));
router.post("/admin/categories/:id/toggle", asyncRoute(async (req, res) => { const enabled = z.object({ enabled: z.boolean() }).parse(req.body); const [category] = await db.update(serviceCategories).set({ isEnabled: enabled.enabled, updatedAt: new Date() }).where(eq(serviceCategories.id, String(req.params.id))).returning(); if (!category) throw new HttpError(404, "الفئة غير موجودة", "NOT_FOUND"); res.json({ category }); }));
router.get("/admin/users", asyncRoute(async (_req, res) => { res.json({ users: await db.select({ id: users.id, displayName: users.displayName, email: users.email, phone: users.phone, role: users.role, status: users.status, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)) }); }));
router.post("/admin/users/:id/status", asyncRoute(async (req, res) => { const status = z.object({ status: z.enum(["active", "suspended", "pending"]) }).parse(req.body); const userId = String(req.params.id); if (userId === req.user!.id) throw new HttpError(400, "لا يمكن تعليق حسابك الحالي", "SELF_STATUS_CHANGE"); const [user] = await db.update(users).set({ status: status.status, updatedAt: new Date() }).where(eq(users.id, userId)).returning(); if (!user) throw new HttpError(404, "المستخدم غير موجود", "NOT_FOUND"); res.json({ user: { id: user.id, displayName: user.displayName, role: user.role, status: user.status } }); }));
export default router;
