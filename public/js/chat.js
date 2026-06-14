// public/js/chat.js — Chat logic: send, history, conversations
// Note: UI functions are injected via setChatUI() to avoid circular imports.

import { MODES } from "./modes.js";

// ── Injected UI functions ─────────────────
let _ui = {};
export function setChatUI(fns) { _ui = fns; }

// ── State ──────────────────────────────────
export let currentMode  = "explain";
export let chatHistory  = [];
export let conversations = [];
export let activeConvId  = null;
export let isLoading     = false;
export let msgCount      = 0;
export let exchCount     = 0;
export let totalTokens   = 0;
export let temperature   = 0.7;

export function setTemperature(value) {
  temperature = value;
}

// ── Mode selection ─────────────────────────
export function selectMode(btn) {
  document.querySelectorAll(".mode-item").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentMode = btn.dataset.mode;
  _ui.updateModeUI(currentMode);
}

export function cycleModes() {
  const keys = Object.keys(MODES);
  const idx  = keys.indexOf(currentMode);
  const next = keys[(idx + 1) % keys.length];
  const btn  = document.querySelector(`[data-mode="${next}"]`);
  if (btn) selectMode(btn);
}

export function insertStarter(text) {
  const ta = document.getElementById("userInput");
  ta.value = text + " ";
  ta.focus();
  handleInput(ta);
}

// ── Conversations ──────────────────────────
function saveConversations() {
  try { localStorage.setItem("learnai_convs", JSON.stringify(conversations)); } catch {}
}

export function loadConversations() {
  try {
    const raw = localStorage.getItem("learnai_convs");
    if (raw) conversations = JSON.parse(raw);
  } catch { conversations = []; }
  _ui.renderHistory();
}

export function saveCurrentConv() {
  if (chatHistory.length === 0) return;
  const firstMsg = chatHistory[0]?.content || "";
  const title = firstMsg.length > 48 ? firstMsg.slice(0, 48) + "…" : firstMsg || "Untitled";

  if (activeConvId) {
    const idx = conversations.findIndex(c => c.id === activeConvId);
    if (idx >= 0) {
      conversations[idx] = { ...conversations[idx], history: [...chatHistory], title, mode: currentMode };
    }
  } else {
    activeConvId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    conversations.push({ id: activeConvId, title, mode: currentMode, history: [...chatHistory], timestamp: Date.now() });
  }
  saveConversations();
  _ui.renderHistory();
}

export function loadConv(id) {
  const conv = conversations.find(c => c.id === id);
  if (!conv) return;

  saveCurrentConv();
  activeConvId = id;
  chatHistory  = [...conv.history];
  currentMode  = conv.mode;
  msgCount     = conv.history.length;
  exchCount    = conv.history.filter(m => m.role === "assistant").length;
  totalTokens  = 0;

  document.querySelectorAll(".mode-item").forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`[data-mode="${currentMode}"]`);
  if (btn) btn.classList.add("active");
  _ui.updateModeUI(currentMode);

  const list = document.getElementById("messagesList");
  list.innerHTML = "";

  for (let i = 0; i < chatHistory.length; i += 2) {
    const user = chatHistory[i];
    const ai   = chatHistory[i + 1];
    if (user) _ui.appendMessageBlock(user.content, ai?.content, conv.mode);
  }

  updateStats();
  document.getElementById("topbarTitle").textContent = conv.title;
  document.getElementById("messagesScroll").scrollTop = 999999;
  _ui.renderHistory();
}

export function deleteConv(e, id) {
  e.stopPropagation();
  conversations = conversations.filter(c => c.id !== id);
  saveConversations();

  if (activeConvId === id) {
    activeConvId = null;
    chatHistory  = [];
    msgCount     = 0;
    exchCount    = 0;
    totalTokens  = 0;
    updateStats();
    _ui.showWelcome();
    document.getElementById("topbarTitle").textContent = "New conversation";
  }
  _ui.renderHistory();
}

export function newChat() {
  saveCurrentConv();
  activeConvId = null;
  chatHistory  = [];
  msgCount     = 0;
  exchCount    = 0;
  totalTokens  = 0;
  updateStats();
  _ui.showWelcome();
  document.getElementById("topbarTitle").textContent = "New conversation";
  _ui.renderHistory();
}

// ── Send message ───────────────────────────
export async function sendMessage() {
  if (isLoading) return;

  const input = document.getElementById("userInput");
  const text  = input.value.trim();

  if (!text) {
    input.style.outline   = "2px solid var(--red)";
    input.placeholder     = "Please type something first.";
    setTimeout(() => {
      input.style.outline = "";
      input.placeholder   = "Ask anything…";
    }, 1200);
    return;
  }

  isLoading = true;
  document.getElementById("sendBtn").disabled = true;
  input.value        = "";
  input.style.height = "auto";
  document.getElementById("charCount").textContent = "";

  _ui.removeWelcome();
  const mode  = currentMode;
  const block = _ui.appendMessageBlock(text, undefined, mode);
  chatHistory.push({ role: "user", content: text });
  msgCount++;

  _ui.addLoadingBlock();

  try {
    const resp = await fetch("/api/chat", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ message: text, mode, history: chatHistory, temperature }),
    });

    const data = await resp.json();
    _ui.removeLoadingBlock();

    const reply = data.error
      ? `**Error:** ${data.error}`
      : (data.reply || "No response generated.");

    _ui.appendAIRow(block, reply, mode);

    chatHistory.push({ role: "assistant", content: reply });
    msgCount++;
    exchCount++;

    if (data.usage?.totalTokens) {
      totalTokens += data.usage.totalTokens;
    }

    updateStats();

    document.getElementById("messagesScroll").scrollTop = 999999;

    if (chatHistory.length === 2) {
      const title = text.slice(0, 40) + (text.length > 40 ? "…" : "");
      document.getElementById("topbarTitle").textContent = title;
    }

    saveCurrentConv();

  } catch {
    _ui.removeLoadingBlock();
    chatHistory.pop();
    _ui.appendErrorRow(block);
  }

  isLoading = false;
  document.getElementById("sendBtn").disabled = false;
  input.focus();
}

// ── Utilities ──────────────────────────────
export function quickStart(text, mode) {
  const btn = document.querySelector(`[data-mode="${mode}"]`);
  if (btn) selectMode(btn);
  const input = document.getElementById("userInput");
  input.value = text;
  handleInput(input);
  sendMessage();
}

export function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

export function handleInput(ta) {
  ta.style.height = "auto";
  ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  const len = ta.value.length;
  document.getElementById("charCount").textContent = len > 0 ? len : "";
}

export function updateStats() {
  document.getElementById("statMsgs").textContent  = msgCount;
  document.getElementById("statExch").textContent  = exchCount;
  document.getElementById("statTokens").textContent =
    totalTokens >= 1000 ? (totalTokens / 1000).toFixed(1) + "k" : totalTokens;
}

export function exportChat() {
  if (chatHistory.length === 0) { alert("No conversation to export."); return; }
  const modeLabel = MODES[currentMode]?.label || currentMode;
  let md = `# LearnAI Export\n_${new Date().toLocaleString()}_\n\n`;
  md += `**Mode:** ${modeLabel}  \n**Temperature:** ${temperature.toFixed(1)}\n\n---\n\n`;
  chatHistory.forEach(m => {
    md += `**${m.role === "user" ? "You" : "LearnAI"}:**\n\n${m.content}\n\n---\n\n`;
  });
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
  a.download = `learnai-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
}
