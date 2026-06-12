import json

import httpx

from app.core.config import Settings
from app.core.errors import AiConfigurationError, AiProviderError
from app.shared.text_utils import strip_markdown_fence


class GeminiTextClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def require_api_key(self) -> str:
        api_key = self.settings.gemini_api_key.strip()
        if len(api_key) == 0:
            raise AiConfigurationError("GEMINI_API_KEY is required")
        return api_key

    def generate_text(self, prompt: str) -> str:
        api_key = self.require_api_key()
        url = f"{self.settings.gemini_api_url.rstrip('/')}/models/{self.settings.gemini_model}:generateContent"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"x-goog-api-key": api_key}

        try:
            response = httpx.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status()
        except httpx.TimeoutException as error:
            raise AiProviderError("Gemini request timed out") from error
        except httpx.HTTPError as error:
            raise AiProviderError("Gemini request failed") from error

        return extract_gemini_text(response.json())


def extract_gemini_text(data: object) -> str:
    if not isinstance(data, dict):
        raise AiProviderError("Invalid Gemini response")

    candidates = data.get("candidates")
    if not isinstance(candidates, list) or len(candidates) == 0:
        raise AiProviderError("Invalid Gemini response")

    first_candidate = candidates[0]
    if not isinstance(first_candidate, dict):
        raise AiProviderError("Invalid Gemini response")

    content = first_candidate.get("content")
    if not isinstance(content, dict):
        raise AiProviderError("Invalid Gemini response")

    parts = content.get("parts")
    if not isinstance(parts, list):
        raise AiProviderError("Invalid Gemini response")

    texts = [part.get("text") for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str)]
    return "".join(texts)


def parse_json_object(text: str) -> dict[str, object]:
    normalized = strip_markdown_fence(text)
    try:
        data = json.loads(normalized)
    except json.JSONDecodeError as error:
        raise AiProviderError("Invalid provider payload") from error

    if not isinstance(data, dict):
        raise AiProviderError("Invalid provider payload")

    return data
