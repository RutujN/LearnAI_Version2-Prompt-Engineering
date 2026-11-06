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

// ── Device & Drawer Helpers ────────────────
const isMobile = () => window.innerWidth <= 768;

function openLeft() {
  const sidebar  = document.getElementById("leftSidebar");
  const backdrop = document.getElementById("backdrop");
  if (isMobile()) {
    closeRight();
    sidebar.classList.add("mobile-open");
    backdrop.classList.add("visible");
    document.body.classList.add("drawer-open");
  } else {
    const rail = document.getElementById("leftRail");
    sidebar.classList.remove("collapsed");
    rail.classList.remove("visible");
  }
}

function closeLeft() {
  const sidebar  = document.getElementById("leftSidebar");
  const backdrop = document.getElementById("backdrop");
  if (isMobile()) {
    sidebar.classList.remove("mobile-open");
    if (!document.getElementById("rightPanel")?.classList.contains("mobile-open")) {
      backdrop.classList.remove("visible");
      document.body.classList.remove("drawer-open");
    }
  } else {
    const rail = document.getElementById("leftRail");
    sidebar.classList.add("collapsed");
    rail.classList.add("visible");
  }
}

function toggleLeft() {
  const sidebar = document.getElementById("leftSidebar");
  if (isMobile()) {
    if (sidebar.classList.contains("mobile-open")) {
      closeLeft();
    } else {
      openLeft();
    }
  } else {
    closeLeft();
  }
}

function openRight() {
  const panel    = document.getElementById("rightPanel");
  const backdrop = document.getElementById("backdrop");
  if (isMobile()) {
    closeLeft();
    panel.classList.add("mobile-open");
    backdrop.classList.add("visible");
    document.body.classList.add("drawer-open");
  } else {
    panel.classList.remove("collapsed");
  }
}

function closeRight() {
  const panel    = document.getElementById("rightPanel");
  const backdrop = document.getElementById("backdrop");
  if (isMobile()) {
    panel.classList.remove("mobile-open");
    if (!document.getElementById("leftSidebar")?.classList.contains("mobile-open")) {
      backdrop.classList.remove("visible");
      document.body.classList.remove("drawer-open");
    }
  } else {
    panel.classList.add("collapsed");
  }
}

function toggleRight() {
  const panel = document.getElementById("rightPanel");
  if (isMobile()) {
    if (panel.classList.contains("mobile-open")) {
      closeRight();
    } else {
      openRight();
    }
  } else {
    panel.classList.toggle("collapsed");
  }
}

export function closeAllMobileDrawers() {
  const sidebar  = document.getElementById("leftSidebar");
  const panel    = document.getElementById("rightPanel");
  const backdrop = document.getElementById("backdrop");
  if (sidebar) sidebar.classList.remove("mobile-open");
  if (panel)   panel.classList.remove("mobile-open");
  if (backdrop) backdrop.classList.remove("visible");
  document.body.classList.remove("drawer-open");
}

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
    btn.addEventListener("click", () => {
      Chat.selectMode(btn);
      closeAllMobileDrawers();
    });
    list.appendChild(btn);
  });
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
    btn.innerHTML = `<svg viewBox="0 0 24 24" style="width:12px;height:12px;stroke:currentColor;fill:none;stroke-width:2"><polyline points="20 6 9 17 4 12"/></svg><span class="tb-btn-text"> Copied</span>`;
    setTimeout(() => (btn.innerHTML = orig), 1800);
  });
}

// ── Event listeners ────────────────────────
function bindEvents() {
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) menuBtn.addEventListener("click", openLeft);

  document.getElementById("toggleLeftBtn").addEventListener("click",  toggleLeft);
  document.getElementById("expandLeftBtn").addEventListener("click",  openLeft);
  document.getElementById("toggleRightBtn").addEventListener("click", toggleRight);

  const closeRightBtn = document.getElementById("closeRightBtn");
  if (closeRightBtn) closeRightBtn.addEventListener("click", closeRight);

  const backdrop = document.getElementById("backdrop");
  if (backdrop) backdrop.addEventListener("click", closeAllMobileDrawers);

  document.getElementById("newChatBtn").addEventListener("click", () => {
    Chat.newChat();
    closeAllMobileDrawers();
  });

  // Close mobile drawer when selecting a conversation or quick prompt
  document.getElementById("historyList").addEventListener("click", (e) => {
    if (e.target.closest(".history-item") && !e.target.closest(".history-item-del")) {
      closeAllMobileDrawers();
    }
  });

  document.getElementById("quickPrompts").addEventListener("click", (e) => {
    if (e.target.closest(".quick-prompt")) {
      closeAllMobileDrawers();
    }
  });

  // Handle escape key to dismiss open mobile drawers
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAllMobileDrawers();
    }
  });

  // Auto clean-up mobile drawer states when resizing to desktop
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      closeAllMobileDrawers();
    }
  });

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
