# Pronto.online ( comming soon into an web app )

FREE AI-powered prompt enhancement tool. Paste a rough prompt, pick a mode, get a polished version ready for any AI. Yes It will be FREE

## Modes
- Default — clarity and structure
- Professional — formal, business-ready
- Friendly — warm and conversational
- Detailed — thorough with edge cases
- Creative — imaginative and open-ended
- Concise — stripped to bare essentials
- More ( comming soon into an web app )

## Tech Stack
- Frontend: Vanilla JS, HTML, CSS
- Backend: Node.js, Express
- AI: OpenAI API (gpt-4o-mini)
- Auth/DB: Supabase (optional)
- Hosting: Vercel

## Setup
1. Clone the repo
2. npm install
3. Copy .env.example to .env and add your OpenAI API key
4. npm run dev
5. Open http://localhost:3000

## API
POST /api/polish — enhances a prompt with selected mode

Remove everything about Ollama, Electron, Windows exe, interactive keywords, green/red highlights, mobile app roadmap, and any feature that doesn't currently exist. No emojis in headers. Keep it under 40 lines total.
