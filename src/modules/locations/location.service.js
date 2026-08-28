import { findDistrictsByStateId, findStates, findVillagesByDistrictId } from "./location.repository.js";

import { AppError } from "../../common/errors/AppError.js";



//dont add uuid pattern checking directly get the state and district



export const getStates = () => findStates();

export function getDistricts(stateId) {
  
  return findDistrictsByStateId(stateId);
}

export function getVillages(districtId) {
 
  return findVillagesByDistrictId(districtId);
}