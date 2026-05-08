require('dotenv').config();
const express = require('express');
const path = require('path');
const { rateLimit } = require('express-rate-limit');
const { createClient } = require('@supabase/supabase-js');
const { generatePolish, getProviderFromEnv } = require('./llm');

// Structured logging utility
const log = {
  info: (msg, data) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`, data ? JSON.stringify(data) : ''),
  error: (msg, err) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, err ? err.message : ''),
  warn: (msg, data) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`, data ? JSON.stringify(data) : ''),
};

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

app.disable('x-powered-by');
app.use(express.json({ limit: '10mb' }));

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    log.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

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
const WEB_PUBLIC_DIR = path.join(__dirname, '..', 'web', 'public');
app.use(express.static(WEB_PUBLIC_DIR, { dotfiles: 'deny' }));

// Ensure homepage loads by default at "/"
app.get('/', (_req, res) => {
  res.sendFile(path.join(WEB_PUBLIC_DIR, 'index.html'));
});

const supabaseAdmin = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

// Public config for the browser Supabase client (anon key is safe to expose)
app.get('/api/config', (_req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  });
});

// Verify Supabase JWT — sets req.user if valid, null otherwise (never blocks)
async function verifyToken(req, _res, next) {
  req.user = null;
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (token && supabaseAdmin) {
    try {
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      req.user = user || null;
    } catch (_) {}
  }
  next();
}

// Parse markup tags from AI response and build structured marked array
function parseMarkup(text) {
  const marked = [];

  const keywordRegex = /<keyword>(.*?)<\/keyword>/g;
  const editableRegex = /<editable>(.*?)<\/editable>/g;

  // Create a list of all tagged regions with their positions and types
  const taggedRegions = [];
  let match;

  while ((match = keywordRegex.exec(text)) !== null) {
    taggedRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'keyword',
      content: match[1],
    });
  }

  while ((match = editableRegex.exec(text)) !== null) {
    taggedRegions.push({
      start: match.index,
      end: match.index + match[0].length,
      type: 'editable',
      content: match[1],
    });
  }

  // Sort by start position
  taggedRegions.sort((a, b) => a.start - b.start);

  // Build marked array by processing text between tags
  let processedIndex = 0;
  for (const region of taggedRegions) {
    // Add text before this tag
    if (processedIndex < region.start) {
      const plainText = text.substring(processedIndex, region.start)
        .replace(/<\/?keyword>/g, '')
        .replace(/<\/?editable>/g, '');
      if (plainText) {
        marked.push({ text: plainText, type: 'text' });
      }
    }
    // Add the tagged content
    marked.push({ text: region.content, type: region.type });
    processedIndex = region.end;
  }

  // Add remaining text after last tag
  if (processedIndex < text.length) {
    const plainText = text.substring(processedIndex)
      .replace(/<\/?keyword>/g, '')
      .replace(/<\/?editable>/g, '');
    if (plainText) {
      marked.push({ text: plainText, type: 'text' });
    }
  }

  return marked.length > 0 ? marked : null;
}

const VALID_MODES = ['default', 'professional', 'friendly', 'detailed', 'creative', 'concise'];

function resolveMode(rawMode, rawTone) {
  const m = String(rawMode || '').toLowerCase();
  // Back-compat: old frontend used "caveman"; treat it as "concise" now.
  if (m === 'caveman') return 'concise';
  if (VALID_MODES.includes(m)) return m;
  const t = String(rawTone || '').toLowerCase();
  if (VALID_MODES.includes(t)) return t;
  return 'default';
}

