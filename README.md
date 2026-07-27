# 🧠 PaperSense AI
### *Read Less. Understand More.*

> Full-stack AI research paper assistant — upload PDFs, chat with them, summarize, extract equations & citations, and search semantically.
> **100% FREE AI** powered by Groq + Llama 3.3 70B. No credit card required.

---

## 🎨 Theme
- **Colors:** Deep maroon `#6B1A2A` × Baby pink `#F7C5D0`
- **Background:** Subtle checkered pattern
- **Fonts:** Playfair Display (headings) · Inter (body) · JetBrains Mono (code)

---

## 📁 Complete Project Structure

```
papersense-ai/
│
├── .env.example                   ← Copy → backend/.env, add GROQ_API_KEY
├── start.sh                       ← One-command launcher (both services)
├── README.md                      ← You are here
│
├── 📂 backend/
│   ├── main.py                    ← FastAPI app: 8 routes, PDF processing, Groq AI
│   ├── requirements.txt           ← FastAPI, PyMuPDF, openai (for Groq compat)
│   ├── .env.example               ← Backend env template
│   └── README.md                  ← Backend-specific docs + upgrade path
│
└── 📂 frontend/
    ├── package.json               ← React 18 deps + proxy config
    ├── public/
    │   └── index.html             ← HTML shell
    └── src/
        ├── index.js               ← ReactDOM entry point
        ├── App.js                 ← Root layout, routing, state orchestration
        ├── App.css                ← Full design system (tokens, all component styles)
        │
        ├── 📂 pages/              ← Page-level route components
        │   ├── HomePage.js        ← Landing page (wraps UploadZone)
        │   └── WorkspacePage.js   ← Paper workspace page (wraps PaperWorkspace)
        │
        ├── 📂 components/         ← Reusable UI components
        │   ├── Sidebar.js         ← Left rail: paper list + tech stack card
        │   ├── UploadZone.js      ← Drag-and-drop PDF uploader + feature grid
        │   └── PaperWorkspace.js  ← 5-tab workspace (Q&A, Summary, Eq, Cit, Search)
        │
        ├── 📂 hooks/              ← Custom React hooks
        │   ├── useApi.js          ← Generic async API hook (loading/error/data)
        │   └── usePapers.js       ← Paper list state (fetch, add, remove)
        │
        └── 📂 utils/
            └── api.js             ← Axios wrappers for all 8 backend endpoints
```

---

## 🚀 Quick Start

### Step 1 — Get your FREE Groq API key
1. Go to **https://console.groq.com**
2. Sign up with Google/GitHub (no credit card)
3. Click **API Keys → Create API Key**
4. Copy your key (starts with `gsk_...`)

### Step 2 — Run with one command
```bash
git clone https://github.com/you/papersense-ai
cd papersense-ai

# Add your key
cp .env.example backend/.env
# Edit backend/.env → set GROQ_API_KEY=gsk_...

# Launch both services
bash start.sh
```

### Or run manually
```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
export GROQ_API_KEY=gsk_YOUR_KEY_HERE
python main.py
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger UI)

# Terminal 2 — Frontend
cd frontend
npm install
npm start
# → http://localhost:3000
```

---

## 🤖 Free AI — Groq + Llama 3.3 70B

| Property | Value |
|---|---|
| Provider | Groq Cloud |
| Model | `llama-3.3-70b-versatile` |
| Free daily limit | **14,400 requests/day** |
| Speed | 300–800 tokens/second |
| Credit card | ❌ Not required |
| API format | OpenAI-compatible |
| Sign up | https://console.groq.com |

The backend uses the `openai` Python SDK pointed at `https://api.groq.com/openai/v1` — so swapping to a paid provider (OpenAI, Anthropic) in the future is a 2-line change.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/upload` | Upload & process a PDF |
| `GET` | `/papers` | List all uploaded papers |
| `POST` | `/ask` | Ask AI a question about a paper |
| `POST` | `/summarize` | Summarize (concise / detailed / eli5) |
| `GET` | `/equations/{id}` | Extract equations |
| `GET` | `/citations/{id}` | Extract citations |
| `POST` | `/search` | Keyword semantic search |
| `DELETE` | `/papers/{id}` | Delete a paper |

---

## 🏗️ Architecture

```
PDF Upload → PyMuPDF (text extract) → Chunker (1500w overlap)
                                    → Equation extractor (regex)
                                    → Citation extractor (regex)
                                    → Groq quick-summary

User Question → Cosine keyword search → Top-4 chunks
                                      → Groq (context-grounded answer)
```

---

## 🔮 Production Upgrade Path

| Current (Free MVP) | Production |
|---|---|
| In-memory dict | ChromaDB / Pinecone vector store |
| Keyword similarity | Real embeddings (sentence-transformers) |
| Groq free tier | Groq paid / OpenAI / Anthropic |
| Single process | Gunicorn + workers |
| No auth | JWT auth + user sessions |
