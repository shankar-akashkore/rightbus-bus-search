import httpx
import pytest

VALID = {"source": "Bangalore", "destination": "Mumbai", "journey_date": "2026-08-09"}


def failing(exc_type):
    def handler(request):
        raise exc_type("simulated failure", request=request)

    return httpx.MockTransport(handler)


def responding(**response_kwargs):
    return httpx.MockTransport(lambda request: httpx.Response(**response_kwargs))


@pytest.mark.parametrize(
    ("transport", "status", "code"),
    [
        (failing(httpx.ConnectError), 502, "GDS_UNAVAILABLE"),
        (failing(httpx.ReadTimeout), 504, "GDS_TIMEOUT"),
        (responding(status_code=500, json={"status": "error"}), 502, "GDS_BAD_RESPONSE"),
        (responding(status_code=200, text="<html>Bad Gateway</html>"), 502, "GDS_BAD_RESPONSE"),
        (responding(status_code=200, json={"status": "error"}), 502, "GDS_BAD_RESPONSE"),
        (responding(status_code=200, json={"status": "success"}), 502, "GDS_BAD_RESPONSE"),
    ],
    ids=["connection-refused", "timeout", "http-500", "not-json", "status-error", "no-trips"],
)
def test_provider_failures_map_to_clear_errors(make_client, transport, status, code):
    response = make_client(transport).get("/api/buses/search", params=VALID)

    assert response.status_code == status
    error = response.json()["error"]
    assert error["code"] == code
    assert error["message"]
