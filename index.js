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

    let inputText = text;
    // Preprocess: if input has 'at [number]' (no colon, no am/pm), append ':00'
    inputText = inputText.replace(/at (\d{1,2})(?!:|\d|\s*am|\s*pm)/gi, (match, p1) => `at ${p1}:00`);
    // Preprocess: handle 'half [number]' as '[number]:30'
    inputText = inputText.replace(/half (\d{1,2})/gi, (match, p1) => `${p1}:30`);
    // Preprocess: handle 'quarter to [number]' and 'quater to [number]' as '[number-1]:45'
    inputText = inputText.replace(/qu?arter to (\d{1,2})/gi, (match, p1) => `${parseInt(p1, 10) - 1}:45`);
    // Preprocess: handle 'quarter past [number]' and 'quater past [number]' as '[number]:15'
    inputText = inputText.replace(/qu?arter past (\d{1,2})/gi, (match, p1) => `${parseInt(p1, 10)}:15`);

    // Debug: Log preprocessed input
    console.log('Preprocessed input:', inputText);

    // Parse using chrono-node
    const parsedDate = chrono.parseDate(inputText, new Date(), { forwardDate: true });

    if (!parsedDate) {
        return res.status(400).json({ error: "Unable to parse date expression." });
    }

    // Debug: Log what chrono parsed
    console.log('Input text:', text);
    console.log('Parsed date:', parsedDate);
    console.log('Parsed hour (Europe/Dublin):', DateTime.fromJSDate(parsedDate, { zone: 'Europe/Dublin' }).hour);

    // Check hour in UTC before timezone conversion
    const parsedHourUTC = parsedDate.getUTCHours();

    // Convert to Europe/Dublin timezone using Luxon
    let dt = DateTime.fromJSDate(parsedDate, { zone: 'Europe/Dublin' });

    // Disambiguate AM/PM if not specified in text
    const textLower = text.toLowerCase();
    const hasAMPM = textLower.includes('am') || textLower.includes('pm');
    // If no am/pm, and hour is between 1 and 8 (inclusive), assume PM (but not for 12)
    if (!hasAMPM) {
        const hour = dt.hour;
        if (hour >= 1 && hour <= 8) {
            dt = dt.plus({ hours: 12 });
        }
    }

    // If chrono parsed noon but input had an explicit hour, override the hour
    let manualHourMatch = inputText.match(/at (\d{1,2})(?::00)?/i);
    if (manualHourMatch) {
        let intendedHour = parseInt(manualHourMatch[1], 10);
        const textLower = inputText.toLowerCase();
        const hasAMPM = textLower.includes('am') || textLower.includes('pm');
        const hasMorning = textLower.includes('morning');
        const hasEvening = textLower.includes('evening');
        // Only override if intended hour is not 12 (to avoid 12:00 noon/pm confusion)
        if (intendedHour !== 12) {
            // If no am/pm/morning/evening and hour is 1-8, default to PM
            if (!hasAMPM && !hasMorning && !hasEvening && intendedHour >= 1 && intendedHour <= 8) {
                dt = dt.set({ hour: intendedHour + 12 });
            } else {
                dt = dt.set({ hour: intendedHour });
            }
        }
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