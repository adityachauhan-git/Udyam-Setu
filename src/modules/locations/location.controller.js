import { getCompetitionMap, getDistricts, getStates, getVillages } from "./location.service.js";
import { logger } from "../../common/utils/logger.js";

export async function listStates(req, res) {
  logger.info("controller.locations.states", { requestId: req.requestId });
  const states = await getStates();
  logger.debug("controller.locations.states.response", { requestId: req.requestId, count: states.length });
  res.json({ success: true, data: { states } });
}

export async function listDistricts(req, res) {
  logger.info("controller.locations.districts", { requestId: req.requestId, stateId: req.query.stateId });
  const districts = await getDistricts(req.query.stateId);
  logger.debug("controller.locations.districts.response", { requestId: req.requestId, count: districts.length });
  res.json({ success: true, data: { districts } });
}

export async function listVillages(req, res) {
  logger.info("controller.locations.villages", { requestId: req.requestId, districtId: req.query.districtId });
  const villages = await getVillages(req.query.districtId);
  logger.debug("controller.locations.villages.response", { requestId: req.requestId, count: villages.length });
  res.json({ success: true, data: { villages } });
}

export async function getCompetitionMapData(req, res) {
  logger.info("controller.locations.competitionMap", { requestId: req.requestId, userId: req.user.id, businessCategory: req.query.businessCategory });
  const map = await getCompetitionMap(req.user.id, req.query.businessCategory);
  logger.debug("controller.locations.competitionMap.response", { requestId: req.requestId, userId: req.user.id, count: map.businesses.length });
  res.json({ success: true, data: map });
}