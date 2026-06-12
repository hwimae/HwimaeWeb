from pydantic import BaseModel


class MovieInfoResponse(BaseModel):
    module: str
    status: str
    message: str
