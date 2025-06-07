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

    let fullOutput = "";

    for await (const chunk of stream) {
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (delta) fullOutput += delta;
    }

    res.json({ result: fullOutput });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
