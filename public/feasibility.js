const tokenKey = "northstar_token";
const reportForm = document.querySelector("#report-form");
const reportStatus = document.querySelector("#report-status");
const reportResults = document.querySelector("#report-results");
const reportMeta = document.querySelector("#report-meta");
const reportContent = document.querySelector("#report-content");

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || payload.error || "Something went wrong");
  return payload;
}

function element(tag, text, className = "") {
  const item = document.createElement(tag);
  if (className) item.className = className;
  if (text != null) item.textContent = String(text);
  return item;
}

function formatLabel(value = "") {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function appendList(parent, items, emptyMessage = "Insufficient local data.") {
  if (!Array.isArray(items) || items.length === 0) {
    parent.appendChild(element("p", emptyMessage, "report-empty-text"));
    return;
  }
  const list = element("ul", null, "report-list");
  items.forEach((item) => list.appendChild(element("li", typeof item === "string" ? item : JSON.stringify(item))));
  parent.appendChild(list);
}

function createCard(title, content) {
  const card = element("article", null, "report-card");
  card.appendChild(element("h2", title));
  if (typeof content === "string") card.appendChild(element("p", content));
  return card;
}

function renderMarketReach(report) {
  const card = createCard("Market Reach", report.marketReach.summary);
  card.appendChild(element("p", `Consumer base: ${report.marketReach.consumerBase}`, "report-detail"));
  card.appendChild(element("h3", "Distribution channels"));
  appendList(card, report.marketReach.distributionChannels.map((channel) => `${channel.name} · ${formatLabel(channel.channel_type)} · ${channel.distance_km} km`));
  card.appendChild(element("h3", "Market evidence"));
  appendList(card, report.marketReach.evidence.map((item) => `${formatLabel(item.observation_type)}: ${item.value} ${item.unit} · ${item.distance_km} km`));
  return card;
}

function renderSwot(report) {
  const card = createCard("SWOT", "");
  const grid = element("div", null, "swot-grid");
  [["Strengths", report.swot.strengths], ["Weaknesses", report.swot.weaknesses], ["Opportunities", report.swot.opportunities], ["Threats", report.swot.threats]].forEach(([title, items]) => {
    const group = element("div", null, "swot-group");
    group.appendChild(element("h3", title));
    appendList(group, items);
    grid.appendChild(group);
  });
  card.appendChild(grid);
  return card;
}

function renderReport(report) {
  reportContent.replaceChildren();
  reportContent.appendChild(renderMarketReach(report));

  const opportunity = createCard("Opportunity Analysis", report.opportunityAnalysis.summary);
  opportunity.appendChild(element("h3", "Opportunities"));
  appendList(opportunity, report.opportunityAnalysis.opportunities);
  opportunity.appendChild(element("h3", "Market gaps"));
  appendList(opportunity, report.opportunityAnalysis.marketGaps);
  reportContent.appendChild(opportunity);
  reportContent.appendChild(renderSwot(report));

  const competitors = createCard("Competitor Mapping", report.competitorMapping.summary);
  competitors.appendChild(element("p", `${report.competitorMapping.competitorCount} nearby competitors · ${report.competitorMapping.competitionLevel}`, "report-detail"));
  appendList(competitors, report.competitorMapping.competitors.map((item) => `${item.name} · ${formatLabel(item.business_type)} · ${item.distance_km} km`), "No matching competitors were found within 10 km.");
  reportContent.appendChild(competitors);

  const pricing = createCard("Product Pricing Suggestions", report.productPricing.summary);
  appendList(pricing, report.productPricing.products.map((item) => `${item.product_name}: ${item.price} per ${item.unit} · ${item.business_name} · ${item.distance_km} km`), "No matching local pricing data was found within 10 km.");
  reportContent.appendChild(pricing);

  const threats = createCard("Threats", "");
  if (report.threats.length === 0) {
    threats.appendChild(element("p", "No nearby risks were found within 10 km.", "report-empty-text"));
  } else {
    report.threats.forEach((item) => {
      const threat = element("div", null, "threat-item");
      threat.appendChild(element("strong", `${formatLabel(item.risk)} · ${formatLabel(item.severity)}`));
      threat.appendChild(element("p", item.reason));
      threat.appendChild(element("p", `Mitigation: ${item.mitigation}`, "report-detail"));
      threats.appendChild(threat);
    });
  }
  reportContent.appendChild(threats);
}

async function loadProfile() {
  const token = localStorage.getItem(tokenKey);
  if (!token) { window.location.href = "/"; return; }
  try {
    const [me, onboarding] = await Promise.all([
      request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }),
      request("/api/onboarding/me", { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    const user = me.data.user;
    const profile = onboarding.data.profile || {};
    document.querySelector("#user-name").textContent = user.name;
    document.querySelector("#user-avatar").textContent = user.name?.charAt(0)?.toUpperCase() || "U";
    const location = [profile.village_name, profile.district_name, profile.state_name].filter(Boolean).join(" · ") || "Location not set yet";
    document.querySelector("#profile-summary").textContent = `${location} · ${profile.skills?.length || 0} skills · ${profile.goals?.length || 0} goals`;
  } catch {
    document.querySelector("#profile-summary").textContent = "Complete onboarding to generate a local report.";
  }
}

reportForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const businessCategory = new FormData(reportForm).get("businessCategory")?.trim();
  if (!businessCategory) { reportStatus.textContent = "Enter a business category."; reportStatus.dataset.kind = "error"; return; }

  reportStatus.textContent = "Analysing nearby market signals…";
  reportStatus.dataset.kind = "";
  try {
    const result = await request("/api/reports/feasibility", {
      method: "POST",
      headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` },
      body: JSON.stringify({ businessCategory }),
    });
    const data = result.data;
    reportMeta.replaceChildren(element("span", `10 km local analysis · ${formatLabel(data.provider)} · ${data.model}`));
    renderReport(data.report);
    reportResults.classList.remove("is-hidden");
    reportStatus.textContent = "Your feasibility report is ready.";
    reportStatus.dataset.kind = "success";
  } catch (error) {
    reportStatus.textContent = error.message;
    reportStatus.dataset.kind = "error";
  }
});

document.querySelector("#logout-button").addEventListener("click", () => { localStorage.removeItem(tokenKey); window.location.href = "/"; });
document.querySelectorAll(".sidebar-toggle, .floating-sidebar-toggle").forEach((button) => button.addEventListener("click", () => document.body.classList.toggle("sidebar-collapsed")));

loadProfile();
