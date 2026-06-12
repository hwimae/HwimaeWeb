import re
from typing import Any


class CategorizationService:
    KEYWORDS: dict[str, list[str]] = {
        "Ăn uống": [
            "cà phê",
            "ăn",
            "uống",
            "phở",
            "cơm",
            "bánh mì",
            "trà sữa",
            "highlands",
            "kfc",
            "lotteria",
        ],
        "Đi lại": ["grab", "taxi", "xăng", "xe", "bus", "vé xe", "sân bay"],
        "Nhà ở": ["thuê nhà", "tiền điện", "tiền nước", "internet", "wifi"],
        "Mua sắm cá nhân": ["quần áo", "mỹ phẩm", "shopee", "lazada", "tiki"],
        "Giải trí & du lịch": ["xem phim", "du lịch", "khách sạn", "vé máy bay", "netflix"],
        "Giáo dục & học tập": ["sách", "khóa học", "học phí", "udemy"],
        "Sức khỏe & thể thao": ["thuốc", "bệnh viện", "gym", "yoga"],
    }

    def pick_category(self, message: str, categories: list[dict[str, Any]]) -> dict[str, Any] | None:
        lower = message.lower()
        best_category: dict[str, Any] | None = None
        best_score = 0

        for category in categories:
            score = self._score_category_match(lower, category)
            if score > best_score:
                best_score = score
                best_category = category

        if best_category is not None:
            return best_category
        return self.find_other_category(categories)

    def find_other_category(self, categories: list[dict[str, Any]]) -> dict[str, Any] | None:
        for category in categories:
            name = str(category.get("name", "")).strip().lower()
            if name in {"khác", "chưa phân loại", "uncategorized", "other"}:
                return category
        return None

    def _score_category_match(self, message: str, category: dict[str, Any]) -> int:
        name = str(category.get("name", "")).strip()
        if not name:
            return 0

        score = 0
        lowered_name = name.lower()
        if self._contains_keyword(message, lowered_name):
            score += 10_000 + len(lowered_name) * 100

        keywords = self.KEYWORDS.get(name, [])
        matched_keywords = [keyword for keyword in keywords if self._contains_keyword(message, keyword)]
        if matched_keywords:
            score += len(matched_keywords) * 1_000
            score += sum(len(keyword) * 10 for keyword in matched_keywords)
            score += max(len(keyword) for keyword in matched_keywords)

        return score

    def _contains_keyword(self, message: str, keyword: str) -> bool:
        escaped = re.escape(keyword.lower())
        pattern = rf"(?<!\w){escaped}(?!\w)"
        return re.search(pattern, message) is not None
