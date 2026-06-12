# AI service

Service Python/FastAPI nội bộ cho RAG gợi ý truyện và các endpoint tài chính/Moniagent.

## Setup

```powershell
python -m venv ai/.venv
.\ai\.venv\Scripts\Activate.ps1
pip install -r ai/requirements.txt
```

## Module layout

- `app/modules/story`: RAG story endpoints (`/embed`, `/answer`, `/story/embed`, `/story/answer`).
- `app/modules/finance`: finance extraction, advice, chat và invoice OCR dùng nội bộ bởi Express backend.
- `app/modules/movie`: module boundary dự phòng; chưa triển khai movie recommendation.

Finance endpoints được thiết kế để vẫn chạy được khi chưa có Gemini key bằng deterministic fallback. Gemini giúp cải thiện chất lượng extraction/advice/OCR khi được cấu hình.

## Biến môi trường

Copy `ai/.env.example` thành `ai/.env` và cấu hình khi cần gọi Gemini thật:

```env
GEMINI_API_KEY=
GEMINI_API_URL="https://generativelanguage.googleapis.com/v1beta"
GEMINI_MODEL="gemini-2.5-flash"
EMBEDDING_MODEL="intfloat/multilingual-e5-small"
```

- `GEMINI_API_KEY`: cần cho endpoint `/answer` khi gọi Gemini thật; không commit key thật. Finance endpoints vẫn có deterministic fallback khi chưa cấu hình key.
- `GEMINI_API_URL`: URL Gemini API, giữ mặc định nếu dùng API public.
- `GEMINI_MODEL`: model Gemini dùng cho sinh câu trả lời.
- `EMBEDDING_MODEL`: model embedding local; request `/embed` đầu tiên có thể tải model về Hugging Face cache.

Backend Express gọi service này qua `AI_SERVICE_URL`, ví dụ trong `backend/.env`:

```env
AI_SERVICE_URL="http://localhost:8000"
```

## Run

```powershell
$env:PYTHONPATH="ai"
uvicorn app.main:app --app-dir ai --host 127.0.0.1 --port 8000
```

## Test

```powershell
.\ai\.venv\Scripts\python.exe -m pytest -c ai/pytest.ini ai/tests -v
```

Các test finance dùng logic deterministic/mocked và không yêu cầu network Gemini thật.

## Endpoint chính

### RAG gợi ý truyện

- `GET /health`
- `POST /embed`
- `POST /answer`
- `POST /story/embed`
- `POST /story/answer`

### Finance / Moniagent nội bộ

- `POST /expense/extract-text`
- `POST /advice/generate`
- `POST /chat/respond`
- `POST /invoice/extract-image`
- `POST /finance/expense/extract-text`
- `POST /finance/advice/generate`
- `POST /finance/chat/respond`
- `POST /finance/invoice/extract-image`

### Movie boundary

- `GET /movie/info`

Finance endpoints không sở hữu auth hoặc database chính. Backend Express gửi context đã xác thực và lưu dữ liệu cuối cùng bằng Prisma.
