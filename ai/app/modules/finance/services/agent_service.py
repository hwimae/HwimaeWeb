import re
import unicodedata
from typing import Any

from app.modules.finance.services.expense_processing_service import ExpenseProcessingService
from app.modules.finance.services.financial_advice_service import FinancialAdviceService


class AgentService:
    ADVICE_PATTERNS = [
        r"\bloi\s+khuyen\b",
        r"\btu\s+van\b",
        r"\bxin\s+khuyen\b",
        r"\bcho\s+(?:toi|m[ij]nh|em|anh|chi)\s+(?:xin\s+)?(?:loi\s+khuyen|tu\s+van)\b",
        r"\bbao\s+cao\s+chi\s+tieu\b",
        r"\bphan\s+tich\s+chi\s+tieu\b",
        r"\btong\s+ket\s+chi\s+tieu\b",
    ]
    QUESTION_PATTERNS = [
        r"\?$",
        r"\bdung\s+khong\b",
        r"\bco\s+(?:dung|phai)\s+khong\b",
        r"\bphai\s+khong\b",
        r"\bsao\b",
        r"\bthe\s+nao\b",
        r"\bkhi\s+nao\b",
        r"\btai\s+sao\b",
        r"\bvi\s+sao\b",
        r"\bao\b",
    ]
    CONFIRM_PATTERNS = [
        r"^(?:ok(?:e)?|okay|yes|yep|da|duoc|dong\s+y|xac\s+nhan|luu)(?:\s+(?:nhe|nha|giup\s+(?:minh|toi)))?$",
        r"^(?:ok(?:e)?|okay)\s+luu(?:\s+(?:nhe|nha|giup\s+(?:minh|toi)))?$",
        r"^(?:dong\s+y|xac\s+nhan)\s+luu$",
    ]
    CANCEL_PATTERNS = [
        r"^(?:huy|bo\s+qua|cancel|thoi)(?:\s+(?:nhe|nha))?$",
        r"^(?:khong|ko)\s+luu(?:\s+(?:nhe|nha))?$",
        r"^(?:dung\s+luu|khoi\s+luu)$",
        r"^(?:khong\s+can\s+luu|khong\s+muon\s+luu)$",
    ]

    def __init__(self) -> None:
        self.expense_service = ExpenseProcessingService()
        self.advice_service = FinancialAdviceService()

    def respond(self, request: dict[str, Any]) -> dict[str, Any]:
        message = str(request.get("message", ""))
        pending_expense = request.get("pendingExpense")
        categories = self._list_of_dicts(request.get("categories"))
        recent_expenses = self._list_of_dicts(request.get("recentExpenses"))
        budgets = self._list_of_dicts(request.get("budgets"))

        if request.get("isConfirmationResponse") and isinstance(pending_expense, dict):
            return self._respond_to_confirmation(message, pending_expense, categories, recent_expenses, budgets)

        if self._is_advice_request(message):
            advice = self.advice_service.generate(self._detect_period(message), budgets, recent_expenses)
            return {
                "assistantMessage": advice["advice"],
                "extractedExpense": None,
                "budgetWarning": "\n".join(advice["warnings"]) if advice["warnings"] else None,
                "advice": advice["advice"],
                "requiresConfirmation": False,
                "askingConfirmation": False,
                "interrupted": False,
            }

        extracted = self.expense_service.extract_expense_from_text(message, categories)
        if extracted.get("amount") is not None:
            return {
                "assistantMessage": extracted["assistantMessage"],
                "extractedExpense": extracted,
                "budgetWarning": None,
                "advice": None,
                "requiresConfirmation": True,
                "askingConfirmation": True,
                "interrupted": False,
            }

        return {
            "assistantMessage": "Mình đã nhận tin nhắn. AI service skeleton đang hoạt động.",
            "extractedExpense": None,
            "budgetWarning": None,
            "advice": None,
            "requiresConfirmation": False,
            "askingConfirmation": False,
            "interrupted": False,
        }

    def _respond_to_confirmation(
        self,
        message: str,
        pending_expense: dict[str, Any],
        categories: list[dict[str, Any]],
        recent_expenses: list[dict[str, Any]],
        budgets: list[dict[str, Any]],
    ) -> dict[str, Any]:
        if self._is_cancel(message):
            return {
                "assistantMessage": "Mình đã hủy khoản chi này, chưa có dữ liệu nào được lưu.",
                "extractedExpense": None,
                "budgetWarning": None,
                "advice": None,
                "requiresConfirmation": False,
                "askingConfirmation": False,
                "interrupted": False,
            }

        if self._is_confirm(message):
            return {
                "assistantMessage": "Mình đã xác nhận khoản chi. Backend sẽ lưu khoản này sau khi người dùng đồng ý.",
                "extractedExpense": pending_expense,
                "budgetWarning": None,
                "advice": None,
                "requiresConfirmation": False,
                "askingConfirmation": False,
                "interrupted": False,
            }

        if self._is_advice_request(message):
            advice = self.advice_service.generate(self._detect_period(message), budgets, recent_expenses)
            prefix = "Mình tạm dừng xác nhận khoản chi trước để trả lời yêu cầu mới của bạn. "
            return {
                "assistantMessage": prefix + advice["advice"],
                "extractedExpense": None,
                "budgetWarning": "\n".join(advice["warnings"]) if advice["warnings"] else None,
                "advice": advice["advice"],
                "requiresConfirmation": False,
                "askingConfirmation": False,
                "interrupted": True,
            }

        extracted = self.expense_service.extract_expense_from_text(message, categories)
        if extracted.get("amount") is not None:
            return {
                "assistantMessage": "Mình thấy bạn đang nhập một khoản chi mới nên sẽ chuyển sang khoản này. "
                + extracted["assistantMessage"],
                "extractedExpense": extracted,
                "budgetWarning": None,
                "advice": None,
                "requiresConfirmation": True,
                "askingConfirmation": True,
                "interrupted": True,
            }

        return {
            "assistantMessage": "Bạn muốn lưu, sửa hay hủy khoản chi này?",
            "extractedExpense": pending_expense,
            "budgetWarning": None,
            "advice": None,
            "requiresConfirmation": True,
            "askingConfirmation": True,
            "interrupted": False,
        }

    def _list_of_dicts(self, value: Any) -> list[dict[str, Any]]:
        if not isinstance(value, list):
            return []
        return [item for item in value if isinstance(item, dict)]

    def _normalize_message(self, message: str) -> str:
        decomposed = unicodedata.normalize("NFKD", message.casefold())
        without_marks = "".join(char for char in decomposed if not unicodedata.combining(char))
        without_marks = without_marks.replace("đ", "d")
        return re.sub(r"\s+", " ", without_marks).strip()

    def _matches_any_pattern(self, normalized_message: str, patterns: list[str]) -> bool:
        return any(re.search(pattern, normalized_message) for pattern in patterns)

    def _strip_terminal_punctuation(self, normalized_message: str) -> str:
        return re.sub(r"[!?.,]+$", "", normalized_message).strip()

    def _looks_like_question(self, normalized_message: str) -> bool:
        return self._matches_any_pattern(normalized_message, self.QUESTION_PATTERNS)

    def _is_advice_request(self, message: str) -> bool:
        normalized = self._normalize_message(message)
        return self._matches_any_pattern(normalized, self.ADVICE_PATTERNS)

    def _detect_period(self, message: str) -> str:
        normalized = self._normalize_message(message)
        if any(keyword in normalized for keyword in ["hom nay", "hang ngay", "daily"]):
            return "daily"
        if any(keyword in normalized for keyword in ["tuan", "hang tuan", "week", "weekly"]):
            return "weekly"
        return "monthly"

    def _is_confirm(self, message: str) -> bool:
        normalized = self._normalize_message(message)
        cleaned = self._strip_terminal_punctuation(normalized)
        if not cleaned:
            return False
        if self._matches_any_pattern(cleaned, self.CONFIRM_PATTERNS):
            return True
        if self._looks_like_question(normalized) or self._is_cancel(message):
            return False
        return False

    def _is_cancel(self, message: str) -> bool:
        normalized = self._normalize_message(message)
        cleaned = self._strip_terminal_punctuation(normalized)
        if not cleaned:
            return False
        if self._matches_any_pattern(cleaned, self.CANCEL_PATTERNS):
            return True
        if self._looks_like_question(normalized):
            return False
        return False
