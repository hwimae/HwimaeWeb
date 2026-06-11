# Next.js Default UI and Modular AI Design

## Mục tiêu

Chuẩn hóa toàn bộ frontend về phong cách UI mặc định/sạch của Next.js và tái cấu trúc AI service thành các module rõ ràng `story`, `finance`, `movie`. Phần AI tài chính sẽ port logic tốt từ `moniagent/` vào dự án hiện tại, nhưng backend Express vẫn sở hữu auth, ownership và database chính.

## Quyết định đã chốt

- UI áp dụng cho **toàn bộ frontend**, không chỉ finance.
- Dùng hướng **strict Next.js default**:
  - Không dùng UI/visual library ngoài như `lucide-react`, `recharts`, `react-markdown`, `remark-gfm`, `clsx`.
  - Chỉ dùng React/Next component tự viết, `next/link`, HTML semantic và CSS tự viết.
- AI service được chia thành module:
  - `story`: giữ RAG/gợi ý truyện hiện tại.
  - `finance`: port AI tài chính từ Moniagent.
  - `movie`: tạo placeholder module, chưa triển khai tính năng movie thật.
- Finance AI không truy cập database chính. Backend Express gom context từ Prisma và gửi sang AI service.
- Finance AI phải có fallback deterministic/rule-based để app vẫn dùng được khi thiếu `GEMINI_API_KEY` hoặc Gemini lỗi.

## Kiến trúc AI service

Cấu trúc đích:

```txt
ai/app/
  main.py
  core/
    config.py
    gemini.py
    errors.py
  shared/
    json_utils.py
    text_utils.py
  modules/
    story/
      router.py
      schemas.py
      services/
        embedding_service.py
        answer_service.py
    finance/
      router.py
      schemas.py
      services/
        expense_processing_service.py
        ocr_service.py
        financial_advice_service.py
        agent_service.py
        categorization_service.py
    movie/
      router.py
      schemas.py
      services/
        placeholder_service.py
```

`ai/app/main.py` chỉ khởi tạo FastAPI app, healthcheck và include router từ các module. Các endpoint hiện có vẫn phải tương thích để backend không bị gãy trong lúc chuyển đổi:

- `GET /health`
- `POST /embed`
- `POST /answer`
- `POST /expense/extract-text`
- `POST /chat/respond`
- `POST /advice/generate`
- `POST /invoice/extract-image`

Có thể thêm endpoint module mới như `/story/embed` hoặc `/finance/chat/respond`, nhưng không được xóa route cũ trong phase này.

## Module `story`

Module `story` chứa logic AI hiện tại của dự án:

- embedding local bằng model cấu hình qua `EMBEDDING_MODEL`;
- answer generation qua Gemini;
- schemas cho `/embed` và `/answer`;
- lỗi thiếu Gemini key cho `/answer` vẫn trả 503 rõ ràng.

Module này không thay đổi hành vi người dùng, chỉ đổi vị trí code và boundary.

## Module `finance`

Module `finance` là nơi port logic từ `moniagent/backend/src`. Các nguồn tham chiếu chính:

- `moniagent/backend/src/core/langgraph_agent.py`
- `moniagent/backend/src/services/expense_processing_service.py`
- `moniagent/backend/src/services/financial_advice_service.py`
- `moniagent/backend/src/services/ocr_service.py`
- các service categorization/learning nếu logic có thể tách khỏi SQLAlchemy.

Khi port, không mang nguyên dependency database cũ vào AI service. Thay vì SQLAlchemy session và model ORM, module finance nhận plain dict/list từ backend:

- `categories`
- `budgets`
- `recentExpenses`
- `chatHistory`
- `pendingExpense`
- invoice/image payload khi xử lý OCR

### Expense extraction

Finance AI phải xử lý tốt tiếng Việt:

- số tiền: `25k`, `25.000đ`, `2 triệu`, `500 nghìn`, `25000`;
- merchant: `ở Highlands`, `tại Phở 24`, `Grab 30k`;
- category suggestion dựa trên danh mục user truyền vào;
- confidence và message xác nhận thân thiện.

Nếu có Gemini key, có thể dùng Gemini để trích merchant/category tốt hơn. Nếu không có key, rule-based path vẫn phải trả kết quả dùng được.

### Chat agent

`POST /chat/respond` nhận context từ backend và trả structured response:

```ts
{
  assistantMessage: string;
  extractedExpense?: {
    merchantName?: string | null;
    description?: string | null;
    amount?: number | null;
    spentAt?: string | null;
    categoryId?: string | null;
    categoryName?: string | null;
    confidence?: number;
    requiresConfirmation?: boolean;
  } | null;
  budgetWarning?: string | null;
  advice?: string | null;
  requiresConfirmation: boolean;
  askingConfirmation: boolean;
  interrupted: boolean;
}
```

