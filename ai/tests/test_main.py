from fastapi.testclient import TestClient

from app.llm import LlmConfigurationError, extract_gemini_text
from app.main import app
from app.modules.story.router import get_embedder_dependency, get_llm_client_dependency


class FakeEmbedder:
    def embed(self, text: str) -> list[float]:
        return [0.1, 0.2, 0.3]


class FakeLlmClient:
    def generate_answer(self, query: str, contexts: list[dict]) -> str:
        titles = ", ".join(context["title"] for context in contexts)
        return f"Bạn có thể thử đọc: {titles}."


class MissingKeyLlmClient:
    def generate_answer(self, query: str, contexts: list[dict]) -> str:
        raise LlmConfigurationError("GEMINI_API_KEY is required")


def test_healthcheck_returns_ok():
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_embed_returns_vector():
    app.dependency_overrides[get_embedder_dependency] = lambda: FakeEmbedder()
    try:
        client = TestClient(app)

        response = client.post("/embed", json={"text": "truyện tu tiên main yếu thành mạnh"})

        assert response.status_code == 200
        assert response.json() == {"embedding": [0.1, 0.2, 0.3]}
    finally:
        app.dependency_overrides.clear()


def test_answer_returns_llm_text():
    app.dependency_overrides[get_llm_client_dependency] = lambda: FakeLlmClient()
    try:
        client = TestClient(app)

        response = client.post(
            "/answer",
            json={
                "query": "Tôi thích truyện phiêu lưu",
                "contexts": [
                    {
                        "storyId": "story-1",
                        "title": "Truyện Phiêu Lưu",
                        "authors": "Tác giả A",
                        "category": "Fantasy",
                        "reason": "Có nhiều hành trình khám phá.",
                        "content": "Nhân vật chính bắt đầu chuyến đi qua vùng đất lạ.",
                        "score": 0.91,
                    }
                ],
            },
        )

        assert response.status_code == 200
        assert response.json() == {"answer": "Bạn có thể thử đọc: Truyện Phiêu Lưu."}
    finally:
        app.dependency_overrides.clear()


def test_answer_returns_service_unavailable_when_gemini_key_is_missing():
    app.dependency_overrides[get_llm_client_dependency] = lambda: MissingKeyLlmClient()
    try:
        client = TestClient(app)

        response = client.post(
            "/answer",
            json={
                "query": "Tôi thích truyện phiêu lưu",
                "contexts": [
                    {
                        "storyId": "story-1",
                        "title": "Truyện Phiêu Lưu",
                        "authors": "Tác giả A",
                        "category": "Fantasy",
                        "reason": "Có nhiều hành trình khám phá.",
                        "content": "Nhân vật chính bắt đầu chuyến đi qua vùng đất lạ.",
                        "score": 0.91,
                    }
                ],
            },
        )

        assert response.status_code == 503
        assert response.json() == {"detail": "GEMINI_API_KEY is required"}
    finally:
        app.dependency_overrides.clear()


def test_extract_gemini_text_combines_response_parts():
    response = {
        "candidates": [
            {
                "content": {
                    "parts": [
                        {"text": "Bạn nên thử Truyện A"},
                        {"text": " vì có motif tu tiên."},
                    ]
                }
            }
        ]
    }

    assert extract_gemini_text(response) == "Bạn nên thử Truyện A vì có motif tu tiên."
