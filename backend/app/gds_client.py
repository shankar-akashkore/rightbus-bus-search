import httpx

from app.errors import GdsBadResponseError, GdsTimeoutError, GdsUnavailableError

SEARCH_PATH = "/mock-gds/search"


class GdsClient:
    """Calls the GDS and turns every failure into one of our own errors."""

    def __init__(self, http: httpx.AsyncClient):
        self._http = http

    async def search_trips(self, source: str, destination: str, journey_date: str) -> list:
        params = {"source": source, "destination": destination, "journey_date": journey_date}
        try:
            response = await self._http.get(SEARCH_PATH, params=params)
        except httpx.TimeoutException as exc:  # check before HTTPError: it is a subclass
            raise GdsTimeoutError(reason=repr(exc)) from exc
        except httpx.HTTPError as exc:
            raise GdsUnavailableError(reason=repr(exc)) from exc

        if response.status_code != 200:
            raise GdsBadResponseError(reason=f"provider returned HTTP {response.status_code}")
        try:
            payload = response.json()
        except ValueError as exc:
            raise GdsBadResponseError(reason="provider returned invalid JSON") from exc

        if not isinstance(payload, dict) or payload.get("status") != "success":
            raise GdsBadResponseError(reason="provider did not report success")
        trips = payload.get("trips")
        if not isinstance(trips, list):
            raise GdsBadResponseError(reason="provider response has no trips list")
        return trips
