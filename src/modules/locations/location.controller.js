import { getDistricts, getStates, getVillages } from "./location.service.js";

export async function listStates(req, res) {
  res.json({ success: true, data: { states: await getStates() } });
}

export async function listDistricts(req, res) {
  res.json({ success: true, data: { districts: await getDistricts(req.query.stateId) } });
}

export async function listVillages(req, res) {
  res.json({ success: true, data: { villages: await getVillages(req.query.districtId) } });
}