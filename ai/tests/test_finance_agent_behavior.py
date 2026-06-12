from app.modules.finance.services.agent_service import AgentService


CATEGORIES = [{"id": "cat-food", "name": "Ăn uống"}]


def test_agent_extracts_expense_and_asks_confirmation():
    result = AgentService().respond(
        {
            "message": "Tôi vừa uống cà phê 25k ở Highlands",
            "isConfirmationResponse": False,
            "pendingExpense": None,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["requiresConfirmation"] is True
    assert result["askingConfirmation"] is True
    assert result["extractedExpense"]["amount"] == 25000


def test_agent_confirmation_returns_expense_ready_for_backend_save():
    pending = {
        "amount": 25000,
        "merchantName": "Highlands",
        "categoryId": "cat-food",
        "categoryName": "Ăn uống",
    }

    result = AgentService().respond(
        {
            "message": "ok lưu",
            "isConfirmationResponse": True,
            "pendingExpense": pending,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["requiresConfirmation"] is False
    assert result["askingConfirmation"] is False
    assert result["extractedExpense"] == pending
    assert "Backend sẽ lưu" in result["assistantMessage"]


def test_agent_advice_request_uses_budget_and_expense_context():
    result = AgentService().respond(
        {
            "message": "Cho tôi lời khuyên chi tiêu tháng này",
            "isConfirmationResponse": False,
            "pendingExpense": None,
            "categories": CATEGORIES,
            "budgets": [{"category": {"name": "Ăn uống"}, "limitAmount": 1_000_000}],
            "recentExpenses": [{"amount": 900_000, "category": {"name": "Ăn uống"}}],
        }
    )

    assert result["requiresConfirmation"] is False
    assert result["askingConfirmation"] is False
    assert result["advice"]
    assert result["budgetWarning"]


def test_agent_interrupts_pending_confirmation_for_advice_request():
    pending = {
        "amount": 25000,
        "merchantName": "Highlands",
        "categoryId": "cat-food",
        "categoryName": "Ăn uống",
    }

    result = AgentService().respond(
        {
            "message": "Cho mình lời khuyên chi tiêu tuần này",
            "isConfirmationResponse": True,
            "pendingExpense": pending,
            "categories": CATEGORIES,
            "budgets": [{"category": {"name": "Ăn uống"}, "limitAmount": 300_000}],
            "recentExpenses": [{"amount": 350_000, "category": {"name": "Ăn uống"}}],
        }
    )

    assert result["interrupted"] is True
    assert result["requiresConfirmation"] is False
    assert result["askingConfirmation"] is False
    assert result["extractedExpense"] is None
    assert "tạm dừng xác nhận khoản chi trước" in result["assistantMessage"].lower()
    assert result["advice"]


def test_agent_interrupts_pending_confirmation_for_new_expense():
    pending = {
        "amount": 25000,
        "merchantName": "Highlands",
        "categoryId": "cat-food",
        "categoryName": "Ăn uống",
    }

    result = AgentService().respond(
        {
            "message": "Mình vừa ăn trưa 50k ở quán cơm",
            "isConfirmationResponse": True,
            "pendingExpense": pending,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["interrupted"] is True
    assert result["requiresConfirmation"] is True
    assert result["askingConfirmation"] is True
    assert result["extractedExpense"]["amount"] == 50000
    assert "nhập một khoản chi mới" in result["assistantMessage"].lower()


def test_agent_does_not_treat_question_as_confirmation():
    pending = {
        "amount": 25000,
        "merchantName": "Highlands",
        "categoryId": "cat-food",
        "categoryName": "Ăn uống",
    }

    result = AgentService().respond(
        {
            "message": "đúng không?",
            "isConfirmationResponse": True,
            "pendingExpense": pending,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["requiresConfirmation"] is True
    assert result["askingConfirmation"] is True
    assert result["interrupted"] is False
    assert result["extractedExpense"] == pending
    assert result["assistantMessage"] == "Bạn muốn lưu, sửa hay hủy khoản chi này?"


def test_agent_accepts_confirm_with_terminal_question_mark():
    pending = {
        "amount": 25000,
        "merchantName": "Highlands",
        "categoryId": "cat-food",
        "categoryName": "Ăn uống",
    }

    result = AgentService().respond(
        {
            "message": "ok lưu nhé?",
            "isConfirmationResponse": True,
            "pendingExpense": pending,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["requiresConfirmation"] is False
    assert result["askingConfirmation"] is False
    assert result["extractedExpense"] == pending
    assert "đã xác nhận" in result["assistantMessage"].lower()


def test_agent_accepts_cancel_with_terminal_question_mark():
    pending = {
        "amount": 25000,
        "merchantName": "Highlands",
        "categoryId": "cat-food",
        "categoryName": "Ăn uống",
    }

    result = AgentService().respond(
        {
            "message": "không lưu nhé?",
            "isConfirmationResponse": True,
            "pendingExpense": pending,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["requiresConfirmation"] is False
    assert result["askingConfirmation"] is False
    assert result["extractedExpense"] is None
    assert "đã hủy" in result["assistantMessage"].lower()


def test_agent_does_not_treat_khong_biet_as_cancel():
    pending = {
        "amount": 25000,
        "merchantName": "Highlands",
        "categoryId": "cat-food",
        "categoryName": "Ăn uống",
    }

    result = AgentService().respond(
        {
            "message": "không biết nữa",
            "isConfirmationResponse": True,
            "pendingExpense": pending,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["requiresConfirmation"] is True
    assert result["askingConfirmation"] is True
    assert result["interrupted"] is False
    assert result["extractedExpense"] == pending


def test_agent_does_not_trigger_advice_on_generic_keyword_fragment():
    result = AgentService().respond(
        {
            "message": "Mình đang suy nghĩ linh tinh, không cần khuyên đâu",
            "isConfirmationResponse": False,
            "pendingExpense": None,
            "categories": CATEGORIES,
            "recentExpenses": [],
            "budgets": [],
        }
    )

    assert result["advice"] is None
    assert result["requiresConfirmation"] is False
    assert result["askingConfirmation"] is False
    assert result["interrupted"] is False
