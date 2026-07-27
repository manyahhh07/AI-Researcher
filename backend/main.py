"""
PaperSense AI — FastAPI Backend
FREE AI powered by Groq (llama-3.3-70b-versatile)
No credit card required. Get key at: https://console.groq.com
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, os, re, hashlib, time
from typing import Optional
from pydantic import BaseModel

# PDF extraction
import fitz  # PyMuPDF

# Groq — free, OpenAI-compatible
from openai import OpenAI

app = FastAPI(title="PaperSense AI", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Groq client (OpenAI-compatible, totally free) ──────────
groq = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY", ""),
    base_url="https://api.groq.com/openai/v1",
)
GROQ_MODEL = "llama-3.3-70b-versatile"   # 14,400 req/day free

# ── In-memory paper store ──────────────────────────────────
papers_store: dict = {}   # paper_id → paper dict

# ── Pydantic models ────────────────────────────────────────
class QuestionRequest(BaseModel):
    paper_id: str
    question: str

class SummarizeRequest(BaseModel):
    paper_id: str
    style: Optional[str] = "concise"  # concise | detailed | eli5

class SearchRequest(BaseModel):
    paper_id: str
    query: str

# ── Helpers ────────────────────────────────────────────────

def extract_text_from_pdf(file_bytes: bytes) -> tuple[str, dict]:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    metadata = doc.metadata or {}
    pages = [page.get_text() for page in doc]
    return "\n\n".join(pages), metadata


def chunk_text(text: str, size: int = 1500, overlap: int = 200) -> list[str]:
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + size]))
        i += size - overlap
    return chunks


def extract_equations(text: str) -> list[str]:
    patterns = [
        r'\$[^$\n]{2,80}\$',
        r'\$\$[^$]{4,200}\$\$',
        r'\\begin\{equation\}.*?\\end\{equation\}',
        r'(?<![a-z])([A-Za-z]\s*[=≈≤≥<>∝]+\s*[^\n,;.]{3,60})',
    ]
    eqs = []
    for p in patterns:
        eqs.extend(re.findall(p, text, re.DOTALL))
    return list(dict.fromkeys(eqs))[:30]   # deduplicate, cap at 30


def extract_citations(text: str) -> list[dict]:
    seen, results = set(), []
    for c in re.findall(r'\[([A-Za-z][^\]]{2,60}|[0-9]{1,3})\]', text):
        if c not in seen:
            seen.add(c); results.append({"type": "inline", "text": c})
    for c in re.findall(r'\(([A-Z][a-z]+(?:\s+et\s+al\.)?(?:,\s*\d{4})?)\)', text):
        if c not in seen:
            seen.add(c); results.append({"type": "inline", "text": c})
    for line in re.findall(r'\n\s*\[?\d+\]?\s+[A-Z][^.\n]{20,150}\.', text)[:30]:
        line = line.strip()
        if line not in seen:
            seen.add(line); results.append({"type": "reference", "text": line})
    return results[:50]


def cosine_sim(query: str, chunk: str) -> float:
    qw = set(query.lower().split())
    cw = set(chunk.lower().split())
    if not qw or not cw:
        return 0.0
    return len(qw & cw) / (len(qw) ** 0.5 * len(cw) ** 0.5 + 1e-9)


def semantic_search(paper_id: str, query: str, top_k: int = 4) -> list[dict]:
    paper = papers_store.get(paper_id)
    if not paper:
        return []
    scored = sorted(
        [(cosine_sim(query, c), i, c) for i, c in enumerate(paper["chunks"])],
        reverse=True,
    )
    return [{"chunk_index": i, "score": round(s, 4), "text": c[:600]}
            for s, i, c in scored[:top_k]]


def call_groq(system: str, user: str, max_tokens: int = 1024) -> str:
    """Single Groq (free Llama) call."""
    resp = groq.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=max_tokens,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user},
        ],
    )
    return resp.choices[0].message.content

# ── Routes ─────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "app": "PaperSense AI", "model": GROQ_MODEL, "provider": "Groq (free)"}


@app.post("/upload")
async def upload_paper(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are supported.")

    file_bytes = await file.read()
    paper_id = hashlib.md5(file_bytes).hexdigest()[:12]

    if paper_id not in papers_store:
        text, metadata = extract_text_from_pdf(file_bytes)
        chunks    = chunk_text(text)
        equations = extract_equations(text)
        citations = extract_citations(text)

        try:
            quick_summary = call_groq(
                "You are a research paper assistant. Give a 2-sentence plain-language overview of this paper.",
                f"Paper excerpt (first 2000 chars):\n{text[:2000]}",
                max_tokens=200,
            )
        except Exception as e:
            quick_summary = f"Summary unavailable ({str(e)[:60]})"

        papers_store[paper_id] = {
            "filename":     file.filename,
            "text":         text,
            "chunks":       chunks,
            "metadata":     metadata,
            "equations":    equations,
            "citations":    citations,
            "quick_summary": quick_summary,
            "uploaded_at":  time.time(),
            "word_count":   len(text.split()),
        }

    p = papers_store[paper_id]
    return {
        "paper_id":       paper_id,
        "filename":       p["filename"],
        "word_count":     p["word_count"],
        "chunk_count":    len(p["chunks"]),
        "equation_count": len(p["equations"]),
        "citation_count": len(p["citations"]),
        "quick_summary":  p["quick_summary"],
        "metadata":       p["metadata"],
    }


@app.get("/papers")
def list_papers():
    return [
        {"paper_id": pid, "filename": p["filename"],
         "word_count": p["word_count"], "uploaded_at": p["uploaded_at"]}
        for pid, p in papers_store.items()
    ]


@app.post("/ask")
def ask_question(req: QuestionRequest):
    paper = papers_store.get(req.paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")

    relevant = semantic_search(req.paper_id, req.question, top_k=4)
    context  = "\n\n---\n\n".join(r["text"] for r in relevant)

    answer = call_groq(
        (
            "You are an expert research assistant. Answer the user's question "
            "using ONLY the provided paper context. Be precise. "
            "Cite specific sections when possible. "
            "If the answer isn't in the context, say so honestly."
        ),
        f"PAPER CONTEXT:\n{context}\n\nQUESTION: {req.question}",
        max_tokens=900,
    )
    return {"answer": answer, "sources": relevant}


@app.post("/summarize")
def summarize_paper(req: SummarizeRequest):
    paper = papers_store.get(req.paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")

    instructions = {
        "concise":  "Summarize the paper in 3-5 bullet points: objective, methods, key findings, conclusions.",
        "detailed": "Write a structured summary with sections: Overview, Methodology, Key Findings, Limitations, Future Work.",
        "eli5":     "Explain this research paper as if the reader is a 16-year-old. Use simple language, no jargon, real-world analogies.",
    }
    instruction = instructions.get(req.style, instructions["concise"])

    summary = call_groq(
        "You are a research paper summarization expert.",
        f"TASK: {instruction}\n\nPAPER TEXT (first 6000 chars):\n{paper['text'][:6000]}",
        max_tokens=1100,
    )
    return {"summary": summary, "style": req.style}


@app.get("/equations/{paper_id}")
def get_equations(paper_id: str):
    paper = papers_store.get(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    return {"equations": paper["equations"], "count": len(paper["equations"])}


@app.get("/citations/{paper_id}")
def get_citations(paper_id: str):
    paper = papers_store.get(paper_id)
    if not paper:
        raise HTTPException(404, "Paper not found.")
    return {"citations": paper["citations"], "count": len(paper["citations"])}


@app.post("/search")
def search_paper(req: SearchRequest):
    if not papers_store.get(req.paper_id):
        raise HTTPException(404, "Paper not found.")
    results = semantic_search(req.paper_id, req.query, top_k=5)
    return {"results": results, "query": req.query}


@app.delete("/papers/{paper_id}")
def delete_paper(paper_id: str):
    if paper_id not in papers_store:
        raise HTTPException(404, "Paper not found.")
    del papers_store[paper_id]
    return {"message": "Paper deleted."}


if __name__ == "__main__":
    if not os.environ.get("GROQ_API_KEY"):
        print("\n⚠️  GROQ_API_KEY not set!")
        print("   Get a FREE key (no credit card) at: https://console.groq.com\n")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
