import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { AppError } from "../../common/errors/AppError.js";
import { findNearbyMarketData } from "./market.repository.js";

const defaultQuestions = [
  "What kind of business idea fits my skills best?",
  "What is my biggest challenge right now?",
  "Which opportunity fits my current skills best?",
  "Should I explore low-investment or high-growth ideas?",
  "What would help me generate income fastest?",
];

const GROQ_MODEL = "openai/gpt-oss-120b";
const GROQ_MAX_ATTEMPTS = 3;
const GROQ_REQUEST_TIMEOUT_MS = 8000;
const GROQ_RETRY_DELAYS_MS = [250, 500];
const FALLBACK_ERROR_MESSAGE = "AI service temporarily unavailable";

class ProviderError extends Error {
  constructor(provider, error, fallbackEligible = false) {
    super(`${provider} provider request failed`);
    this.name = "ProviderError";
    this.provider = provider;
    this.cause = error;
    this.fallbackEligible = fallbackEligible;
  }
}

function getErrorStatus(error) {
  const status = Number(error?.status ?? error?.statusCode ?? error?.response?.status);
  return Number.isInteger(status) ? status : null;
}

function isTemporaryProviderError(error) {
  const status = getErrorStatus(error);
  if ([408, 429, 500, 502, 503, 504].includes(status)) return true;
  if (status !== null) return false;

  return [
    "ECONNABORTED",
    "ECONNRESET",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "ENETUNREACH",
    "UND_ERR_CONNECT_TIMEOUT",
    "UND_ERR_SOCKET",
  ].includes(error?.code)
    || [
      "AbortError",
      "FetchError",
      "TimeoutError",
      "APIConnectionError",
      "APIConnectionTimeoutError",
    ].includes(error?.name);
}

function logProviderError(provider, error, attempt) {
  console.error(`[${provider}] AI request failed`, {
    attempt,
    status: getErrorStatus(error),
    code: error?.code,
    message: error?.message || "Unknown provider error",
  });
}

function getRequiredApiKey(name) {
  const apiKey = process.env[name];
  if (!apiKey) {
    throw new ProviderError(name === "GROQ_API_KEY" ? "groq" : "gemini", new Error(`${name} is not configured`));
  }
  return apiKey;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function withTimeout(promise, milliseconds) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      const timeoutError = new Error("Gemini request timed out");
      timeoutError.code = "ETIMEDOUT";
      reject(timeoutError);
    }, milliseconds);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
}

function getGeminiApiKey() {
  return getRequiredApiKey("GEMINI_API_KEY");
}

function normalizeHistoryEntry(entry) {
  if (!entry || typeof entry !== "object") {
    throw new AppError("Chat history entries must be objects", 400);
  }

  const role = entry.role === "assistant" || entry.role === "model" ? "model" : "user";

  if (Array.isArray(entry.parts)) {
    return {
      role,
      parts: entry.parts
        .filter((part) => part && typeof part === "object")
        .map((part) => ({ text: String(part.text || part.content || "") }))
        .filter((part) => part.text.trim()),
    };
  }

  const text = typeof entry.content === "string"
    ? entry.content
    : typeof entry.text === "string"
      ? entry.text
      : "";

  return {
    role,
    parts: [{ text }],
  };
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  return [value].filter(Boolean);
}

export function buildRecommendedQuestions(profile = {}) {
  const questions = [...defaultQuestions];
  const skills = toArray(profile.skills);
  const interests = toArray(profile.interests);
  const goals = toArray(profile.goals);
  const landAccess = profile.land_access ?? profile.landAccess;
  const capitalRange = profile.capital_range ?? profile.capitalRange;
  const incomeRange = profile.desired_monthly_income_range ?? profile.desiredMonthlyIncomeRange;

  if (skills.length > 0) {
    questions.unshift(`I have skills in ${skills.slice(0, 2).join(", ")}. Which business idea fits me best?`);
  }

  if (interests.length > 0) {
    questions.unshift(`I am interested in ${interests.slice(0, 2).join(", ")}. Which opportunity should I explore first?`);
  }

  if (goals.includes("Start a new business")) {
    questions.unshift("I want to start a business. Should I explore low-cost or scalable ideas?");
  }

  if (landAccess === true) {
    questions.unshift("I have access to land. Should I look at farm-based or agri-business opportunities?");
  }

  if (capitalRange) {
    questions.unshift(`My capital range is ${capitalRange}. Should I focus on ideas that fit that budget?`);
  }

  if (incomeRange) {
    questions.unshift(`I want to reach around ${incomeRange}. Should I focus on ideas that can help me get there faster?`);
  }

  return [...new Set(questions)].slice(0, 5);
}

