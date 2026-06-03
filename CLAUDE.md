# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Ngôn ngữ làm việc

- Mỗi lần trả lời user, luôn bắt đầu bằng lời chào có tên `boo`.
- Luôn làm việc và trao đổi với user bằng tiếng Việt.
- Tạo/cập nhật tài liệu hướng người dùng bằng tiếng Việt, trừ khi user yêu cầu ngôn ngữ khác.

## Trạng thái hiện tại của repo

- Dự án đã có code cho 2 phần:
  - `backend/`: Express + TypeScript + Prisma (PostgreSQL).
  - `frontend/`: Next.js App Router + TypeScript.
- `ai/` hiện mới là placeholder (chưa có service FastAPI chạy thực tế).
- Không có script monorepo phức tạp ở root; nếu cần lệnh package cụ thể, ưu tiên chạy theo từng thư mục con bằng `pnpm --dir <folder> ...`.

## Lệnh thường dùng

### Backend (`backend/`)

```powershell
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm test
pnpm test -- import-books.spec.ts
pnpm test -- import-comments.spec.ts
pnpm prisma:generate
pnpm prisma:migrate -- --name <migration-name>
pnpm import:stories
pnpm import:comments
```

### Frontend (`frontend/`)

```powershell
pnpm dev
pnpm build
pnpm start
pnpm typecheck
pnpm test
pnpm lint
pnpm format:check
```

### AI (`ai/`)

Hiện chỉ có tài liệu mô tả định hướng, chưa có lệnh runtime/test chính thức.

## Biến môi trường quan trọng

### Backend

- `DATABASE_URL` (bắt buộc)
- `JWT_SECRET` (bắt buộc)
- `PORT` (mặc định `4000`)
- `FRONTEND_URL` (mặc định `http://localhost:3000`)

### Frontend

- `NEXT_PUBLIC_API_URL` (mặc định `http://localhost:4000`)

## Kiến trúc tổng quan

### Backend architecture (Express)

- Entry point: `backend/src/main.ts`.
- App composition: `backend/src/app.ts`:
  - `cors`, `express.json`, global rate-limit.
  - Gắn router theo domain: `/auth`, `/stories`, `/reviews`.
  - 404 + error handler tập trung (`backend/src/errors.ts`).
- Cấu hình runtime: `backend/src/config.ts` (đọc env, validate giá trị bắt buộc).
- Truy cập DB: `backend/src/prisma.ts` tạo singleton `PrismaClient`.
- Domain modules theo pattern router/service/schema:
  - `auth/`: đăng ký, đăng nhập, lấy profile hiện tại.
  - `stories/`: danh sách truyện + chi tiết truyện.
  - `reviews/`: viết review truyện (cần JWT) + xem review của user hiện tại.
- Middleware dùng chung:
  - `middleware/validate.ts`: validate request bằng Zod.
  - `middleware/auth.ts`: verify JWT, gắn `req.user`.
- Script nhập dữ liệu truyện/sách:
  - `backend/src/scripts/import-books.ts`: import metadata truyện từ `prepared_data_book.csv`, lưu `contentPath` tới file trong `output/`.
  - `backend/src/scripts/import-comments.ts`: import review/comment từ `comments.csv`.
  - Test parser/import: `backend/src/scripts/import-books.spec.ts`, `backend/src/scripts/import-comments.spec.ts`.

### Database model (Prisma)

- Schema ở `backend/prisma/schema.prisma`.
- Core entities:
  - `User`
  - `Story`
  - `Category`
  - `Review` (unique theo cặp `userId + storyId` cho review user; review import dùng `externalCommentId`)
- Migration history ở `backend/prisma/migrations/`.

### Frontend architecture (Next.js App Router)

- App routes trong `frontend/src/app/`:
  - `/` danh sách truyện.
  - `/stories/[id]` chi tiết truyện + form review.
  - `/login`, `/register` cho auth flow.
- `frontend/src/lib/api.ts`: wrapper gọi API backend (`apiGet`, `apiPost`).
- `frontend/src/lib/auth.ts`: parse payload auth + lưu/lấy access token từ `localStorage`.
- Component chính cho review UI: `frontend/src/components/review-form.tsx`.
- Type parsing cho story payload nằm trong `frontend/src/types/story.ts` để kiểm soát dữ liệu nhận từ API.

## Dữ liệu truyện/sách

- Dữ liệu local dự kiến nằm ở: `data/raw/books/`.
- Các file/thư mục chính:
  - `data/raw/books/book_data.csv`
  - `data/raw/books/book_id.csv`
  - `data/raw/books/prepared_data_book.csv`
  - `data/raw/books/comments.csv`
  - `data/raw/books/output/*.txt`
- `output/*.txt` chỉ lưu đường dẫn vào `Story.contentPath`, không import full text vào database.

## Lưu ý khi phát triển

- Repo hiện dùng ExpressJS cho backend (không phải NestJS).
- Khi thay đổi API contract (auth/stories/reviews), cần cập nhật đồng bộ parser/type phía frontend để tránh lệch payload runtime.
- Không chỉnh `backend/.env` thật nếu không được yêu cầu; chỉ cập nhật `.env.example` hoặc hướng dẫn cấu hình.
