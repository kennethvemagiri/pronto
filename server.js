require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { rateLimit } = require('express-rate-limit');
const OpenAI = require('openai').default;

const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');
app.use(express.json());

// Rate limit: Free tier — 20 polishes per hour per IP
const polishLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    error: 'Too many requests',
    message: 'You have used your 20 free polishes this hour. Upgrade to Pro for unlimited access.',
  },
});

// Serve only public assets (avoid exposing server files / secrets)
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'deny' }));
// Serve animation frames (kept outside /public)
app.use('/animations', express.static(path.join(__dirname, 'animations'), { dotfiles: 'deny' }));

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Load instruction files — reload on each request so edits take effect without restart
function loadInstructions(filename) {
  try {
    return fs.readFileSync(path.join(__dirname, 'instructions', filename), 'utf8');
  } catch (e) {
    console.warn(`Could not load instructions/${filename}:`, e.message);
    return null;
  }
}

app.post('/api/polish', polishLimiter, async (req, res) => {
  if (!openai) {
    return res.status(503).json({
      error: 'OpenAI not configured',
      message: 'Set OPENAI_API_KEY in .env to use the prompt enhancer.',
    });
  }

  const { prompt, audience, tone, constraints, mode } = req.body || {};
  const text = (prompt || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  // Load the right instruction file based on mode
  const isAiMode = mode === 'ai';
  const instructionFile = isAiMode ? 'ai-intelligence.md' : 'basic-intelligence.md';
  const systemPrompt = loadInstructions(instructionFile);

  if (!systemPrompt) {
    return res.status(500).json({ error: 'Instruction file missing', message: `Could not load instructions/${instructionFile}` });
  }

  let userMessage = `Polish this prompt:\n\n"${text}"`;
  if (tone) userMessage += `\nTone: ${tone}`;
  if (audience) userMessage += `\nTarget audience: ${audience}`;
  if (constraints) userMessage += `\nConstraints: ${constraints}`;
  userMessage += '\n\nRespond with only the JSON object (polished + improvements).';

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: isAiMode ? 0.6 : 0.2,
    });

    const content = completion.choices[0]?.message?.content?.trim() || '';
    let data;
    try {
      data = JSON.parse(content);
    } catch (_) {
      const polished = content.replace(/^["']|["']$/g, '');
      data = { polished: polished, improvements: ['Clearer structure and intent', 'More specific, actionable phrasing'] };
    }

    const polished = data.polished || '';
    const improvements = Array.isArray(data.improvements) ? data.improvements : [];

    const bullets = polished.includes('\n-')
      ? polished.split(/\n\s*-\s*/).map((s) => s.trim()).filter(Boolean)
      : [polished];

    res.json({
      polished,
      bullets: bullets.length ? bullets : [polished],
      improvements: improvements.length ? improvements : ['Clearer structure and intent', 'More specific, actionable phrasing'],
    });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({
      error: 'Enhancement failed',
      message: err.message || 'OpenAI request failed.',
    });
  }
});

// Custom 404 — serve 404.html for any unmatched route
app.use((_req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

app.listen(PORT, () => {
  console.log(`pronto server at http://localhost:${PORT}`);
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set — /api/polish will return 503. Add it to .env.');
  }
});
