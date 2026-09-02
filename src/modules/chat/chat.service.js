import { GoogleGenAI } from "@google/genai";
import { AppError } from "../../common/errors/AppError.js";

const defaultQuestions = [
  "What kind of business would you like to start or improve?",
  "What is your biggest challenge right now?",
  "Which opportunity fits your current skills best?",
  "Do you want low-investment ideas or high-growth ideas?",
  "What would help you generate income fastest?",
];

function getGeminiModelName() {
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new AppError("GEMINI_API_KEY is not configured", 500);
  }

  return apiKey;
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
    questions.unshift(`Based on your skills in ${skills.slice(0, 2).join(", ")}, which business idea fits you best?`);
  }

  if (interests.length > 0) {
    questions.unshift(`Since you are interested in ${interests.slice(0, 2).join(", ")}, which opportunity would you like to explore first?`);
  }

  if (goals.includes("Start a new business")) {
    questions.unshift("You mentioned starting a new business. Should I suggest low-cost ideas or scalable ideas?");
  }

  if (landAccess === true) {
    questions.unshift("Since you have access to land, should I suggest farm-based or agri-business opportunities?");
  }

  if (capitalRange) {
    questions.unshift(`You mentioned a capital range of ${capitalRange}. Should I suggest ideas within that budget?`);
  }

  if (incomeRange) {
    questions.unshift(`You want to target around ${incomeRange}. Should I focus on ideas that can help you reach that income level faster?`);
  }

  return [...new Set(questions)].slice(0, 5);
}

export async function getRecommendedQuestions(profile) {
  return buildRecommendedQuestions(profile ?? {});
}

export async function sendChatMessage({ message, history = [], userId }) {
  if (typeof message !== "string" || !message.trim()) {
    throw new AppError("Message is required", 400);
  }

  if (history && !Array.isArray(history)) {
    throw new AppError("History must be an array", 400);
  }

  const modelName = getGeminiModelName();
  const ai = new GoogleGenAI({ apiKey: getGeminiApiKey() });

  const contents = [
    ...history.map((entry) => normalizeHistoryEntry(entry)),
    { role: "user", parts: [{ text: message.trim() }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents,
    });

    return {
      reply: response?.text || "No response generated",
      model: modelName,
      userId,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const details = error?.message || "Gemini request failed";
    throw new AppError(`Gemini request failed: ${details}`, 502);
  }
}
