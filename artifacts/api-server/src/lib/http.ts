import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public readonly status: number, message: string, public readonly code = "REQUEST_ERROR") {
    super(message);
  }
}

export const asyncRoute = (handler: RequestHandler): RequestHandler => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "بيانات الطلب غير صحيحة", details: error.flatten() } });
    return;
  }
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  console.error(error);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "حدث خطأ داخلي غير متوقع" } });
};
