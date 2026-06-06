# Nền tảng gợi ý truyện cá nhân hoá

Dự án full-stack cho bài toán khám phá và gợi ý truyện chữ.

Hệ thống hiện gồm:

- **Frontend**: Next.js App Router + React + TypeScript.
- **Backend**: Express + TypeScript + Prisma.
- **AI service**: Python FastAPI, local embedding, Gemini answer generation.
- **Database**: PostgreSQL + pgvector.
- **Dữ liệu**: metadata truyện, review/comment và nội dung truyện local.

## Cấu trúc thư mục

| Thư mục | Vai trò |
|---|---|
| `frontend/` | Ứng dụng web Next.js. |
| `backend/` | API Express, Prisma schema, import scripts, recommendation APIs. |
| `ai/` | FastAPI service cho embedding và sinh câu trả lời AI. |
| `data/raw/` | Dữ liệu thô truyện/sách. |
| `data/processed/` | Dữ liệu đã xử lý. |
| `docs/` | Tài liệu thiết kế, setup và ghi chú kỹ thuật. |

Tài liệu AI v1 chi tiết nằm ở:

```text
docs/AI_STORY_ADVISOR_V1.md
```

Tài liệu setup AI chi tiết nằm ở:

```text
docs/AI_STORY_ADVISOR_SETUP.md
```

## Yêu cầu môi trường

- Node.js 20+
- pnpm 9+
- Python 3.10 khuyến nghị cho AI service
- PostgreSQL local có extension `pgvector`
- Gemini API key

## Biến môi trường

### Backend: `backend/.env`

Tạo file:

```text
backend/.env
```

Nội dung mẫu:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/story_recommendation?schema=public"
JWT_SECRET="some-long-random-secret"
PORT=4000
FRONTEND_URL="http://localhost:3000"
AI_SERVICE_URL="http://localhost:8000"
```

| Biến | Bắt buộc | Ghi chú |
|---|---:|---|
| `DATABASE_URL` | Có | Chuỗi kết nối PostgreSQL. |
| `JWT_SECRET` | Có | Secret ký JWT, nên dùng chuỗi dài và ngẫu nhiên. |
| `PORT` | Không | Backend mặc định chạy ở `4000`. |
| `FRONTEND_URL` | Không | Origin frontend cho CORS. |
| `AI_SERVICE_URL` | Không | URL FastAPI AI service, mặc định `http://localhost:8000`. |

### AI service: `ai/.env`

Tạo file:

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

| Biến | Bắt buộc | Ghi chú |
|---|---:|---|
| `GEMINI_API_KEY` | Có | API key để AI service gọi Gemini. Không commit key thật. |
| `GEMINI_API_URL` | Không | Giữ mặc định nếu dùng Gemini API public. |
| `GEMINI_MODEL` | Không | Model mặc định hiện dùng `gemini-2.5-flash`. |
| `EMBEDDING_MODEL` | Không | Model embedding local mặc định `intfloat/multilingual-e5-small`. |

Không đưa Gemini key vào `backend/.env`, vì backend không gọi Gemini trực tiếp.

## Setup lần đầu

Các bước trong phần này thường chỉ cần làm một lần cho một môi trường local mới, hoặc làm lại khi xoá `node_modules`, xoá venv, đổi dependency, đổi database.

### 1. Cài dependency Node.js

Tại thư mục gốc:

```powershell
pnpm install
```

Hoặc cài riêng từng package:

```powershell
pnpm --dir backend install
pnpm --dir frontend install
```

### 2. Tạo Python venv cho AI service

```powershell
py -3.10 -m venv ai/.venv
.\ai\.venv\Scripts\Activate.ps1
pip install -r ai/requirements.txt
```

Nếu PowerShell chặn activate script:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\ai\.venv\Scripts\Activate.ps1
```

Thoát venv:

```powershell
deactivate
```

### 3. Chuẩn bị PostgreSQL + pgvector

Database cần PostgreSQL và extension `vector`.

Lưu ý: thư mục `backend/prisma/migrations/` đã được squash lại thành 5 phase:

1. `platform-foundation`
2. `movie-foundation`
3. `story-foundation`
4. `story-ai-retrieval`
5. `story-content-storage-state`

Local PostgreSQL bắt buộc phải có extension `pgvector` để migration phase 4 `story-ai-retrieval` chạy thành công.

Nếu dùng Docker, nên dùng image có sẵn pgvector thay vì image `postgres` thường. Ví dụ:

```powershell
docker run --name story-recommendation-postgres `
  -e POSTGRES_PASSWORD=postgres `
  -e POSTGRES_DB=story_recommendation `
  -p 5432:5432 `
  -d pgvector/pgvector:pg16
