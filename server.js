import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import { InferenceClient } from "@huggingface/inference";

dotenv.config();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === CONFIG ===
const PORT = process.env.PORT || 3000;
const HF_TOKEN = process.env.HF_TOKEN || process.env.DEFAULT_HF_TOKEN;
const DEFAULT_MODEL = "deepseek-ai/DeepSeek-V3-Chat";
const DEFAULT_PROVIDER = "auto";

// === MIDDLEWARE ===
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "dist")));

// === ROUTES ===

app.post("/api/ask-json", async (req, res) => {
  const { prompt, model = DEFAULT_MODEL, provider = DEFAULT_PROVIDER } = req.body;

  if (!prompt || !model) {
    return res.status(400).json({ error: "Missing 'prompt' or 'model' in request body." });
  }

  try {
    const client = new InferenceClient(HF_TOKEN);

    const result = await client.chatCompletion({
      model,
      provider,
      messages: [
        { role: "system", content: "You're an AI web developer assistant." },
        { role: "user", content: prompt }
      ]
    });

    const output = result.choices?.[0]?.message?.content ?? "";
    return res.json({ result: output });

  } catch (err) {
    return res.status(500).json({ error: err.message || "Unexpected error" });
  }
});

// Catch-all to serve frontend SPA
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
