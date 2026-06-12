from app.core.errors import AiProviderError
from app.core.gemini import extract_gemini_text as _extract_gemini_text
from app.modules.story.services.answer_service import LlmClient, LlmClientError, LlmConfigurationError


def extract_gemini_text(data: object) -> str:
    try:
        return _extract_gemini_text(data)
    except AiProviderError as error:
        raise LlmClientError(str(error)) from error


__all__ = ["LlmClient", "LlmClientError", "LlmConfigurationError", "extract_gemini_text"]
