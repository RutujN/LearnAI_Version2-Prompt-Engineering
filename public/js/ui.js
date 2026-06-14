// public/js/ui.js — DOM rendering (no imports from chat.js)
// Callbacks for chat interactions are injected via setUIChatCallbacks().

import { MODES } from "./modes.js";

const md = text => window.marked.parse(text);

// ── Injected chat callbacks ────────────────
let _chat = {};
export function setUIChatCallbacks(fns) { _chat = fns; }

// ── Escape helpers ─────────────────────────
export function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Mode UI ────────────────────────────────
export function updateModeUI(currentMode) {
  const m = MODES[currentMode];
  if (!m) return;

  document.getElementById("modePillText").textContent = m.short;
  document.getElementById("modeCardName").textContent = m.label;
  document.getElementById("modeCardDesc").textContent = m.desc;
  document.getElementById("modeCardIcon").innerHTML   = m.icon;
  document.getElementById("modeCardTags").innerHTML   = m.tags
    .map(t => `<span class="mc-tag">${t}</span>`)
    .join("");

  // System prompt viewer — refresh content, collapse on mode change
  document.getElementById("promptView").textContent = m.prompt || "";
  document.getElementById("promptToggle").classList.remove("open");
  document.getElementById("promptView").classList.remove("open");

  const qp = document.getElementById("quickPrompts");
  qp.innerHTML = m.starters
    .map(s => `
      <button class="quick-prompt" data-starter="${s.replace(/"/g, '&quot;')}" data-mode="${currentMode}">
        <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        ${escHtml(s)}
      </button>`)
    .join("");

  qp.querySelectorAll(".quick-prompt").forEach(btn => {
    btn.addEventListener("click", () => _chat.quickStart(btn.dataset.starter, btn.dataset.mode));
  });
}

// ── History sidebar ────────────────────────
export function renderHistory() {
  const { conversations, activeConvId } = _chat.getState();
  const list = document.getElementById("historyList");
  list.innerHTML = "";

  if (!conversations.length) {
    const el = document.createElement("div");
    el.className   = "history-empty";
    el.textContent = "No conversations yet. Start chatting to see history here.";
    list.appendChild(el);
    return;
  }

  const sorted = [...conversations].sort((a, b) => b.timestamp - a.timestamp);
  const todayMs     = (() => { const d = new Date(); d.setHours(0,0,0,0); return d.getTime(); })();
  const yesterdayMs = todayMs - 86400000;

  let lastGroup = null;
  sorted.forEach(conv => {
    const d = new Date(conv.timestamp); d.setHours(0,0,0,0);
    const ts = d.getTime();
    const group =
      ts === todayMs     ? "Today" :
      ts === yesterdayMs ? "Yesterday" :
      d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (group !== lastGroup) {
      const lbl = document.createElement("div");
      lbl.className   = "sb-section-label";
      if (lastGroup !== null) lbl.style.paddingTop = "10px";
      lbl.textContent = group;
      list.appendChild(lbl);
      lastGroup = group;
    }

    const item = document.createElement("div");
    item.className  = "history-item" + (conv.id === activeConvId ? " active-chat" : "");
    item.innerHTML  = `
      <div class="history-item-icon">
        <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      </div>
      <div class="history-item-text">${escHtml(conv.title)}</div>
      <button class="history-item-del" title="Delete">
        <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>`;

    item.querySelector(".history-item-del").addEventListener("click", e => _chat.deleteConv(e, conv.id));
    item.addEventListener("click", e => {
      if (!e.target.closest(".history-item-del")) _chat.loadConv(conv.id);
    });
    list.appendChild(item);
  });
}

