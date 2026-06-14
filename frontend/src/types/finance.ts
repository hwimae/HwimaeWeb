export type FinanceCategory = {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  displayOrder?: number;
};

export type FinanceExpense = {
  id: string;
  amount: number;
  merchantName?: string | null;
  description?: string | null;
  spentAt?: string | null;
  categoryId?: string | null;
  category?: FinanceCategory | null;
};

export type FinanceBudget = {
  id: string;
  categoryId: string;
  limitAmount: number;
  period: "weekly" | "monthly" | "yearly";
  alertThreshold: number;
  category?: FinanceCategory;
};

export type SpendingSummary = {
  totalAmount: number;
  categories: Array<{ categoryId: string | null; categoryName: string; amount: number }>;
};

export type FinanceGroupRole = "OWNER" | "MEMBER";

export type FinanceGroupSummary = {
  id: string;
  name: string;
  ownerId: string;
  currentUserRole: FinanceGroupRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FinanceGroupMember = {
  userId: string;
  name: string;
  email: string;
  role: FinanceGroupRole;
  joinedAt: string;
};

export type FinanceGroupDetail = FinanceGroupSummary & {
  members: FinanceGroupMember[];
};

export type FinanceGroupMemberDashboard = {
  member: { userId: string; name: string; email: string };
  categories: FinanceCategory[];
  budgets: FinanceBudget[];
  expenses: FinanceExpense[];
  summary: SpendingSummary;
};

export type FinanceChatStartResponse = {
  sessionId: string;
  initialMessage: string;
};

export type FinanceInvoice = {
  id: string;
  userId: string;
  filename: string;
  filePath: string;
  storeName?: string | null;
  purchasedAt?: string | null;
  totalAmount?: number | null;
  extractedData?: unknown;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type FinanceInvoicePendingExpense = {
  invoiceId: string;
  merchantName?: string | null;
  description?: string | null;
  amount?: number | null;
  spentAt?: string | null;
  sourceType?: string | null;
};

export type FinanceInvoiceProcessResponse = {
  invoice: FinanceInvoice;
  pendingExpense: FinanceInvoicePendingExpense | null;
};

export type FinanceChatResponse = {
  assistantMessage: string;
  extractedExpense?: {
    merchantName?: string | null;
    amount?: number | null;
    categoryId?: string | null;
    categoryName?: string | null;
    spentAt?: string | null;
  } | null;
  savedExpense?: FinanceExpense | null;
  budgetWarning?: string | null;
  advice?: string | null;
  requiresConfirmation: boolean;
  askingConfirmation: boolean;
  interrupted: boolean;
};

export type FinanceChatMessageResponse = FinanceChatResponse & {
  extractedExpense: NonNullable<FinanceChatResponse["extractedExpense"]> | null;
  savedExpense: FinanceExpense | null;
  budgetWarning: string | null;
  advice: string | null;
};

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalNumber(value: unknown): value is number | undefined {
  return value === undefined || typeof value === "number";
}

function parseMoney(value: unknown, errorMessage: string): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  throw new Error(errorMessage);
}

const STRICT_ISO_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isStrictIsoDateString(value: unknown): value is string {
  if (typeof value !== "string" || !STRICT_ISO_DATE_TIME.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function parseRequiredDateString(value: unknown, errorMessage: string): string {
  if (!isStrictIsoDateString(value)) {
    throw new Error(errorMessage);
  }

  return value;
}

function parseOptionalDateString(value: unknown, errorMessage: string): string | null | undefined {
  if (value === undefined || value === null) return value;
  if (!isStrictIsoDateString(value)) {
    throw new Error(errorMessage);
  }

  return value;
}

function isFinanceBudgetPeriod(value: unknown): value is FinanceBudget["period"] {
  return value === "weekly" || value === "monthly" || value === "yearly";
}

function isFinanceGroupRole(value: unknown): value is FinanceGroupRole {
  return value === "OWNER" || value === "MEMBER";
}

export function parseFinanceGroupMember(input: unknown): FinanceGroupMember {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance group member");
  }

  const value = input as Partial<FinanceGroupMember>;
  if (typeof value.userId !== "string" || typeof value.name !== "string" || typeof value.email !== "string" || !isFinanceGroupRole(value.role)) {
    throw new Error("Invalid finance group member");
  }

  return {
    userId: value.userId,
    name: value.name,
    email: value.email,
    role: value.role,
    joinedAt: parseRequiredDateString(value.joinedAt, "Invalid finance group member"),
  };
}

function isFinanceChatExtractedExpense(value: unknown): value is FinanceChatMessageResponse["extractedExpense"] | undefined {
  if (value === undefined || value === null) return true;
  if (!value || typeof value !== "object") return false;

  const candidate = value as Partial<NonNullable<FinanceChatMessageResponse["extractedExpense"]>>;
  return (
    isOptionalString(candidate.merchantName) &&
    (candidate.amount === null || isOptionalNumber(candidate.amount)) &&
    isOptionalString(candidate.categoryId) &&
    isOptionalString(candidate.categoryName) &&
    isOptionalString(candidate.spentAt)
  );
}

export function parseFinanceInvoice(input: unknown): FinanceInvoice {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance invoice");
  }

  const value = input as Partial<FinanceInvoice>;
  if (
    typeof value.id !== "string" ||
    typeof value.userId !== "string" ||
    typeof value.filename !== "string" ||
    typeof value.filePath !== "string" ||
    !isOptionalString(value.storeName) ||
    !(value.totalAmount === undefined || value.totalAmount === null || typeof value.totalAmount === "number" || typeof value.totalAmount === "string") ||
    typeof value.status !== "string"
  ) {
    throw new Error("Invalid finance invoice");
  }

  return {
    id: value.id,
    userId: value.userId,
    filename: value.filename,
    filePath: value.filePath,
    storeName: value.storeName,
    purchasedAt: parseOptionalDateString(value.purchasedAt, "Invalid finance invoice"),
    totalAmount: value.totalAmount === undefined ? undefined : value.totalAmount === null ? null : parseMoney(value.totalAmount, "Invalid finance invoice"),
    extractedData: value.extractedData,
    status: value.status,
    createdAt: parseRequiredDateString(value.createdAt, "Invalid finance invoice"),
    updatedAt: parseRequiredDateString(value.updatedAt, "Invalid finance invoice"),
  };
}

export function parseFinanceInvoicePendingExpense(input: unknown): FinanceInvoicePendingExpense {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance invoice pending expense");
  }

  const value = input as Partial<FinanceInvoicePendingExpense>;
  if (
    typeof value.invoiceId !== "string" ||
    !isOptionalString(value.merchantName) ||
    !isOptionalString(value.description) ||
    !(value.amount === null || isOptionalNumber(value.amount)) ||
    !isOptionalString(value.spentAt) ||
    !isOptionalString(value.sourceType)
  ) {
    throw new Error("Invalid finance invoice pending expense");
  }

  return {
    invoiceId: value.invoiceId,
    merchantName: value.merchantName,
    description: value.description,
    amount: value.amount === undefined ? undefined : value.amount,
    spentAt: parseOptionalDateString(value.spentAt, "Invalid finance invoice pending expense"),
    sourceType: value.sourceType,
  };
}

