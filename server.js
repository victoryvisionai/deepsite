import express from "express";
import { InferenceClient } from "@huggingface/inference";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

// STREAM → WRITE to file → POST to n8n webhook
app.post("/api/ask-stream", async (req, res) => {
  const { prompt, model, provider, webhook } = req.body;

  if (!prompt || !model) {
    return res.status(400).json({ error: "Missing 'prompt' or 'model'" });
  }

  try {
    const client = new InferenceClient(process.env.HF_TOKEN);
    const stream = await client.chatCompletionStream({
      model,
      provider,
      messages: [
        { role: "system", content: "You are a web developer assistant." },
        { role: "user", content: prompt }
      ],
      max_tokens: 4000
    });

    const id = crypto.randomUUID();
    const filePath = path.join("/tmp", `${id}.html`);
    const writeStream = fs.createWriteStream(filePath, { flags: "a" });

    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta) writeStream.write(delta);
    }

    writeStream.end();

    // Webhook (POST to n8n)
    const webhookUrl =
      webhook ||
      `${process.env.N8N_WEBHOOK_URL || "https://victoryvision.app.n8n.cloud"}/webhook/receive-html`;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: "ready",
        fileUrl: `${process.env.BASE_URL || "https://deepsite-fdia.onrender.com"}/api/files/${id}`
      })
    });

    res.status(202).json({ message: "HTML generated and webhook sent", id });
  } catch (err) {
    res.status(500).json({ error: err.message || "Streaming error" });
  }
});

// Download file
app.get("/api/files/:id", (req, res) => {
  const filePath = path.join("/tmp", `${req.params.id}.html`);
  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "text/html");
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).send("File not found");
  }
});

// Optional: Delete file
app.delete("/api/files/:id", (req, res) => {
  const filePath = path.join("/tmp", `${req.params.id}.html`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    res.send("File deleted");
  } else {
    res.status(404).send("File not found");
  }
});

// Health
app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

// Fallback
app.get("*", (_req, res) => {
  res.status(404).send("Not found");
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
