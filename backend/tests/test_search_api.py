import pytest

from app.config import Settings, get_settings
from app.main import app

SEARCH_URL = "/api/buses/search"
VALID = {"source": "Bangalore", "destination": "Mumbai", "journey_date": "2026-08-09"}
ALL_TRIP_IDS = {"TRP-128475", "TRP-120807", "TRP-110955", "TRP-128852", "TRP-130024"}


def search(client, **overrides):
    """Search with the valid params, changed by overrides (None leaves a param out)."""
    params = {key: value for key, value in {**VALID, **overrides}.items() if value is not None}
    return client.get(SEARCH_URL, params=params)


def assert_validation_error(response, field):
    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert field in [detail["field"] for detail in error["details"]]
    return error


# The five test cases the assignment asks for


def test_bangalore_to_mumbai_returns_every_matching_trip(client):
    response = search(client)

    assert response.status_code == 200
    body = response.json()
    assert body["total_results"] == 5
    assert {bus["trip_id"] for bus in body["buses"]} == ALL_TRIP_IDS
    # Includes the three trips whose route_name says Jaisalmer or Jodhpur.
    assert {"TRP-120807", "TRP-128852", "TRP-130024"} <= {bus["trip_id"] for bus in body["buses"]}
    assert body["meta"] == {
        "provider_trip_count": 5,
        "excluded": {"route_mismatch": 0, "date_mismatch": 0, "unavailable": 0, "invalid": 0},
    }


def test_bangalore_to_delhi_returns_an_empty_list_not_an_error(client):
    response = search(client, destination="Delhi")

    assert response.status_code == 200
    body = response.json()
    assert body["total_results"] == 0
    assert body["buses"] == []
    assert body["meta"]["excluded"]["route_mismatch"] == 5


def test_missing_source_is_rejected(client):
    error = assert_validation_error(search(client, source=None), "source")
    assert error["message"] == "source is required"


def test_missing_destination_is_rejected(client):
    error = assert_validation_error(search(client, destination=None), "destination")
    assert error["message"] == "destination is required"


@pytest.mark.parametrize(
    ("source", "destination"),
    [("Bangalore", "Bangalore"), ("  bangalore ", "BANGALORE"), ("Bengaluru", "Bangalore")],
)
def test_same_source_and_destination_is_rejected(client, source, destination):
    response = search(client, source=source, destination=destination)

    assert response.status_code == 422
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["message"] == "source and destination must be different cities"


def test_blank_source_counts_as_missing(client):
    assert_validation_error(search(client, source="   "), "source")


def test_missing_journey_date_is_rejected(client):
    assert_validation_error(search(client, journey_date=None), "journey_date")


@pytest.mark.parametrize("journey_date", ["09-08-2026", "2026-02-30", "tomorrow", "2026-8-9"])
def test_invalid_journey_date_is_rejected(client, journey_date):
    assert_validation_error(search(client, journey_date=journey_date), "journey_date")


def test_past_dates_can_be_rejected_in_strict_mode(client):
    app.dependency_overrides[get_settings] = lambda: Settings(allow_past_dates=False)

    error = assert_validation_error(search(client, journey_date="2020-01-01"), "journey_date")
    assert error["message"] == "journey_date cannot be in the past"


def test_other_dates_return_no_buses(client):
    body = search(client, journey_date="2026-08-10").json()

    assert body["buses"] == []
    assert body["meta"]["excluded"]["date_mismatch"] == 5


def test_reverse_direction_returns_no_buses(client):
    body = search(client, source="Mumbai", destination="Bangalore").json()

    assert body["buses"] == []
    assert body["meta"]["excluded"]["route_mismatch"] == 5


@pytest.mark.parametrize(
    ("source", "destination"), [("  bangalore ", "MUMBAI"), ("Bengaluru", "Bombay")]
)
def test_city_matching_ignores_case_spacing_and_aliases(client, source, destination):
    body = search(client, source=source, destination=destination).json()

    assert body["total_results"] == 5
    assert (body["source"], body["destination"]) == ("Bangalore", "Mumbai")


def test_results_are_sorted_by_departure_time(client):
    buses = search(client).json()["buses"]

    assert [bus["departure_at"] for bus in buses] == [
        "2026-08-09T16:00:00",
        "2026-08-09T16:04:00",
        "2026-08-09T19:30:00",
        "2026-08-09T21:15:00",
        "2026-08-09T23:03:00",
    ]


def test_returns_clean_fields_and_hides_provider_internals(client):
    buses = search(client).json()["buses"]
    bus = next(bus for bus in buses if bus["trip_id"] == "TRP-110955")

    assert bus["operator"] == "Infinity Infoway Pvt. Ltd."
    assert bus["is_ac"] is True
    assert bus["seat_type"] == "sleeper"
    assert bus["arrival_at"] == "2026-08-10T13:30:00"  # provider sent "01:30 PM"
    assert bus["duration_minutes"] == 1080
    assert (bus["fare"], bus["currency"]) == (3592, "INR")
    assert bus["seats_available"] == 10
    assert len(bus["boarding_points"]) == 14
    assert len(bus["dropping_points"]) == 14
    assert bus["boarding_points"][0]["contact"] is None  # provider sent the placeholder "0"
    for internal in ("booking_token", "route_name", "proximity_info"):
        assert internal not in bus


def test_unknown_routes_use_the_same_error_shape(client):
    response = client.get("/api/does-not-exist")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"
