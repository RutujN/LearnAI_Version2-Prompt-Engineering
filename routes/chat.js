// routes/chat.js — Chat API route + system prompts

const SYSTEM_PROMPTS = {
  explain: `You are an expert tutor. When given a topic or concept, provide a clear, structured explanation using markdown.
Structure it as:
## Overview
(2-3 sentences covering the core idea)
## Key Points
(bullet list of the most important aspects)
## Analogy
(a simple, relatable comparison)
## Real-World Example
(a concrete scenario where this applies)
## Summary
(one or two sentences to close)
Be thorough but concise. Avoid filler phrases.`,

  eli5: `Explain topics in plain, simple language as if talking to someone who has never heard of this before.
Use short sentences. Use everyday analogies. Avoid all technical jargon.
Be warm, clear, and sometimes use a small story or scenario to make the idea click.
Format with markdown for readability.`,

  summarize: `You are a summarization expert. Condense the provided text into:
**TL;DR** — 2-3 sentences at the top capturing the core message.
**Key Points** — a bullet list of the most important ideas.
**Conclusions** — what the reader should take away.
Preserve meaning. Use markdown. Do not add opinions not present in the source.`,

  quiz: `Generate exactly 5 well-crafted multiple-choice quiz questions on the given topic.
For each question:
- Number it (1–5)
- Write a clear, unambiguous question
- Provide 4 options labeled A–D
- Mark the correct answer with ✅
- Add a one-sentence explanation of why it is correct
Use markdown. Leave a clear blank line between each question.`,

  interview: `Generate 8 interview questions for the given topic or role. Group them as:
- **Conceptual (3):** theory and fundamentals
- **Practical (3):** coding or scenario-based
- **Behavioral (2):** soft skills using the STAR format

For each question include:
- The question itself
- **Model Answer** with 3–4 key points the candidate should cover

Use clear markdown formatting.`,

  professional: `Rewrite the provided text in a polished, professional tone suitable for business communication.
Improve clarity, fix grammar, elevate vocabulary, and ensure proper structure.
Format your response as:

**Rewritten:**
[your polished version here]

**Changes made:**
[brief bullet list of what was improved and why]

Keep the original meaning intact. Do not add content that wasn't there.`,
};

// Clamp helper for temperature
function clampTemperature(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0.7;
  return Math.min(Math.max(num, 0), 1);
}

export async function chatHandler(req, res) {
  const { message, mode, history = [], temperature } = req.body;

  // Validate input
  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Message cannot be empty." });
  }

  const trimmed = message.trim();
  const systemPrompt = SYSTEM_PROMPTS[mode] || SYSTEM_PROMPTS.explain;
  const temp = clampTemperature(temperature);

  // Build Gemini contents array (no system role — inject into first user turn)
  const contents = [];

  if (history.length <= 1) {
    contents.push({
      role: "user",
      parts: [{ text: systemPrompt + "\n\n" + trimmed }]
    });
  } else {
    const historyContents = history.slice(0, -1).map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    if (historyContents.length > 0) {
      historyContents[0].parts[0].text =
        systemPrompt + "\n\n" + historyContents[0].parts[0].text;
    }

    contents.push(...historyContents);
    contents.push({ role: "user", parts: [{ text: trimmed }] });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: temp
          }
        })
      }
    );

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response was generated.";

    const usage = data?.usageMetadata
      ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          responseTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount,
        }
      : null;

    res.json({ reply, usage, temperature: temp });
  } catch (err) {
    console.error("[chat error]", err);
    res.status(500).json({ error: "Server error. Check your API key and connection." });
  }
}
