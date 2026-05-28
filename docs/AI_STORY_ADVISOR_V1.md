# AI Story Advisor v1

Tài liệu này mô tả phiên bản v1 của tính năng **AI tư vấn truyện theo nội dung truyện** trong dự án `story-recommendation`.

## 1. Chức năng chính

AI Story Advisor v1 cho phép người dùng nhập mô tả gu đọc truyện bằng tiếng Việt, ví dụ:

```text
Tôi thích truyện tu tiên, nam chính từ yếu thành mạnh, ít ngôn tình
```

Hệ thống sẽ tìm các truyện có nội dung gần với yêu cầu đó, sau đó dùng Gemini để viết câu trả lời tư vấn ngắn gọn. Kết quả trả về gồm:

- `answer`: câu trả lời tự nhiên bằng tiếng Việt;
- `recommendations`: danh sách truyện phù hợp, có title, tác giả, thể loại, điểm phù hợp và lý do.

Người dùng sử dụng tính năng này tại:

```text
/recommendations
```

## 2. Công nghệ sử dụng

| Tầng | Công nghệ | Vai trò |
|---|---|---|
| Frontend | Next.js App Router, React, TypeScript | Trang nhập gu truyện và hiển thị kết quả tư vấn. |
| Backend API | Express, TypeScript, Zod | Nhận request từ frontend, validate input, điều phối recommendation flow. |
| Database ORM | Prisma | Quản lý schema, model `StoryChunk`, truy vấn dữ liệu truyện. |
| Database | PostgreSQL + pgvector | Lưu embedding vector và search nội dung truyện gần nhất. |
| AI service | Python FastAPI | Cung cấp endpoint tạo embedding và sinh câu trả lời. |
| Embedding model | `intfloat/multilingual-e5-small` | Tạo vector 384 chiều cho query và nội dung truyện. |
| LLM | Gemini API, mặc định `gemini-2.5-flash` | Viết câu trả lời tư vấn dựa trên truyện ứng viên. |
| Test | Jest, pytest, Vitest | Kiểm tra backend, AI service và frontend. |

## 3. Các tầng trong hệ thống

### 3.1. Frontend

Các file chính:

- `frontend/src/app/recommendations/page.tsx`
- `frontend/src/components/story-advisor-form.tsx`
- `frontend/src/types/recommendation.ts`

Vai trò:

1. Hiển thị trang AI tư vấn truyện.
2. Cho người dùng nhập gu đọc truyện.
3. Gọi backend endpoint `POST /recommendations/ask`.
4. Parse response bằng type/parser riêng.
5. Hiển thị câu trả lời AI và danh sách card truyện.

Frontend không gọi Gemini và không gọi AI service trực tiếp. Frontend chỉ giao tiếp với backend Express.

### 3.2. Backend API

Các file chính:

- `backend/src/recommendations/recommendations.router.ts`
- `backend/src/recommendations/recommendations.controller.ts`
- `backend/src/recommendations/recommendations.schema.ts`
- `backend/src/recommendations/recommendations.service.ts`
- `backend/src/recommendations/ai-client.ts`

Vai trò:

1. Định nghĩa route `POST /recommendations/ask`.
2. Validate body:
   - `query`: tối thiểu 2 ký tự, tối đa 1000 ký tự;
   - `limit`: từ 1 đến 10, mặc định 5.
3. Gọi AI service để tạo embedding cho query.
4. Search bảng `story_chunks` bằng pgvector.
5. Gom kết quả theo truyện để tránh trả nhiều chunk của cùng một truyện.
6. Gọi AI service để sinh câu trả lời bằng Gemini.
7. Nếu Gemini lỗi, trả fallback answer deterministic.

Backend chỉ biết AI service thông qua biến:

```env
AI_SERVICE_URL="http://localhost:8000"
```

### 3.3. AI service

Các file chính:

- `ai/app/main.py`
- `ai/app/config.py`
- `ai/app/schemas.py`
- `ai/app/embedding.py`
- `ai/app/llm.py`

Endpoint hiện có:

| Endpoint | Vai trò |
|---|---|
| `GET /health` | Kiểm tra service sống. |
| `POST /embed` | Nhận text và trả embedding vector. |
| `POST /answer` | Nhận query + contexts, gọi Gemini để sinh câu trả lời. |

AI service đọc cấu hình từ:

```text
ai/.env
```

Các biến quan trọng:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=intfloat/multilingual-e5-small
```

Không commit `ai/.env` vì file này chứa secret.

### 3.4. Database và vector storage

Các file chính:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260528000000_add_story_chunks_pgvector/migration.sql`

