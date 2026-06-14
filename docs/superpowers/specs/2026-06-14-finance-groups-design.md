# Thiết kế nhóm Finance

Ngày: 2026-06-14

## Mục tiêu

Thiết kế này thêm chức năng nhóm trong khu Finance để người dùng chia sẻ việc sử dụng tài chính với nhau. Phạm vi MVP đã chốt:

1. Nhóm là nhóm riêng tư, không phải cộng đồng công khai.
2. Dữ liệu trong các màn Finance cá nhân và trong màn Nhóm dùng chung cùng một nguồn dữ liệu, không tạo bản sao riêng cho nhóm.
3. Mỗi thành viên vẫn có dashboard tài chính cá nhân riêng, nhưng dashboard đó có thể được mở từ nhóm.
4. Khi cùng nhóm, các thành viên xem được dashboard, danh mục, ngân sách và giao dịch gần đây của nhau bằng cách bấm vào nút tên từng thành viên.
5. Thành viên được sửa dữ liệu tài chính của chính mình, nhưng không được xóa bất kỳ dữ liệu nào.
6. Chủ nhóm có quyền quản trị mạnh: thêm/xóa thành viên, xóa nhóm và xóa dữ liệu tài chính của thành viên trong nhóm.
7. Chủ nhóm thêm thành viên bằng email tài khoản đã đăng ký.
8. Hành động xóa dùng xác nhận đơn giản ở UI.

Thiết kế giữ kiến trúc hiện tại: backend Express + TypeScript + Prisma, frontend Next.js App Router + TypeScript. Module Finance hiện có đã có `expenses`, `budgets`, `categories`, `spending`, `chat`, `invoices`; chức năng nhóm sẽ mở rộng theo cùng pattern router/controller/service/schema/test.

## Quyết định đã chốt

- Chọn hướng “lớp chia sẻ/quản trị trên dữ liệu cá nhân”.
- Dữ liệu hiển thị trong `/finance/groups` là dữ liệu thật đang dùng ở các màn Finance cá nhân, không phải snapshot hay bản sao.
- Không chuyển `FinanceExpense`, `FinanceBudget`, `FinanceCategory` sang dữ liệu sở hữu bởi group.
- Thêm bảng group và membership để quyết định ai có quyền xem/quản trị dữ liệu finance của ai.
- Role trong nhóm chỉ gồm `OWNER` và `MEMBER` cho MVP.
- User tạo nhóm là `OWNER`.
- Thành viên thường xem được dữ liệu finance của thành viên khác trong cùng nhóm.
- Thành viên thường không được xóa dữ liệu, kể cả dữ liệu của chính mình, trong các UI/API nhóm.
- Thành viên vẫn được sửa dữ liệu của chính mình qua các luồng finance cá nhân hiện có.
- Chủ nhóm được xóa dữ liệu finance của mọi thành viên trong nhóm.
- Xác nhận xóa ở frontend là hộp thoại xác nhận đơn giản, chưa yêu cầu nhập email/tên.

## Phạm vi không làm trong MVP

- Không làm lời mời chờ xác nhận.
- Không làm link mời nhóm.
- Không làm feed cộng đồng/bài viết/bình luận.
- Không làm chia tiền/nợ ai trả ai.
- Không làm activity log chi tiết.
- Không làm xóa mềm/thùng rác.
- Không làm quyền riêng tư tuỳ biến theo từng trường dữ liệu.
- Không làm role quản trị viên trung gian ngoài `OWNER` và `MEMBER`.
- Không làm dashboard nhóm gộp toàn bộ dữ liệu thành một báo cáo chung; màn nhóm chỉ cung cấp các nút tên thành viên để mở dashboard finance dùng chung dữ liệu thật của từng người.

## Thiết kế dữ liệu Prisma

Thêm enum và model mới vào `backend/prisma/schema.prisma`.

### Enum `FinanceGroupRole`

```prisma
enum FinanceGroupRole {
  OWNER
  MEMBER
}
```

### Model `FinanceGroup`

```prisma
model FinanceGroup {
  id          String               @id @default(cuid())
  name        String
  ownerId     String
  owner       User                 @relation("OwnedFinanceGroups", fields: [ownerId], references: [id], onDelete: Cascade)
  members     FinanceGroupMember[]
  createdAt   DateTime             @default(now()) @db.Timestamptz(3)
  updatedAt   DateTime             @updatedAt @db.Timestamptz(3)

  @@index([ownerId])
  @@map("finance_groups")
}
```

