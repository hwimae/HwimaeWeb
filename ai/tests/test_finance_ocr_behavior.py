from app.modules.finance.services.ocr_service import OcrService


def test_ocr_extracts_invoice_text_payload_fields():
    result = OcrService().extract_invoice_image(
        "receipt.txt",
        b"Highlands Coffee\nTotal: 45,000 VND\nDate: 2026-06-11",
    )

    assert result["storeName"] == "Highlands Coffee"
    assert result["totalAmount"] == 45000
    assert result["purchasedAt"] == "2026-06-11"
    assert result["assistantMessage"]


def test_ocr_returns_fallback_for_unreadable_png_bytes():
    result = OcrService().extract_invoice_image(
        "receipt.png",
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01",
    )

    assert result["storeName"] is None
    assert result["totalAmount"] is None
    assert "chưa thể đọc" in result["assistantMessage"].lower()


def test_ocr_rejects_binary_payload_with_ascii_chunks():
    result = OcrService().extract_invoice_image(
        "receipt.bin",
        b"PK\x03\x04Invoice Highlands Coffee Total 45,000 VND\x00\x01\x02Date 2026-06-11",
    )

    assert result["storeName"] is None
    assert result["totalAmount"] is None
    assert result["purchasedAt"] is None
    assert result["rawText"] is None
    assert "chưa thể đọc" in result["assistantMessage"].lower()