export function parseFinanceInvoiceProcessResponse(input: unknown): FinanceInvoiceProcessResponse {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance invoice process response");
  }

  const value = input as Partial<FinanceInvoiceProcessResponse>;
  if (!(value.pendingExpense === null || value.pendingExpense === undefined || typeof value.pendingExpense === "object")) {
    throw new Error("Invalid finance invoice process response");
  }

  return {
    invoice: parseFinanceInvoice(value.invoice),
    pendingExpense: value.pendingExpense ? parseFinanceInvoicePendingExpense(value.pendingExpense) : null,
  };
}

export function parseFinanceCategory(input: unknown): FinanceCategory {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance category");
  }

  const value = input as Partial<FinanceCategory>;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !isOptionalString(value.description) ||
    !isOptionalString(value.icon) ||
    !isOptionalString(value.color) ||
    !isOptionalNumber(value.displayOrder)
  ) {
    throw new Error("Invalid finance category");
  }

  return value as FinanceCategory;
}

export function parseFinanceCategories(input: unknown): FinanceCategory[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid finance categories");
  }

  return input.map(parseFinanceCategory);
}

export function parseFinanceExpense(input: unknown): FinanceExpense {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance expense");
  }

  const value = input as Partial<FinanceExpense>;
  if (
    typeof value.id !== "string" ||
    !isOptionalString(value.merchantName) ||
    !isOptionalString(value.description) ||
    !isOptionalString(value.spentAt) ||
    !isOptionalString(value.categoryId) ||
    !(value.category === undefined || value.category === null || typeof value.category === "object")
  ) {
    throw new Error("Invalid finance expense");
  }

  return {
    id: value.id,
    amount: parseMoney(value.amount, "Invalid finance expense"),
    merchantName: value.merchantName,
    description: value.description,
    spentAt: parseOptionalDateString(value.spentAt, "Invalid finance expense"),
    categoryId: value.categoryId,
    category: value.category ? parseFinanceCategory(value.category) : value.category,
  };
}

export function parseFinanceExpenses(input: unknown): FinanceExpense[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid finance expenses");
  }

  return input.map(parseFinanceExpense);
}

export function parseFinanceBudget(input: unknown): FinanceBudget {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance budget");
  }

  const value = input as Partial<FinanceBudget>;
  if (
    typeof value.id !== "string" ||
    typeof value.categoryId !== "string" ||
    !isFinanceBudgetPeriod(value.period) ||
    typeof value.alertThreshold !== "number" ||
    !(value.category === undefined || typeof value.category === "object")
  ) {
    throw new Error("Invalid finance budget");
  }

  return {
    id: value.id,
    categoryId: value.categoryId,
    limitAmount: parseMoney(value.limitAmount, "Invalid finance budget"),
    period: value.period,
    alertThreshold: value.alertThreshold,
    category: value.category ? parseFinanceCategory(value.category) : undefined,
  };
}

