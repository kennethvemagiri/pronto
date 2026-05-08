const path = require('path');
const fs = require('fs');

const { OllamaProvider } = require('./providers/ollama');
const { OpenAIProvider } = require('./providers/openai');
const { modes } = require('../prompts/modes');

function basicLocalPolish(prompt) {
  const text = (prompt || '').trim();
  if (!text) return { polished: '', improvements: [] };

  let cleaned = text
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .trim();

  if (!/[.?!]$/.test(cleaned)) cleaned += '.';

  cleaned = cleaned[0].toUpperCase() + cleaned.slice(1);

  return {
    polished: cleaned,
    improvements: ['Fixed spacing and punctuation', 'Made the prompt clearer'],
  };
}

function readInstruction(filename) {
  try {
    return fs.readFileSync(path.join(__dirname, '..', 'instructions', filename), 'utf8');
  } catch (e) {
    return null;
  }
}

function lookupMode(name) {
  const key = String(name || '').trim().toLowerCase();
  const found = Object.keys(modes).find((k) => k.toLowerCase() === key);
  return found ? modes[found] : modes.Default;
}

function isAiConfigured() {
  if (getProviderFromEnv() === 'openai') {
    return !!process.env.OPENAI_API_KEY;
  }
  return true;
}

function getProviderFromEnv() {
  const provider = String(process.env.PRONTO_LLM_PROVIDER || 'ollama').toLowerCase();
  if (provider === 'openai') return 'openai';
  return 'ollama';
}

function createProvider() {
  const provider = getProviderFromEnv();
  if (provider === 'openai') {
    return new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.PRONTO_OPENAI_MODEL || 'gpt-4o-mini',
    });
  }
  return new OllamaProvider({
    baseUrl: process.env.PRONTO_OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model: process.env.PRONTO_OLLAMA_MODEL || 'llama3',
  });
}

async function generatePolish(params) {
  const { prompt, mode } = params || {};

  const modeDef = lookupMode(mode);

  if (!isAiConfigured()) {
    console.warn('[llm] No AI provider configured; using basicLocalPolish');
    return basicLocalPolish(prompt);
  }

  const aiExtra = readInstruction('ai-intelligence.md');
  const combined = aiExtra
    ? `${modeDef.systemPrompt}\n\n---\n\n${aiExtra}`
    : modeDef.systemPrompt;

  const provider = createProvider();
  return provider.generatePolish({ ...params, systemPrompt: combined });
}

module.exports = {
  generatePolish,
  getProviderFromEnv,
};
