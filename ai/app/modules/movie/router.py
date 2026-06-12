from fastapi import APIRouter

from app.modules.movie.schemas import MovieInfoResponse
from app.modules.movie.services.stub_service import get_movie_module_info

movie_router = APIRouter(prefix="/movie", tags=["movie"])


@movie_router.get("/info", response_model=MovieInfoResponse)
def movie_info() -> MovieInfoResponse:
    return MovieInfoResponse(**get_movie_module_info())
