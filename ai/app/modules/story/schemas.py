from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints


NonBlankText = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1)]


class EmbedRequest(BaseModel):
    text: NonBlankText = Field(max_length=12000)


class EmbedResponse(BaseModel):
    embedding: list[float]


class StoryContext(BaseModel):
    storyId: str
    title: str
    authors: str
    category: str
    reason: str
    content: str
    score: float


class AnswerRequest(BaseModel):
    query: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2)] = Field(max_length=1000)
    contexts: list[StoryContext] = Field(min_length=1, max_length=10)


class AnswerResponse(BaseModel):
    answer: str
