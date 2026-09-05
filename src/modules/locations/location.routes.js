import { Router } from "express";
import { authenticate } from "../../common/middleware/auth.middleware.js";
import { getCompetitionMapData, listDistricts, listStates, listVillages } from "./location.controller.js";

const router = Router();

router.get("/states", listStates);
router.get("/districts", listDistricts);
router.get("/villages", listVillages);
router.get("/competition-map", authenticate, getCompetitionMapData);

export default router;