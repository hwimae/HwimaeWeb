from fastapi.testclient import TestClient

from app.main import app


def test_invoice_extract_contract():
    client = TestClient(app)

    response = client.post(
        "/invoice/extract-image",
        files={"file": ("bill.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["assistantMessage"].startswith("Đã nhận file bill.png")
    assert body["storeName"] is None
    assert body["totalAmount"] is None