AI có thể nhận biết ba intent chính:

1. Ghi nhận chi tiêu.
2. Xác nhận/sửa/hủy pending expense.
3. Hỏi tư vấn tài chính.

AI không tự lưu expense. Nó chỉ trả dữ liệu có cấu trúc để backend quyết định lưu.

### Advice

`POST /advice/generate` nhận `period`, `budgets`, `expenses` và trả:

```ts
{
  advice: string;
  highlights: string[];
  warnings: string[];
}
```

Logic Moniagent về phân tích spending pattern được giữ lại, nhưng dữ liệu đầu vào là list từ backend. Gemini chỉ dùng để viết advice tự nhiên hơn; fallback deterministic vẫn phải có.

### Invoice/OCR

`POST /invoice/extract-image` xử lý ảnh hóa đơn:

- nếu có Gemini key: dùng Gemini vision để extract store/date/total/raw text;
- nếu thiếu key hoặc OCR lỗi: trả message fallback rõ ràng, không làm service crash;
- validate file type và size ở boundary phù hợp.

Output gồm:

```ts
{
  storeName?: string | null;
  totalAmount?: number | null;
  purchasedAt?: string | null;
  rawText?: string | null;
  extractedData: Record<string, unknown>;
  assistantMessage: string;
}
```

## Module `movie`

Module `movie` chỉ tạo sẵn boundary để quản lý dài hạn:

- router placeholder;
- schemas placeholder;
- service placeholder;
- route health hoặc info nội bộ nếu cần.

Không thêm UI movie, backend movie API hoặc recommendation movie thật trong scope này.

## Backend finance behavior

Backend Express vẫn là nơi sở hữu:

- JWT auth;
- user ownership;
- Prisma/PostgreSQL;
- tạo/lưu expense, invoice, chat session, AI interaction.

### Chat flow

`POST /finance/chat/start` tạo `FinanceChatSession` và trả initial message.

`POST /finance/chat/:sessionId/message`:

1. Kiểm tra session thuộc user.
2. Lưu user message.
3. Lấy context từ Prisma:
   - categories;
   - budgets;
   - recent expenses;
   - chat history.
4. Gửi context sang AI `/chat/respond`.
5. Lưu assistant message + metadata.
6. Nếu user đang xác nhận pending expense và response hợp lệ để lưu:
   - backend validate `amount`, `categoryId`, `invoiceId`, ownership;
   - tạo `FinanceExpense`;
   - trả thêm `savedExpense` cho frontend.

Backend response cho chat mở rộng:

```ts
{
  assistantMessage: string;
  extractedExpense?: unknown | null;
  savedExpense?: FinanceExpense | null;
  budgetWarning?: string | null;
  advice?: string | null;
  requiresConfirmation: boolean;
  askingConfirmation: boolean;
  interrupted: boolean;
}
```

### Invoice flow

`POST /finance/invoices/process`:

1. Validate auth và upload file.
2. Tạo hoặc cập nhật `FinanceInvoice`.
3. Gửi ảnh sang AI OCR.
4. Lưu `extractedData`, `storeName`, `totalAmount`, `purchasedAt`, `status`.
5. Trả invoice và optional pending expense nếu OCR đủ dữ liệu.

### Advice flow

`POST /finance/advice`:

1. Lấy budgets và expenses của user.
2. Gửi sang AI `/advice/generate`.
3. Lưu `FinanceAIInteraction`.
4. Trả advice/highlights/warnings.

## Frontend UI architecture

Toàn bộ frontend dùng strict Next.js default style.

### Dependencies cần bỏ

Frontend không còn dùng:

- `lucide-react`
- `recharts`
- `react-markdown`
- `remark-gfm`
- `clsx`

Nếu có dependency khác chỉ phục vụ UI/visual và không cần cho behavior, cũng phải loại bỏ trong plan implementation.

### Component UI tối giản

Tạo bộ component nhỏ tự viết:

```txt
frontend/src/components/ui/
  app-nav.tsx
  page-shell.tsx
  status-message.tsx
  form-field.tsx
```

Các component này chỉ render HTML semantic, không dùng icon library, không dùng CSS framework.

### Routes cần refactor UI

- `/`
- `/stories/[id]`
- `/login`
- `/register`
- `/finance/dashboard`
- `/finance/chat`
- `/finance/expenses`
- `/finance/budgets`
- `/finance/settings`

