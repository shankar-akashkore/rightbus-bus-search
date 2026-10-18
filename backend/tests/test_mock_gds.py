import json

import pytest
from fastapi.testclient import TestClient

from mock_gds.main import DATA_FILE, app

client = TestClient(app)
PARAMS = {"source": "Bangalore", "destination": "Mumbai", "journey_date": "2026-08-09"}


def test_returns_the_supplied_response_verbatim():
    response = client.get("/mock-gds/search", params=PARAMS)

    assert response.status_code == 200
    assert response.json() == json.loads(DATA_FILE.read_text(encoding="utf-8"))
    assert response.json()["status"] == "success"
    assert len(response.json()["trips"]) == 5


def test_ignores_search_values_like_a_coordinate_based_provider():
    response = client.get("/mock-gds/search", params={**PARAMS, "destination": "Delhi"})

    # Same 5 trips: filtering is the backend's job, not the provider's.
    assert response.status_code == 200
    assert len(response.json()["trips"]) == 5


@pytest.mark.parametrize("missing", ["source", "destination", "journey_date"])
def test_requires_every_search_param(missing):
    params = {key: value for key, value in PARAMS.items() if key != missing}

    assert client.get("/mock-gds/search", params=params).status_code == 422


def test_error_mode_simulates_a_provider_failure(monkeypatch):
    monkeypatch.setenv("MOCK_GDS_FAIL_MODE", "error")

    response = client.get("/mock-gds/search", params=PARAMS)

    assert response.status_code == 500
    assert response.json()["status"] == "error"


def test_malformed_mode_returns_a_non_json_body(monkeypatch):
    monkeypatch.setenv("MOCK_GDS_FAIL_MODE", "malformed")

    response = client.get("/mock-gds/search", params=PARAMS)

    assert response.status_code == 200
    with pytest.raises(ValueError):
        response.json()


def test_health():
    assert client.get("/health").json() == {"status": "ok"}