Model mới:

```prisma
model StoryChunk {
  id         String                 @id @default(cuid())
  storyId    String
  chunkIndex Int
  content    String
  embedding  Unsupported("vector(384)")
  story      Story                  @relation(fields: [storyId], references: [id], onDelete: Cascade)
  createdAt  DateTime               @default(now())

  @@unique([storyId, chunkIndex])
  @@index([storyId])
  @@map("story_chunks")
}
```

Bảng `story_chunks` lưu từng đoạn nội dung truyện sau khi chia chunk. Mỗi chunk có embedding 384 chiều để phục vụ semantic search.

Migration bật extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

và tạo index:

```sql
CREATE INDEX "story_chunks_embedding_idx" ON "story_chunks" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);
```

### 3.5. Indexing pipeline

Các file chính:

- `backend/src/scripts/index-story-chunks.ts`
- `backend/src/recommendations/story-chunker.ts`
- `backend/src/scripts/index-story-chunks.spec.ts`
- `backend/src/recommendations/story-chunker.spec.ts`

Script index làm nhiệm vụ chuẩn bị dữ liệu cho AI search:

1. Lấy truyện có nội dung trong database.
2. Mặc định bỏ qua truyện đã có chunks.
3. Chia nội dung truyện thành các chunk nhỏ.
4. Gọi AI service `/embed` cho từng chunk.
5. Lưu chunk và embedding vào bảng `story_chunks`.
6. Log `Next cursor` để chạy batch tiếp theo.

Cú pháp chính:

```powershell
pnpm --dir backend index:story-chunks
pnpm --dir backend index:story-chunks -- --limit 100
pnpm --dir backend index:story-chunks -- --limit 100 --after <storyId>
pnpm --dir backend index:story-chunks -- --limit 100 --force
```

Ý nghĩa:

| Option | Vai trò |
|---|---|
| Không truyền gì | Index tối đa 20 truyện chưa có chunks. |
| `--limit 100` | Index tối đa 100 truyện trong một batch. |
| `--after <storyId>` | Chạy tiếp từ cursor story id đã log trước đó. |
| `--force` | Re-index cả truyện đã có chunks. |

## 4. Luồng hoạt động end-to-end

### 4.1. Luồng chuẩn bị dữ liệu

Luồng này không chạy mỗi lần user hỏi AI. Chỉ chạy khi cần index dữ liệu mới hoặc re-index.

```text
StoryContent trong DB
  → backend script index-story-chunks
  → clean + chunk nội dung truyện
  → AI service /embed
  → embedding vector 384 chiều
  → lưu vào PostgreSQL story_chunks
```

### 4.2. Luồng user hỏi AI

Luồng này chạy mỗi khi user submit form ở `/recommendations`.

```text
Frontend /recommendations
  → POST backend /recommendations/ask
  → validate query + limit
  → AI service /embed cho query
  → pgvector search trong story_chunks
  → gom chunk theo story
  → AI service /answer
  → Gemini sinh answer
  → backend trả answer + recommendations
  → frontend hiển thị kết quả
```

## 5. Giới hạn của v1

Phiên bản v1 hiện tập trung vào MVP local, nên có một số giới hạn:

- Chưa có background worker cho indexing.
- Chưa có UI hiển thị tiến độ index.
- Chưa có bảng `IndexJob` để lưu lịch sử từng job.
- Chưa batch embedding nhiều chunk trong một request; hiện mỗi chunk gọi `/embed` một lần.
- Chưa version hóa embedding theo model.
- Chưa tự phát hiện truyện đã thay đổi nội dung để re-index tự động.
- Recommendation dựa trên nội dung đã index, không phải toàn bộ metadata nếu truyện chưa có `story_chunks`.

## 6. Khi nào cần chạy lại indexing?

Không cần chạy indexing mỗi lần mở app. Chỉ cần chạy lại khi:

1. Lần đầu setup dữ liệu AI.
2. Vừa import thêm truyện mới.
3. Nội dung truyện thay đổi.
4. Muốn index thêm batch lớn hơn.
5. Đổi embedding model và muốn tạo lại vector.
6. Muốn re-index bằng `--force`.

Nếu chỉ dùng app hằng ngày, chỉ cần chạy:

- AI service;
- backend dev server;
- frontend dev server.

## 7. Các bước khởi tạo phần AI từ đầu

Ban đầu thư mục `ai/` chỉ là placeholder, chưa có service chạy thật. Phần này mô tả lại các bước đã khởi tạo AI Story Advisor v1 từ đầu, gồm tạo môi trường Python, tạo FastAPI service, cấu hình Gemini, kết nối backend và index dữ liệu truyện.

