from collections.abc import Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from app.modules.story.schemas import AnswerRequest, AnswerResponse, EmbedRequest, EmbedResponse
from app.modules.story.services.answer_service import LlmClientError, LlmConfigurationError

story_router = APIRouter(prefix="/story", tags=["story"])
legacy_router = APIRouter(tags=["story-legacy"])

_embedder_provider: Callable[[], Any] | None = None
_llm_client_provider: Callable[[], Any] | None = None


def configure_dependencies(
    embedder_provider: Callable[[], Any],
    llm_client_provider: Callable[[], Any],
) -> None:
    global _embedder_provider, _llm_client_provider
    _embedder_provider = embedder_provider
    _llm_client_provider = llm_client_provider


def get_embedder_dependency() -> Any:
    if _embedder_provider is None:
        raise RuntimeError("Story embedder dependency has not been configured")
    return _embedder_provider()


def get_llm_client_dependency() -> Any:
    if _llm_client_provider is None:
        raise RuntimeError("Story LLM dependency has not been configured")
    return _llm_client_provider()


def _embed_text(request: EmbedRequest, embedder: Any) -> EmbedResponse:
    return EmbedResponse(embedding=embedder.embed(request.text))


def _answer(request: AnswerRequest, llm_client: Any) -> AnswerResponse:
    contexts = [context.model_dump() for context in request.contexts]
    try:
        return AnswerResponse(answer=llm_client.generate_answer(request.query, contexts))
    except LlmConfigurationError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except LlmClientError as error:
        raise HTTPException(status_code=502, detail=str(error)) from error


@story_router.post("/embed", response_model=EmbedResponse)
def story_embed(
    request: EmbedRequest,
    embedder: Any = Depends(get_embedder_dependency),
) -> EmbedResponse:
    return _embed_text(request, embedder)


@legacy_router.post("/embed", response_model=EmbedResponse)
def legacy_embed(
    request: EmbedRequest,
    embedder: Any = Depends(get_embedder_dependency),
) -> EmbedResponse:
    return _embed_text(request, embedder)


@story_router.post("/answer", response_model=AnswerResponse)
def story_answer(
    request: AnswerRequest,
    llm_client: Any = Depends(get_llm_client_dependency),
) -> AnswerResponse:
    return _answer(request, llm_client)


@legacy_router.post("/answer", response_model=AnswerResponse)
def legacy_answer(
    request: AnswerRequest,
    llm_client: Any = Depends(get_llm_client_dependency),
) -> AnswerResponse:
    return _answer(request, llm_client)