export async function getRecommendedQuestions(profile) {
  return buildRecommendedQuestions(profile ?? {});
}

function formatLabel(value) {
  return String(value)
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (str) => str.toUpperCase());
}

function emptyMarketSummary() {
  return { businesses: [], products: [], observations: [], risks: [], channels: [] };
}

function summarizeNearbyMarketData(marketData) {
  const businesses = new Map();

  marketData.businesses.forEach((row) => {
    if (!businesses.has(row.id)) {
      businesses.set(row.id, { name: row.name, type: row.business_type, products: [] });
    }
    if (row.product_name) {
      businesses.get(row.id).products.push(`${row.product_name}: ${row.price} per ${row.unit}`);
    }
  });

  return {
    businesses: [...businesses.values()].map((business) => `${business.name} (${formatLabel(business.type)})`),
    products: [...businesses.values()].flatMap((business) => business.products.map((product) => `${business.name} — ${product}`)),
    observations: marketData.observations.map((row) => `${formatLabel(row.observation_type)}: ${row.value} ${row.unit} (${row.source_label})`),
    risks: marketData.risks.map((row) => `${formatLabel(row.severity)} ${formatLabel(row.risk_type)}: ${row.description}`),
    channels: marketData.channels.map((row) => `${row.name} (${formatLabel(row.channel_type)})`),
  };
}

async function getNearbyMarketSummary(villageId) {
  if (!villageId) return emptyMarketSummary();

  try {
    return summarizeNearbyMarketData(await findNearbyMarketData(villageId));
  } catch (error) {
    console.warn("Failed to load nearby GIS market data:", error.message);
    return emptyMarketSummary();
  }
}

function buildOnboardingContext(profile = {}, marketData = emptyMarketSummary()) {
  if (!profile || typeof profile !== "object") {
    return null;
  }

  const profileParts = [];

  const skills = toArray(profile.skills);
  const interests = toArray(profile.interests);
  const goals = toArray(profile.goals);

  const addPart = (label, value) => {
    if (value === null || value === undefined || value === "") return;
    if (Array.isArray(value)) {
      const cleaned = value.filter(Boolean);
      if (cleaned.length > 0) profileParts.push(`${label}: ${cleaned.join(", ")}`);
      return;
    }
    profileParts.push(`${label}: ${String(value)}`);
  };

  addPart("Age group", profile.age_group ?? profile.ageGroup);
  addPart("Preferred language(try to answer in this language)", profile.preferred_language ?? profile.preferredLanguage);
  addPart("Address", [
    profile.village_name ?? profile.villageName,
    profile.district_name ?? profile.districtName,
    profile.state_name ?? profile.stateName,
  ].filter(Boolean).join(", ") || null);
  addPart("Village", profile.village_name ?? profile.villageName ?? profile.village_id ?? profile.villageId);
  addPart("District", profile.district_name ?? profile.districtName ?? profile.district_id ?? profile.districtId);
  addPart("State", profile.state_name ?? profile.stateName ?? profile.state_id ?? profile.stateId);
  addPart("Land access", profile.land_access ?? profile.landAccess);
  addPart("Land size", profile.land_area ?? profile.landArea);
  addPart("Land unit", profile.land_unit ?? profile.landUnit);
  addPart("Land type", profile.land_type ?? profile.landType);
  addPart("Capital range", profile.capital_range ?? profile.capitalRange);
  addPart("Desired monthly income", profile.desired_monthly_income_range ?? profile.desiredMonthlyIncomeRange);
  addPart("Skills", skills);
  addPart("Interests", interests);
  addPart("Goals", goals);
  addPart("Nearby businesses within 10 km", marketData.businesses);
  addPart("Nearby products and prices within 10 km", marketData.products);
  addPart("Market observations within 10 km", marketData.observations);
  addPart("Local risks within 10 km", marketData.risks);
  addPart("Distribution channels within 10 km", marketData.channels);
  addPart("Electricity available", profile.electricity_available ?? profile.electricityAvailable);
  addPart("Internet available", profile.internet_available ?? profile.internetAvailable);
  addPart("Water available", profile.water_available ?? profile.waterAvailable);
  addPart("Storage available", profile.storage_available ?? profile.storageAvailable);
  addPart("Transport available", profile.transport_available ?? profile.transportAvailable);
  addPart("Equipment available", profile.equipment_available ?? profile.equipmentAvailable);

  return profileParts.length > 0
    ? `You are helping this user with business advice. Use the onboarding profile as background context for all responses and do not ask the user for information they already provided. Prioritize opportunities that are practical near the user’s location within a 10 km radius. Treat nearby businesses, prices, market observations, risks, and distribution channels as local signals. Profile summary: ${profileParts.join("; ")}.`
    : null;
}

