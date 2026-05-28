# Nền tảng gợi ý truyện cá nhân hoá (Story Recommendation Platform)

Dự án full-stack cho bài toán gợi ý truyện chữ, gồm:

- **Frontend**: Next.js (xem danh sách truyện, chi tiết truyện, đăng nhập/đăng ký, viết review)
- **Backend**: Node.js/Express + Prisma (auth, stories, reviews, import dữ liệu sách/truyện)
- **AI service**: thư mục Python/FastAPI (đang ở giai đoạn khởi tạo cho recommendation + RAG)
- **Database**: PostgreSQL

## Cấu trúc thư mục

- `frontend/` — ứng dụng web Next.js
- `backend/` — API backend
- `ai/` — dịch vụ AI (chuẩn bị cho recommendation models + RAG Story Assistant)
- `data/raw/` — dữ liệu thô truyện/sách
- `data/processed/` — dữ liệu đã xử lý

## Yêu cầu môi trường

- Node.js 20+
- pnpm 9+
- Docker (để chạy PostgreSQL local)

## 1) Cài dependencies

Tại thư mục gốc dự án:

```bash
pnpm install
```

## 2) Tạo và chạy PostgreSQL local

```bash
docker run --name story-recommendation-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=story_recommendation -p 5432:5432 -d postgres:16
```

## 3) Cấu hình biến môi trường cho backend

Tạo file `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/story_recommendation?schema=public"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
FRONTEND_URL="http://localhost:3000"
```

Ghi chú:

- `JWT_SECRET` là bắt buộc để ký/xác thực JWT.
- Nên dùng chuỗi ngẫu nhiên dài (>= 32 ký tự).

## 4) Generate Prisma client + migrate database

```bash
pnpm --filter backend prisma:generate
pnpm --filter backend prisma:migrate -- --name story_refactor
```

## 5) Chạy ứng dụng

### chạy frontend + backend

```bash
pnpm dev
```

### tách từng service

Terminal 1 (backend):

```bash
pnpm --filter backend dev
```

Terminal 2 (frontend):

```bash
pnpm --filter frontend dev
```

## 6) Import dữ liệu truyện

Đặt dữ liệu raw tại `data/raw/books/`:

```text
data/raw/books/book_data.csv
data/raw/books/book_id.csv
data/raw/books/prepared_data_book.csv
data/raw/books/comments.csv
data/raw/books/output/*.txt
```

Sau đó chạy:

```bash
pnpm --filter backend import:stories
pnpm --filter backend import:comments
```

## 7) Truy cập ứng dụng

- Frontend: http://localhost:3000
- Backend: http://localhost:4000

## Các lệnh thường dùng

### Ở root workspace

| Lệnh | Mục đích |
|---|---|
| `pnpm dev` | Chạy frontend + backend ở chế độ dev |
| `pnpm build` | Build toàn bộ workspace |
| `pnpm lint` | Chạy lint cho các package có cấu hình |
| `pnpm test` | Chạy test toàn workspace |
| `pnpm format` | Format code |

### Backend

| Lệnh | Mục đích |
|---|---|
| `pnpm --filter backend dev` | Chạy backend dev |
| `pnpm --filter backend build` | Build backend |
| `pnpm --filter backend test` | Chạy test backend |
| `pnpm --filter backend prisma:generate` | Generate Prisma Client |
| `pnpm --filter backend prisma:migrate -- --name <name>` | Tạo + apply migration |
| `pnpm --filter backend import:stories` | Import metadata truyện từ CSV |
| `pnpm --filter backend import:comments` | Import review/comment truyện từ CSV |

### Frontend

| Lệnh | Mục đích |
|---|---|
| `pnpm --filter frontend dev` | Chạy frontend dev |
| `pnpm --filter frontend build` | Build frontend |
| `pnpm --filter frontend test` | Chạy test frontend |

## Trạng thái hiện tại

- `ai/` hiện là khung ban đầu, chưa triển khai service FastAPI hoàn chỉnh.
- Luồng MVP hiện tập trung vào nền tảng backend/frontend + dữ liệu truyện + review trước khi mở rộng recommendation models.
