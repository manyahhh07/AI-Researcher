# Backend — AI Research Paper Assistant

## Setup

```bash
cd backend
pip install -r requirements.txt
export ANTHROPIC_API_KEY=sk-ant-...
python main.py
```

Server runs at http://localhost:8000

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /upload | Upload a PDF paper |
| GET | /papers | List all uploaded papers |
| POST | /ask | Ask a question about a paper |
| POST | /summarize | Summarize a paper (concise/detailed/eli5) |
| GET | /equations/{id} | Extract equations from a paper |
| GET | /citations/{id} | Extract citations from a paper |
| POST | /search | Semantic keyword search within a paper |
| DELETE | /papers/{id} | Delete a paper |

## Architecture

```
Upload PDF
    │
    ▼
PyMuPDF (text + metadata extraction)
    │
    ├── Chunking (1500-word overlapping chunks)
    ├── Equation extraction (regex patterns)
    ├── Citation extraction (regex patterns)
    └── Quick summary (Claude Sonnet)

Ask / Search
    │
    ▼
Cosine keyword similarity → top-K chunks
    │
    ▼
Claude Sonnet (context-grounded answer)
```

## Production Upgrades
- Replace in-memory store with ChromaDB + real embeddings
- Add LangChain for RAG pipeline
- Add Ollama as local LLM alternative
- Add Redis for session persistence
- Add auth (JWT)
