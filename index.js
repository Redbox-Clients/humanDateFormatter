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
  let dt = DateTime.fromJSDate(parsedDate, { zone: 'Europe/Dublin' });

  // ✅ Default early morning times to PM if no am/pm was specified
  if (dt.hour >= 0 && dt.hour <= 8) {
    dt = dt.plus({ hours: 12 });
  }

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