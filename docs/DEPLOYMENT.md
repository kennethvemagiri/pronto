# Deployment Guide — Pronto to Vercel

Deploy Pronto to production on Vercel in 5 minutes.

## Prerequisites

- [Vercel account](https://vercel.com/signup) (free)
- [GitHub account](https://github.com/signup) (to push code)

> Note: **AI polish is designed for local/desktop usage with Ollama** (see `README.md`). A hosted Vercel deployment can still serve the UI + basic polish, but **AI mode requires a reachable LLM endpoint** (typically not available on Vercel unless you operate your own remote inference service).

## Step 1: Prepare Your Code

### 1.1 Create a GitHub Repository

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Pronto AI prompt enhancer"

# Create repo on GitHub, then push
git remote add origin https://github.com/YOUR_USERNAME/pronto-online.git
git branch -M main
git push -u origin main
```

### 1.2 Verify .env.example

Ensure `.env.example` contains all required variables:

```bash
cat .env.example
```

Should show:
```
PRONTO_LLM_PROVIDER=ollama
PRONTO_OLLAMA_BASE_URL=http://127.0.0.1:11434
PRONTO_OLLAMA_MODEL=llama3
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
PORT=3000
NODE_ENV=development
```

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Continue with GitHub"** and authorize Vercel
4. Search for your `pronto-online` repository
5. Click **"Import"**

### 2.2 Configure Environment Variables

In Vercel's import screen, you'll see "Environment Variables":

**Add each variable**:

| Key | Value | Required |
|-----|-------|----------|
| `SUPABASE_URL` | `https://xxx.supabase.co` | ❌ No |
| `SUPABASE_ANON_KEY` | `eyJhbGc...` | ❌ No |
| `SUPABASE_SERVICE_KEY` | `eyJhbGc...` | ❌ No |
| `NODE_ENV` | `production` | ✅ Yes |

**Where to get these**:

- **Supabase keys** (optional): [supabase.com/dashboard](https://supabase.com/dashboard)

### 2.3 Deploy

Click **"Deploy"**. Vercel will:
1. Clone your repo
2. Install dependencies (`npm install`)
3. Run build script (`npm run build`)
4. Start the server

**Wait 2-3 minutes**. You'll see a "Congratulations!" message with your live URL.

## Step 3: Verify Deployment

### 3.1 Test the Live Site

```bash
# Your Vercel URL will be something like:
# https://pronto-online.vercel.app

# Test health endpoint:
curl https://pronto-online.vercel.app/health

# Should return:
# {"status":"ok","timestamp":"2026-04-20T...","environment":"production",...}
```

### 3.2 Test in Browser

1. Go to `https://your-url.vercel.app/workbench.html`
2. Enter a rough prompt: `"write a blog about marketing"`
3. Click **Polish** (AI mode should be ON)
4. Verify:
   - ✅ Output appears with green/red highlighting
   - ✅ Green keywords are highlighted
   - ✅ Red words are editable
   - ✅ Click a red word → type → re-polish triggers after 500ms

### 3.3 Monitor Errors

- Go to Vercel dashboard → Your project → **"Functions"** tab
- Check logs for errors

## Step 4: Custom Domain (Optional)

### 4.1 Add Custom Domain

1. In Vercel dashboard, go to **"Settings"** → **"Domains"**
2. Enter your domain (e.g., `pronto.example.com`)
3. Follow DNS setup instructions for your registrar
4. Vercel will auto-issue SSL certificate

### 4.2 Redirect Root Domain

If you want `https://example.com` → `https://pronto.example.com`:

In your domain registrar:
- Set A record to Vercel's IP
- Or use CNAME (if Vercel supports it for your domain)

## Step 5: Monitor Production

### 5.1 Check Health Endpoint

Set up a monitor (e.g., [uptime.robot](https://uptimerobot.com)):

```
GET https://your-url.vercel.app/health
```

Should always return `{"status":"ok",...}`

### 5.2 View Logs

**Vercel logs**:
- Dashboard → Your project → **"Deployments"** tab
- Click latest deployment → **"Logs"**

**Request metrics**:
- Dashboard → Your project → **"Analytics"** tab

## Step 6: Make Updates

### 6.1 Update Code Locally

```bash
# Make changes, test locally
npm run dev

# Commit and push
git add .
git commit -m "Update: improved error messages"
git push origin main
```

### 6.2 Auto-Redeploy

Vercel automatically redeploys when you push to `main` branch.

**Wait 2-3 minutes**, then your live site updates.

### 6.3 Manual Redeploy

In Vercel dashboard:
1. Click your project
2. Go to **"Deployments"** tab
3. Click the three dots on latest deployment
4. Choose **"Redeploy"**

## Troubleshooting

### Issue: `npm install` fails on Vercel

**Solution**:
1. Confirm your repo includes `package-lock.json`
2. Redeploy with **Clear build cache**
3. If a dependency fails to compile, check Node version compatibility (this project targets Node 18+)

### Issue: AI mode returns `LLM not available` / Ollama unreachable

**Reason**: The server tries to call Ollama at `PRONTO_OLLAMA_BASE_URL` (default `http://127.0.0.1:11434`). On a hosted Vercel deployment, that address is **the server itself**, not your laptop — so AI mode will fail unless you run your own reachable inference endpoint.

**Solution (recommended)**:
- Use the **desktop build** (`npm run dist`) for local AI polish with Ollama.

**Solution (self-hosted server)**:
- Run Ollama (or another compatible inference server) on a host your deployment can reach, then set `PRONTO_OLLAMA_BASE_URL` accordingly.

### Issue: Slow `/api/polish` responses

**Solution**:
1. Check `/health` latency first
2. If only `/api/polish` is slow, the bottleneck is usually model inference (CPU/GPU) or prompt size
3. Try a smaller/faster model (`PRONTO_OLLAMA_MODEL`)

### Issue: Interactive keywords not showing (no color)

**Reason**: The model didn’t return `<keyword>` / `<editable>` markup in the `polished` field.

**Solution**:
1. Try again (some models are inconsistent)
2. Confirm you’re using a capable instruct/chat model
3. The UI still works without markup (plain text)

## Performance Tips

### Cache Static Assets

Already configured in `vercel.json`:
- `/public/*` cached for 1 year

### Optimize Bundle

```bash
# Check bundle size
npm ls --depth=0

# Remove unused dependencies
npm prune
```

### Monitor Response Times

In Vercel dashboard → **Analytics**:
- Check avg response time per endpoint
- Look for spikes or bottlenecks

## Cost Estimates

| Component | Free Tier | Cost |
|-----------|-----------|------|
| Vercel Hosting | ✅ Included | $0 |
| Local inference (Ollama) | N/A | $0 (runs on your hardware) |
| Supabase (optional) | 500K auth ops | $0-25/mo |

**Total**: Typically **$0** for hosting + whatever optional services you enable.

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] `NODE_ENV=production` is set
- [ ] Security headers are enabled (vercel.json configured)
- [ ] HTTPS is enforced (Vercel default)
- [ ] Rate limiting is active (20 reqs/hour)

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test the live site
3. ✅ Configure custom domain (optional)
4. 📧 Share with users!

---

**Questions?** Check [GitHub Issues](https://github.com/your-username/pronto-online/issues) or email support@pronto.online
