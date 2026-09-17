import assert from "node:assert/strict";
import test from "node:test";
import { createReportRepository } from "../src/modules/report/report.repository.js";
import { buildStructuredReport, generateFeasibilityReport, getLocalMarketContext, normalizeBusinessCategory } from "../src/modules/report/report.service.js";

test("report repository uses PostGIS radius queries for every local-market data type", async () => {
  const calls = [];
  const repository = createReportRepository({
    query: async (sql, values) => {
      calls.push({ sql, values });
      return { rows: [] };
    },
  });

  await repository.findNearbyMarketData("village-id", "dairy", 10000);

  assert.equal(calls.length, 5);
  assert.ok(calls.every(({ sql }) => sql.includes("ST_DWithin")));
  assert.ok(calls.every(({ values }) => values[0] === "village-id" && values[1] === 10000));
  assert.equal(calls[1].values[2], "dairy");
  assert.equal(calls[2].values[2], "dairy");
});

test("structured report preserves factual competitor, pricing, risk, and channel data", () => {
  const localMarketContext = {
    market: [{ observation_type: "milk_procurement_price", value: "42.00" }],
    competitors: [{ id: "business-1", name: "Dairy Collective", distance_km: "0.25" }],
    pricing: [{ product_name: "Milk procurement", price: "42.00", unit: "litre" }],
    threats: [{ risk_type: "fodder_shortage", severity: "high", description: "Seasonal shortage" }],
    distributionChannels: [{ name: "Dairy Chilling Route", channel_type: "cold_chain_route" }],
  };
  const sectionAnalyses = {
    marketReach: { summary: "Reach exists", advice: ["Use the channel", "Measure demand", "Collect more data"] },
    opportunityAnalysis: { summary: "Potential exists", advice: ["Test demand", "Compare costs", "Start small"] },
    swot: { summary: "Profile and market signals show a possible fit", advice: ["Use skills", "Address gaps", "Plan for risks"] },
    competitorMapping: { summary: "One nearby competitor is recorded", advice: ["Compare service", "Find a gap", "Pilot locally"] },
    productPricing: { summary: "Observed pricing is available", advice: ["Use as reference", "Calculate costs", "Test rates"] },
    threats: { summary: "One local risk is recorded", advice: ["Prioritize risk", "Keep reserve", "Review seasonally"] },
  };

  const report = buildStructuredReport(sectionAnalyses, localMarketContext, {});

  assert.equal(report.competitorMapping.data.competitorCount, 1);
  assert.deepEqual(report.competitorMapping.data.competitors, localMarketContext.competitors);
  assert.deepEqual(report.productPricing.data.products, localMarketContext.pricing);
  assert.deepEqual(report.marketReach.data.distributionChannels, localMarketContext.distributionChannels);
  assert.equal(report.threats.summary, "One local risk is recorded");
  assert.equal(report.threats.advice.length, 3);
});

test("business category is required and normalized", () => {
  assert.equal(normalizeBusinessCategory(" Dairy "), "dairy");
  assert.throws(() => normalizeBusinessCategory(""), { message: "Business category is required" });
});

test("report rejects a user without an onboarding profile or selected village", async () => {
  await assert.rejects(
    () => generateFeasibilityReport(
      { userId: "user-1", businessCategory: "dairy" },
      { getOnboarding: async () => ({ user_id: "user-1", is_complete: false }) },
    ),
    { message: "Complete onboarding with a selected village before requesting a feasibility report" },
  );
});

test("report uses zero competitors and insufficient-data defaults when the radius has no facts", async () => {
  const context = {
    location: { village: "Test Village", district: "Test District", state: "Test State" },
    businessCategory: "dairy",
    radiusKm: 10,
    market: [], competitors: [], pricing: [], threats: [], distributionChannels: [],
  };
  const profile = { id: "profile-1", village_id: "village-1", skills: [], interests: [], goals: [] };
  const result = await generateFeasibilityReport(
    { userId: "user-1", businessCategory: "dairy" },
    {
      getOnboarding: async () => profile,
      getLocalMarketContext: async () => context,
      generateWithAi: async () => ({ reply: JSON.stringify({ summary: "No local evidence is available.", advice: ["Collect data", "Run a pilot", "Review results"] }), provider: "groq", model: "test", fallbackUsed: false }),
    },
  );

  assert.equal(result.report.competitorMapping.data.competitorCount, 0);
  assert.equal(result.report.marketReach.summary, "No local evidence is available.");
  assert.equal(result.report.productPricing.data.products.length, 0);
  assert.equal(result.report.marketReach.advice.length, 3);
});

test("report makes one focused AI request per section and isolates failures", async () => {
  const context = {
    location: { village: "Test Village", district: "Test District", state: "Test State" },
    businessCategory: "transport",
    radiusKm: 10,
    market: [], competitors: [], pricing: [], threats: [], distributionChannels: [],
  };
  const profile = { id: "profile-1", village_id: "village-1", skills: [], interests: [], goals: [] };
  const calls = [];

  const result = await generateFeasibilityReport(
    { userId: "user-1", businessCategory: "transport" },
    {
      getOnboarding: async () => profile,
      getLocalMarketContext: async () => context,
      generateWithAi: async ([message]) => {
        calls.push(message.parts[0].text);
        if (calls.length === 2) throw new Error("temporary failure");
        return { reply: JSON.stringify({ summary: `Summary ${calls.length}`, advice: ["One", "Two", "Three"] }), provider: "groq", model: "test", fallbackUsed: false };
      },
    },
  );

  assert.equal(calls.length, 6);
  assert.ok(calls.some((call) => call.includes("market reach")));
  assert.ok(calls.some((call) => call.includes("opportunity analysis")));
  assert.ok(calls.some((call) => call.includes("SWOT")));
  assert.ok(calls.some((call) => call.includes("competitor mapping")));
  assert.ok(calls.some((call) => call.includes("product pricing")));
  assert.ok(calls.some((call) => call.includes("threats")));
  assert.equal(result.report.marketReach.advice.length, 3);
  assert.equal(result.report.opportunityAnalysis.summary.startsWith("The available local"), true);
  assert.equal(result.fallbackUsed, true);
});

test("report service enforces the fixed 10 km radius", async () => {
  await assert.rejects(() => getLocalMarketContext("village-1", "dairy", 5), { message: "Feasibility reports use a fixed 10 km radius" });
});
