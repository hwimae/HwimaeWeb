from fastapi.testclient import TestClient

from app.main import app


def test_extract_text_contract():
    client = TestClient(app)

    response = client.post(
        "/expense/extract-text",
        json={
            "message": "Tôi uống cà phê 25k",
            "categories": [{"id": "cat1", "name": "Ăn uống", "description": "Food", "icon": "🍜"}],
            "recentExpenses": [],
            "locale": "vi-VN",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert "assistantMessage" in body
    assert "requiresConfirmation" in body


def test_advice_contract():
    client = TestClient(app)

    response = client.post("/advice/generate", json={"period": "monthly", "budgets": [], "expenses": [], "locale": "vi-VN"})

    assert response.status_code == 200
    assert response.json() == {"advice": "Mình cần thêm dữ liệu chi tiêu để đưa ra lời khuyên chính xác hơn.", "highlights": [], "warnings": []}


def test_chat_contract():
    client = TestClient(app)

    response = client.post(
        "/chat/respond",
        json={
            "sessionId": "session1",
            "message": "Xin chào",
            "messageType": "text",
            "isConfirmationResponse": False,
            "pendingExpense": None,
            "categories": [],
            "recentExpenses": [],
            "chatHistory": [],
            "locale": "vi-VN",
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "assistantMessage": "Mình đã nhận tin nhắn. AI service skeleton đang hoạt động.",
        "extractedExpense": None,
        "budgetWarning": None,
        "advice": None,
        "requiresConfirmation": False,
        "askingConfirmation": False,
        "interrupted": False,
    }
