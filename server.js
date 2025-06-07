import express from "express";
const app = express();

app.use(express.json());

app.get("/api/ping", (_req, res) => {
  res.json({ message: "pong" });
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`✅ Server running on http://localhost:${process.env.PORT || 3000}`);
});
