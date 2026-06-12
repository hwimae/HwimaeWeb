from typing import Any, Literal

from pydantic import BaseModel, Field


class CategoryContext(BaseModel):
    id: str
    name: str
    description: str | None = None
    icon: str | None = None


class ExtractExpenseTextRequest(BaseModel):
    message: str
    categories: list[CategoryContext] = Field(default_factory=list)
    recentExpenses: list[dict[str, Any]] = Field(default_factory=list)
    locale: Literal["vi-VN"] = "vi-VN"


class ExtractExpenseResponse(BaseModel):
    merchantName: str | None = None
    description: str | None = None
    amount: float | None = None
    spentAt: str | None = None
    categoryId: str | None = None
    categoryName: str | None = None
    confidence: float = 0
    assistantMessage: str
    requiresConfirmation: bool = True


class AdviceRequest(BaseModel):
    period: Literal["daily", "weekly", "monthly"] = "monthly"
    budgets: list[dict[str, Any]] = Field(default_factory=list)
    expenses: list[dict[str, Any]] = Field(default_factory=list)
    locale: Literal["vi-VN"] = "vi-VN"


class AdviceResponse(BaseModel):
    advice: str
    highlights: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class ChatRequest(BaseModel):
    sessionId: str
    message: str
    messageType: Literal["text"] = "text"
    isConfirmationResponse: bool = False
    pendingExpense: dict[str, Any] | None = None
    categories: list[dict[str, Any]] = Field(default_factory=list)
    budgets: list[dict[str, Any]] = Field(default_factory=list)
    recentExpenses: list[dict[str, Any]] = Field(default_factory=list)
    chatHistory: list[dict[str, Any]] = Field(default_factory=list)
    locale: Literal["vi-VN"] = "vi-VN"


class ChatResponse(BaseModel):
    assistantMessage: str
    extractedExpense: dict[str, Any] | None = None
    budgetWarning: str | None = None
    advice: str | None = None
    requiresConfirmation: bool = False
    askingConfirmation: bool = False
    interrupted: bool = False


class InvoiceExtractResponse(BaseModel):
    storeName: str | None = None
    totalAmount: float | None = None
    purchasedAt: str | None = None
    rawText: str | None = None
    extractedData: dict[str, Any] = Field(default_factory=dict)
    assistantMessage: str