### 7.1. Tạo cấu trúc thư mục AI service

Tạo các thư mục chính:

```powershell
New-Item -ItemType Directory -Force ai/app
New-Item -ItemType Directory -Force ai/tests
```

Lý do:

- `ai/app/` chứa source code runtime của FastAPI service.
- `ai/tests/` chứa test Python cho service.
- Tách `app` và `tests` giúp service dễ chạy bằng `uvicorn app.main:app --app-dir ai` và dễ test bằng `pytest`.

Các file runtime được tạo trong `ai/app/`:

| File | Lý do tạo |
|---|---|
| `ai/app/__init__.py` | Đánh dấu `app` là Python package để import được `app.main`, `app.config`, `app.schemas`. |
| `ai/app/config.py` | Gom cấu hình model embedding, Gemini API URL, Gemini model và API key. |
| `ai/app/schemas.py` | Định nghĩa input/output cho `/embed` và `/answer` bằng Pydantic. |
| `ai/app/embedding.py` | Bọc model `SentenceTransformer` để tạo embedding. |
| `ai/app/llm.py` | Bọc logic gọi Gemini API và build prompt trả lời. |
| `ai/app/main.py` | Khởi tạo FastAPI app và expose endpoint `/health`, `/embed`, `/answer`. |

### 7.2. Tạo Python virtual environment

Chạy tại thư mục gốc repo:

```powershell
py -3.10 -m venv ai/.venv
```

Lý do:

- AI service dùng Python dependencies riêng, không nên cài lẫn vào Python global.
- Venv nằm trong `ai/.venv` để scope rõ ràng cho AI service.
- Dự án đã test ổn với Python 3.10.

Activate venv:

```powershell
.\ai\.venv\Scripts\Activate.ps1
```

Nếu PowerShell chặn script activate:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\ai\.venv\Scripts\Activate.ps1
```

Lý do:

- `Set-ExecutionPolicy -Scope Process` chỉ mở quyền chạy script trong terminal hiện tại.
- Không thay đổi policy vĩnh viễn của máy.

Khi activate thành công, prompt sẽ có dạng:

```text
(.venv) PS D:\story-recommendation>
```

Thoát venv:

```powershell
deactivate
```

### 7.3. Khai báo Python dependencies

Tạo file:

```text
ai/requirements.txt
```

Nội dung:

```text
fastapi==0.115.6
uvicorn[standard]==0.34.0
sentence-transformers==3.3.1
pydantic-settings==2.7.1
httpx==0.28.1
pytest==8.3.4
```

Lý do dùng từng dependency:

| Dependency | Lý do sử dụng |
|---|---|
| `fastapi` | Tạo HTTP API cho AI service. |
| `uvicorn[standard]` | Chạy FastAPI app local ở port `8000`. |
| `sentence-transformers` | Load model `intfloat/multilingual-e5-small` để tạo embedding. |
| `pydantic-settings` | Đọc cấu hình từ environment variables và `ai/.env`. |
| `httpx` | Gọi Gemini API bằng HTTP request. |
| `pytest` | Chạy test cho AI service. |

Cài dependencies vào venv:

```powershell
pip install -r ai/requirements.txt
```

Lệnh này chỉ cần chạy lần đầu, hoặc chạy lại khi `ai/requirements.txt` thay đổi.

### 7.4. Cấu hình `ai/.env`

Tạo file local:

```text
ai/.env
```

Nội dung mẫu:

```env
GEMINI_API_KEY=your-gemini-api-key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta
GEMINI_MODEL=gemini-2.5-flash
EMBEDDING_MODEL=intfloat/multilingual-e5-small
```

Lý do:

- `GEMINI_API_KEY` là secret, không được hardcode trong source code.
- `GEMINI_API_URL` cho phép đổi endpoint nếu Gemini API thay đổi.
- `GEMINI_MODEL` cho phép đổi model mà không sửa code.
- `EMBEDDING_MODEL` cho phép đổi model embedding về sau.

`ai/app/config.py` dùng `pydantic-settings` để đọc file này:

```python
model_config = SettingsConfigDict(env_file=Path(__file__).resolve().parents[1] / ".env", env_file_encoding="utf-8")
```

Vì vậy khi chạy AI service không cần set thủ công:

```powershell
$env:GEMINI_API_KEY="..."
```

`ai/.env` đã được thêm vào `.gitignore` để tránh commit secret.

### 7.5. Tạo schema cho AI endpoints

Tạo file:

```text
ai/app/schemas.py
```

Mục đích:

- Chuẩn hóa contract giữa backend và AI service.
- Validate request body trước khi xử lý.
- Giúp response luôn có shape rõ ràng.

Các schema chính:

| Schema | Vai trò |
|---|---|
| `EmbedRequest` | Body của `POST /embed`, gồm `text`. |
| `EmbedResponse` | Response của `/embed`, gồm `embedding`. |
| `StoryContext` | Một truyện ứng viên backend gửi sang AI service. |
| `AnswerRequest` | Body của `POST /answer`, gồm `query` và `contexts`. |
| `AnswerResponse` | Response của `/answer`, gồm `answer`. |

### 7.6. Tạo embedding wrapper

Tạo file:

```text
ai/app/embedding.py
```

Mục đích:

- Load model embedding một lần.
- Chuẩn hóa text đầu vào.
- Trả vector dạng `list[float]` để backend lưu vào PostgreSQL pgvector.

Model v1:

```text
intfloat/multilingual-e5-small
```

Lý do chọn:

- Hỗ trợ multilingual, phù hợp tiếng Việt hơn model English-only.
- Vector dimension là `384`, vừa đủ nhẹ cho local MVP.
- Khớp với schema DB `vector(384)`.

### 7.7. Tạo Gemini LLM client

Tạo file:

```text
ai/app/llm.py
```

Mục đích:

- Build prompt tư vấn truyện bằng tiếng Việt.
- Gửi request tới Gemini endpoint `generateContent`.
- Parse text response từ Gemini.
- Chuẩn hóa lỗi khi thiếu key, timeout hoặc response không hợp lệ.

Luồng xử lý trong LLM client:

```text
query + contexts
  → build_prompt()
  → POST Gemini generateContent
  → extract_gemini_text()
  → trả answer string
