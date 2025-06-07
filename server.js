import express from "express";
const app = express();

app.use(express.json());

// ✅ Working API route
app.post("/api/ask-json", (req, res) => {
  const { prompt, model, provider } = req.body;

  if (!prompt || !model) {
    return res.status(400).json({ error: "Missing 'prompt' or 'model'" });
  }

  // Respond with placeholder result (replace with real logic later)
  res.json({
    result: `✅ Received prompt for model ${model} via provider ${provider || "default"}`,
    original: req.body
  });
});

// ✅ Simple ping route to verify health
app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

// ✅ Catch-all for unmatched routes
app.get("*", (_req, res) => {
  res.status(404).send("Not found");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
