from functools import lru_cache

from fastapi import Depends, FastAPI, HTTPException

from app.config import get_settings
from app.embedding import Embedder
from app.llm import LlmClient, LlmClientError, LlmConfigurationError
from app.schemas import AnswerRequest, AnswerResponse, EmbedRequest, EmbedResponse

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


@app.post("/embed", response_model=EmbedResponse)
def embed_text(request: EmbedRequest, embedder: Embedder = Depends(get_embedder)) -> EmbedResponse:
    return EmbedResponse(embedding=embedder.embed(request.text))


@app.post("/answer", response_model=AnswerResponse)
def answer(request: AnswerRequest, llm_client: LlmClient = Depends(get_llm_client)) -> AnswerResponse:
    contexts = [context.model_dump() for context in request.contexts]
    try:
        return AnswerResponse(answer=llm_client.generate_answer(request.query, contexts))
    except LlmConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except LlmClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error
