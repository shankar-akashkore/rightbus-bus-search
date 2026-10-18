import httpx
import pytest
from fastapi.testclient import TestClient

from app.gds_client import GdsClient
from app.main import app
from app.routes import get_gds_client
from mock_gds.main import app as mock_gds_app


@pytest.fixture
def make_client():
    """Build a backend TestClient whose GDS calls go through the given httpx transport."""

    def build(transport: httpx.AsyncBaseTransport) -> TestClient:
        http = httpx.AsyncClient(transport=transport, base_url="http://gds.test")
        app.dependency_overrides[get_gds_client] = lambda: GdsClient(http)
        return TestClient(app)

    yield build
    app.dependency_overrides.clear()


@pytest.fixture
def client(make_client, monkeypatch) -> TestClient:
    """The backend wired to the real mock GDS in-process, so no server has to run."""
    monkeypatch.delenv("MOCK_GDS_FAIL_MODE", raising=False)
    monkeypatch.delenv("MOCK_GDS_LATENCY_MS", raising=False)
    return make_client(httpx.ASGITransport(app=mock_gds_app))
