// server.js — LearnAI entry point

import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { chatHandler } from "./routes/chat.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API routes
app.post("/api/chat", chatHandler);

// Fallback — serve the SPA
app.get("*path", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`LearnAI → http://localhost:${PORT}`);
});
