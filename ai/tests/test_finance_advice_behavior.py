from decimal import Decimal

from app.modules.finance.services.financial_advice_service import FinancialAdviceService


def test_generate_monthly_advice_with_budget_context():
    result = FinancialAdviceService().generate(
        "monthly",
        budgets=[
            {"category": {"name": "Ăn uống"}, "limitAmount": 1_000_000},
            {"category": {"name": "Đi lại"}, "limitAmount": 500_000},
        ],
        expenses=[
            {"amount": 750_000, "category": {"name": "Ăn uống"}},
            {"amount": 300_000, "category": {"name": "Đi lại"}},
        ],
    )

    assert result["advice"]
    assert result["highlights"]
    assert any("Ăn uống" in text for text in [*result["highlights"], *result["warnings"], result["advice"]])
    assert isinstance(result["warnings"], list)


def test_generate_empty_weekly_context_returns_fallback():
    result = FinancialAdviceService().generate("weekly", budgets=[], expenses=[])

    assert result["advice"]
    assert result["highlights"] == []
    assert result["warnings"] == []


def test_generate_parses_string_and_decimal_amounts_for_expenses_and_budgets():
    result = FinancialAdviceService().generate(
        "monthly",
        budgets=[
            {"category": {"name": "Ăn uống"}, "limitAmount": "25,000"},
            {"category": {"name": "Đi lại"}, "limitAmount": Decimal("50000")},
            {"category": {"name": "Khác"}, "limitAmount": True},
        ],
        expenses=[
            {"amount": "20,000", "category": {"name": "Ăn uống"}},
            {"amount": Decimal("5000"), "category": {"name": "Ăn uống"}},
            {"amount": True, "category": {"name": "Đi lại"}},
        ],
    )

    assert result["highlights"][0] == "Tổng chi tiêu monthly: 25,000đ"
    assert any("Ăn uống đã vượt ngân sách" in warning for warning in result["warnings"])
    assert all("Đi lại" not in warning for warning in result["warnings"])
