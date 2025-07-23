const express = require('express');
const chrono = require('chrono-node');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/parse', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing 'text' in request body." });
  }

  const parsedDate = chrono.parseDate(text, new Date(), { forwardDate: true });

  if (!parsedDate) {
    return res.status(400).json({ error: "Unable to parse date expression." });
  }

  res.json({ resolvedDateTime: parsedDate });
});

app.get('/', (req, res) => {
  res.send('Chrono Parser API is running.');
});

app.listen(PORT, () => console.log(`Chrono parser running on port ${PORT}`));