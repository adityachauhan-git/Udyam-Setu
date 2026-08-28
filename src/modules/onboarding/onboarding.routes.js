import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware.js";
import { getMyOnboarding, updateMyOnboarding } from "./onboarding.controller.js";

const router = Router();

router.use(authenticate);
router.get("/me", getMyOnboarding);
router.put("/me", updateMyOnboarding);

export default router;