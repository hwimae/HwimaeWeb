import re
from typing import Any

from app.modules.finance.services.expense_processing_service import ExpenseProcessingService


class OcrService:
    def __init__(self) -> None:
        self.expense_service = ExpenseProcessingService()

    def extract_invoice_image(self, filename: str, content: bytes) -> dict[str, Any]:
        raw_text = self._decode_text(content)
        if not raw_text:
            return self._fallback_response(filename)

        store_name = self._extract_store_name(raw_text)
        total_amount = self._extract_total_amount(raw_text)
        purchased_at = self._extract_date(raw_text)

        if total_amount is None and purchased_at is None:
            return self._fallback_response(filename, raw_text)

        extracted_data = {
            "storeName": store_name,
            "totalAmount": total_amount,
            "purchasedAt": purchased_at,
            "source": "deterministic_text_payload",
        }
        return {
            "storeName": store_name,
            "totalAmount": total_amount,
            "purchasedAt": purchased_at,
            "rawText": raw_text,
            "extractedData": extracted_data,
            "assistantMessage": f"Đã trích xuất thông tin từ file {filename}. Vui lòng kiểm tra lại trước khi lưu.",
        }

    def _fallback_response(self, filename: str, raw_text: str | None = None) -> dict[str, Any]:
        return {
            "storeName": None,
            "totalAmount": None,
            "purchasedAt": None,
            "rawText": raw_text,
            "extractedData": {},
            "assistantMessage": f"Đã nhận file {filename} nhưng chưa thể đọc rõ nội dung hóa đơn. Bạn vui lòng thử ảnh rõ hơn hoặc nhập tay giúp mình nhé.",
        }

    def _decode_text(self, content: bytes) -> str | None:
        if not content or self._looks_like_binary(content):
            return None

        try:
            text = content.decode("utf-8").strip()
        except UnicodeDecodeError:
            return None

        if not text or not re.search(r"[A-Za-zÀ-ỹ]", text):
            return None
        return text

    def _looks_like_binary(self, content: bytes) -> bool:
        signatures = [
            b"\x89PNG\r\n\x1a\n",
            b"\xff\xd8\xff",
            b"GIF87a",
            b"GIF89a",
            b"%PDF-",
            b"PK\x03\x04",
        ]
        if any(content.startswith(signature) for signature in signatures):
            return True

        sample = content[:512]
        if b"\x00" in sample:
            return True

        if not sample:
            return False

        control_bytes = sum(
            1
            for byte in sample
            if byte < 32 and byte not in {9, 10, 13, 12}
        )
        return control_bytes / len(sample) > 0.1

    def _extract_store_name(self, raw_text: str) -> str | None:
        ignored_prefixes = ("ngày", "date", "tổng", "total", "cộng", "amount", "thành tiền")
        for line in raw_text.splitlines():
            value = line.strip(" \t:-")
            if value and not value.lower().startswith(ignored_prefixes):
                return value
        return None

    def _extract_date(self, raw_text: str) -> str | None:
        iso_match = re.search(r"\b(\d{4}-\d{2}-\d{2})\b", raw_text)
        if iso_match:
            return iso_match.group(1)

        local_match = re.search(r"\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b", raw_text)
        if local_match:
            day, month, year = local_match.groups()
            return f"{year}-{int(month):02d}-{int(day):02d}"
        return None

    def _extract_total_amount(self, raw_text: str) -> float | None:
        amount_lines = [
            line
            for line in raw_text.splitlines()
            if re.search(r"tổng|total|amount|thành tiền|vnd|đ|₫", line, re.IGNORECASE)
        ]
        for line in amount_lines + [raw_text]:
            amount = self.expense_service._extract_amount(line)
            if amount is not None:
                return amount
        return None
