from app.services.agent_service import AgentService
from app.services.expense_processing_service import ExpenseProcessingService
from app.services.ocr_service import OcrService


def test_extract_amount_from_vietnamese_text_without_llm():
    service = ExpenseProcessingService()

    result = service.extract_expense_from_text(
        "Tôi vừa uống cà phê 25k ở Highlands",
        categories=[{"id": "cat1", "name": "Ăn uống", "description": "Food", "icon": "🍜"}],
    )

    assert result["amount"] == 25000
    assert result["categoryId"] == "cat1"
    assert result["requiresConfirmation"] is True


def test_unknown_category_is_left_for_user_confirmation():
    service = ExpenseProcessingService()

    result = service.extract_expense_from_text(
        "Mua phụ kiện máy tính 120k",
        categories=[{"id": "food", "name": "Ăn uống"}],
    )

    assert result["amount"] == 120000
    assert result["categoryId"] is None
    assert result["categoryName"] is None
    assert "danh mục" in result["assistantMessage"].lower()


def test_chat_confirmation_response_uses_pending_expense_statelessly():
    service = AgentService()

    result = service.respond(
        {
            "message": "ok lưu giúp mình",
            "isConfirmationResponse": True,
            "pendingExpense": {"amount": 25000, "merchantName": "Highlands", "categoryName": "Ăn uống"},
        }
    )

    assert result["requiresConfirmation"] is False
    assert result["askingConfirmation"] is False
    assert result["extractedExpense"] is not None
    assert "đã xác nhận" in result["assistantMessage"].lower()


def test_ocr_service_extracts_fields_from_text_payload_without_network():
    service = OcrService()

    result = service.extract_invoice_image(
        "invoice.txt",
        "Highlands Coffee\nNgày: 2026-06-10\nTổng cộng: 45.000đ".encode("utf-8"),
    )

    assert result["storeName"] == "Highlands Coffee"
    assert result["purchasedAt"] == "2026-06-10"
    assert result["totalAmount"] == 45000
    assert "Highlands Coffee" in result["rawText"]
