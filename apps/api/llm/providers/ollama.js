function buildUserMessage({ prompt, audience, tone, constraints, mode }) {
  const text = (prompt || '').trim();
  let userMessage = `Polish this prompt:\n\n"${text}"`;
  if (tone) userMessage += `\nTone: ${tone}`;
  if (audience) userMessage += `\nTarget audience: ${audience}`;
  if (constraints) userMessage += `\nConstraints: ${constraints}`;

  if (mode === 'ai') {
    userMessage += '\n\nIn your polished response, wrap important domain terms, verbs, and key concepts in <keyword>tags</keyword>. Wrap variables, parameters, and user-customizable values in <editable>tags</editable>.';
  }

  userMessage += '\n\nRespond with only the JSON object (polished + improvements).';
  return userMessage;
}

async function postJson(url, body, { timeoutMs } = {}) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs || 45000);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) {
      const e = new Error(`Ollama HTTP ${res.status}: ${text}`.slice(0, 1000));
      e.code = 'ollama_http_error';
      e.status = res.status;
      throw e;
    }
    return text;
  } catch (err) {
    if (err && err.name === 'AbortError') {
      const e = new Error('Ollama request timed out');
      e.code = 'ollama_timeout';
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(t);
  }
}

function safeJsonParse(s) {
  const text = String(s || '').trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    // Many local models sometimes wrap JSON with extra text.
    // Extract the first {...} block as a best-effort.
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const slice = text.slice(start, end + 1);
      try {
        return JSON.parse(slice);
      } catch (_) {}
    }
    return null;
  }
}

class OllamaProvider {
  constructor({ baseUrl, model }) {
    this.baseUrl = String(baseUrl || 'http://127.0.0.1:11434').replace(/\/+$/, '');
    this.model = model || 'llama3';
  }

  async generatePolish({ prompt, mode, tone, audience, constraints, systemPrompt }) {
    const userMessage = buildUserMessage({ prompt, mode, tone, audience, constraints });

    // Prefer /api/chat because it’s widely supported and keeps roles.
    const url = `${this.baseUrl}/api/chat`;
    const body = {
      model: this.model,
      stream: false,
      // Ask Ollama to enforce JSON output where supported.
      format: 'json',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      options: {
        temperature: mode === 'ai' ? 0.7 : 0.3,
        top_p: 0.95,
        // Prevent very long generations from hanging local runs.
        num_predict: mode === 'ai' ? 700 : 300,
      },
    };

    let raw;
    try {
      raw = await postJson(url, body, { timeoutMs: 180000 });
    } catch (err) {
      // Normalize common “Ollama not running” cases
      const msg = (err && err.message) ? err.message : String(err);
      if (/ECONNREFUSED|fetch failed|Failed to fetch|getaddrinfo/i.test(msg)) {
        const e = new Error('Ollama is not reachable. Install Ollama and start it.');
        e.code = 'ollama_unreachable';
        e.status = 503;
        throw e;
      }
      throw err;
    }

    const parsed = safeJsonParse(raw);
    const content = parsed && parsed.message && typeof parsed.message.content === 'string'
      ? parsed.message.content
      : (typeof raw === 'string' ? raw : '');

    const data = safeJsonParse(content) || safeJsonParse(raw);

    if (!data) {
      const e = new Error('Model response was not valid JSON');
      e.code = 'ollama_bad_json';
      throw e;
    }

    const polished = typeof data.polished === 'string' ? data.polished.trim() : '';
    if (!polished) {
      const e = new Error('Model returned empty output');
      e.code = 'ollama_empty_output';
      throw e;
    }

    return data;
  }
}

module.exports = { OllamaProvider };

