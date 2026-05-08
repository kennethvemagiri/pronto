const OpenAI = require('openai');

function safeJsonParse(s) {
  const text = String(s || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch (_) {}
    }
    return null;
  }
}

function buildUserContent({ prompt, tone, audience, constraints }) {
  const raw = String(prompt || '').trim();
  let content = raw;

  const parts = [];
  if (tone) parts.push(`Tone: ${tone}`);
  if (audience) parts.push(`Audience: ${audience}`);
  if (constraints) parts.push(`Constraints: ${constraints}`);
  if (parts.length) {
    content += `\n\n${parts.join('. ')}.`;
  }

  return content;
}

function buildFullSystemPrompt(systemPrompt) {
  const base = String(systemPrompt || '').trim();
  return `${base}\n\nReturn your response as a single JSON object with this shape:\n{"polished":"<the rewritten prompt>","improvements":["<short tag>","..."]}\nNo prose. No markdown.`;
}

function normalizeModelText(s) {
  // If the model double-escapes newlines, JSON.parse yields literal "\\n".
  // Convert those sequences into real newlines for consistent rendering downstream.
  return String(s || '')
    // handle "\\\\n" (double-escaped) first
    .replace(/\\\\n/g, '\n')
    .replace(/\\\\r\\\\n/g, '\n')
    // then normal "\n" escapes
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n');
}

class OpenAIProvider {
  constructor({ apiKey, model }) {
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) {
      const e = new Error('OPENAI_API_KEY is not set');
      e.code = 'openai_error';
      e.status = 503;
      throw e;
    }
    this.client = new OpenAI({ apiKey: key });
    this.model = model || process.env.PRONTO_OPENAI_MODEL || 'gpt-4o-mini';
  }

  async generatePolish({ prompt, systemPrompt, tone, audience, constraints }) {
    const fullSystem = buildFullSystemPrompt(systemPrompt);
    const userContent = buildUserContent({ prompt, tone, audience, constraints });

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: fullSystem },
          { role: 'user', content: userContent },
        ],
      });

      const rawText = completion.choices && completion.choices[0] && completion.choices[0].message
        ? completion.choices[0].message.content
        : '';

      let data = safeJsonParse(rawText);
      if (!data || typeof data !== 'object') {
        const polished = normalizeModelText(String(rawText || '').trim());
        return {
          polished,
          improvements: [],
        };
      }

      const polished = typeof data.polished === 'string' ? normalizeModelText(data.polished.trim()) : '';
      const improvements = Array.isArray(data.improvements)
        ? data.improvements.filter((x) => typeof x === 'string')
        : [];

      if (!polished) {
        const e = new Error('OpenAI returned empty polished prompt');
        e.code = 'openai_error';
        e.status = 502;
        throw e;
      }

      return { polished, improvements };
    } catch (err) {
      if (err && err.code === 'openai_error') throw err;

      const status = err && err.status ? err.status : (err && err.response && err.response.status);
      const msg = err && err.message ? err.message : String(err);

      const e = new Error(`OpenAI request failed: ${msg}`);
      e.code = 'openai_error';
      e.status = status === 401 || status === 403 ? 503 : (status || 503);
      throw e;
    }
  }
}

module.exports = { OpenAIProvider };
