const express = require('express');
const chrono = require('chrono-node');
const { DateTime } = require('luxon');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/parse', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Missing 'text' in request body." });
  }

  // Parse using chrono-node
  const parsedDate = chrono.parseDate(text, new Date(), { forwardDate: true });

  if (!parsedDate) {
    return res.status(400).json({ error: "Unable to parse date expression." });
  }

  // Convert to Europe/Dublin timezone using Luxon
  const dt = DateTime.fromJSDate(parsedDate, { zone: 'Europe/Dublin' });

  res.json({
    resolvedDateTime: dt.toISO(),
    dayOfWeek: dt.toFormat('cccc'), // Full day name (e.g. Friday)
    localTime: dt.toFormat('HH:mm'),
    timezone: 'Europe/Dublin'
  });
});

app.get('/', (req, res) => {
  res.send('Chrono Parser API is running.');
});

app.listen(PORT, () => console.log(`Chrono parser running on port ${PORT}`));