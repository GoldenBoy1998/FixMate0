import { Router, type IRouter } from "express";
import multer from "multer";
import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { db, attachments, maintenanceRequests, notifications } from "@workspace/db";
import { asyncRoute, HttpError } from "../lib/http";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1 }, fileFilter: (_req, file, callback) => {
  const allowed = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
  callback(null, allowed.has(file.mimetype));
} });
const uploadRoot = path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), ".data", "uploads"));
const extensionByMime: Record<string, string> = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "application/pdf": ".pdf" };

async function canAccessRequest(requestId: string, userId: string, role: string) {
  const [request] = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, requestId)).limit(1);
  if (!request) throw new HttpError(404, "الطلب غير موجود", "NOT_FOUND");
  if (role !== "admin" && request.customerId !== userId && request.assignedTechnicianId !== userId) throw new HttpError(403, "لا يمكنك الوصول إلى مرفقات هذا الطلب", "FORBIDDEN");
  return request;
}

router.get("/notifications", requireAuth, asyncRoute(async (req, res) => {
  const rows = await db.select().from(notifications).where(eq(notifications.userId, req.user!.id)).orderBy(desc(notifications.createdAt)).limit(50);
  res.json({ notifications: rows });
}));

router.post("/notifications/:id/read", requireAuth, asyncRoute(async (req, res) => {
  const [updated] = await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, String(req.params.id)), eq(notifications.userId, req.user!.id))).returning();
  if (!updated) throw new HttpError(404, "الإشعار غير موجود", "NOT_FOUND");
  res.json({ notification: updated });
}));

router.post("/requests/:id/attachments", requireAuth, upload.single("file"), asyncRoute(async (req, res) => {
  const requestId = String(req.params.id);
  await canAccessRequest(requestId, req.user!.id, req.user!.role);
  if (!req.file) throw new HttpError(400, "الملف غير صالح أو نوعه غير مدعوم", "INVALID_FILE");
  const storageKey = `${randomUUID()}${extensionByMime[req.file.mimetype]}`;
  const destination = path.join(uploadRoot, storageKey);
  await mkdir(uploadRoot, { recursive: true });
  await writeFile(destination, req.file.buffer, { flag: "wx", mode: 0o600 });
  const [attachment] = await db.insert(attachments).values({ requestId, uploadedBy: req.user!.id, storageKey, originalName: path.basename(req.file.originalname).slice(0, 255), mimeType: req.file.mimetype, sizeBytes: req.file.size }).returning();
  if (!attachment) throw new HttpError(500, "تعذر حفظ المرفق");
  res.status(201).json({ attachment });
}));

router.get("/requests/:id/attachments/:attachmentId", requireAuth, asyncRoute(async (req, res) => {
  const requestId = String(req.params.id);
  await canAccessRequest(requestId, req.user!.id, req.user!.role);
  const [attachment] = await db.select().from(attachments).where(and(eq(attachments.id, String(req.params.attachmentId)), eq(attachments.requestId, requestId))).limit(1);
  if (!attachment) throw new HttpError(404, "المرفق غير موجود", "NOT_FOUND");
  const filePath = path.join(uploadRoot, attachment.storageKey);
  res.type(attachment.mimeType).download(filePath, attachment.originalName);
}));

export default router;
