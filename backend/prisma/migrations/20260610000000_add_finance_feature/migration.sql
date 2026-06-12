CREATE TABLE "finance_categories" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "isSystemCategory" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_invoices" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "storeName" TEXT,
    "purchasedAt" TIMESTAMPTZ(3),
    "totalAmount" NUMERIC(12,2),
    "extractedData" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_expenses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "categoryId" TEXT,
    "description" TEXT,
    "merchantName" TEXT,
    "amount" NUMERIC(12,2) NOT NULL,
    "spentAt" TIMESTAMPTZ(3),
    "confirmedByUser" BOOLEAN NOT NULL DEFAULT false,
    "sourceType" TEXT NOT NULL DEFAULT 'manual',
    "sourceMetadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_budgets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "limitAmount" NUMERIC(12,2) NOT NULL,
    "period" TEXT NOT NULL DEFAULT 'monthly',
    "alertThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_chat_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTitle" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_chat_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_chat_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_ai_interactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "interactionType" TEXT NOT NULL,
    "inputData" JSONB NOT NULL,
    "aiResponse" JSONB NOT NULL,
    "userFeedback" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_ai_interactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_categorization_rules" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "storeNamePattern" TEXT NOT NULL,
    "suggestedCategoryId" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "finance_categorization_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "finance_categorization_feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "suggestedCategoryId" TEXT,
    "confirmedCategoryId" TEXT NOT NULL,
    "feedbackType" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "finance_categorization_feedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "finance_categories_userId_name_key" ON "finance_categories"("userId", "name");
CREATE INDEX "finance_categories_userId_idx" ON "finance_categories"("userId");
CREATE INDEX "finance_invoices_userId_idx" ON "finance_invoices"("userId");
CREATE INDEX "finance_expenses_userId_spentAt_idx" ON "finance_expenses"("userId", "spentAt");
CREATE INDEX "finance_expenses_categoryId_idx" ON "finance_expenses"("categoryId");
CREATE INDEX "finance_expenses_invoiceId_idx" ON "finance_expenses"("invoiceId");
CREATE UNIQUE INDEX "finance_budgets_userId_categoryId_period_key" ON "finance_budgets"("userId", "categoryId", "period");
CREATE INDEX "finance_budgets_userId_idx" ON "finance_budgets"("userId");
CREATE INDEX "finance_budgets_categoryId_idx" ON "finance_budgets"("categoryId");
CREATE INDEX "finance_chat_sessions_userId_createdAt_idx" ON "finance_chat_sessions"("userId", "createdAt");
CREATE INDEX "finance_chat_messages_sessionId_createdAt_idx" ON "finance_chat_messages"("sessionId", "createdAt");
CREATE INDEX "finance_ai_interactions_userId_createdAt_idx" ON "finance_ai_interactions"("userId", "createdAt");
CREATE UNIQUE INDEX "finance_categorization_rules_userId_storeNamePattern_key" ON "finance_categorization_rules"("userId", "storeNamePattern");
CREATE INDEX "finance_categorization_rules_suggestedCategoryId_idx" ON "finance_categorization_rules"("suggestedCategoryId");
CREATE INDEX "finance_categorization_feedback_userId_idx" ON "finance_categorization_feedback"("userId");
CREATE INDEX "finance_categorization_feedback_expenseId_idx" ON "finance_categorization_feedback"("expenseId");
CREATE INDEX "finance_categorization_feedback_suggestedCategoryId_idx" ON "finance_categorization_feedback"("suggestedCategoryId");
CREATE INDEX "finance_categorization_feedback_confirmedCategoryId_idx" ON "finance_categorization_feedback"("confirmedCategoryId");

ALTER TABLE "finance_categories" ADD CONSTRAINT "finance_categories_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_invoices" ADD CONSTRAINT "finance_invoices_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "finance_invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_expenses" ADD CONSTRAINT "finance_expenses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_budgets" ADD CONSTRAINT "finance_budgets_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "finance_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_chat_sessions" ADD CONSTRAINT "finance_chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_chat_messages" ADD CONSTRAINT "finance_chat_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "finance_chat_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_ai_interactions" ADD CONSTRAINT "finance_ai_interactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_categorization_rules" ADD CONSTRAINT "finance_categorization_rules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_categorization_rules" ADD CONSTRAINT "finance_categorization_rules_suggestedCategoryId_fkey" FOREIGN KEY ("suggestedCategoryId") REFERENCES "finance_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_categorization_feedback" ADD CONSTRAINT "finance_categorization_feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_categorization_feedback" ADD CONSTRAINT "finance_categorization_feedback_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "finance_expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "finance_categorization_feedback" ADD CONSTRAINT "finance_categorization_feedback_suggestedCategoryId_fkey" FOREIGN KEY ("suggestedCategoryId") REFERENCES "finance_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "finance_categorization_feedback" ADD CONSTRAINT "finance_categorization_feedback_confirmedCategoryId_fkey" FOREIGN KEY ("confirmedCategoryId") REFERENCES "finance_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
