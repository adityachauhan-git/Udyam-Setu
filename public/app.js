const tokenKey = "northstar_token";
const authForm = document.querySelector("#auth-form");
const authView = document.querySelector("#auth-view");
const onboardingView = document.querySelector("#onboarding-view");
const userView = document.querySelector("#user-view");
const formMessage = document.querySelector("#form-message");
const onboardingMessage = document.querySelector("#onboarding-message");
let mode = "login";
let onboardingStep = 0;
let onboardingData = { skills: [], interests: [], goals: [] };

const options = {
  skills: ["Farming", "Animal husbandry", "Cooking", "Tailoring", "Carpentry", "Repair work", "Driving", "Computers", "Teaching", "Handicrafts", "Trading/selling", "Other"],
  interests: ["Agriculture", "Dairy", "Food", "Retail", "Manufacturing", "Services", "Technology", "Transportation", "Handicrafts", "Livestock", "Other"],
  goals: ["Start a new business", "Expand my existing business", "Find a job", "Get a government loan", "Find a government scheme", "Increase farm income", "Learn a skill"],
};

async function request(path, requestOptions = {}) {
  const response = await fetch(path, { ...requestOptions, headers: { "Content-Type": "application/json", ...(requestOptions.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Something went wrong");
  return payload;
}

function setOptions(select, placeholder, items) {
  select.replaceChildren(new Option(placeholder, ""));
  items.forEach((item) => select.add(new Option(item.name, item.id)));
  select.disabled = items.length === 0;
}

async function loadStates() {
  const result = await request("/api/locations/states");
  setOptions(document.querySelector("#onboarding-state"), "Choose a state", result.data.states);
}

async function loadDistricts(stateId) {
  const district = document.querySelector("#onboarding-district");
  const village = document.querySelector("#onboarding-village");
  setOptions(district, "Choose a district", []);
  setOptions(village, "Choose a village", []);
  if (!stateId) return;
  setOptions(district, "Loading districts...", []);
  const result = await request(`/api/locations/districts?stateId=${encodeURIComponent(stateId)}`);
  setOptions(district, "Choose a district", result.data.districts);
}

async function loadVillages(districtId) {
  const village = document.querySelector("#onboarding-village");
  setOptions(village, "Choose a village", []);
  if (!districtId) return;
  setOptions(village, "Loading villages...", []);
  const result = await request(`/api/locations/villages?districtId=${encodeURIComponent(districtId)}`);
  setOptions(village, "Choose a village", result.data.villages);
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === "register";
  document.querySelector("#form-eyebrow").textContent = registering ? "Start with clarity" : "Welcome back";
  document.querySelector("#form-title").textContent = registering ? "Create your workspace" : "Sign in to UdyamSetyu";
  document.querySelector("#form-subtitle").textContent = registering ? "Bring your next important decision into focus." : "Your strategy workspace is ready when you are.";
  document.querySelector(".name-field").classList.toggle("is-hidden", !registering);
  document.querySelector("#name").required = registering;
  document.querySelector("#password").autocomplete = registering ? "new-password" : "current-password";
  document.querySelector("#submit-label").textContent = registering ? "Create workspace" : "Continue to workspace";
  document.querySelectorAll(".tab").forEach((tab) => { const active = tab.dataset.mode === mode; tab.classList.toggle("is-active", active); tab.setAttribute("aria-selected", String(active)); });
  formMessage.textContent = "";
}

function showUser(user) {
  window.location.href = "/chat";
}

function showError(message) { formMessage.textContent = message; }
function showOnboardingMessage(message) { onboardingMessage.textContent = message; }

function renderChoices() {
  Object.entries(options).forEach(([key, values]) => {
    const container = document.querySelector(`#${key}-options`);
    container.replaceChildren(...values.map((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice";
      button.textContent = value;
      button.dataset.list = key;
      button.dataset.value = value;
      button.classList.toggle("is-selected", onboardingData[key].includes(value));
      return button;
    }));
  });

  document.querySelectorAll(".choice-row .choice").forEach((button) => {
    const expected = button.dataset.value === "true";
    button.classList.toggle("is-selected", onboardingData[button.dataset.field] === expected);
  });

  document.querySelectorAll(".choice-grid .toggle").forEach((button) => {
    button.classList.toggle("is-selected", onboardingData[button.dataset.field] === true);
  });
}

function renderOnboarding() {
  document.querySelectorAll(".onboarding-step").forEach((step) => step.classList.toggle("is-hidden", Number(step.dataset.step) !== onboardingStep));
  document.querySelector("#progress-label").textContent = `Step ${onboardingStep + 1} of 4`;
  document.querySelector("#progress-bar").style.width = `${((onboardingStep + 1) / 4) * 100}%`;
  document.querySelector("#back-button").classList.toggle("is-hidden", onboardingStep === 0);
  document.querySelector("#next-label").textContent = onboardingStep === 3 ? "Finish onboarding" : "Next";
}

function readForm() {
  onboardingData.ageGroup = document.querySelector("#age-group").value || null;
  onboardingData.villageId = document.querySelector("#onboarding-village").value || null;
  onboardingData.preferredLanguage = document.querySelector("#preferred-language").value || null;
  onboardingData.landArea = document.querySelector("#land-area").value || null;
  onboardingData.landUnit = document.querySelector("#land-unit").value || null;
  onboardingData.landType = document.querySelector("#land-type").value || null;
  onboardingData.capitalRange = document.querySelector("#capital-range").value || null;
  onboardingData.desiredMonthlyIncomeRange = document.querySelector("#income-range").value || null;
}

async function fillForm(profile = {}) {
  onboardingData = {
    ageGroup: profile.ageGroup ?? profile.age_group ?? null,
    villageId: profile.villageId ?? profile.village_id ?? null,
    preferredLanguage: profile.preferredLanguage ?? profile.preferred_language ?? null,
    landAccess: profile.landAccess ?? profile.land_access ?? null,
    landArea: profile.landArea ?? profile.land_area ?? null,
    landUnit: profile.landUnit ?? profile.land_unit ?? null,
    landIrrigated: profile.landIrrigated ?? profile.land_irrigated ?? null,
    landType: profile.landType ?? profile.land_type ?? null,
    capitalRange: profile.capitalRange ?? profile.capital_range ?? null,
    electricityAvailable: profile.electricityAvailable ?? profile.electricity_available ?? null,
    internetAvailable: profile.internetAvailable ?? profile.internet_available ?? null,
    waterAvailable: profile.waterAvailable ?? profile.water_available ?? null,
    storageAvailable: profile.storageAvailable ?? profile.storage_available ?? null,
    transportAvailable: profile.transportAvailable ?? profile.transport_available ?? null,
    equipmentAvailable: profile.equipmentAvailable ?? profile.equipment_available ?? null,
    desiredMonthlyIncomeRange: profile.desiredMonthlyIncomeRange ?? profile.desired_monthly_income_range ?? null,
    skills: profile.skills || [],
    interests: profile.interests || [],
    goals: profile.goals || [],
  };

  const fields = {
    "#age-group": onboardingData.ageGroup,
    "#preferred-language": onboardingData.preferredLanguage,
    "#land-area": onboardingData.landArea,
    "#land-unit": onboardingData.landUnit,
    "#land-type": onboardingData.landType,
    "#capital-range": onboardingData.capitalRange,
    "#income-range": onboardingData.desiredMonthlyIncomeRange,
  };
  Object.entries(fields).forEach(([selector, value]) => { document.querySelector(selector).value = value || ""; });

  const state = document.querySelector("#onboarding-state");
  const district = document.querySelector("#onboarding-district");
  const village = document.querySelector("#onboarding-village");
  if (profile.state_id && state.options.length > 1) {
    state.value = profile.state_id;
    await loadDistricts(profile.state_id);
  }
  if (profile.district_id && district.options.length > 1) {
    district.value = profile.district_id;
    await loadVillages(profile.district_id);
  }
  if (onboardingData.villageId) village.value = onboardingData.villageId;
  renderChoices();
  renderOnboarding();
}

async function openOnboarding(profile) {
  userView.classList.add("is-hidden");
  authView.classList.add("is-hidden");
  onboardingView.classList.remove("is-hidden");
  await loadStates();
  await fillForm(profile);
}

async function loadOnboarding() {
  const result = await request("/api/onboarding/me", { headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` } });
  return result.data.profile;
}

async function saveOnboarding(complete = false) {
  readForm();
  const result = await request("/api/onboarding/me", { method: "PUT", headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` }, body: JSON.stringify({ ...onboardingData, isComplete: complete }) });
  onboardingData = result.data.profile;
  return result.data.profile;
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  formMessage.textContent = "";
  try {
    const result = await request(`/api/auth/${mode === "register" ? "register" : "login"}`, { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(authForm).entries())) });
    localStorage.setItem(tokenKey, result.data.token);
    const profile = await loadOnboarding();
    if (profile.is_complete) {
      window.location.href = "/chat";
      return;
    }
    await openOnboarding(profile);
  } catch (error) { showError(error.message); }
});

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setMode(tab.dataset.mode)));
document.querySelector("#onboarding-state").addEventListener("change", (event) => loadDistricts(event.target.value).catch((error) => showOnboardingMessage(error.message)));
document.querySelector("#onboarding-district").addEventListener("change", (event) => loadVillages(event.target.value).catch((error) => showOnboardingMessage(error.message)));
document.querySelectorAll(".choice-row, .choice-grid").forEach((grid) => grid.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.list) {
    const list = onboardingData[button.dataset.list];
    onboardingData[button.dataset.list] = list.includes(button.dataset.value) ? list.filter((value) => value !== button.dataset.value) : [...list, button.dataset.value];
    button.classList.toggle("is-selected");
    return;
  }

  if (button.dataset.value === "true" || button.dataset.value === "false") {
    const fieldName = button.dataset.field;
    const nextValue = button.dataset.value === "true";
    onboardingData[fieldName] = nextValue;

    document.querySelectorAll(`button[data-field="${fieldName}"][data-value]`).forEach((option) => {
      option.classList.toggle("is-selected", option === button);
    });
    return;
  }

  onboardingData[button.dataset.field] = button.classList.toggle("is-selected");
}));
document.querySelector("#onboarding-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (onboardingStep < 3) { onboardingStep += 1; renderOnboarding(); return; }
  try {
    await saveOnboarding(true);
    const me = await request("/api/auth/me", { headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` } });
    showOnboardingMessage("");
    showUser(me.data.user);
  } catch (error) { showOnboardingMessage(error.message); }
});
document.querySelector("#back-button").addEventListener("click", () => { onboardingStep -= 1; renderOnboarding(); });
document.querySelector("#save-button").addEventListener("click", async () => { try { await saveOnboarding(false); showOnboardingMessage("Progress saved"); } catch (error) { showOnboardingMessage(error.message); } });
document.querySelector("#edit-onboarding").addEventListener("click", async () => { try { onboardingStep = 0; await openOnboarding(await loadOnboarding()); } catch (error) { showError(error.message); } });
document.querySelector("#logout-button").addEventListener("click", () => { localStorage.removeItem(tokenKey); userView.classList.add("is-hidden"); onboardingView.classList.add("is-hidden"); authView.classList.remove("is-hidden"); authForm.reset(); setMode("login"); });

renderChoices();
loadStates().catch(() => {});
const token = localStorage.getItem(tokenKey);
if (token) loadOnboarding().then(async (profile) => { const me = await request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }); if (profile.is_complete) { window.location.href = "/chat"; } else { openOnboarding(profile); } }).catch(() => localStorage.removeItem(tokenKey));