app.post('/api/polish', polishLimiter, verifyToken, async (req, res) => {
  const { prompt, audience, tone, constraints, mode } = req.body || {};
  const text = (prompt || '').trim();
  if (!text) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const resolvedMode = resolveMode(mode, tone);

  try {
    const data = await generatePolish({
      prompt: text,
      mode: resolvedMode,
      audience,
      tone,
      constraints,
    });

    const polished = data.polished || '';
    const improvements = Array.isArray(data.improvements) ? data.improvements : [];

    const bullets = polished.includes('\n-')
      ? polished.split(/\n\s*-\s*/).map((s) => s.trim()).filter(Boolean)
      : [polished];

    const finalImprovements = improvements.length ? improvements : ['Clearer structure and intent', 'More specific, actionable phrasing'];

    const marked = parseMarkup(polished);
    // Clean up markup tags from polished text for display/copy
    const cleanPolished = polished.replace(/<\/?keyword>/g, '').replace(/<\/?editable>/g, '');

    const responseObj = {
      polished: cleanPolished,
      bullets: bullets.length ? bullets : [cleanPolished],
      improvements: finalImprovements,
      mode: resolvedMode,
    };

    if (marked) {
      responseObj.marked = marked;
    }

    res.json(responseObj);

    // Save to prompt history if user is authenticated (fire and forget)
    if (req.user && supabaseAdmin) {
      supabaseAdmin.from('prompts').insert({
        user_id: req.user.id,
        original: text,
        polished: cleanPolished,
        mode: resolvedMode,
        improvements: finalImprovements,
      }).catch((err) => console.warn('[history] Save failed:', err.message));
    }
  } catch (err) {
    let status = 500;
    if (err && err.code === 'openai_error') status = 503;
    else if (err && err.code === 'ollama_unreachable') status = 503;
    else if (err && err.status) status = err.status;
    console.error('Polish error:', err && err.message ? err.message : err);
    res.status(status).json({
      error: status === 503 ? 'LLM not available' : 'Enhancement failed',
      message: err && err.message ? err.message : 'Request failed.',
      provider: getProviderFromEnv(),
    });
  }
});

// Health check endpoint (for monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
    supabase: supabaseAdmin ? 'configured' : 'not configured',
    llmProvider: getProviderFromEnv(),
    ollama: {
      baseUrl: process.env.PRONTO_OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
      model: process.env.PRONTO_OLLAMA_MODEL || 'llama3',
    },
  });
});

// Contact form submission
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  if (message.length > 5000) {
    return res.status(400).json({ error: 'Message is too long (max 5000 characters).' });
  }

  // Log submission (plug in Resend / SendGrid here when ready)
  console.log('[contact]', { name, email, subject, receivedAt: new Date().toISOString() });

  res.json({ ok: true });
});

// Prompt history — requires valid Supabase JWT
app.get('/api/history', verifyToken, async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!supabaseAdmin) return res.status(503).json({ error: 'Database not configured' });
  const { data, error } = await supabaseAdmin
    .from('prompts')
    .select('id, original, polished, mode, improvements, created_at')
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ history: data });
});

// Custom 404 — serve 404.html for any unmatched route
app.use((_req, res) => {
  res.status(404).sendFile(path.join(WEB_PUBLIC_DIR, '404.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  const errorId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  log.error(`Unhandled error [${errorId}]`, err);

  // Don't expose internal error details to client in production
  const clientMessage = IS_PRODUCTION
    ? 'An unexpected error occurred. Please try again.'
    : err.message;

  res.status(err.status || 500).json({
    error: 'Internal server error',
    message: clientMessage,
    errorId: IS_PRODUCTION ? errorId : undefined,
  });
});

function startServer(port = PORT) {
  const server = app.listen(port, () => {
    log.info(`🚀 Server ready`, {
      port: port,
      environment: NODE_ENV,
      url: `http://localhost:${port}`,
      llmProvider: getProviderFromEnv(),
    });

    if (!process.env.SUPABASE_URL) {
      log.warn('Supabase not configured - authentication disabled', null);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    log.info('SIGTERM signal received: closing HTTP server', null);
    server.close(() => {
      log.info('HTTP server closed', null);
      process.exit(0);
    });
  });

  return server;
}

if (require.main === module) {
  startServer(PORT);
}

module.exports = { app, startServer };
