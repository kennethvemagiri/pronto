# Pronto — Intelligent Prompt Enhancement

Transform rough ideas into clear, structured prompts for any AI model in seconds.

**Live Demo**: https://pronto.online

## ✨ Features

- **Smart Polish**: Enhance prompts using **local models via Ollama** (no API keys required)
- **Interactive Keywords**: Click to edit keywords and watch your polish update instantly (green highlights)
- **Editable Parameters**: Modify red-highlighted words to fine-tune recommendations (instant re-polish)
- **Improvements Tracking**: See exactly what was improved in your prompt
- **Works Offline**: Basic polish works fully offline; AI polish works locally with Ollama
- **Secure**: No data sent to closed-source platforms, your privacy respected
- **Mobile Friendly**: Works perfectly on phone, tablet, or desktop

## 🚀 Quick Start

### Local Desktop App (Windows `.exe`) — recommended

Prereqs:
- Node.js 18+
- Ollama installed (for AI mode): https://ollama.com

```bash
# Install deps
npm install

# (Optional) configure Ollama model/base URL
copy .env.example .env

# Run desktop app (Electron)
npm run electron:dev
```

### Build the Windows `.exe`

```bash
npm install
npm run dist
```

Build outputs will appear in `dist/` (NSIS installer + portable exe).

### Local Development (server)

```bash
# Clone the repo
git clone https://github.com/your-username/pronto-online.git
cd pronto-online

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Optional: set local Ollama model in .env
# - PRONTO_OLLAMA_MODEL (default: llama3)
# - PRONTO_OLLAMA_BASE_URL (default: http://127.0.0.1:11434)

# Start dev server
npm run dev

# Open http://localhost:3000
```

### Environment Variables

- `PRONTO_LLM_PROVIDER`: LLM provider selector (default: `ollama`)
- `PRONTO_OLLAMA_BASE_URL`: Ollama API base URL (default: `http://127.0.0.1:11434`)
- `PRONTO_OLLAMA_MODEL`: Ollama model name (default: `llama3`)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`: optional auth/history
- `NODE_ENV`: `development` or `production`
- `PORT`: server port (only for `npm run dev` / `npm start`)

## 📦 How It Works

### The Polish Flow

1. **User Input** → Enters rough prompt, selects tone/audience
2. **Local Polish** → Applied immediately (grammar, structure)
3. **AI Enhancement** (optional) → Your local model (via Ollama) refines based on intent
4. **Interactive Output** → Keywords highlighted green, editables in red
5. **Edit & Re-Polish** → Click red words to edit, auto-refreshes polish with your local model

### Interactive Keywords

- **Green keywords**: Domain terms, verbs, main concepts (read-only)
- **Red editables**: Variables, parameters, customizable values (click to edit)
- **Instant re-polish**: 500ms debounce after edit → fresh polish with updated keywords

## 🏗️ Architecture

```
Frontend (Vanilla JS)
├── app.js          (Core logic, message rendering)
├── wb.js           (Workbench UI, interactivity)
└── styles.css      (Styling, animations)

Backend (Express + Node.js)
├── server.js       (API, local LLM integration, Supabase optional)
├── vercel.json     (Deployment config)
└── package.json    (Dependencies)

Data
└── Supabase (optional, for history & auth)
```

## 📚 API Endpoints

### POST `/api/polish`

Polish a prompt with AI enhancement.

**Request**:
```json
{
  "prompt": "write a blog post",
  "tone": "professional",
  "audience": "marketers",
  "constraints": "under 500 words",
  "mode": "ai"
}
```

**Response**:
```json
{
  "polished": "Write a professional blog post targeting marketers...",
  "marked": [
    { "text": "Write", "type": "keyword" },
    { "text": " a ", "type": "text" },
    { "text": "blog post", "type": "keyword" }
  ],
  "improvements": ["Added audience", "Specified format"],
  "bullets": ["Full polished text"]
}
```

### GET `/api/history` (Authenticated)

Get user's prompt history (requires Supabase JWT).

### POST `/api/contact`

Submit a contact form message.

### GET `/health`

Health check endpoint (for monitoring).

## 🔒 Security

- **No logs of prompts**: Prompts aren't stored unless you authenticate
- **Secure API keys**: Use environment variables, never hardcoded
- **Rate limiting**: 20 polishes/hour per IP (free tier)
- **HTTPS only**: Recommended for production
- **Security headers**: CORS, CSP, XFrame, etc. configured

## 🌐 Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# You'll be prompted to:
# 1. Create/link a project
# 2. Set environment variables (optional Supabase keys, etc.)
# 3. Deploy!
```

**Full Setup Guide**: See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Deploy to Netlify

Not recommended for Node.js backend. Use Vercel or self-host.

### Self-Host (AWS, DigitalOcean, etc.)

```bash
# On your server:
git clone <repo>
cd pronto-online
npm install
npm start

# Use PM2 or similar for process management
npm install -g pm2
pm2 start server.js --name pronto
```

## 🧪 Testing

```bash
# Run tests (currently basic setup)
npm test

# Manual testing
npm run dev
# Open http://localhost:3000/workbench.html
# Enable AI mode, try a prompt!
```

## 📊 Monitoring

- **Health endpoint**: `GET /health` returns status
- **Logs**: Check `NODE_ENV=production` logs for errors

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

## 🙋 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/pronto-online/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/pronto-online/discussions)
- **Email**: support@pronto.online

## 🎯 Roadmap

- [ ] Save & load prompt history (Supabase integration)
- [ ] Custom models selection
- [ ] Prompt templates library
- [ ] Team collaboration
- [ ] API pricing tier
- [ ] Mobile app (React Native)

---

**Made with ❤️ for prompt engineers everywhere**
