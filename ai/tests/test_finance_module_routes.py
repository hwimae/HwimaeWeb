from fastapi.testclient import TestClient

from app.main import app


def test_finance_module_and_legacy_extract_routes_match():
    client = TestClient(app)
    payload = {
        "message": "Tôi vừa uống cà phê 25k ở Highlands",
        "categories": [{"id": "cat-food", "name": "Ăn uống", "description": "Food", "icon": "🍜"}],
        "recentExpenses": [],
        "locale": "vi-VN",
    }

    legacy = client.post("/expense/extract-text", json=payload)
    module = client.post("/finance/expense/extract-text", json=payload)

    assert legacy.status_code == 200
    assert module.status_code == 200
    assert legacy.json()["amount"] == 25000
    assert module.json()["amount"] == 25000
    assert legacy.json()["merchantName"] == "Highlands"
    assert module.json()["categoryId"] == "cat-food"


def test_finance_chat_module_route_returns_confirmation_state():
    client = TestClient(app)

    response = client.post(
        "/finance/chat/respond",
        json={
            "sessionId": "session-1",
            "message": "Tôi vừa uống cà phê 25k ở Highlands",
            "messageType": "text",
            "isConfirmationResponse": False,
            "pendingExpense": None,
            "categories": [{"id": "cat-food", "name": "Ăn uống"}],
            "budgets": [],
            "recentExpenses": [],
            "chatHistory": [],
            "locale": "vi-VN",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["requiresConfirmation"] is True
    assert body["askingConfirmation"] is True
    assert body["extractedExpense"]["amount"] == 25000
