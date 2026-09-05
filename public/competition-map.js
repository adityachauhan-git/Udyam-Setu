const tokenKey = "northstar_token";
const mapForm = document.querySelector("#competition-map-form");
const mapStatus = document.querySelector("#competition-map-status");
const mapCount = document.querySelector("#competition-map-count");
const mapLocation = document.querySelector("#competition-map-location");
let competitionMap;
let competitionMapLayers;
let mapRequestNumber = 0;

async function request(path, options = {}) {
  const response = await fetch(path, { ...options, headers: { "Content-Type": "application/json", ...(options.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || payload.error || "Something went wrong");
  return payload;
}

function element(tag, text) {
  const item = document.createElement(tag);
  if (text != null) item.textContent = String(text);
  return item;
}

function formatLabel(value = "") {
  return String(value).replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function createPopup(title, type, distance) {
  const popup = document.createElement("div");
  popup.appendChild(element("strong", title));
  popup.appendChild(element("div", formatLabel(type)));
  popup.appendChild(element("div", `Distance: ${Number(distance).toFixed(2)} km`));
  return popup;
}

function renderMap(data) {
  const village = data.village;
  const center = [Number(village.latitude), Number(village.longitude)];
  if (!competitionMap) {
    competitionMap = L.map("competition-map").setView(center, 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(competitionMap);
    competitionMapLayers = L.layerGroup().addTo(competitionMap);
  }

  competitionMap.setView(center, 11);
  competitionMapLayers.clearLayers();
  L.circle(center, { color: "#d97706", fillColor: "#fbbf24", fillOpacity: 0.08, radius: 10000, weight: 2 }).addTo(competitionMapLayers);
  L.circleMarker(center, { color: "#102a43", fillColor: "#d7f26c", fillOpacity: 1, radius: 9, weight: 3 })
    .bindPopup(createPopup(village.name, "Your village", 0))
    .addTo(competitionMapLayers);

  data.businesses.forEach((business) => {
    L.marker([Number(business.latitude), Number(business.longitude)])
      .bindPopup(createPopup(business.name, business.business_type, business.distance_km))
      .addTo(competitionMapLayers);
  });

  mapCount.textContent = `${data.businesses.length} businesses · 10 km radius`;
  mapLocation.textContent = `${village.name}, ${village.district}`;
  mapStatus.textContent = `${data.businesses.length} nearby businesses found.`;
  mapStatus.dataset.kind = "success";
  competitionMap.invalidateSize();
}

async function loadMap(businessCategory = "") {
  const requestNumber = ++mapRequestNumber;
  const query = businessCategory ? `?businessCategory=${encodeURIComponent(businessCategory)}` : "";
  mapStatus.textContent = "Loading nearby businesses.";
  mapStatus.dataset.kind = "";
  try {
    const result = await request(`/api/locations/competition-map${query}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` },
    });
    if (requestNumber !== mapRequestNumber) return;
    renderMap(result.data);
  } catch (error) {
    if (requestNumber !== mapRequestNumber) return;
    mapStatus.textContent = error.message;
    mapStatus.dataset.kind = "error";
  }
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
    loadMap();
  } catch {
    document.querySelector("#profile-summary").textContent = "Complete onboarding to view the competition map.";
  }
}

mapForm.addEventListener("submit", (event) => {
  event.preventDefault();
  loadMap(new FormData(mapForm).get("businessCategory")?.trim() || "");
});

document.querySelector("#logout-button").addEventListener("click", () => { localStorage.removeItem(tokenKey); window.location.href = "/"; });
document.querySelectorAll(".sidebar-toggle, .floating-sidebar-toggle").forEach((button) => button.addEventListener("click", () => document.body.classList.toggle("sidebar-collapsed")));

loadProfile();
