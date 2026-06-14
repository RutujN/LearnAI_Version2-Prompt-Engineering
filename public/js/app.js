// public/js/app.js — Application entry point
// Wires chat.js and ui.js together (no circular imports).

import { MODES }         from "./modes.js";
import * as UI           from "./ui.js";
import * as Chat         from "./chat.js";

// ── Cross-inject so each module can call the other ──
Chat.setChatUI({
  updateModeUI:       UI.updateModeUI,
  renderHistory:      UI.renderHistory,
  showWelcome:        UI.showWelcome,
  removeWelcome:      UI.removeWelcome,
  appendMessageBlock: UI.appendMessageBlock,
  appendAIRow:        UI.appendAIRow,
  appendErrorRow:     UI.appendErrorRow,
  addLoadingBlock:    UI.addLoadingBlock,
  removeLoadingBlock: UI.removeLoadingBlock,
});

UI.setUIChatCallbacks({
  quickStart:  Chat.quickStart,
  loadConv:    Chat.loadConv,
  deleteConv:  Chat.deleteConv,
  getState: () => ({
    conversations: Chat.conversations,
    activeConvId:  Chat.activeConvId,
  }),
});

// ── Build mode list ────────────────────────
function buildModeList() {
  const list = document.getElementById("modeList");
  Object.entries(MODES).forEach(([key, m], i) => {
    const btn = document.createElement("button");
    btn.className    = "mode-item" + (i === 0 ? " active" : "");
    btn.dataset.mode = key;
    btn.innerHTML    = `
      <div class="mode-dot"></div>
      <div class="mode-icon">${m.icon}</div>
      <span>${m.label}</span>`;
    btn.addEventListener("click", () => Chat.selectMode(btn));
    list.appendChild(btn);
  });
}

// ── Sidebar toggles ────────────────────────
function toggleLeft() {
  const sidebar = document.getElementById("leftSidebar");
  const rail    = document.getElementById("leftRail");
  sidebar.classList.add("collapsed");
  rail.classList.add("visible");
}

function expandLeft() {
  const sidebar = document.getElementById("leftSidebar");
  const rail    = document.getElementById("leftRail");
  sidebar.classList.remove("collapsed");
  rail.classList.remove("visible");
}

function toggleRight() {
  document.getElementById("rightPanel").classList.toggle("collapsed");
}

// ── Prompt viewer ───────────────────────────
function togglePromptView() {
  document.getElementById("promptToggle").classList.toggle("open");
  document.getElementById("promptView").classList.toggle("open");
}

// ── Temperature slider ─────────────────────
const TEMP_HINTS = [
  { max: 0.2, text: "Very precise — focused and repeatable answers." },
  { max: 0.5, text: "Precise — mostly consistent, slight variation." },
  { max: 0.8, text: "Balanced — consistent but with some variation." },
  { max: 1.0, text: "Creative — more varied and exploratory answers." },
];

function tempHintFor(value) {
  return TEMP_HINTS.find(h => value <= h.max)?.text || TEMP_HINTS[TEMP_HINTS.length - 1].text;
}

function bindTemperature() {
  const slider = document.getElementById("tempSlider");
  const val    = document.getElementById("tempVal");
  const hint   = document.getElementById("tempHint");

  slider.addEventListener("input", () => {
    const t = parseFloat(slider.value);
    val.textContent  = t.toFixed(1);
    hint.textContent = tempHintFor(t);
    Chat.setTemperature(t);
  });
}

// ── Copy last response ─────────────────────
function copyLast() {
  const all = document.querySelectorAll(".msg-ai-content");
  if (!all.length) return;
  navigator.clipboard.writeText(all[all.length - 1].innerText).then(() => {
    const btn  = document.getElementById("copyLastBtn");
    const orig = btn.innerHTML;
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
    setTimeout(() => (btn.innerHTML = orig), 1800);
  });
}

// ── Event listeners ────────────────────────
function bindEvents() {
  document.getElementById("toggleLeftBtn").addEventListener("click",  toggleLeft);
  document.getElementById("expandLeftBtn").addEventListener("click",  expandLeft);
  document.getElementById("toggleRightBtn").addEventListener("click", toggleRight);
  document.getElementById("newChatBtn").addEventListener("click",     Chat.newChat);
  document.getElementById("sendBtn").addEventListener("click",        Chat.sendMessage);
  document.getElementById("copyLastBtn").addEventListener("click",    copyLast);
  document.getElementById("exportBtn").addEventListener("click",      Chat.exportChat);
  document.getElementById("modePill").addEventListener("click",       Chat.cycleModes);
  document.getElementById("promptToggle").addEventListener("click",   togglePromptView);

  const input = document.getElementById("userInput");
  input.addEventListener("keydown", Chat.handleKey);
  input.addEventListener("input",   () => Chat.handleInput(input));

  bindTemperature();
}

// ── Init ───────────────────────────────────
function init() {
  buildModeList();
  bindEvents();
  UI.updateModeUI(Chat.currentMode);
  Chat.updateStats();
  Chat.loadConversations();
  UI.showWelcome();
}

document.addEventListener("DOMContentLoaded", init);
