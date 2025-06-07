import express from "express";
import { InferenceClient } from "@huggingface/inference";

const app = express();
app.use(express.json());

// ✅ AI-powered endpoint
app.post("/api/ask-json", async (req, res) => {
  const { prompt, model, provider } = req.body;

  if (!prompt || !model) {
    return res.status(400).json({ error: "Missing 'prompt' or 'model'" });
  }

  try {
    const client = new InferenceClient(process.env.HF_TOKEN);

    const result = await client.chatCompletion({
      model,
      provider,
      messages: [
        { role: "system", content: "You are an AI web developer assistant." },
        { role: "user", content: prompt }
      ]
    });

    const output = result.choices?.[0]?.message?.content ?? "";
    res.json({ result: output });
  } catch (err) {
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});

// ✅ Test route
app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

// ✅ Fallback route
app.get("*", (_req, res) => {
  res.status(404).send("Not found");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