```

Nếu PostgreSQL đã có sẵn, đảm bảo database trong `DATABASE_URL` tồn tại và hỗ trợ:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4. Tạo file env local

Tạo:

```text
backend/.env
ai/.env
```

Theo mẫu ở phần **Biến môi trường**.

### 5. Apply migration và generate Prisma client

Nếu local database của bạn trước đây đang dùng migration history cũ trước khi squash, hãy reset local database trước:

```powershell
pnpm --dir backend exec prisma migrate reset --force
```

Sau đó chạy:

```powershell
pnpm --dir backend prisma:migrate
pnpm --dir backend prisma:generate
```

Nếu Prisma hỏi reset schema:

```text
Do you want to continue? All data will be lost.
```

Chỉ chọn `y` nếu bạn chấp nhận xoá toàn bộ dữ liệu local. Nếu cần giữ dữ liệu, chọn `N`.

### 6. Import dữ liệu truyện

Đặt dữ liệu raw tại:

```text
data/raw/books/book_data.csv
data/raw/books/book_id.csv
data/raw/books/prepared_data_book.csv
data/raw/books/comments.csv
data/raw/books/output/*.txt
```

Sau đó chạy:

```powershell
pnpm --dir backend import:stories
pnpm --dir backend import:comments
```

Chỉ cần chạy lại khi dữ liệu raw thay đổi hoặc bạn reset database.

### 7. Index nội dung truyện cho AI search

Script index dùng metadata trên `Story` để biết chunks RAG đang stale hay fresh:

- `contentHash`: SHA-256 của file nội dung truyện.
- `contentUpdatedAt`: thời điểm nội dung file thay đổi.
- `contentIndexedAt`: thời điểm chunks/embedding được index thành công.

Truyện được xem là cần index/re-index khi chưa có `contentIndexedAt`, thiếu `contentUpdatedAt`, hoặc `contentUpdatedAt > contentIndexedAt`.

Kiểm tra truyện nào cần index/re-index mà không gọi AI service và không ghi DB:

```powershell
pnpm --dir backend index:story-chunks -- --dry-run
```

Index các truyện stale/chưa index. Bước này cần AI service đang chạy ở terminal khác vì script sẽ gọi `POST /embed`:

```powershell
pnpm --dir backend index:story-chunks
```

Force re-index cả truyện đã có chunks, kể cả khi metadata đang fresh:

```powershell
pnpm --dir backend index:story-chunks -- --force
```

Chạy batch lớn hơn:

```powershell
pnpm --dir backend index:story-chunks -- --limit 100
```

Chạy tiếp từ cursor đã log:

```powershell
pnpm --dir backend index:story-chunks -- --limit 100 --after <storyId>
```

Không cần chạy bước này mỗi lần mở app. Chỉ chạy khi:

- lần đầu chuẩn bị dữ liệu AI;
- import thêm truyện mới;
- nội dung truyện thay đổi;
- `--dry-run` báo có truyện stale/chưa index;
- muốn index thêm batch;
- đổi embedding model;
- muốn re-index bằng `--force`.

## Chạy dự án mỗi lần phát triển

Mỗi lần bắt đầu làm việc, thường cần 3 terminal.

### Terminal 1: AI service

```powershell
.\ai\.venv\Scripts\Activate.ps1
uvicorn app.main:app --app-dir ai --host 127.0.0.1 --port 8000
```

Kiểm tra:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```

Kết quả mong đợi:

```json
{"status":"ok"}
```

### Terminal 2: Backend

```powershell
pnpm --dir backend dev
```

Backend chạy ở:

```text
http://localhost:4000
```

### Terminal 3: Frontend

```powershell
pnpm --dir frontend dev
```

Frontend chạy ở:

```text
http://localhost:3000
```

Trang AI tư vấn truyện:

```text
http://localhost:3000/recommendations
```

## Luồng AI tư vấn truyện

### Chuẩn bị dữ liệu

```text
Story trong DB
  -> backend index-story-chunks script
  -> story-chunker chia nội dung thành chunk
  -> AI service /embed
  -> PostgreSQL story_chunks lưu vector
```

### User hỏi AI

```text
Frontend /recommendations
  -> Backend POST /recommendations/ask
  -> AI service /embed cho query
  -> pgvector search trong story_chunks
  -> Backend gom kết quả theo truyện
  -> AI service /answer
  -> Gemini sinh câu trả lời
  -> Frontend hiển thị answer + recommendation cards
```

## API chính

### `POST /recommendations/ask`

Request:

```json
{
  "query": "Tôi thích truyện tu tiên, main yếu thành mạnh",
  "limit": 3
}
```

Response:

```json
{
  "answer": "...",
  "recommendations": [
    {
      "storyId": "...",
      "title": "...",
      "authors": "...",
      "category": "...",
      "averageRating": 4.8,
      "reviewCount": 120,
      "score": 0.91,
      "reason": "..."
    }
  ]
}
```

Test thủ công:

```powershell
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:4000/recommendations/ask" `
  -ContentType "application/json" `
  -Body '{"query":"Tôi thích truyện tu tiên, main yếu thành mạnh","limit":3}'
```

## Các lệnh thường dùng

### Root workspace

| Lệnh | Mục đích | Khi nào chạy |
|---|---|---|
| `pnpm install` | Cài dependency workspace | Lần đầu hoặc khi dependency đổi |
| `pnpm dev` | Chạy frontend + backend song song | Mỗi lần dev nếu không cần tách terminal |
| `pnpm build` | Build toàn workspace | Trước khi kiểm tra release |
| `pnpm lint` | Chạy lint các package có cấu hình | Trước khi commit |
| `pnpm test` | Chạy test toàn workspace | Trước khi commit |
| `pnpm format` | Format code | Khi cần format toàn repo |

### Backend

| Lệnh | Mục đích | Khi nào chạy |
|---|---|---|
| `pnpm --dir backend dev` | Chạy backend dev | Mỗi lần dev |
| `pnpm --dir backend build` | Build backend | Trước release hoặc kiểm tra build |
| `pnpm --dir backend start` | Chạy backend đã build | Sau khi build |
| `pnpm --dir backend typecheck` | Typecheck backend | Sau khi sửa TypeScript |
| `pnpm --dir backend test` | Chạy test backend | Sau khi sửa backend |
| `pnpm --dir backend prisma:generate` | Generate Prisma client | Sau migration/schema change |
| `pnpm --dir backend prisma:migrate` | Apply/create migration dev | Khi schema DB thay đổi |
| `pnpm --dir backend import:stories` | Import metadata/nội dung truyện | Khi setup data hoặc data đổi |
| `pnpm --dir backend import:comments` | Import comments/reviews | Khi setup data hoặc data đổi |
| `pnpm --dir backend index:story-chunks` | Index nội dung truyện cho AI | Lần đầu hoặc khi cần index thêm |

### Frontend

| Lệnh | Mục đích | Khi nào chạy |
|---|---|---|
| `pnpm --dir frontend dev` | Chạy frontend dev | Mỗi lần dev |
| `pnpm --dir frontend build` | Build frontend | Trước release hoặc kiểm tra build |
| `pnpm --dir frontend start` | Chạy frontend đã build | Sau khi build |
| `pnpm --dir frontend typecheck` | Typecheck frontend | Sau khi sửa TypeScript |
| `pnpm --dir frontend test` | Chạy test frontend | Sau khi sửa frontend |
| `pnpm --dir frontend lint` | Lint frontend | Trước commit |
| `pnpm --dir frontend format:check` | Kiểm tra format frontend | Trước commit nếu cần |

### AI service

| Lệnh | Mục đích | Khi nào chạy |
|---|---|---|
| `py -3.10 -m venv ai/.venv` | Tạo Python venv | Lần đầu hoặc khi xoá venv |
| `.\ai\.venv\Scripts\Activate.ps1` | Activate venv | Mỗi terminal chạy AI |
| `pip install -r ai/requirements.txt` | Cài dependency Python | Lần đầu hoặc khi requirements đổi |
| `uvicorn app.main:app --app-dir ai --host 127.0.0.1 --port 8000` | Chạy AI service | Mỗi lần dev cần AI |
| `py -3.10 -m pytest ai/tests/test_main.py -q` | Chạy test AI | Sau khi sửa AI service |

## Kiểm tra trước khi kết thúc thay đổi

```powershell
py -3.10 -m pytest ai/tests/test_main.py -q
pnpm --dir backend test
pnpm --dir backend typecheck
pnpm --dir frontend test
pnpm --dir frontend typecheck
pnpm --dir frontend lint
```

## Ghi chú bảo mật

- Không commit `backend/.env`.
- Không commit `ai/.env`.
- Không đưa Gemini API key thật vào tài liệu, issue, commit message hoặc log public.
- Nếu lỡ lộ key, hãy revoke key cũ và tạo key mới.

## Trạng thái hiện tại

- Backend/frontend nền tảng đã có auth, stories, reviews và recommendation routes.
- AI service FastAPI đã hoạt động với local embedding + Gemini answer.
- Frontend có trang `/recommendations` cho AI tư vấn truyện.
- Semantic recommendation chỉ dùng các truyện đã được index vào bảng `story_chunks`.
