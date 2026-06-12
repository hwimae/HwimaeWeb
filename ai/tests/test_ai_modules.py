from fastapi.testclient import TestClient

from app.main import app, get_embedder, get_llm_client
from app.modules.story.router import get_embedder_dependency, get_llm_client_dependency
from app.modules.story.services.answer_service import LlmConfigurationError


class FakeEmbedder:
    def embed(self, text: str) -> list[float]:
        return [0.4, 0.5, 0.6]


class FakeLlmClient:
    def generate_answer(self, query: str, contexts: list[dict]) -> str:
        return f"Gợi ý cho: {query}"


class MissingKeyLlmClient:
    def generate_answer(self, query: str, contexts: list[dict]) -> str:
        raise LlmConfigurationError("GEMINI_API_KEY is required")


STORY_CONTEXT = {
    "storyId": "story-1",
    "title": "Truyện Phiêu Lưu",
    "authors": "Tác giả A",
    "category": "Fantasy",
    "reason": "Có nhiều hành trình khám phá.",
    "content": "Nhân vật chính bắt đầu chuyến đi qua vùng đất lạ.",
    "score": 0.91,
}


def test_main_exports_app_and_dependencies():
    assert app is not None
    assert callable(get_embedder)
    assert callable(get_llm_client)


def test_embed_routes_share_same_behavior():
    app.dependency_overrides[get_embedder_dependency] = lambda: FakeEmbedder()
    try:
        client = TestClient(app)

        legacy_response = client.post("/embed", json={"text": "truyện phiêu lưu"})
        story_response = client.post("/story/embed", json={"text": "truyện phiêu lưu"})

        assert legacy_response.status_code == 200
        assert story_response.status_code == 200
        assert legacy_response.json() == {"embedding": [0.4, 0.5, 0.6]}
        assert story_response.json() == {"embedding": [0.4, 0.5, 0.6]}
    finally:
        app.dependency_overrides.clear()


def test_story_answer_returns_llm_text():
    app.dependency_overrides[get_llm_client_dependency] = lambda: FakeLlmClient()
    try:
        client = TestClient(app)

        response = client.post(
            "/story/answer",
            json={
                "query": "Tôi thích truyện phiêu lưu",
                "contexts": [STORY_CONTEXT],
            },
        )

        assert response.status_code == 200
        assert response.json() == {"answer": "Gợi ý cho: Tôi thích truyện phiêu lưu"}
    finally:
        app.dependency_overrides.clear()


def test_story_answer_returns_service_unavailable_when_gemini_key_is_missing():
    app.dependency_overrides[get_llm_client_dependency] = lambda: MissingKeyLlmClient()
    try:
        client = TestClient(app)

        response = client.post(
            "/story/answer",
            json={
                "query": "Tôi thích truyện phiêu lưu",
                "contexts": [STORY_CONTEXT],
            },
        )

        assert response.status_code == 503
        assert response.json() == {"detail": "GEMINI_API_KEY is required"}
    finally:
        app.dependency_overrides.clear()


def test_movie_info_returns_stub_boundary_response():
    client = TestClient(app)

    response = client.get("/movie/info")

    assert response.status_code == 200
    assert response.json() == {
        "module": "movie",
        "status": "stub",
        "message": "Movie AI module boundary exists; recommendation behavior is outside this scope.",
    }
