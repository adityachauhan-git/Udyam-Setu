import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware.js";
import { getSuggestions, sendMessage } from "./chat.controller.js";

const router = Router();

router.use(authenticate);
router.get("/recommendations", getSuggestions);
router.post("/send", sendMessage);

export default router;
