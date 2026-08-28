import { AppError } from "../../common/errors/AppError.js";
import { findOnboardingByUserId, markOnboardingComplete, upsertOnboardingProfile } from "./onboarding.repository.js";


const languages = ["English", "Hindi", "Marathi", "Kannada", "Tamil", "Telugu", "Bengali", "Gujarati", "Punjabi", "Other"];
const ageGroups = ["under-18", "18-25", "26-40", "41-60", "60+"];
const landUnits = ["acre", "hectare", "bigha"];
const landTypes = ["agricultural", "residential", "other"];
const capitalRanges = ["0-25k", "25k-1L", "1-5L", "5L+"];
const incomeRanges = ["5k-10k", "10k-25k", "25k-50k", "50k+"];
const skills = ["Farming", "Animal husbandry", "Cooking", "Tailoring", "Carpentry", "Repair work", "Driving", "Computers", "Teaching", "Handicrafts", "Trading/selling", "Other"];
const interests = ["Agriculture", "Dairy", "Food", "Retail", "Manufacturing", "Services", "Technology", "Transportation", "Handicrafts", "Livestock", "Other"];
const goals = ["Start a new business", "Expand my existing business", "Find a job", "Get a government loan", "Find a government scheme", "Increase farm income", "Learn a skill"];

function enumValue(value, allowed, label) {
  if (value == null || value === "") return null;
  if (!allowed.includes(value)) throw new AppError(`${label} is invalid`, 400);
  return value;
}

function booleanValue(value, label) {
  if (value == null || value === "") return null;
  if (typeof value !== "boolean") throw new AppError(`${label} must be true or false`, 400);
  return value;
}

function completionValue(value) {
  if (value == null || value === false) return false;
  if (value !== true) throw new AppError("isComplete must be true or false", 400);
  return true;
}

function arrayValue(value, allowed, label) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((item) => !allowed.includes(item))) {
    throw new AppError(`${label} contains an invalid option`, 400);
  }
  return [...new Set(value)];
}

function normalizeProfile(body = {}) {
  const landArea = body.landArea == null || body.landArea === "" ? null : Number(body.landArea);
  if (landArea !== null && (!Number.isFinite(landArea) || landArea <= 0)) {
    throw new AppError("Land area must be a positive number", 400);
  }
  const villageId = body.villageId || null;

  return {
    ageGroup: enumValue(body.ageGroup, ageGroups, "Age group"),
    villageId,
    preferredLanguage: enumValue(body.preferredLanguage, languages, "Preferred language"),
    landAccess: booleanValue(body.landAccess, "Land access"),
    landArea,
    landUnit: enumValue(body.landUnit, landUnits, "Land unit"),
    landIrrigated: booleanValue(body.landIrrigated, "Irrigated"),
    landType: enumValue(body.landType, landTypes, "Land type"),
    capitalRange: enumValue(body.capitalRange, capitalRanges, "Capital range"),
    electricityAvailable: booleanValue(body.electricityAvailable, "Electricity availability"),
    internetAvailable: booleanValue(body.internetAvailable, "Internet availability"),
    waterAvailable: booleanValue(body.waterAvailable, "Water availability"),
    storageAvailable: booleanValue(body.storageAvailable, "Storage availability"),
    transportAvailable: booleanValue(body.transportAvailable, "Transport availability"),
    equipmentAvailable: booleanValue(body.equipmentAvailable, "Equipment availability"),
    skills: arrayValue(body.skills, skills, "Skills"),
    interests: arrayValue(body.interests, interests, "Interests"),
    goals: arrayValue(body.goals, goals, "Goals"),
    desiredMonthlyIncomeRange: enumValue(body.desiredMonthlyIncomeRange, incomeRanges, "Desired monthly income range"),
    isComplete: completionValue(body.isComplete),
  };
}

export async function getOnboarding(userId) {
  return (await findOnboardingByUserId(userId)) || { user_id: userId, is_complete: false };
}

export async function saveOnboarding(userId, body) {
  const profile = normalizeProfile(body);
  if (profile.isComplete && (!profile.villageId || !profile.preferredLanguage)) {
    throw new AppError("Village and preferred language are required to finish onboarding", 400);
  }
  try {
    const saved = await upsertOnboardingProfile(userId, profile);
    if (profile.isComplete) await markOnboardingComplete(userId);
    return saved;
  } catch (error) {
    if (error.code === "23503") throw new AppError("Selected village is invalid", 400);
    throw error;
  }
}