import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SESSION_COOKIE_NAME: z.string().min(1).default("fixmate_session"),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(14),
  SESSION_COOKIE_SECURE: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  SESSION_COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),
});

export const config = envSchema.parse(process.env);
