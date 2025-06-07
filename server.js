import express from "express";
import { InferenceClient } from "@huggingface/inference";

const app = express();
app.use(express.json());

// ✅ Streaming AI-powered endpoint
app.post("/api/ask-json", async (req, res) => {
  const { prompt, model, provider } = req.body;

  if (!prompt || !model) {
    return res.status(400).json({ error: "Missing 'prompt' or 'model'" });
  }

  try {
    const client = new InferenceClient(process.env.HF_TOKEN);

    const stream = await client.chatCompletionStream({
      model,
      provider,
      messages: [
        { role: "system", content: "You are an AI web developer assistant." },
        { role: "user", content: prompt }
      ]
    });

    // Enable streaming response
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Transfer-Encoding", "chunked");
    res.setHeader("Cache-Control", "no-cache");

    // Stream content back chunk by chunk
    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta) {
        res.write(delta);
      }
    }

    res.end();
  } catch (err) {
    res.status(500).json({ error: err.message || "Stream error." });
  }
});

// ✅ Ping route
app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

// ✅ Catch-all
app.get("*", (_req, res) => {
  res.status(404).send("Not found");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
