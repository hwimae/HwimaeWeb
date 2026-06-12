from fastapi import APIRouter, File, HTTPException, UploadFile

from app.modules.finance.schemas import (
    AdviceRequest,
    AdviceResponse,
    ChatRequest,
    ChatResponse,
    ExtractExpenseResponse,
    ExtractExpenseTextRequest,
    InvoiceExtractResponse,
)
from app.modules.finance.services.agent_service import AgentService
from app.modules.finance.services.expense_processing_service import ExpenseProcessingService
from app.modules.finance.services.financial_advice_service import FinancialAdviceService
from app.modules.finance.services.ocr_service import OcrService

expense_router = APIRouter(prefix="/expense", tags=["expense"])
advice_router = APIRouter(prefix="/advice", tags=["advice"])
chat_router = APIRouter(prefix="/chat", tags=["chat"])
invoice_router = APIRouter(prefix="/invoice", tags=["invoice"])
finance_router = APIRouter(prefix="/finance", tags=["finance"])

expense_service = ExpenseProcessingService()
advice_service = FinancialAdviceService()
agent_service = AgentService()
ocr_service = OcrService()

MAX_INVOICE_UPLOAD_BYTES = 5 * 1024 * 1024


@expense_router.post("/extract-text", response_model=ExtractExpenseResponse)
def extract_text(request: ExtractExpenseTextRequest) -> ExtractExpenseResponse:
    result = expense_service.extract_expense_from_text(
        request.message,
        [category.model_dump() for category in request.categories],
    )
    return ExtractExpenseResponse(**result)


@advice_router.post("/generate", response_model=AdviceResponse)
def generate_advice(request: AdviceRequest) -> AdviceResponse:
    return AdviceResponse(**advice_service.generate(request.period, request.budgets, request.expenses))


@chat_router.post("/respond", response_model=ChatResponse)
def respond(request: ChatRequest) -> ChatResponse:
    return ChatResponse(**agent_service.respond(request.model_dump()))


@invoice_router.post("/extract-image", response_model=InvoiceExtractResponse)
async def extract_image(file: UploadFile = File(...)) -> InvoiceExtractResponse:
    if file.content_type and not (file.content_type.startswith("image/") or file.content_type.startswith("text/")):
        raise HTTPException(status_code=415, detail="Unsupported invoice file type")

    content = await file.read(MAX_INVOICE_UPLOAD_BYTES + 1)
    if len(content) > MAX_INVOICE_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Invoice file is too large")

    return InvoiceExtractResponse(**ocr_service.extract_invoice_image(file.filename or "invoice", content))


finance_router.include_router(expense_router)
finance_router.include_router(advice_router)
finance_router.include_router(chat_router)
finance_router.include_router(invoice_router)
