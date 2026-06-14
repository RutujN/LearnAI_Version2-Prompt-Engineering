// public/js/modes.js — Prompt mode definitions (frontend display + system prompt text)

export const MODES = {
  explain: {
    label: "Explain a Concept",
    short: "Explain",
    desc: "Structured explanation with key points, an analogy, and a real-world example.",
    tags: ["structured", "examples", "analogies"],
    starters: [
      "Explain how the internet works",
      "What is recursion in programming?",
      "How does machine learning work?",
      "Explain the concept of neural networks",
    ],
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    prompt: `You are an expert tutor. When given a topic or concept, provide a clear, structured explanation using markdown.
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
  },

  eli5: {
    label: "Simple Explanation",
    short: "ELI5",
    desc: "Any topic explained in plain language, zero jargon, relatable comparisons.",
    tags: ["simple", "no-jargon", "beginner"],
    starters: [
      "Explain blockchain in simple terms",
      "What is the stock market in plain English?",
      "How does a computer work simply?",
      "Explain machine learning like I'm new to it",
    ],
    icon: `<svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    prompt: `Explain topics in plain, simple language as if talking to someone who has never heard of this before.
Use short sentences. Use everyday analogies. Avoid all technical jargon.
Be warm, clear, and sometimes use a small story or scenario to make the idea click.
Format with markdown for readability.`,
  },

  summarize: {
    label: "Summarize",
    short: "Summarize",
    desc: "Paste any text to get a TL;DR, key points, and conclusions.",
    tags: ["TL;DR", "concise", "key-points"],
    starters: [
      "Summarize this article:",
      "Give me the key takeaways from:",
      "What are the main points of:",
      "Condense this into bullet points:",
    ],
    icon: `<svg viewBox="0 0 24 24"><line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/></svg>`,
    prompt: `You are a summarization expert. Condense the provided text into:
**TL;DR** — 2-3 sentences at the top capturing the core message.
**Key Points** — a bullet list of the most important ideas.
**Conclusions** — what the reader should take away.
Preserve meaning. Use markdown. Do not add opinions not present in the source.`,
  },

  quiz: {
    label: "Quiz Generator",
    short: "Quiz",
    desc: "Generates 5 MCQs with correct answers and explanations.",
    tags: ["MCQ", "answers", "explanations"],
    starters: [
      "Quiz me on Python fundamentals",
      "Generate 5 questions about World War II",
      "Test my knowledge of photosynthesis",
      "Create a quiz for JavaScript basics",
    ],
    icon: `<svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
    prompt: `Generate exactly 5 well-crafted multiple-choice quiz questions on the given topic.
For each question:
- Number it (1–5)
- Write a clear, unambiguous question
- Provide 4 options labeled A–D
- Mark the correct answer with ✅
- Add a one-sentence explanation of why it is correct
Use markdown. Leave a clear blank line between each question.`,
  },

  interview: {
    label: "Interview Prep",
    short: "Interview",
    desc: "8 questions — conceptual, practical, and behavioral — with model answers.",
    tags: ["questions", "answers", "behavioral"],
    starters: [
      "Interview prep for a backend developer role",
      "Questions for a data scientist position",
      "Mock interview on system design",
      "Prepare me for a product manager interview",
    ],
    icon: `<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    prompt: `Generate 8 interview questions for the given topic or role. Group them as:
- **Conceptual (3):** theory and fundamentals
- **Practical (3):** coding or scenario-based
- **Behavioral (2):** soft skills using the STAR format

For each question include:
- The question itself
- **Model Answer** with 3–4 key points the candidate should cover

Use clear markdown formatting.`,
  },

  professional: {
    label: "Rewrite — Professional",
    short: "Rewrite",
    desc: "Polishes casual or rough text into professional business communication.",
    tags: ["formal", "polished", "business"],
    starters: [
      "Rewrite this email professionally:",
      "Make this message more formal:",
      "Polish this cover letter paragraph:",
      "Professional version of this Slack message:",
    ],
    icon: `<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    prompt: `Rewrite the provided text in a polished, professional tone suitable for business communication.
Improve clarity, fix grammar, elevate vocabulary, and ensure proper structure.
Format your response as:

**Rewritten:**
[your polished version here]

**Changes made:**
[brief bullet list of what was improved and why]

Keep the original meaning intact. Do not add content that wasn't there.`,
  },
};