```

Prompt yêu cầu Gemini:

- chỉ gợi ý dựa trên truyện ứng viên backend cung cấp;
- không bịa truyện mới;
- trả lời ngắn gọn bằng tiếng Việt;
- nêu lý do phù hợp và lưu ý nếu có.

### 7.8. Tạo FastAPI app

Tạo file:

```text
ai/app/main.py
```

Mục đích:

- Khởi tạo FastAPI app.
- Tạo dependency `get_embedder()` để endpoint `/embed` dùng embedding model.
- Tạo dependency `get_llm_client()` để endpoint `/answer` dùng Gemini client.
- Dùng `lru_cache` để không load model nhiều lần.

Endpoint:

| Endpoint | Lệnh gọi | Mục đích |
|---|---|---|
| `/health` | `GET /health` | Kiểm tra service đã chạy. |
| `/embed` | `POST /embed` | Tạo embedding cho query/chunk. |
| `/answer` | `POST /answer` | Sinh câu trả lời từ query + contexts. |

Chạy service:

```powershell
.\ai\.venv\Scripts\Activate.ps1
uvicorn app.main:app --app-dir ai --host 127.0.0.1 --port 8000
```

Lý do dùng `--app-dir ai`:

- Cho phép Uvicorn import module `app.main` từ thư mục `ai/`.
- Không cần set `$env:PYTHONPATH="ai"` thủ công.

Kiểm tra service:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Kết quả mong đợi:

```json
{"status":"ok"}
```

### 7.9. Tạo test cho AI service

Tạo file:

```text
ai/tests/test_main.py
```

Mục đích:

- Test `/health` trả `{"status":"ok"}`.
- Test `/embed` bằng fake embedder, không cần load model thật.
- Test `/answer` bằng fake LLM, không gọi Gemini thật.
- Test lỗi thiếu Gemini key trả HTTP 503.
- Test parser Gemini response.

Tạo file:

```text
ai/pytest.ini
```

Mục đích:

- Cấu hình pytest để import được package `app` trong thư mục `ai/`.

Chạy test:

```powershell
py -3.10 -m pytest ai/tests/test_main.py -q
```

Hoặc nếu đang ở trong venv:

```powershell
pytest ai/tests/test_main.py -q
```

Lý do test dùng fake dependency:

- Không phụ thuộc internet.
- Không gọi Gemini thật.
- Không tốn API quota.
- Không phải load model embedding thật trong unit test.

### 7.10. Kết nối backend với AI service

Tạo file backend client:

```text
backend/src/recommendations/ai-client.ts
```

Mục đích:

- Backend không gọi Python code trực tiếp.
- Backend chỉ gọi HTTP API của AI service.
- Tách rõ contract:
  - `embedText(text)` → `POST /embed`
  - `generateAdvisorAnswer(input)` → `POST /answer`

Thêm config backend:

```env
AI_SERVICE_URL="http://localhost:8000"
```

Lý do:

- Backend có thể đổi URL AI service theo môi trường.
- Local dùng `localhost:8000`.
- Production có thể dùng service URL khác.

### 7.11. Tạo vector storage trong database

Thêm model `StoryChunk` vào Prisma và tạo migration pgvector.

Mục đích:

- Lưu từng đoạn nội dung truyện sau khi chunk.
- Mỗi chunk có embedding vector 384 chiều.
- Cho phép backend semantic search bằng pgvector.

Chạy migration:

```powershell
pnpm --dir backend prisma:migrate
pnpm --dir backend prisma:generate
```

Lý do:

- `prisma:migrate` tạo/cập nhật bảng `story_chunks` và extension/index pgvector.
- `prisma:generate` cập nhật Prisma Client để TypeScript backend biết model mới.

### 7.12. Tạo script index dữ liệu truyện

Tạo file:

```text
backend/src/scripts/index-story-chunks.ts
```

Mục đích:

- Đọc nội dung truyện đã import vào DB.
- Chia nội dung thành chunks.
- Gọi AI service `/embed` cho từng chunk.
- Lưu embedding vào bảng `story_chunks`.

Thêm script vào `backend/package.json`:

```json
"index:story-chunks": "tsx src/scripts/index-story-chunks.ts"
```

Chạy index mặc định:

```powershell
pnpm --dir backend index:story-chunks
```

Lý do bước này cần chạy trước khi hỏi AI:

- API hỏi AI chỉ search trong bảng `story_chunks`.
- Nếu chưa index truyện nào, backend không có vector để tìm truyện phù hợp.

### 7.13. Tạo backend endpoint hỏi AI

Thêm endpoint:

```text
POST /recommendations/ask
```

Các file liên quan:

- `backend/src/recommendations/recommendations.schema.ts`
- `backend/src/recommendations/recommendations.service.ts`
- `backend/src/recommendations/recommendations.controller.ts`
- `backend/src/recommendations/recommendations.router.ts`

Mục đích:

- Nhận query từ frontend.
- Tạo embedding cho query.
- Search vector trong `story_chunks`.
- Gom kết quả theo truyện.
- Gọi AI service `/answer` để Gemini viết câu trả lời.
- Trả `answer` và `recommendations` cho frontend.

Test thủ công:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:4000/recommendations/ask" `
  -ContentType "application/json" `
  -Body '{"query":"Tôi thích truyện tu tiên, main yếu thành mạnh","limit":3}'
```

