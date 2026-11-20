import { Router, type IRouter } from "express";
import cookieParser from "cookie-parser";
import { eq, or } from "drizzle-orm";
import { z } from "zod";
import { authSessions, customerProfiles, technicianProfiles, users } from "@workspace/db";
import { db } from "@workspace/db";
import { asyncRoute, HttpError } from "../lib/http";
import { config } from "../lib/config";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "../lib/security";
import { requireAuth } from "../middlewares/auth";

const router: IRouter = Router();
const identity = z.string().trim().min(3).max(254);
const password = z.string().min(8).max(128);
const registerSchema = z.object({ displayName: z.string().trim().min(2).max(120), email: z.string().email().optional(), phone: z.string().trim().min(9).max(20).optional(), password, role: z.enum(["customer", "technician"]).default("customer"), state: z.string().trim().max(120).optional(), city: z.string().trim().max(120).optional(), bio: z.string().trim().max(2000).optional(), location: z.string().trim().max(200).optional(), yearsExperience: z.number().int().min(0).max(70).optional() }).refine((data) => Boolean(data.email || data.phone), { message: "أدخل البريد الإلكتروني أو رقم الهاتف", path: ["email"] });
const loginSchema = z.object({ identity, password });

function publicUser(user: typeof users.$inferSelect) { return { id: user.id, displayName: user.displayName, email: user.email, phone: user.phone, role: user.role, status: user.status, createdAt: user.createdAt }; }
function cookieOptions() { return { httpOnly: true, secure: config.SESSION_COOKIE_SECURE, sameSite: config.SESSION_COOKIE_SAME_SITE as "lax" | "strict" | "none", path: "/", maxAge: config.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000 }; }
async function startSession(userId: string, res: Parameters<import("express").RequestHandler>[1]) {
  const raw = createSessionToken();
  const expiresAt = new Date(Date.now() + config.SESSION_TTL_DAYS * 86400000);
  await db.insert(authSessions).values({ userId, tokenHash: hashSessionToken(raw), expiresAt });
  res.cookie(config.SESSION_COOKIE_NAME, raw, cookieOptions());
}

router.post("/register", asyncRoute(async (req, res) => {
  const input = registerSchema.parse(req.body);
  const existing = await db.select({ id: users.id }).from(users).where(input.email && input.phone ? or(eq(users.email, input.email), eq(users.phone, input.phone)) : input.email ? eq(users.email, input.email) : eq(users.phone, input.phone!)).limit(1);
  if (existing[0]) throw new HttpError(409, "الحساب موجود مسبقاً", "ACCOUNT_EXISTS");
  const [user] = await db.insert(users).values({ displayName: input.displayName, email: input.email || null, phone: input.phone || null, passwordHash: await hashPassword(input.password), role: input.role, status: input.role === "technician" ? "pending" : "active" }).returning();
  if (!user) throw new HttpError(500, "تعذر إنشاء الحساب");
  if (input.role === "customer") await db.insert(customerProfiles).values({ userId: user.id, state: input.state, city: input.city });
  if (input.role === "technician") await db.insert(technicianProfiles).values({ userId: user.id, bio: input.bio || "", location: input.location || input.city || "غير محدد", yearsExperience: input.yearsExperience || 0 });
  await startSession(user.id, res);
  res.status(201).json({ user: publicUser(user) });
}));

router.post("/login", asyncRoute(async (req, res) => {
  const input = loginSchema.parse(req.body);
  const [user] = await db.select().from(users).where(or(eq(users.email, input.identity), eq(users.phone, input.identity))).limit(1);
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) throw new HttpError(401, "بيانات الدخول غير صحيحة", "INVALID_CREDENTIALS");
  if (user.status !== "active") throw new HttpError(403, "الحساب غير نشط أو بانتظار المراجعة", "ACCOUNT_NOT_ACTIVE");
  await startSession(user.id, res);
  res.json({ user: publicUser(user) });
}));

router.post("/logout", asyncRoute(async (req, res) => {
  const raw = req.cookies?.[config.SESSION_COOKIE_NAME] as string | undefined;
  if (raw) await db.delete(authSessions).where(eq(authSessions.tokenHash, hashSessionToken(raw)));
  res.clearCookie(config.SESSION_COOKIE_NAME, { httpOnly: true, secure: config.SESSION_COOKIE_SECURE, sameSite: config.SESSION_COOKIE_SAME_SITE as "lax" | "strict" | "none", path: "/" });
  res.status(204).send();
}));

router.get("/me", requireAuth, (req, res) => { res.json({ user: publicUser(req.user!) }); });

export default router;
