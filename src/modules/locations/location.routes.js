import { Router } from "express";
import { listDistricts, listStates, listVillages } from "./location.controller.js";

const router = Router();

router.get("/states", listStates);
router.get("/districts", listDistricts);
router.get("/villages", listVillages);

export default router;