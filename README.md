# 🌱 CropVet — AI-Powered Farm Management

> Autonomous crop health intelligence for Kenyan smallholder farmers.

---

## 📁 File Structure

```
cropvet/
├── .env.example                    ← Copy to .env and fill in keys
├── .gitignore
├── docker-compose.yml              ← Local dev (Ollama + backend + frontend)
├── docker-compose.prod.yml         ← Production build
├── deploy.sh                       ← One-command local deploy
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── railway.json                ← Railway deploy config
│   ├── requirements.txt
│   └── app/
│       ├── main.py                 ← FastAPI app entry point
│       ├── config.py               ← Settings from .env
│       └── routes/
│           ├── auth.py             ← Supabase email+phone 2FA
│           ├── diagnose.py         ← Groq Vision image analysis
│           ├── chat.py             ← Groq general farm assistant
│           ├── cropmind.py         ← Ollama local AI agent
│           ├── timeline.py         ← Farm advisory calendar
│           └── marketplace.py      ← Agro-input marketplace
│
└── frontend/
    ├── Dockerfile
    ├── vercel.json                 ← Vercel deploy config
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx                 ← Routes + auth guard
        ├── index.css               ← Design system + Tailwind
        ├── lib/
        │   ├── api.js              ← Axios instance → backend
        │   └── supabase.js         ← Supabase client
        ├── hooks/
        │   └── useAuth.jsx         ← Auth state + helpers
        ├── components/
        │   ├── Layout.jsx          ← Sidebar + mobile nav
        │   ├── ProtectedRoute.jsx
        │   └── ui/
        │       ├── Button.jsx
        │       ├── Card.jsx
        │       └── Badge.jsx
        └── pages/
            ├── Landing.jsx         ← Marketing / entry page
            ├── auth/
            │   ├── Login.jsx
            │   ├── Register.jsx
            │   └── Verify2FA.jsx   ← OTP (email + SMS)
            ├── Dashboard.jsx       ← Farm overview + stats
            ├── Diagnose.jsx        ← Groq Vision image upload
            ├── CropMind.jsx        ← Autonomous AI agent HQ
            ├── Assistant.jsx       ← Groq chatbot
            ├── Timeline.jsx        ← Advisory calendar
            ├── Marketplace.jsx     ← Agro-input shop
            └── Settings.jsx        ← Farm profile + 2FA
```

---

## 🚀 Deploy Instructions

### Local Development (Docker)
```bash
cp .env.example .env        # Fill in your keys
./deploy.sh                  # Builds everything + starts Ollama
```
Access:
- Frontend → http://localhost:3000
- Backend API → http://localhost:8000
- API Docs → http://localhost:8000/docs

---

### Deploy to Railway (Backend)
1. Push your repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the **`backend/`** folder as root
4. Add all env variables from `.env.example` in Railway's Variables tab
5. Railway auto-detects `railway.json` and deploys

**Important env vars for Railway:**
```
GROQ_API_KEY=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
CORS_ORIGINS=https://your-vercel-app.vercel.app
```

---

### Deploy to Vercel (Frontend)
1. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
2. Set **Root Directory** to `frontend/`
3. Framework preset: **Vite**
4. Add env variable:
```
VITE_API_URL=https://your-railway-backend.railway.app
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```
5. Deploy — Vercel reads `vercel.json` automatically

---

### CropMind Local AI (Ollama)
CropMind runs locally on Docker — no API key needed.
The model (`llama3.2:3b`) is downloaded automatically on first deploy (~2GB).
It is stored in a persistent Docker volume so it survives restarts.

---

## 🔑 Keys Needed
| Service | Required | Purpose |
|---|---|---|
| Groq | ✅ Yes | Image diagnosis + Farm Assistant chat |
| Supabase | ✅ Yes | Auth (email + phone 2FA), database |
| Crop.health | Optional | More accurate disease ID (falls back to Groq) |
| Mapbox | Optional | Farm map feature |

Get Groq free at: https://console.groq.com
Get Supabase free at: https://supabase.com
