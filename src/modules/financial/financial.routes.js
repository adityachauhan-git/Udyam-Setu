import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware.js";
import { checkSchemeEligibility } from "./financial.controller.js";

const router = Router();

router.use(authenticate);
router.post("/eligibility", checkSchemeEligibility);

export default router;