from app.modules.finance.services.expense_processing_service import ExpenseProcessingService


CATEGORIES = [
    {"id": "cat-food", "name": "Ăn uống", "description": "Nhà hàng, cà phê"},
    {"id": "cat-transport", "name": "Đi lại", "description": "Grab taxi xăng xe"},
    {"id": "cat-other", "name": "Khác", "description": "Chi phí khác"},
]


def test_extracts_vietnamese_amount_merchant_and_category():
    result = ExpenseProcessingService().extract_expense_from_text(
        "Tôi vừa uống cà phê 25k ở Highlands",
        CATEGORIES,
    )

    assert result["amount"] == 25000
    assert result["merchantName"] == "Highlands"
    assert result["categoryId"] == "cat-food"
    assert result["categoryName"] == "Ăn uống"
    assert result["requiresConfirmation"] is True
    assert "25,000" in result["assistantMessage"]


def test_extracts_million_and_transport_keyword():
    result = ExpenseProcessingService().extract_expense_from_text(
        "Chi Grab đi sân bay 1.2 triệu",
        CATEGORIES,
    )

    assert result["amount"] == 1200000
    assert result["merchantName"] == "Grab"
    assert result["categoryId"] == "cat-transport"


def test_unknown_category_uses_other_category_for_confirmation():
    result = ExpenseProcessingService().extract_expense_from_text(
        "Mua phụ kiện 80k",
        CATEGORIES,
    )

    assert result["amount"] == 80000
    assert result["categoryId"] == "cat-other"
    assert result["confidence"] >= 0.5


def test_bare_number_requires_expense_context():
    service = ExpenseProcessingService()

    assert service.extract_expense_from_text("Đơn hàng 123456 đã giao", CATEGORIES)["amount"] is None
    assert service.extract_expense_from_text("Hôm nay mua sách 123456", CATEGORIES)["amount"] == 123456


def test_pick_strongest_category_instead_of_input_order():
    result = ExpenseProcessingService().extract_expense_from_text(
        "Đi grab ra sân bay",
        [
            {"id": "cat-other", "name": "Khác", "description": "Khác"},
            {"id": "cat-food", "name": "Ăn uống", "description": "Nhà hàng, cà phê"},
            {"id": "cat-transport", "name": "Đi lại", "description": "Grab taxi xăng xe"},
        ],
    )

    assert result["categoryId"] == "cat-transport"
    assert result["categoryName"] == "Đi lại"
