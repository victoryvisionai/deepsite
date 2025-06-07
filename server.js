import express from "express";
const app = express();

app.use(express.json());

app.post("/api/ask-json", (req, res) => {
  res.json({ message: "✅ Your ask-json endpoint works!", body: req.body });
});

app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
