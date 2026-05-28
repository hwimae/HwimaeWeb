# AI service

Python/FastAPI service for story recommendation RAG with local embeddings and Gemini-generated answers.

## Setup

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r ai/requirements.txt
```

## Run

Set a Gemini API key before starting the service:

```powershell
$env:GEMINI_API_KEY="your-gemini-api-key"
$env:PYTHONPATH="ai"
uvicorn app.main:app --app-dir ai --host 127.0.0.1 --port 8000
```

The first `/embed` request downloads `intfloat/multilingual-e5-small` into the local Hugging Face cache. The `/answer` endpoint uses Gemini via `GEMINI_API_KEY`; override `GEMINI_MODEL` if you want a different Gemini model.