### 7.14. Tạo frontend UI

Tạo trang:

```text
frontend/src/app/recommendations/page.tsx
```

Tạo form:

```text
frontend/src/components/story-advisor-form.tsx
```

Cập nhật parser type:

```text
frontend/src/types/recommendation.ts
```

Mục đích:

- Cho người dùng nhập gu truyện.
- Gọi backend `/recommendations/ask`.
- Hiển thị answer và danh sách truyện phù hợp.

Mở UI:

```text
http://localhost:3000/recommendations
```

### 7.15. Thứ tự chạy sau khi khởi tạo xong

Sau khi đã setup xong, mỗi lần dùng dự án chỉ cần chạy 3 terminal:

Terminal AI:

```powershell
.\ai\.venv\Scripts\Activate.ps1
uvicorn app.main:app --app-dir ai --host 127.0.0.1 --port 8000
```

Terminal backend:

```powershell
pnpm --dir backend dev
```

Terminal frontend:

```powershell
pnpm --dir frontend dev
```

Không cần chạy lại migration, import data, hoặc index chunks mỗi lần, trừ khi data/schema/model thay đổi.

## 8. File liên quan

| Nhóm | File |
|---|---|
| AI service | `ai/app/main.py`, `ai/app/config.py`, `ai/app/embedding.py`, `ai/app/llm.py`, `ai/app/schemas.py` |
| AI tests | `ai/tests/test_main.py`, `ai/pytest.ini` |
| Backend AI client | `backend/src/recommendations/ai-client.ts` |
| Backend API | `backend/src/recommendations/recommendations.*` |
| Chunking | `backend/src/recommendations/story-chunker.ts` |
| Index script | `backend/src/scripts/index-story-chunks.ts` |
| Prisma | `backend/prisma/schema.prisma`, `backend/prisma/migrations/20260528000000_add_story_chunks_pgvector/migration.sql` |
| Frontend | `frontend/src/app/recommendations/page.tsx`, `frontend/src/components/story-advisor-form.tsx`, `frontend/src/types/recommendation.ts` |
| Setup docs | `docs/AI_STORY_ADVISOR_SETUP.md` |
