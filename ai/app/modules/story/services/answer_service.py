from app.core.config import Settings
from app.core.errors import AiConfigurationError, AiProviderError
from app.core.gemini import GeminiTextClient
from app.modules.story.schemas import StoryContext


class LlmConfigurationError(AiConfigurationError):
    pass


class LlmClientError(AiProviderError):
    pass


class LlmClient:
    def __init__(self, api_key: str, model: str, api_url: str) -> None:
        self.settings = Settings(
            gemini_api_key=api_key,
            gemini_model=model,
            gemini_api_url=api_url,
        )
        self.client = GeminiTextClient(self.settings)

    def generate_answer(self, query: str, contexts: list[dict]) -> str:
        prompt = build_prompt(query, contexts)
        try:
            self.client.require_api_key()
            answer = self.client.generate_text(prompt)
        except AiConfigurationError as error:
            raise LlmConfigurationError(str(error)) from error
        except AiProviderError as error:
            raise LlmClientError(str(error)) from error

        normalized = answer.strip()
        if len(normalized) == 0:
            raise LlmClientError("Gemini returned an empty response")
        return normalized


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
