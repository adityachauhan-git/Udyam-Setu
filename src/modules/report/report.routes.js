import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware.js";
import { createFeasibilityReport } from "./report.controller.js";

const router = Router();

router.use(authenticate);
router.post("/feasibility", createFeasibilityReport);

export default router;
