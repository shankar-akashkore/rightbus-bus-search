from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, Query, Request

from app.config import Settings, get_settings
from app.errors import InvalidSearchError
from app.gds_client import GdsClient
from app.schemas import ErrorResponse, SearchParams, SearchResponse
from app.search_service import search_buses

router = APIRouter()

ERROR_RESPONSES = {
    422: {"model": ErrorResponse, "description": "Missing or invalid search parameters"},
    502: {"model": ErrorResponse, "description": "The GDS is unreachable or sent a bad response"},
    504: {"model": ErrorResponse, "description": "The GDS took too long to respond"},
}


def get_gds_client(request: Request) -> GdsClient:
    """The shared client created at startup. Tests override this dependency."""
    return request.app.state.gds_client


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.get("/api/buses/search", responses=ERROR_RESPONSES)
async def search(
    params: Annotated[SearchParams, Query()],
    gds: Annotated[GdsClient, Depends(get_gds_client)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> SearchResponse:
    """Available buses for one route and date, sorted by departure time."""
    if not settings.allow_past_dates and params.journey_date < date.today():
        message = "journey_date cannot be in the past"
        raise InvalidSearchError(message, details=[{"field": "journey_date", "message": message}])
    return await search_buses(params, gds)