### Model `FinanceGroupMember`

```prisma
model FinanceGroupMember {
  groupId   String
  userId    String
  role      FinanceGroupRole @default(MEMBER)
  group     FinanceGroup     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime         @default(now()) @db.Timestamptz(3)
  updatedAt DateTime         @updatedAt @db.Timestamptz(3)

  @@id([groupId, userId])
  @@index([userId])
  @@map("finance_group_members")
}
```

### Quan hệ trong `User`

Bổ sung vào `User`:

```prisma
ownedFinanceGroups  FinanceGroup[]       @relation("OwnedFinanceGroups")
financeGroupMembers FinanceGroupMember[]
```

### Quy tắc dữ liệu

- Khi tạo group, transaction sẽ tạo `FinanceGroup` và `FinanceGroupMember` cho owner với role `OWNER`.
- `FinanceGroup.ownerId` là nguồn xác định chủ nhóm chính; membership role `OWNER` giúp query quyền nhanh và trả role cho frontend.
- Không thêm `groupId` vào `FinanceExpense`, `FinanceBudget`, `FinanceCategory` trong MVP.
- Màn Finance cá nhân và màn Nhóm đọc/ghi cùng các record `FinanceExpense`, `FinanceBudget`, `FinanceCategory` theo `userId`.
- Khi xóa group, membership bị xóa cascade; dữ liệu finance cá nhân không bị xóa theo group.
- Khi owner gọi API xóa dữ liệu của member trong nhóm, record finance thật của member đó bị xóa và sẽ biến mất cả ở màn Finance cá nhân lẫn màn Nhóm.

## Backend module

Thêm module mới:

- `backend/src/finance/groups/groups.router.ts`
- `backend/src/finance/groups/groups.controller.ts`
- `backend/src/finance/groups/groups.service.ts`
- `backend/src/finance/groups/groups.schema.ts`
- `backend/src/finance/groups/groups.service.spec.ts`
- `backend/src/finance/groups/groups.router.spec.ts`

Gắn router trong `backend/src/finance/finance.router.ts`:

```ts
router.use('/groups', createFinanceGroupsRouter(deps));
```

Module này dùng cùng middleware hiện có:

- `requireAuth(deps)` cho toàn bộ route.
- `validateBody`, `validateParams` cho input.
- Helper `getRequiredUserId` trong `finance/http.ts`.

## Backend API

### `GET /finance/groups`

Lấy danh sách nhóm mà user hiện tại tham gia.

Response gồm tối thiểu:

```json
[
  {
    "id": "group-id",
    "name": "Gia đình",
    "ownerId": "owner-user-id",
    "currentUserRole": "OWNER",
    "memberCount": 3,
    "createdAt": "2026-06-14T00:00:00.000Z",
    "updatedAt": "2026-06-14T00:00:00.000Z"
  }
]
```

### `POST /finance/groups`

Tạo nhóm mới.

Input:

```json
{
  "name": "Gia đình"
}
```

Quy tắc:

- `name` bắt buộc, trim, giới hạn độ dài hợp lý.
- User hiện tại là owner.
- Tạo membership owner trong cùng transaction.

Response trả group chi tiết như `GET /finance/groups/:groupId`.

### `GET /finance/groups/:groupId`

Lấy chi tiết nhóm và danh sách thành viên.

Quy tắc:

- User gọi API phải là thành viên group.
- Trả `403` nếu không thuộc group.

Response gồm:

```json
{
  "id": "group-id",
  "name": "Gia đình",
  "ownerId": "owner-user-id",
  "currentUserRole": "MEMBER",
  "members": [
    {
      "userId": "user-id",
      "name": "Boo",
      "email": "boo@example.com",
      "role": "OWNER",
      "joinedAt": "2026-06-14T00:00:00.000Z"
    }
  ],
  "createdAt": "2026-06-14T00:00:00.000Z",
  "updatedAt": "2026-06-14T00:00:00.000Z"
}
```

Không trả `passwordHash` hoặc dữ liệu nhạy cảm khác.

### `POST /finance/groups/:groupId/members`

Chủ nhóm thêm thành viên bằng email tài khoản đã đăng ký.

Input:

```json
{
  "email": "member@example.com"
}
```

Quy tắc:

- User gọi API phải là `OWNER` của group.
- Email phải tồn tại trong bảng `User`.
- Nếu user đã là member, trả `409 Conflict`.
- Nếu thêm chính owner hoặc chính mình mà đã có membership, trả `409 Conflict`.
- Member mới có role `MEMBER`.

