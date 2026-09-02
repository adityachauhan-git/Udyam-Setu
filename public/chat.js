const tokenKey = "northstar_token";
const chatSuggestions = document.querySelector("#chat-suggestions-select");
const chatMessages = document.querySelector("#chat-messages");
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatStatus = document.querySelector("#chat-status");
const userName = document.querySelector("#user-name");
const userAvatar = document.querySelector("#user-avatar");
const profileSummary = document.querySelector("#profile-summary");
const logoutButton = document.querySelector("#logout-button");
const newChatButton = document.querySelector("#new-chat");
const sidebarToggles = document.querySelectorAll(".sidebar-toggle, .floating-sidebar-toggle");
let chatHistory = [];

async function request(path, requestOptions = {}) {
  const response = await fetch(path, { ...requestOptions, headers: { "Content-Type": "application/json", ...(requestOptions.headers || {}) } });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.message || "Something went wrong");
  return payload;
}

function setChatStatus(message = "", kind = "") {
  if (!chatStatus) return;
  chatStatus.textContent = message;
  chatStatus.dataset.kind = kind;
}

function escapeHtml(value = "") {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatMessageContent(text = "") {
  if (!text) return "";

  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  const htmlChunks = [];
  let paragraphLines = [];
  let listItems = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    const paragraph = paragraphLines.join("<br>");
    htmlChunks.push(`<p>${paragraph}</p>`);
    paragraphLines = [];
  };

  const flushList = () => {
    if (listItems.length === 0) return;
    htmlChunks.push(`<ul>${listItems.map((item) => `<li>${item}</li>`).join("")}</ul>`);
    listItems = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    if (/^---+$/.test(line)) {
      flushParagraph();
      flushList();
      htmlChunks.push("<hr>");
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      flushParagraph();
      flushList();
      const level = Math.min(line.match(/^#+/)[0].length, 3);
      const content = escapeHtml(line.replace(/^#+\s*/, ""));
      htmlChunks.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      flushParagraph();
      listItems.push(escapeHtml(line.replace(/^[-*]\s*/, "")));
      continue;
    }

    paragraphLines.push(escapeHtml(line));
  }

  flushParagraph();
  flushList();

  return htmlChunks
    .join("")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>");
}

function renderThinkingIndicator() {
  if (!chatMessages) return;

  const thinking = document.querySelector(".chat-thinking-indicator");
  if (thinking) return;

  const item = document.createElement("div");
  item.className = "chat-message assistant chat-thinking-indicator";
  item.innerHTML = `
    <div class="thinking-dots" aria-label="Thinking">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  chatMessages.appendChild(item);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeThinkingIndicator() {
  const indicator = document.querySelector(".chat-thinking-indicator");
  if (indicator) indicator.remove();
}

function renderChatMessages() {
  if (!chatMessages) return;
  chatMessages.innerHTML = "";

  if (chatHistory.length === 0) {
    chatMessages.innerHTML = '<div class="chat-empty">Ask UdyamSetyu for business ideas, strategy, or next steps.</div>';
    return;
  }

  chatHistory.forEach((message) => {
    const item = document.createElement("div");
    item.className = `chat-message ${message.role}`;
    item.innerHTML = formatMessageContent(message.text);
    chatMessages.appendChild(item);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getSuggestionLabel(question = "") {
  const text = String(question || "").trim();
  if (!text) return "Suggested prompt";

  if (/skills/i.test(text)) return "My best business fit";
  if (/interested in|opportunity should I explore/i.test(text)) return "My best opportunity";
  if (/start a business|low-cost|scalable/i.test(text)) return "My startup path";
  if (/land|agri|farm/i.test(text)) return "Land-based idea";
  if (/capital range|budget/i.test(text)) return "Budget fit";
  if (/income|reach around|income goal/i.test(text)) return "Income goal";
  if (/challenge/i.test(text)) return "My biggest challenge";
  if (/generate income fastest|fastest/i.test(text)) return "Fastest income path";

  return text.length > 52 ? `${text.slice(0, 49).trim()}…` : text;
}

function normalizeSuggestionOption(question) {
  if (typeof question === "string") {
    const value = question.trim();
    return value ? { value, text: getSuggestionLabel(value) } : null;
  }

  if (question && typeof question === "object") {
    const value = String(question.value ?? question.question ?? question.text ?? question.prompt ?? "").trim();
    const text = question.label ?? question.question ?? question.text ?? question.prompt ?? value;

    if (!value) return null;
    return { value, text: getSuggestionLabel(text) };
  }

  return null;
}

function renderChatSuggestions(questions = []) {
  if (!chatSuggestions) return;

  const options = [
    { value: "", text: "Suggested prompts" },
    ...((Array.isArray(questions) ? questions : []).map(normalizeSuggestionOption).filter(Boolean))
  ];

  chatSuggestions.innerHTML = "";
  options.forEach((option) => {
    const item = document.createElement("option");
    item.value = option.value;
    item.textContent = option.text;
    chatSuggestions.appendChild(item);
  });
}

async function loadChatRecommendations() {
  const token = localStorage.getItem(tokenKey);
  if (!token || !chatSuggestions) return;

  try {
    const result = await request("/api/chat/recommendations", { headers: { Authorization: `Bearer ${token}` } });
    renderChatSuggestions(result?.data?.questions || []);
  } catch (error) {
    renderChatSuggestions([]);
    setChatStatus(error.message, "error");
  }
}

async function submitChatMessage(rawMessage) {
  const message = rawMessage.trim();
  if (!message) return;

  setChatStatus("Thinking...", "");
  chatHistory.push({ role: "user", text: message });
  renderChatMessages();
  renderThinkingIndicator();
  chatInput.value = "";

  try {
    const token = localStorage.getItem(tokenKey);
    const result = await request("/api/chat/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ message }),
    });

    removeThinkingIndicator();
    chatHistory.push({ role: "assistant", text: result?.data?.reply || "I’m not sure yet." });
    renderChatMessages();
    setChatStatus("Ready for the next question.", "success");
  } catch (error) {
    removeThinkingIndicator();
    chatHistory.push({ role: "assistant", text: `I hit an issue: ${error.message}` });
    renderChatMessages();
    setChatStatus(error.message, "error");
  }
}

async function loadProfileSummary() {
  const token = localStorage.getItem(tokenKey);
  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    const me = await request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } });
    const profile = await request("/api/onboarding/me", { headers: { Authorization: `Bearer ${token}` } });
    const user = me.data.user;
    const onboarding = profile.data.profile || {};

    if (userName) userName.textContent = user.name;
    if (userAvatar) userAvatar.textContent = user.name?.charAt(0)?.toUpperCase() || "N";

    const profileParts = [user.village, user.district, user.state].filter(Boolean);
    const summaryText = profileParts.length ? profileParts.join(" · ") : "Location not set yet";
    if (profileSummary) profileSummary.textContent = `${summaryText} • ${onboarding.skills?.length || 0} skills • ${onboarding.goals?.length || 0} goals`;
  } catch (error) {
    console.error(error);
    if (profileSummary) profileSummary.textContent = "Your profile is being loaded.";
  }
}

chatSuggestions?.addEventListener("change", (event) => {
  const selected = event.target.value;
  if (!selected) return;
  chatInput.value = selected;
  chatInput.focus();
  chatSuggestions.value = "";
});

chatForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await submitChatMessage(chatInput.value);
});

logoutButton?.addEventListener("click", () => {
  localStorage.removeItem(tokenKey);
  window.location.href = "/";
});

newChatButton?.addEventListener("click", () => {
  chatHistory = [];
  renderChatMessages();
  setChatStatus("", "");
  renderChatSuggestions([]);
  loadChatRecommendations().catch(() => {});
});

document.querySelectorAll(".nav-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".nav-toggle").forEach((item) => item.classList.toggle("active", item === button));
  });
});

sidebarToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    document.body.classList.toggle("sidebar-collapsed");
    const collapsed = document.body.classList.contains("sidebar-collapsed");
    sidebarToggles.forEach((button) => {
      button.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
      button.textContent = "☰";
    });
  });
});

renderChatMessages();
loadProfileSummary().catch(() => {});
loadChatRecommendations().catch(() => {});
