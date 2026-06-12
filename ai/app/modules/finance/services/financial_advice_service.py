import re
from decimal import Decimal, InvalidOperation
from typing import Any


class FinancialAdviceService:
    def generate(self, period: str, budgets: list[dict[str, Any]], expenses: list[dict[str, Any]]) -> dict[str, Any]:
        total = sum(self._amount(expense) for expense in expenses)
        if total <= 0:
            return {
                "advice": "Mình cần thêm dữ liệu chi tiêu để đưa ra lời khuyên chính xác hơn.",
                "highlights": [],
                "warnings": [],
            }

        by_category = self._group_by_category(expenses)
        budget_map = self._budget_map(budgets)
        top_category = max(by_category, key=by_category.__getitem__) if by_category else "Chưa phân loại"
        warnings = self._budget_warnings(by_category, budget_map)
        highlights = [f"Tổng chi tiêu {period}: {total:,.0f}đ"]

        if by_category:
            highlights.append(f"Danh mục chi nhiều nhất: {top_category} ({by_category[top_category]:,.0f}đ)")

        advice = self._build_advice(period, total, top_category, warnings)
        return {"advice": advice, "highlights": highlights, "warnings": warnings}

    def _amount(self, expense: dict[str, Any]) -> float:
        return self._parse_numeric(expense.get("amount", 0))

    def _category_name(self, expense: dict[str, Any]) -> str:
        category = expense.get("category")
        if isinstance(category, dict) and isinstance(category.get("name"), str):
            return category["name"]
        if isinstance(expense.get("categoryName"), str):
            return expense["categoryName"]
        return "Chưa phân loại"

    def _group_by_category(self, expenses: list[dict[str, Any]]) -> dict[str, float]:
        totals: dict[str, float] = {}
        for expense in expenses:
            category_name = self._category_name(expense)
            totals[category_name] = totals.get(category_name, 0.0) + self._amount(expense)
        return totals

    def _budget_map(self, budgets: list[dict[str, Any]]) -> dict[str, float]:
        budget_map: dict[str, float] = {}
        for budget in budgets:
            category = budget.get("category")
            category_name = category.get("name") if isinstance(category, dict) else budget.get("categoryName")
            limit = self._parse_numeric(budget.get("limitAmount", budget.get("limit_amount", 0)))
            if isinstance(category_name, str) and limit > 0:
                budget_map[category_name] = limit
        return budget_map

    def _budget_warnings(self, by_category: dict[str, float], budget_map: dict[str, float]) -> list[str]:
        warnings: list[str] = []
        for category_name, limit in budget_map.items():
            spent = by_category.get(category_name, 0.0)
            if spent >= limit:
                warnings.append(
                    f"{category_name} đã vượt ngân sách: {spent:,.0f}đ/{limit:,.0f}đ. Bạn nên siết lại các khoản không thiết yếu."
                )
            elif spent >= limit * 0.8:
                warnings.append(
                    f"{category_name} đã chạm {spent / limit:.0%} ngân sách: {spent:,.0f}đ/{limit:,.0f}đ. Hãy theo dõi sát hơn."
                )
        return warnings

    def _build_advice(self, period: str, total: float, top_category: str, warnings: list[str]) -> str:
        if warnings:
            return (
                f"Trong kỳ {period}, bạn đã chi {total:,.0f}đ và nhóm {top_category} đang chiếm tỷ trọng cao. "
                f"Ưu tiên rà soát các khoản trong {top_category} trước để giữ ngân sách ổn định hơn."
            )
        return (
            f"Trong kỳ {period}, bạn đã chi {total:,.0f}đ. Nhóm chi lớn nhất hiện là {top_category}; "
            f"hãy tiếp tục theo dõi nhóm này để tối ưu ngân sách đều hơn."
        )

    def _parse_numeric(self, value: Any) -> float:
        if isinstance(value, bool):
            return 0.0
        if isinstance(value, Decimal):
            return float(value)
        if isinstance(value, (int, float)):
            return float(value)
        if isinstance(value, str):
            normalized = value.strip().replace(" ", "")
            if not normalized:
                return 0.0

            comma_count = normalized.count(",")
            dot_count = normalized.count(".")
            if comma_count and dot_count:
                if normalized.rfind(",") > normalized.rfind("."):
                    normalized = normalized.replace(".", "").replace(",", ".")
                else:
                    normalized = normalized.replace(",", "")
            elif comma_count:
                if re.fullmatch(r"\d{1,3}(?:,\d{3})+", normalized):
                    normalized = normalized.replace(",", "")
                else:
                    normalized = normalized.replace(",", ".")
            elif dot_count and re.fullmatch(r"\d{1,3}(?:\.\d{3})+", normalized):
                normalized = normalized.replace(".", "")

            try:
                return float(Decimal(normalized))
            except (InvalidOperation, ValueError):
                return 0.0
        return 0.0
