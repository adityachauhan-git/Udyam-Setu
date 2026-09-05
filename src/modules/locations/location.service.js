import { findCompetitionMapByUserId, findDistrictsByStateId, findStates, findVillagesByDistrictId } from "./location.repository.js";

import { AppError } from "../../common/errors/AppError.js";



//dont add uuid pattern checking directly get the state and district



export const getStates = () => findStates();

export function getDistricts(stateId) {
  
  return findDistrictsByStateId(stateId);
}

export function getVillages(districtId) {
 
  return findVillagesByDistrictId(districtId);
}

const COMPETITION_RADIUS_METERS = 10000;

function normalizeBusinessCategory(value) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > 100) {
    throw new AppError("Business category is invalid", 400);
  }
  return value.trim().toLowerCase() || null;
}

export async function getCompetitionMap(userId, businessCategory) {
  const map = await findCompetitionMapByUserId(userId, normalizeBusinessCategory(businessCategory), COMPETITION_RADIUS_METERS);
  if (!map) throw new AppError("Complete onboarding with a selected village before viewing the competition map", 400);
  return { radiusKm: 10, ...map };
}