function buildGroqMessages(contents) {
  return contents.map((entry) => ({
    role: entry.role === "model" ? "assistant" : entry.role,
    content: entry.parts.map((part) => part.text).join("\n"),
  }));
}

async function generateWithGroq(messages) {
  const groq = new Groq({
    apiKey: getRequiredApiKey("GROQ_API_KEY"),
    timeout: GROQ_REQUEST_TIMEOUT_MS,
  });

  for (let attempt = 1; attempt <= GROQ_MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
      });

      return {
        reply: response?.choices?.[0]?.message?.content || "No response generated",
        model: GROQ_MODEL,
        provider: "groq",
        fallbackUsed: false,
      };
    } catch (error) {
      const temporary = isTemporaryProviderError(error);
      logProviderError("groq", error, attempt);

      if (!temporary || attempt === GROQ_MAX_ATTEMPTS) {
        throw new ProviderError("groq", error, temporary);
      }

      await wait(GROQ_RETRY_DELAYS_MS[attempt - 1]);
    }
  }

  throw new ProviderError("groq", new Error("Groq retry limit reached"), true);
}

async function generateWithGemini(contents) {
  let apiKey;
  try {
    apiKey = getGeminiApiKey();
  } catch (error) {
    throw error;
  }

  const modelName = getGeminiModelName();
  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await withTimeout(
      ai.models.generateContent({ model: modelName, contents }),
      GROQ_REQUEST_TIMEOUT_MS,
    );

    return {
      reply: response?.text || "No response generated",
      model: modelName,
      provider: "gemini",
    };
  } catch (error) {
    logProviderError("gemini", error, 1);
    throw new ProviderError("gemini", error, false);
  }
}

export async function generateWithAi(contents) {
  try {
    return await generateWithGroq(buildGroqMessages(contents));
  } catch (groqError) {
    if (!(groqError instanceof ProviderError) || !groqError.fallbackEligible) {
      throw new AppError("AI provider configuration error", 500);
    }

    try {
      const result = await generateWithGemini(contents);
      return { ...result, fallbackUsed: true };
    } catch (geminiError) {
      console.error("[ai] Both providers are unavailable", {
        groq: groqError.cause?.message || "Unknown Groq error",
        gemini: geminiError.cause?.message || "Unknown Gemini error",
      });
      throw new AppError(FALLBACK_ERROR_MESSAGE, 503);
    }
  }
}

export async function sendChatMessage({ message, history = [], userId, profile = {} }) {
  if (typeof message !== "string" || !message.trim()) {
    throw new AppError("Message is required", 400);
  }

  if (history && !Array.isArray(history)) {
    throw new AppError("History must be an array", 400);
  }

  const marketData = await getNearbyMarketSummary(profile?.village_id ?? profile?.villageId);

  console.log("marketData", marketData);

  const onboardingContext = buildOnboardingContext(profile, marketData);

  const contents = [];

  if (onboardingContext) {
    contents.push({
      role: "user",
      parts: [{
        text: onboardingContext,
      }],
    });
  }

  contents.push(
    ...history.map((entry) => normalizeHistoryEntry(entry)),
    { role: "user", parts: [{ text: message.trim() }] },
  );

  const result = await generateWithAi(contents);
  return { ...result, userId };
}