export function parseFinanceBudgets(input: unknown): FinanceBudget[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid finance budgets");
  }

  return input.map(parseFinanceBudget);
}

function parseSpendingSummaryCategory(input: unknown): SpendingSummary["categories"][number] {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid spending summary");
  }

  const value = input as Partial<SpendingSummary["categories"][number]>;
  if (!((typeof value.categoryId === "string" || value.categoryId === null) && typeof value.categoryName === "string")) {
    throw new Error("Invalid spending summary");
  }

  return {
    categoryId: value.categoryId,
    categoryName: value.categoryName,
    amount: parseMoney(value.amount, "Invalid spending summary"),
  };
}

export function parseSpendingSummary(input: unknown): SpendingSummary {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid spending summary");
  }

  const value = input as Partial<SpendingSummary>;
  if (!Array.isArray(value.categories)) {
    throw new Error("Invalid spending summary");
  }

  return {
    totalAmount: parseMoney(value.totalAmount, "Invalid spending summary"),
    categories: value.categories.map(parseSpendingSummaryCategory),
  };
}

export function parseFinanceGroupSummary(input: unknown): FinanceGroupSummary {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance group");
  }

  const value = input as Partial<FinanceGroupSummary>;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.ownerId !== "string" ||
    !isFinanceGroupRole(value.currentUserRole) ||
    typeof value.memberCount !== "number"
  ) {
    throw new Error("Invalid finance group");
  }

  return {
    id: value.id,
    name: value.name,
    ownerId: value.ownerId,
    currentUserRole: value.currentUserRole,
    memberCount: value.memberCount,
    createdAt: parseRequiredDateString(value.createdAt, "Invalid finance group"),
    updatedAt: parseRequiredDateString(value.updatedAt, "Invalid finance group"),
  };
}

export function parseFinanceGroups(input: unknown): FinanceGroupSummary[] {
  if (!Array.isArray(input)) {
    throw new Error("Invalid finance groups");
  }

  return input.map(parseFinanceGroupSummary);
}

export function parseFinanceGroupDetail(input: unknown): FinanceGroupDetail {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance group detail");
  }

  const value = input as Partial<FinanceGroupDetail>;
  if (!Array.isArray(value.members)) {
    throw new Error("Invalid finance group detail");
  }

  return { ...parseFinanceGroupSummary(value), members: value.members.map(parseFinanceGroupMember) };
}

export function parseFinanceGroupMemberDashboard(input: unknown): FinanceGroupMemberDashboard {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance group member dashboard");
  }

  const value = input as Partial<FinanceGroupMemberDashboard>;
  if (!value.member || typeof value.member !== "object") {
    throw new Error("Invalid finance group member dashboard");
  }

  const member = value.member as Partial<FinanceGroupMemberDashboard["member"]>;
  if (typeof member.userId !== "string" || typeof member.name !== "string" || typeof member.email !== "string") {
    throw new Error("Invalid finance group member dashboard");
  }

  return {
    member: { userId: member.userId, name: member.name, email: member.email },
    categories: parseFinanceCategories(value.categories),
    budgets: parseFinanceBudgets(value.budgets),
    expenses: parseFinanceExpenses(value.expenses),
    summary: parseSpendingSummary(value.summary),
  };
}

export function parseFinanceChatStartResponse(input: unknown): FinanceChatStartResponse {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance chat start response");
  }

  const value = input as Partial<FinanceChatStartResponse>;
  if (typeof value.sessionId !== "string" || typeof value.initialMessage !== "string") {
    throw new Error("Invalid finance chat start response");
  }

  return { sessionId: value.sessionId, initialMessage: value.initialMessage };
}

export function parseFinanceChatMessageResponse(input: unknown): FinanceChatMessageResponse {
  if (!input || typeof input !== "object") {
    throw new Error("Invalid finance chat message response");
  }

  const value = input as Partial<FinanceChatMessageResponse>;
  if (
    typeof value.assistantMessage !== "string" ||
    !isFinanceChatExtractedExpense(value.extractedExpense) ||
    !(value.savedExpense === undefined || value.savedExpense === null || typeof value.savedExpense === "object") ||
    !(typeof value.budgetWarning === "string" || value.budgetWarning === null || value.budgetWarning === undefined) ||
    !(typeof value.advice === "string" || value.advice === null || value.advice === undefined) ||
    typeof value.requiresConfirmation !== "boolean" ||
    typeof value.askingConfirmation !== "boolean" ||
    typeof value.interrupted !== "boolean"
  ) {
    throw new Error("Invalid finance chat message response");
  }

  return {
    assistantMessage: value.assistantMessage,
    extractedExpense: value.extractedExpense ?? null,
    savedExpense: value.savedExpense ? parseFinanceExpense(value.savedExpense) : null,
    budgetWarning: value.budgetWarning ?? null,
    advice: value.advice ?? null,
    requiresConfirmation: value.requiresConfirmation,
    askingConfirmation: value.askingConfirmation,
    interrupted: value.interrupted,
  };
}
