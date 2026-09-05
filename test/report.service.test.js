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
  const aiReply = JSON.stringify({
    marketReach: { summary: "Reach exists", consumerBase: "No population count" },
    opportunityAnalysis: { summary: "Potential exists", opportunities: ["Value-added dairy"], marketGaps: [] },
    swot: { strengths: ["Skills"], weaknesses: [], opportunities: [], threats: [] },
    threats: [{ risk: "fodder_shortage", mitigation: "Build local fodder supply" }],
    competitorMapping: { competitorCount: 999, competitionLevel: "high", summary: "One nearby competitor", competitors: [{ name: "Invented" }] },
    productPricing: { summary: "Use observed pricing", products: [{ price: 999 }] },
  });

  const report = buildStructuredReport(aiReply, localMarketContext);

  assert.equal(report.competitorMapping.competitorCount, 1);
  assert.deepEqual(report.competitorMapping.competitors, localMarketContext.competitors);
  assert.deepEqual(report.productPricing.products, localMarketContext.pricing);
  assert.deepEqual(report.marketReach.distributionChannels, localMarketContext.distributionChannels);
  assert.equal(report.threats[0].mitigation, "Build local fodder supply");
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
  const aiReply = JSON.stringify({
    marketReach: {}, opportunityAnalysis: {}, swot: {}, threats: [], competitorMapping: {}, productPricing: {},
  });

  const result = await generateFeasibilityReport(
    { userId: "user-1", businessCategory: "dairy" },
    {
      getOnboarding: async () => profile,
      getLocalMarketContext: async () => context,
      generateWithAi: async () => ({ reply: aiReply, provider: "groq", model: "test", fallbackUsed: false }),
    },
  );

  assert.equal(result.report.competitorMapping.competitorCount, 0);
  assert.equal(result.report.marketReach.summary, "Insufficient local market data for a detailed reach assessment.");
  assert.equal(result.report.productPricing.products.length, 0);
});

test("report service enforces the fixed 10 km radius", async () => {
  await assert.rejects(() => getLocalMarketContext("village-1", "dairy", 5), { message: "Feasibility reports use a fixed 10 km radius" });
});