// ── Welcome screen ─────────────────────────
export function showWelcome() {
  const list = document.getElementById("messagesList");
  list.innerHTML = "";

  const w = document.createElement("div");
  w.className = "welcome";
  w.id        = "welcomeScreen";
  w.innerHTML = `
    <div class="welcome-icon">
      <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    </div>
    <h1>What are we learning today?</h1>
    <p>Pick a mode from the sidebar or try one of these quick starts.</p>
    <div class="starter-grid">
      <div class="starter-card" data-text="What is recursion in programming?" data-mode="explain">
        <div class="starter-card-label">Explain recursion</div>
        <div class="starter-card-sub">With examples &amp; analogies</div>
      </div>
      <div class="starter-card" data-text="Machine learning" data-mode="eli5">
        <div class="starter-card-label">Machine learning, simply</div>
        <div class="starter-card-sub">No jargon, plain English</div>
      </div>
      <div class="starter-card" data-text="JavaScript Promises and async/await" data-mode="quiz">
        <div class="starter-card-label">Quiz me on Promises</div>
        <div class="starter-card-sub">5 MCQs with answers</div>
      </div>
      <div class="starter-card" data-text="Python developer role" data-mode="interview">
        <div class="starter-card-label">Python interview prep</div>
        <div class="starter-card-sub">Questions &amp; model answers</div>
      </div>
    </div>`;

  w.querySelectorAll(".starter-card").forEach(card => {
    card.addEventListener("click", () => _chat.quickStart(card.dataset.text, card.dataset.mode));
  });

  list.appendChild(w);
}

export function removeWelcome() {
  const w = document.getElementById("welcomeScreen");
  if (w) w.remove();
}

// ── Message blocks ─────────────────────────
export function appendMessageBlock(userText, aiText, mode) {
  const list  = document.getElementById("messagesList");
  const block = document.createElement("div");
  block.className = "msg-block";

  const userRow = document.createElement("div");
  userRow.className = "msg-user";
  userRow.innerHTML = `<div class="msg-user-bubble">${escHtml(userText)}</div>`;
  block.appendChild(userRow);

  if (aiText !== undefined) block.appendChild(buildAIRow(aiText, mode));

  list.appendChild(block);
  document.getElementById("messagesScroll").scrollTop = 999999;
  return block;
}

export function appendAIRow(block, text, mode) {
  block.appendChild(buildAIRow(text, mode));
  document.getElementById("messagesScroll").scrollTop = 999999;
}

export function appendErrorRow(block) {
  const row = document.createElement("div");
  row.className = "msg-ai";
  row.innerHTML = `
    <div class="ai-av">
      <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    </div>
    <div class="msg-ai-body">
      <div class="ai-name">LearnAI</div>
      <div class="msg-ai-content">
        <p style="color:var(--red)">Connection error — check that the server is running and your API key is valid.</p>
      </div>
    </div>`;
  block.appendChild(row);
}

function buildAIRow(text, mode) {
  const m        = mode && MODES[mode] ? MODES[mode] : null;
  const modeChip = m ? `<span class="mode-chip">${m.short}</span>` : "";

  const row = document.createElement("div");
  row.className = "msg-ai";
  row.innerHTML = `
    <div class="ai-av">
      <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    </div>
    <div class="msg-ai-body">
      <div class="ai-name">LearnAI ${modeChip}</div>
      <div class="msg-ai-content">${md(text)}</div>
      <div class="msg-actions">
        <button class="msg-act-btn copy-btn">
          <svg viewBox="0 0 24 24"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy
        </button>
      </div>
    </div>`;

  const copyBtn = row.querySelector(".copy-btn");
  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(text).then(() => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" style="width:11px;height:11px;stroke:currentColor;fill:none;stroke-width:2"><polyline points="20 6 9 17 4 12"/></svg> Copied`;
      setTimeout(() => (copyBtn.innerHTML = orig), 1800);
    });
  });

  return row;
}

// ── Loading indicator ──────────────────────
export function addLoadingBlock() {
  removeWelcome();
  const list  = document.getElementById("messagesList");
  const block = document.createElement("div");
  block.className = "msg-block";
  block.id        = "loadingBlock";
  block.innerHTML = `
    <div class="msg-ai">
      <div class="ai-av">
        <svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      </div>
      <div class="msg-ai-body">
        <div class="ai-name">LearnAI</div>
        <div class="typing"><span></span><span></span><span></span></div>
      </div>
    </div>`;
  list.appendChild(block);
  document.getElementById("messagesScroll").scrollTop = 999999;
}

export function removeLoadingBlock() {
  const el = document.getElementById("loadingBlock");
  if (el) el.remove();
}
