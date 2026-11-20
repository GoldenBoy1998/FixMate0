import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import requestsRouter from "./requests";
const router: IRouter = Router();
router.use(healthRouter);
router.use("/auth", authRouter);
router.use(requestsRouter);
export default router;
