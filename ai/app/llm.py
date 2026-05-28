import time

import httpx

from app.schemas import StoryContext


class LlmClientError(RuntimeError):
    pass


class LlmConfigurationError(LlmClientError):
    pass


class LlmClient:
    def __init__(self, api_key: str, model: str, api_url: str) -> None:
        self.api_key = api_key
        self.model = model
        self.api_url = api_url.rstrip("/")

    def generate_answer(self, query: str, contexts: list[dict]) -> str:
        if len(self.api_key.strip()) == 0:
            raise LlmConfigurationError("GEMINI_API_KEY is required")

        prompt = build_prompt(query, contexts)
        data = self._post_generate_content(prompt)
        answer = extract_gemini_text(data)
        if len(answer.strip()) == 0:
            raise LlmClientError("Gemini returned an empty response")
        return answer.strip()

    def _post_generate_content(self, prompt: str) -> object:
        url = f"{self.api_url}/models/{self.model}:generateContent"
        payload = {"contents": [{"parts": [{"text": prompt}]}]}
        headers = {"x-goog-api-key": self.api_key}

        for attempt in range(3):
            try:
                response = httpx.post(url, headers=headers, json=payload, timeout=60)
                if response.status_code in {429, 500, 502, 503, 504} and attempt < 2:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                response.raise_for_status()
                return response.json()
            except httpx.TimeoutException as error:
                if attempt < 2:
                    time.sleep(0.5 * (attempt + 1))
                    continue
                raise LlmClientError("Gemini request timed out") from error
            except httpx.HTTPError as error:
                raise LlmClientError("Gemini request failed") from error

        raise LlmClientError("Gemini request failed")


def extract_gemini_text(data: object) -> str:
    if not isinstance(data, dict):
        raise LlmClientError("Invalid Gemini response")

    candidates = data.get("candidates")
    if not isinstance(candidates, list) or len(candidates) == 0:
        raise LlmClientError("Invalid Gemini response")

    first_candidate = candidates[0]
    if not isinstance(first_candidate, dict):
        raise LlmClientError("Invalid Gemini response")

    content = first_candidate.get("content")
    if not isinstance(content, dict):
        raise LlmClientError("Invalid Gemini response")

    parts = content.get("parts")
    if not isinstance(parts, list):
        raise LlmClientError("Invalid Gemini response")

    texts = [part.get("text") for part in parts if isinstance(part, dict) and isinstance(part.get("text"), str)]
    return "".join(texts)


def build_prompt(query: str, contexts: list[dict]) -> str:
    context_lines: list[str] = []
    for index, item in enumerate(contexts, start=1):
        context = StoryContext.model_validate(item)
        context_lines.append(
            "\n".join(
                [
                    f"{index}. {context.title}",
                    f"Tác giả: {context.authors}",
                    f"Thể loại: {context.category}",
                    f"Lý do truy xuất: {context.reason}",
                    f"Đoạn liên quan: {context.content[:1200]}",
                ]
            )
        )

    joined_context = "\n\n".join(context_lines)
    return (
        "Bạn là trợ lý tư vấn truyện tiếng Việt. "
        "Chỉ gợi ý dựa trên danh sách truyện được cung cấp, không bịa truyện mới.\n\n"
        f"Gu đọc của người dùng: {query}\n\n"
        f"Truyện ứng viên:\n{joined_context}\n\n"
        "Hãy trả lời ngắn gọn bằng tiếng Việt. Với mỗi truyện, nêu lý do phù hợp và một lưu ý nếu có."
    )
