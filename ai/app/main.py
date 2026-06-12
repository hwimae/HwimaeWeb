from functools import lru_cache

from fastapi import FastAPI

from app.config import get_settings
from app.embedding import Embedder
from app.finance import advice_router, chat_router, expense_router, finance_router, invoice_router
from app.llm import LlmClient
from app.modules.movie.router import movie_router
from app.modules.story.router import configure_dependencies, legacy_router, story_router

app = FastAPI(title="Story Recommendation AI Service")


@lru_cache
def create_embedder() -> Embedder:
    settings = get_settings()
    return Embedder(settings.embedding_model)


@lru_cache
def create_llm_client() -> LlmClient:
    settings = get_settings()
    return LlmClient(settings.gemini_api_key, settings.gemini_model, settings.gemini_api_url)


def get_embedder() -> Embedder:
    return create_embedder()


def get_llm_client() -> LlmClient:
    return create_llm_client()


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


configure_dependencies(get_embedder, get_llm_client)

app.include_router(legacy_router)
app.include_router(story_router)
app.include_router(movie_router)
app.include_router(finance_router)
app.include_router(expense_router)
app.include_router(invoice_router)
app.include_router(advice_router)
app.include_router(chat_router)
