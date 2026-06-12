import re


_MARKDOWN_FENCE_PATTERN = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def strip_markdown_fence(text: str) -> str:
    stripped = text.strip()
    return _MARKDOWN_FENCE_PATTERN.sub("", stripped).strip()


def contains_any(text: str, needles: list[str] | tuple[str, ...]) -> bool:
    lowered = text.lower()
    return any(needle.lower() in lowered for needle in needles)


def normalize_spaces(text: str) -> str:
    return " ".join(text.split())
