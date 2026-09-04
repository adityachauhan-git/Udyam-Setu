const tokenKey = "northstar_token";
const fundingForm = document.querySelector("#funding-form");
const fundingStatus = document.querySelector("#funding-status");
const fundingResults = document.querySelector("#funding-results");
const fundingSummary = document.querySelector("#funding-summary");
const repaymentSchedule = document.querySelector("#repayment-schedule");
const scheduleCount = document.querySelector("#schedule-count");

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Something went wrong");
  return payload;
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value) || 0);
}

function renderFundingResult(data) {
  fundingResults.classList.remove("is-hidden");
  if (!data.eligible) {
    fundingSummary.innerHTML = "<div class=\"funding-empty\"><h2>We could not find a matching scheme</h2><p>Your project cost is above the supported scheme range. Try a lower margin capital or speak with a funding advisor.</p></div>";
    repaymentSchedule.innerHTML = "";
    scheduleCount.textContent = "";
    return;
  }
  const cards = [["Eligible scheme", data.scheme.name], ["Project cost", formatCurrency(data.projectCost)], ["Available loan", formatCurrency(data.loanAmount)], ["Quarterly installment", formatCurrency(data.quarterlyInstallment)]];
  fundingSummary.innerHTML = cards.map(([label, value], index) => `<article class="funding-stat ${index === 2 ? "funding-stat-accent" : ""}"><span>${label}</span><strong>${value}</strong></article>`).join("");
  repaymentSchedule.innerHTML = data.repaymentSchedule.map((entry) => `<tr><td>Q${entry.quarterNumber}</td><td><span class="schedule-status ${entry.status === "Moratorium" ? "is-moratorium" : ""}">${entry.status}</span></td><td>${formatCurrency(entry.installmentAmount)}</td><td>${formatCurrency(entry.remainingLoanBalance)}</td></tr>`).join("");
  scheduleCount.textContent = `${data.tenureYears} years · ${data.moratoriumMonths} month moratorium`;
}

fundingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const marginCapital = Number(new FormData(fundingForm).get("marginCapital"));
  if (!Number.isFinite(marginCapital) || marginCapital <= 0) { fundingStatus.textContent = "Enter a margin capital amount greater than zero."; fundingStatus.dataset.kind = "error"; return; }
  fundingStatus.textContent = "Checking your eligibility…";
  fundingStatus.dataset.kind = "";
  try {
    const result = await request("/api/schemes/eligibility", { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` }, body: JSON.stringify({ marginCapital }) });
    renderFundingResult(result.data);
    fundingStatus.textContent = result.data.eligible ? "Your repayment plan is ready." : "No eligible scheme was found.";
    fundingStatus.dataset.kind = result.data.eligible ? "success" : "error";
  } catch (error) { fundingStatus.textContent = error.message; fundingStatus.dataset.kind = "error"; }
});

document.querySelector("#logout-button").addEventListener("click", () => { localStorage.removeItem(tokenKey); window.location.href = "/"; });
document.querySelectorAll(".sidebar-toggle, .floating-sidebar-toggle").forEach((button) => button.addEventListener("click", () => document.body.classList.toggle("sidebar-collapsed")));
