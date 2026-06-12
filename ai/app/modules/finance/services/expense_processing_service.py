import re
from typing import Any

from app.modules.finance.services.categorization_service import CategorizationService


class ExpenseProcessingService:
    KNOWN_MERCHANTS = [
        "Highlands Coffee",
        "Highlands",
        "Circle K",
        "VinMart",
        "WinMart",
        "Grab",
        "Shopee",
        "Lazada",
        "Tiki",
        "Phở 24",
    ]
    EXPENSE_CONTEXT_KEYWORDS = [
        "mua",
        "chi",
        "trả",
        "tra",
        "uống",
        "uong",
        "ăn",
        "an",
        "hết",
        "het",
        "tốn",
        "ton",
        "cà phê",
        "ca phe",
        "đóng tiền",
        "dong tien",
        "thanh toán",
        "thanh toan",
    ]

    def __init__(self, categorization_service: CategorizationService | None = None) -> None:
        self.categorization_service = categorization_service or CategorizationService()

    def extract_expense_from_text(self, message: str, categories: list[dict[str, Any]]) -> dict[str, Any]:
        amount = self._extract_amount(message)
        category = self.categorization_service.pick_category(message, categories)
        merchant = self._extract_merchant(message)

        return {
            "merchantName": merchant,
            "description": message,
            "amount": amount,
            "spentAt": None,
            "categoryId": category.get("id") if category else None,
            "categoryName": category.get("name") if category else None,
            "confidence": self._confidence(amount, category),
            "assistantMessage": self._build_message(amount, merchant, category),
            "requiresConfirmation": True,
        }

    def _extract_amount(self, message: str) -> float | None:
        patterns = [
            (r"(\d+(?:[.,]\d+)?)\s*(?:triệu|tr)(?=\b|\s|đ|vnd|₫)", 1_000_000),
            (r"(\d+(?:[.,]\d+)?)\s*(?:nghìn|ngàn|ng)(?=\b|\s|đ|vnd|₫)", 1_000),
            (r"(\d+(?:[.,]\d+)?)\s*k(?=\b|\s|đ|vnd|₫)", 1_000),
            (r"(\d+(?:[.,]\d+)?)\s*(?:đ|vnd|₫)(?=\b|\s|$)", 1),
            (r"\$\s*(\d+(?:[.,]\d+)?)", 1),
        ]

        for pattern, multiplier in patterns:
            match = re.search(pattern, message, re.IGNORECASE)
            if not match:
                continue
            amount = self._parse_number(match.group(1), multiplier)
            if amount is not None:
                return amount

        bare_number_match = re.search(r"\b(\d{4,})\b", message, re.IGNORECASE)
        if bare_number_match and self._has_expense_context(message, bare_number_match.start(), bare_number_match.end()):
            return self._parse_number(bare_number_match.group(1), 1)

        return None

    def _parse_number(self, raw: str, multiplier: int) -> float | None:
        normalized = raw.strip().replace(" ", "")

        if multiplier == 1:
            if re.fullmatch(r"\d+[.,]\d{1,2}", normalized):
                normalized = normalized.replace(",", ".")
            else:
                normalized = normalized.replace(",", "").replace(".", "")
        else:
            normalized = normalized.replace(",", ".")

        try:
            return float(normalized) * multiplier
        except ValueError:
            return None

    def _has_expense_context(self, message: str, start: int, end: int) -> bool:
        lower = message.lower()
        if any(keyword in lower for keyword in self.EXPENSE_CONTEXT_KEYWORDS):
            return True

        window_start = max(0, start - 24)
        window_end = min(len(lower), end + 24)
        nearby_text = lower[window_start:window_end]
        return any(keyword in nearby_text for keyword in self.EXPENSE_CONTEXT_KEYWORDS)

    def _extract_merchant(self, message: str) -> str | None:
        match = re.search(r"(?:ở|tại|từ)\s+([^,.;]+)$", message, re.IGNORECASE)
        if match:
            merchant = match.group(1).strip()
            if merchant:
                return merchant

        lower = message.lower()
        for merchant in self.KNOWN_MERCHANTS:
            if merchant.lower() in lower:
                return merchant
        return None

    def _confidence(self, amount: float | None, category: dict[str, Any] | None) -> float:
        if amount is None:
            return 0.3 if category else 0.2
        if category:
            category_name = str(category.get("name", "")).strip().lower()
            if category_name in {"khác", "chưa phân loại", "uncategorized", "other"}:
                return 0.55
            return 0.85
        return 0.45

    def _build_message(self, amount: float | None, merchant: str | None, category: dict[str, Any] | None) -> str:
        if amount is None:
            return "Mình đã nhận tin nhắn chi tiêu nhưng chưa thấy số tiền rõ ràng. Bạn xác nhận lại giúp mình nhé?"

        formatted_amount = f"{amount:,.0f}đ"
        location = f" ở {merchant}" if merchant else ""
        category_name = category.get("name") if category else None
        if category_name:
            return f"Mình nhận diện khoản chi {formatted_amount}{location} thuộc nhóm {category_name}. Bạn xác nhận giúp mình nhé?"
        return f"Mình nhận diện khoản chi {formatted_amount}{location}. Bạn xác nhận số tiền và danh mục giúp mình nhé?"