### `DELETE /finance/groups/:groupId/members/:memberUserId`

Chủ nhóm xóa thành viên khỏi nhóm.

Quy tắc:

- User gọi API phải là `OWNER`.
- `memberUserId` phải là thành viên group.
- Không cho xóa owner khỏi chính group qua endpoint này; nếu muốn rời/xóa nhóm, dùng `DELETE /finance/groups/:groupId`.
- Xóa membership, không xóa dữ liệu finance cá nhân của thành viên.

### `DELETE /finance/groups/:groupId`

Chủ nhóm xóa nhóm.

Quy tắc:

- Chỉ `OWNER` được xóa group.
- Xóa group và memberships cascade.
- Không xóa dữ liệu finance cá nhân.

### `GET /finance/groups/:groupId/members/:memberUserId/dashboard`

Xem dashboard finance của một thành viên trong cùng group.

Quy tắc:

- User gọi API phải là thành viên group.
- `memberUserId` phải là thành viên group.
- Trả dữ liệu dashboard thật của `memberUserId`, không phải của user gọi API.
- Payload lấy từ cùng các bảng finance cá nhân đang phục vụ `/finance/dashboard`, `/finance/expenses`, `/finance/budgets` của member đó; không tạo dữ liệu group riêng.

Response nên gom đủ dữ liệu cho UI:

```json
{
  "member": {
    "userId": "member-user-id",
    "name": "An",
    "email": "an@example.com"
  },
  "categories": [],
  "budgets": [],
  "expenses": [],
  "summary": {
    "totalAmount": 0,
    "categories": []
  }
}
```

Có thể tái sử dụng logic từ `categories`, `budgets`, `expenses`, `spending` service hiện có, nhưng service nhóm phải truyền `memberUserId` sau khi đã kiểm tra quyền.

### `GET /finance/groups/:groupId/members/:memberUserId/expenses`

Xem danh sách chi tiêu của thành viên.

Quy tắc giống dashboard. Endpoint này hữu ích nếu UI muốn lazy-load hoặc refresh riêng phần giao dịch.

### `GET /finance/groups/:groupId/members/:memberUserId/budgets`

Xem ngân sách của thành viên.

Quy tắc giống dashboard.

### `DELETE /finance/groups/:groupId/members/:memberUserId/expenses/:expenseId`

Chủ nhóm xóa một khoản chi của thành viên.

Quy tắc kiểm tra theo thứ tự:

1. User gọi API là `OWNER` của group.
2. `memberUserId` là thành viên group.
3. `expenseId` thuộc đúng `memberUserId`.
4. Xóa expense.
5. Trả `204`.

### `DELETE /finance/groups/:groupId/members/:memberUserId/budgets/:budgetId`

Chủ nhóm xóa một ngân sách của thành viên.

Quy tắc giống xóa expense, nhưng kiểm tra `budgetId` thuộc đúng `memberUserId`.

## Error handling

Backend trả lỗi nhất quán:

- `401 Unauthorized`: chưa đăng nhập hoặc token không hợp lệ.
- `403 Forbidden`: user không thuộc group, hoặc không phải owner nhưng gọi API owner-only.
- `404 Not found`: không tìm thấy group, user email, membership, expense hoặc budget thuộc member.
- `409 Conflict`: thêm thành viên đã tồn tại trong group, hoặc thao tác trùng/không hợp lệ theo trạng thái hiện tại.

Các lỗi quyền phải ưu tiên không rò rỉ dữ liệu ngoài nhóm. Ví dụ user ngoài nhóm gọi dashboard của group nên nhận `403` hoặc thông điệp chung, không được biết chi tiết dữ liệu của member.

## Frontend types và API wrapper

Mở rộng `frontend/src/types/finance.ts`:

- `FinanceGroupRole = "OWNER" | "MEMBER"`
- `FinanceGroupSummary`
- `FinanceGroupMember`
- `FinanceGroupDetail`
- `FinanceGroupMemberDashboard`

Thêm parser tương ứng:

- `parseFinanceGroupSummary`
- `parseFinanceGroups`
- `parseFinanceGroupDetail`
- `parseFinanceGroupMemberDashboard`

Mở rộng `frontend/src/lib/finance-api.ts`:

