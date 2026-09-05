import { AppError } from "../../common/errors/AppError.js";
import { generateWithAi } from "../chat/chat.service.js";
import { getOnboarding } from "../onboarding/onboarding.service.js";
import { findNearbyMarketData, findVillageLocation } from "./report.repository.js";

const RADIUS_KM = 10;

export function normalizeBusinessCategory(value) {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError("Business category is required", 400);
  }
  const category = value.trim().toLowerCase();
  if (category.length > 100) throw new AppError("Business category is too long", 400);
  return category;
}

function profileContext(profile) {
  return {
    skills: profile.skills || [],
    interests: profile.interests || [],
    goals: profile.goals || [],
    capitalRange: profile.capital_range,
    land: {
      access: profile.land_access,
      area: profile.land_area,
      unit: profile.land_unit,
      irrigated: profile.land_irrigated,
      type: profile.land_type,
    },
    resources: {
      electricity: profile.electricity_available,
      internet: profile.internet_available,
      water: profile.water_available,
      storage: profile.storage_available,
      transport: profile.transport_available,
      equipment: profile.equipment_available,
    },
    desiredIncome: profile.desired_monthly_income_range,
    preferredLanguage: profile.preferred_language,
  };
}

export async function getLocalMarketContext(villageId, businessCategory, radiusKm = RADIUS_KM) {
  if (radiusKm !== RADIUS_KM) throw new AppError("Feasibility reports use a fixed 10 km radius", 400);
  const village = await findVillageLocation(villageId);
  if (!village) throw new AppError("Selected village location is unavailable", 400);

  const marketData = await findNearbyMarketData(villageId, businessCategory, radiusKm * 1000);
  return {
    location: {
      village: village.village,
      district: village.district,
      state: village.state,
      latitude: village.latitude,
      longitude: village.longitude,
    },
    businessCategory,
    radiusKm,
    ...marketData,
  };
}

function financialContext(profile) {
  const capitalRange = profile.capital_range;
  if (!capitalRange) {
    return { capitalRange: null, calculation: null, note: "No capital range is stored for this user." };
  }

  return {
    capitalRange,
    calculation: null,
    note: "Exact margin capital is not stored, so an exact loan calculation is not available for this report.",
  };
}

export function buildFeasibilityAiContext(localMarketContext, profile) {
  return {
    reportType: "AI Business Feasibility Report",
    factualDataNotice: "All local-market records are database facts from a demo dataset and are not real-world verified. Do not invent numerical facts, businesses, prices, population, competitors, or risks.",
    localMarket: localMarketContext,
    onboarding: profileContext(profile),
    financial: financialContext(profile),
  };
}

function parseJsonReply(reply) {
  const trimmed = String(reply || "").trim();
  const json = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(json);
  } catch {
    throw new AppError("AI returned an invalid feasibility report", 502);
  }
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

export function buildStructuredReport(aiReply, localMarketContext) {
  const parsedReply = parseJsonReply(aiReply);
  if (!parsedReply || typeof parsedReply !== "object" || Array.isArray(parsedReply)) {
    throw new AppError("AI returned an invalid feasibility report", 502);
  }
  const generated = parsedReply;
  const marketReach = objectOrEmpty(generated.marketReach);
  const opportunityAnalysis = objectOrEmpty(generated.opportunityAnalysis);
  const swot = objectOrEmpty(generated.swot);
  const competitorMapping = objectOrEmpty(generated.competitorMapping);
  const productPricing = objectOrEmpty(generated.productPricing);
  const generatedThreats = arrayOrEmpty(generated.threats);

  return {
    marketReach: {
      summary: String(marketReach.summary || "Insufficient local market data for a detailed reach assessment."),
      consumerBase: String(marketReach.consumerBase || "Population data is not available in the supplied context."),
      distributionChannels: localMarketContext.distributionChannels,
      evidence: localMarketContext.market,
    },
    opportunityAnalysis: {
      summary: String(opportunityAnalysis.summary || "Insufficient local data to identify a detailed opportunity."),
      opportunities: arrayOrEmpty(opportunityAnalysis.opportunities),
      marketGaps: arrayOrEmpty(opportunityAnalysis.marketGaps),
    },
    swot: {
      strengths: arrayOrEmpty(swot.strengths),
      weaknesses: arrayOrEmpty(swot.weaknesses),
      opportunities: arrayOrEmpty(swot.opportunities),
      threats: arrayOrEmpty(swot.threats),
    },
    threats: localMarketContext.threats.map((threat) => {
      const generatedThreat = generatedThreats.find((item) => String(item?.risk || "").toLowerCase().includes(String(threat.risk_type).toLowerCase()));
      return {
        risk: threat.risk_type,
        severity: threat.severity,
        reason: threat.description,
        mitigation: String(generatedThreat?.mitigation || "No mitigation recommendation was generated."),
      };
    }),
    competitorMapping: {
      competitorCount: localMarketContext.competitors.length,
      competitionLevel: String(competitorMapping.competitionLevel || "insufficient data"),
      summary: String(competitorMapping.summary || "No competitor interpretation was generated."),
      competitors: localMarketContext.competitors,
    },
    productPricing: {
      summary: String(productPricing.summary || "No pricing interpretation was generated."),
      products: localMarketContext.pricing,
    },
  };
}

export async function generateFeasibilityReport({ userId, businessCategory }, dependencies = {}) {
  const loadOnboarding = dependencies.getOnboarding || getOnboarding;
  const loadLocalMarketContext = dependencies.getLocalMarketContext || getLocalMarketContext;
  const generateReportWithAi = dependencies.generateWithAi || generateWithAi;
  const category = normalizeBusinessCategory(businessCategory);
  const profile = await loadOnboarding(userId);
  if (!profile.id || !profile.village_id) {
    throw new AppError("Complete onboarding with a selected village before requesting a feasibility report", 400);
  }

  const localMarketContext = await loadLocalMarketContext(profile.village_id, category);
  const aiContext = buildFeasibilityAiContext(localMarketContext, profile);
  const instruction = `Return only valid JSON with exactly these top-level keys: marketReach, opportunityAnalysis, swot, threats, competitorMapping, productPricing. Use the supplied database values as factual evidence. Do not invent facts. If a section lacks evidence, say that data is insufficient.\n\n${JSON.stringify(aiContext)}`;
  const aiResult = await generateReportWithAi([{ role: "user", parts: [{ text: instruction }] }]);

  return {
    report: buildStructuredReport(aiResult.reply, localMarketContext),
    provider: aiResult.provider,
    model: aiResult.model,
    fallbackUsed: aiResult.fallbackUsed === true,
  };
}
