import type { RequestHandler } from "express";
import { and, eq, gt } from "drizzle-orm";
import { authSessions, users, type User } from "@workspace/db";
import { db } from "@workspace/db";
import { config } from "../lib/config";
import { hashSessionToken } from "../lib/security";
import { HttpError } from "../lib/http";

declare global {
  namespace Express {
    interface Request { user?: User; sessionId?: string; }
  }
}

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const raw = req.cookies?.[config.SESSION_COOKIE_NAME] as string | undefined;
    if (!raw) throw new HttpError(401, "يجب تسجيل الدخول", "AUTH_REQUIRED");
    const result = await db.select({ session: authSessions, user: users }).from(authSessions).innerJoin(users, eq(authSessions.userId, users.id)).where(and(eq(authSessions.tokenHash, hashSessionToken(raw)), gt(authSessions.expiresAt, new Date()))).limit(1);
    const row = result[0];
    if (!row || row.user.status !== "active") throw new HttpError(401, "جلسة الدخول غير صالحة", "INVALID_SESSION");
    req.user = row.user;
    req.sessionId = row.session.id;
    next();
  } catch (error) { next(error); }
};

export function requireRole(...roles: User["role"][]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(new HttpError(401, "يجب تسجيل الدخول", "AUTH_REQUIRED"));
    if (!roles.includes(req.user.role)) return next(new HttpError(403, "ليس لديك صلاحية لهذه العملية", "FORBIDDEN"));
    next();
  };
}