- `listFinanceGroups()`
- `createFinanceGroup(body)`
- `getFinanceGroup(groupId)`
- `addFinanceGroupMember(groupId, body)`
- `deleteFinanceGroupMember(groupId, memberUserId)`
- `deleteFinanceGroup(groupId)`
- `getFinanceGroupMemberDashboard(groupId, memberUserId)`
- `listFinanceGroupMemberExpenses(groupId, memberUserId)`
- `listFinanceGroupMemberBudgets(groupId, memberUserId)`
- `deleteFinanceGroupMemberExpense(groupId, memberUserId, expenseId)`
- `deleteFinanceGroupMemberBudget(groupId, memberUserId, budgetId)`

Tất cả API dùng `requireToken()` như các finance API hiện có.

## Frontend UI

### Điều hướng

Cập nhật `frontend/src/components/finance/finance-nav.tsx` thêm item:

```ts
{ href: "/finance/groups", label: "Nhóm" }
```

Cập nhật `FinanceShell` để `/finance/groups` có title/description riêng:

- Title: `Nhóm tài chính`
- Description: `Chia sẻ dashboard tài chính cá nhân với các thành viên trong nhóm.`

### Route mới

Thêm route:

- `frontend/src/app/finance/groups/page.tsx`

Page render component chính, ví dụ `FinanceGroups`.

### Component đề xuất

Thêm các component dưới `frontend/src/components/finance/`:

- `finance-groups.tsx`: container load state và phối hợp các component con.
- `finance-groups-panel.tsx`: danh sách nhóm, nút tạo nhóm, trạng thái selected group.
- `finance-group-detail.tsx`: chi tiết nhóm, danh sách member, form thêm member cho owner.
- `finance-member-selector.tsx`: dãy nút hiển thị tên từng thành viên; bấm vào tên nào thì mở nội dung finance của người đó.
- `finance-member-dashboard.tsx`: dashboard của member đang chọn, dùng dữ liệu thật từ finance cá nhân của member đó.

Có thể tái sử dụng component hiện có:

- `CategoryCard`
- `ExpenseChart`
- `BudgetInsights`
- `BudgetUsageChart`
- `RecentTransactions`
- `StatusMessage`

### Layout trang nhóm

Desktop: layout 2 cột.

- Cột trái: danh sách group.
- Cột phải: chi tiết group, dãy nút tên thành viên và dashboard finance của member đang chọn.

Mobile: xếp dọc; dãy nút tên thành viên có thể cuộn ngang nếu nhiều người.

Trang cần hiển thị rõ người đang xem dữ liệu:

- “Đang xem dashboard của An”
- Nếu xem chính mình: “Đây là dashboard của bạn trong nhóm Gia đình”

### Owner UI

Nếu `currentUserRole === "OWNER"`:

- Hiện form thêm member bằng email.
- Hiện nút xóa member, trừ owner.
- Hiện nút xóa group.
- Hiện nút xóa expense/budget trong dashboard member.
- Khi bấm xóa, dùng xác nhận đơn giản bằng `window.confirm` hoặc modal hiện có nếu dự án đã có pattern phù hợp.

Nội dung xác nhận ví dụ:

- `Bạn chắc chắn muốn xóa khoản này khỏi dữ liệu của An?`
- `Bạn chắc chắn muốn xóa ngân sách này khỏi dữ liệu của An?`
- `Bạn chắc chắn muốn xóa nhóm Gia đình?`

Nếu user là `MEMBER`:

- Không hiển thị form thêm member.
- Không hiển thị bất kỳ nút xóa nào.
- Chỉ có quyền xem dashboard thành viên khác.

## Data flow frontend

1. User mở `/finance/groups`.
2. Frontend gọi `GET /finance/groups`.
3. Nếu không có group, hiển thị empty state và nút “Tạo nhóm đầu tiên”.
4. Nếu có group, chọn group đầu tiên hoặc group vừa được tạo.
5. Frontend gọi `GET /finance/groups/:groupId`.
6. UI hiển thị dãy nút theo tên từng thành viên trong nhóm.
7. User bấm vào tên thành viên muốn xem.
8. Frontend gọi `GET /finance/groups/:groupId/members/:memberUserId/dashboard`.
9. Dashboard render từ payload trả về, dùng cùng dữ liệu thật đang hiển thị trong finance cá nhân của member đó.
10. Khi owner thêm/xóa member hoặc xóa dữ liệu, frontend refresh group detail/dashboard tương ứng.

## Empty, loading và error state

Frontend dùng `StatusMessage` theo pattern hiện có.

