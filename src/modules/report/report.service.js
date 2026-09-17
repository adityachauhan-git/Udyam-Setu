import { AppError } from "../../common/errors/AppError.js";
import { logger } from "../../common/utils/logger.js";
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

function profileContext(profile = {}) {
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
  return JSON.parse(json);
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

const SECTION_CONFIG = {
  marketReach: {
    label: "market reach",
    fallbackSummary: "The available local observations and distribution channels provide the market-reach evidence shown below; population data is not available in the supplied context.",
    fallbackAdvice: [
      "Use the listed local channels to test demand with a small pilot.",
      "Track weekly orders and repeat customers before expanding capacity.",
      "Collect local customer or population data to improve the next assessment.",
    ],
  },
  opportunityAnalysis: {
    label: "opportunity analysis",
    fallbackSummary: "The available local prices, observations, competitors, and channels are shown below as the evidence for evaluating this opportunity.",
    fallbackAdvice: [
      "Start with the demand signal that is closest to your proposed business.",
      "Compare your costs with the listed local prices before investing.",
      "Validate the opportunity with potential customers and channel partners.",
    ],
  },
  swot: {
    label: "SWOT",
    fallbackSummary: "This SWOT assessment is based on the onboarding profile and local market signals supplied below.",
    fallbackAdvice: [
      "Build on the skills and resources already available in your profile.",
      "Address the listed resource gaps before committing major capital.",
      "Use the local opportunities while preparing for the recorded risks.",
    ],
  },
  competitorMapping: {
    label: "competitor mapping",
    fallbackSummary: "The competitor count and nearby businesses shown below are the available evidence within the fixed 10 km radius.",
    fallbackAdvice: [
      "Compare your service, price, and delivery area with the listed businesses.",
      "Identify one customer segment that nearby competitors serve poorly.",
      "Begin with a small service area and expand after measuring demand.",
    ],
  },
  productPricing: {
    label: "product pricing",
    fallbackSummary: "The products, services, prices, units, and businesses shown below are the available local pricing evidence within 10 km.",
    fallbackAdvice: [
      "Use the observed prices as a reference, not as a guaranteed margin.",
      "Calculate fuel, labour, maintenance, and delivery costs before setting rates.",
      "Test an introductory price with a small group of local customers.",
    ],
  },
  threats: {
    label: "threats",
    fallbackSummary: "The operational risks and severities shown below are the available local threat evidence within 10 km.",
    fallbackAdvice: [
      "Prioritize mitigation for risks marked high or critical.",
      "Keep a contingency reserve for route, supply, and maintenance disruptions.",
      "Review these risks after each operating season and update the plan.",
    ],
  },
};

function normalizeAdvice(value, fallbackAdvice) {
  const advice = arrayOrEmpty(value)
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .slice(0, 3);
  return [...advice, ...fallbackAdvice].slice(0, 3);
}

function fallbackSection(sectionKey) {
  const config = SECTION_CONFIG[sectionKey];
  return { summary: config.fallbackSummary, advice: [...config.fallbackAdvice] };
}

function parseSectionReply(reply, sectionKey) {
  const config = SECTION_CONFIG[sectionKey];
  try {
    const parsed = objectOrEmpty(parseJsonReply(reply));
    const summary = String(parsed.summary || "").trim();
    if (!summary) throw new Error("summary is missing");
    return {
      analysis: { summary, advice: normalizeAdvice(parsed.advice, config.fallbackAdvice) },
      fallbackUsed: false,
    };
  } catch (error) {
    logger.warn("service.report.feasibility.section_fallback", {
      section: sectionKey,
      message: error.message,
    });
    return { analysis: fallbackSection(sectionKey), fallbackUsed: true };
  }
}

function sectionPrompt(sectionKey, aiContext) {
  const config = SECTION_CONFIG[sectionKey];
  return `Analyse only the ${config.label} section of an AI business feasibility report. Return only valid JSON in exactly this shape: {"summary":"one concise paragraph","advice":["three concise practical recommendations"]}. The advice array must contain exactly three strings. Base every statement only on the supplied onboarding profile and local-market database facts. Do not invent businesses, prices, population, competitors, risks, demand, or numerical facts. If evidence is limited, acknowledge that in the summary and advice. Do not reproduce database records; the backend will attach them separately.\n\nContext:\n${JSON.stringify(aiContext)}`;
}

function sectionData(localMarketContext, profile) {
  const onboarding = profileContext(profile);
  return {
    marketReach: {
      marketObservations: localMarketContext.market,
      distributionChannels: localMarketContext.distributionChannels,
    },
    opportunityAnalysis: {
      marketObservations: localMarketContext.market,
      pricing: localMarketContext.pricing,
      competitors: localMarketContext.competitors,
      distributionChannels: localMarketContext.distributionChannels,
    },
    swot: {
      onboarding,
      marketObservations: localMarketContext.market,
      risks: localMarketContext.threats,
      resources: onboarding.resources,
    },
    competitorMapping: {
      competitorCount: localMarketContext.competitors.length,
      competitors: localMarketContext.competitors,
    },
    productPricing: {
      products: localMarketContext.pricing,
    },
    threats: {
      risks: localMarketContext.threats,
    },
  };
}

export function buildStructuredReport(sectionAnalyses, localMarketContext, profile) {
  const data = sectionData(localMarketContext, profile);
  return Object.fromEntries(Object.keys(SECTION_CONFIG).map((sectionKey) => {
    const analysis = sectionAnalyses[sectionKey] || fallbackSection(sectionKey);
    return [sectionKey, { ...analysis, data: data[sectionKey] }];
  }));
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
  const sectionEntries = Object.keys(SECTION_CONFIG);
  const settledResults = await Promise.allSettled(sectionEntries.map(async (sectionKey) => {
    const aiResult = await generateReportWithAi([{ role: "user", parts: [{ text: sectionPrompt(sectionKey, aiContext) }] }]);
    logger.info("service.report.feasibility.ai_reply", {
      userId,
      businessCategory: category,
      section: sectionKey,
      provider: aiResult.provider,
      model: aiResult.model,
      reply: aiResult.reply,
    });
    const parsed = parseSectionReply(aiResult.reply, sectionKey);
    return { sectionKey, ...parsed, provider: aiResult.provider, model: aiResult.model, providerFallback: aiResult.fallbackUsed === true };
  }));

  const sectionAnalyses = {};
  const providers = {};
  const models = {};
  let fallbackUsed = false;
  settledResults.forEach((result, index) => {
    const sectionKey = sectionEntries[index];
    if (result.status === "fulfilled") {
      sectionAnalyses[sectionKey] = result.value.analysis;
      providers[sectionKey] = result.value.provider;
      models[sectionKey] = result.value.model;
      fallbackUsed = fallbackUsed || result.value.fallbackUsed || result.value.providerFallback;
      return;
    }

    logger.warn("service.report.feasibility.section_request_failed", {
      userId,
      businessCategory: category,
      section: sectionKey,
      message: result.reason?.message || "Unknown AI error",
    });
    sectionAnalyses[sectionKey] = fallbackSection(sectionKey);
    providers[sectionKey] = "fallback";
    models[sectionKey] = null;
    fallbackUsed = true;
  });

  return {
    report: buildStructuredReport(sectionAnalyses, localMarketContext, profile),
    provider: "multiple",
    model: "multiple",
    providers,
    models,
    fallbackUsed,
  };
}