### Finance UI

Finance dashboard:

- summary cards bằng `article`;
- danh mục/ngân sách bằng list hoặc table;
- progress bar bằng HTML/CSS hoặc `<meter>`;
- không dùng chart library.

Finance chat:

- message bubbles bằng HTML/CSS;
- text AI render bằng `white-space: pre-wrap`, không dùng markdown renderer;
- pending expense có action rõ: lưu, sửa, hủy hoặc gửi xác nhận bằng text;
- khi lưu thành công, hiển thị saved state và refresh dashboard/expenses khi user quay lại.

Expenses/budgets:

- form HTML chuẩn;
- table/list rõ ràng;
- lỗi/loading/empty state thống nhất qua `StatusMessage`.

### Styling

Dùng `frontend/src/app/globals.css` làm nguồn style chính. CSS cần đơn giản:

- nền sáng;
- max-width nhất quán;
- spacing nhất quán;
- button/link/form/table thống nhất;
- responsive bằng grid/flex cơ bản;
- tránh shadow/gradient/animation phức tạp.

## Error handling

- AI service offline: backend trả 502, frontend hiển thị “AI service chưa sẵn sàng, thử lại sau.”
- Thiếu Gemini key: finance fallback rule-based; `/answer` story vẫn báo 503 nếu cần Gemini thật.
- Category không thuộc user: backend không lưu, frontend yêu cầu chọn lại.
- Pending expense thiếu amount: không lưu, AI hỏi thêm số tiền.
- File upload sai type/quá lớn: trả 415/413 rõ ràng.
- DB/auth lỗi: frontend hiển thị lỗi có thể hiểu được, không crash page.

## Testing strategy

### AI tests

- Expense extraction tiếng Việt không cần network.
- Chat confirmation response.
- Advice fallback không cần Gemini key.
- OCR fallback/validation.
- Module routes vẫn giữ backward compatibility.

### Backend tests

- Chat service gửi đủ `categories`, `budgets`, `recentExpenses`, `chatHistory` sang AI client.
- Confirmation flow tạo `FinanceExpense` khi user xác nhận.
- Không tạo expense nếu category/invoice không thuộc user.
- Invoice process gọi AI OCR và update status/data.
- Advice service gửi context đúng và lưu AI interaction.

### Frontend tests

- App nav/page shell render các route chính.
- Finance chat hiển thị pending expense và saved state.
- Expenses/budgets render table/form bằng HTML default.
- Không import các UI libraries đã loại bỏ.

## Verification plan

Manual smoke cuối cùng:

1. Chạy PostgreSQL, AI service, backend, frontend.
2. Register/login.
3. Mở `/finance/chat`.
4. Gửi `Tôi vừa uống cà phê 25k ở Highlands`.
5. AI hỏi xác nhận với amount/merchant/category đúng.
6. Gửi `ok lưu`.
7. Backend lưu `FinanceExpense`.
8. Mở `/finance/dashboard` và `/finance/expenses`, thấy expense mới.
9. Hỏi `Cho tôi lời khuyên chi tiêu tháng này`.
10. AI trả advice hoặc fallback advice rõ ràng.
11. Mở các route chính của app để xác nhận UI thống nhất Next.js default.

## Phases implementation

1. Tách AI service thành module `story`, `finance`, `movie` mà vẫn giữ endpoint cũ.
2. Port/adapt finance AI từ Moniagent vào module `finance` theo plain dict contracts.
3. Hoàn thiện backend finance chat/advice/invoice flow, đặc biệt confirmation save expense.
4. Refactor toàn bộ frontend sang strict Next.js default UI và bỏ UI dependencies.
5. Cập nhật docs/env, chạy checks và manual smoke.

## Definition of Done

- AI service có module `story`, `finance`, `movie`.
- Finance AI dùng được cho text expense extraction, confirmation, advice và invoice OCR/fallback.
- Backend lưu expense sau khi user xác nhận.
- Frontend toàn dự án không còn dùng UI/visual libraries ngoài.
- UI các route chính thống nhất, sạch, dùng HTML/CSS/Next component cơ bản.
- Backend, frontend, AI checks pass.
- Manual smoke chứng minh finance chat lưu được expense và dashboard cập nhật.

## Out of scope

- Không triển khai movie recommendation thật.
- Không thay đổi database chính ngoài những gì finance flow đã có, trừ khi implementation plan phát hiện thiếu trường cần thiết và được nêu rõ.
- Không xóa `moniagent/` cho đến khi boo xác nhận cleanup sau khi port xong.
- Không thêm UI framework mới.