- Loading group list: `Đang tải danh sách nhóm tài chính...`
- Không tải được group list: `Không thể tải danh sách nhóm tài chính.`
- Không có group: `Bạn chưa tham gia nhóm tài chính nào.`
- Không tải được group detail: `Không thể tải chi tiết nhóm tài chính.`
- Không tải được dashboard member: `Không thể tải dashboard của thành viên này.`
- Thêm member thất bại: hiển thị message API nếu có, fallback `Không thể thêm thành viên.`
- Xóa thất bại: giữ nguyên dữ liệu trên UI và hiển thị lỗi.

## Testing backend

### Service tests

Thêm test cho `groups.service.ts`:

- Tạo group tự gán owner.
- List group chỉ trả group user tham gia.
- Owner thêm member bằng email hợp lệ.
- Không thêm email không tồn tại.
- Không thêm member trùng.
- Member không thêm được member khác.
- User ngoài group không xem được group detail.
- Member xem được dashboard của member khác cùng group.
- Dashboard group đọc đúng dữ liệu finance thật của `memberUserId`, không dùng bản sao group.
- User ngoài group không xem được dashboard member.
- Owner xóa được member thường.
- Owner không xóa chính owner qua endpoint member delete.
- Member không xóa được member.
- Owner xóa được expense của member.
- Owner xóa được budget của member.
- Member không xóa được expense/budget.
- Owner không xóa được expense/budget không thuộc `memberUserId`.

### Router/controller tests

Thêm test cho `groups.router.ts`:

- Route yêu cầu auth.
- Validate body tạo group.
- Validate body thêm member.
- Validate params `groupId`, `memberUserId`, `expenseId`, `budgetId`.
- Status code đúng cho `201`, `204`, `400`, `401`, `403`, `404`, `409`.

## Testing frontend

### Type/parser tests

Mở rộng `frontend/src/types/finance.test.ts`:

- Parse group summary hợp lệ.
- Parse group detail hợp lệ.
- Parse role chỉ nhận `OWNER` hoặc `MEMBER`.
- Parse member dashboard hợp lệ.
- Reject payload thiếu field bắt buộc hoặc sai kiểu.

### API wrapper tests

Mở rộng `frontend/src/lib/finance-api.test.ts`:

- Các API group gửi đúng path/method/token.
- Delete endpoints xử lý `204`.
- API group parse response đúng.

### Component tests

Thêm test cho component group:

- Empty state khi chưa có group.
- Loading/error state.
- Owner thấy form thêm member.
- Member không thấy form thêm member.
- Owner thấy nút xóa member/dữ liệu.
- Member không thấy bất kỳ nút xóa nào.
- Danh sách thành viên hiển thị thành dãy nút theo tên từng người.
- Bấm nút tên member thì dashboard hiển thị tên member đang xem và nội dung finance của member đó.
- Sau khi xóa thành công, dashboard refresh hoặc item biến mất khỏi UI.

## Rủi ro và lưu ý triển khai

- Quyền owner xóa dữ liệu của người khác là quyền mạnh. UI phải hiển thị rõ đang thao tác trên dữ liệu của thành viên nào.
- Backend không được dựa vào UI để bảo vệ quyền; mọi endpoint xóa phải kiểm tra owner và membership.
- Vì dữ liệu vẫn thuộc user cá nhân, các service hiện có cần được tái sử dụng cẩn thận để tránh vô tình dùng `currentUserId` thay vì `memberUserId` trong route nhóm.
- Nếu sau này cần chia tiền/nợ ai trả ai, nên thêm phase mới với model riêng cho shared expense/split, không nhét vội vào MVP này.

## Tiêu chí hoàn thành

- User đăng nhập có thể tạo nhóm finance.
- Owner có thể thêm thành viên bằng email đã đăng ký.
- Thành viên cùng nhóm xem được dashboard, ngân sách, danh mục và giao dịch gần đây của nhau bằng cách bấm nút tên từng người.
- Dữ liệu hiển thị trong nhóm dùng chung nguồn với các màn Finance cá nhân; không có bản sao dữ liệu nhóm.
- Member không thấy và không gọi được thành công bất kỳ API xóa nào.
- Owner xóa được member, group, expense và budget của member trong nhóm.
- Các lỗi quyền trả đúng `403`; dữ liệu không tồn tại/không thuộc member trả đúng `404`.
- Frontend có route `/finance/groups`, nav item “Nhóm”, loading/error/empty state đầy đủ.
- Backend/frontend tests cho quyền chính và parser/API/component đều pass.
