from app.schemas import SearchParams
from app.search_service import process_trips
from tests.factories import make_trip, supplied_trip

PARAMS = SearchParams(source="Bangalore", destination="Mumbai", journey_date="2026-08-09")


def trip_ids(buses):
    return [bus.trip_id for bus in buses]


def test_excludes_unavailable_and_sold_out_trips():
    trips = [
        make_trip("TRP-OK"),
        make_trip("TRP-UNAVAILABLE", availability__is_available=False),
        make_trip("TRP-SOLD-OUT", availability__seats_available=0),
    ]

    buses, excluded = process_trips(trips, PARAMS)

    assert trip_ids(buses) == ["TRP-OK"]
    assert excluded.unavailable == 2


def test_matches_on_city_fields_and_ignores_route_name():
    trips = [
        # route_name says Mumbai, but the trip really goes to Delhi: excluded.
        make_trip("TRP-DELHI", to_city_name="Delhi", route_name="Bangalore To Mumbai"),
        # route_name says Jaisalmer, but the trip really goes to Mumbai: kept.
        make_trip("TRP-MUMBAI", route_name="Bangalore To Jaisalmer"),
    ]

    buses, excluded = process_trips(trips, PARAMS)

    assert trip_ids(buses) == ["TRP-MUMBAI"]
    assert excluded.route_mismatch == 1


def test_excludes_trips_on_other_dates():
    trips = [
        make_trip(
            "TRP-NEXT-DAY",
            schedule__departure_date="2026-08-10",
            schedule__estimated_arrival_date="2026-08-11",
        )
    ]

    buses, excluded = process_trips(trips, PARAMS)

    assert buses == []
    assert excluded.date_mismatch == 1


def test_skips_malformed_trips_without_failing_the_search():
    no_price = make_trip("TRP-NO-PRICE")
    del no_price["pricing"]
    trips = [
        make_trip("TRP-OK"),
        no_price,
        make_trip("TRP-BAD-TIME", schedule__departure_time="25:99 XM"),
        make_trip(
            "TRP-ARRIVES-BEFORE-LEAVING",
            schedule__estimated_arrival_date="2026-08-09",
            schedule__arrival_time="1:00 PM",
        ),
        "not a trip at all",
    ]

    buses, excluded = process_trips(trips, PARAMS)

    assert trip_ids(buses) == ["TRP-OK"]
    assert excluded.invalid == 4


def test_sorts_by_real_departure_time_not_text():
    trips = [
        make_trip("TRP-LATE", schedule__departure_time="11:03 PM"),
        make_trip("TRP-AFTERNOON", schedule__departure_time="4:00 PM"),
        make_trip("TRP-MORNING", schedule__departure_time="09:15 AM"),
    ]

    buses, _ = process_trips(trips, PARAMS)

    assert trip_ids(buses) == ["TRP-MORNING", "TRP-AFTERNOON", "TRP-LATE"]


def test_normalizes_provider_fields():
    [bus], _ = process_trips([supplied_trip("TRP-110955")], PARAMS)

    assert bus.departure_at.isoformat() == "2026-08-09T19:30:00"
    assert bus.arrival_at.isoformat() == "2026-08-10T13:30:00"
    assert bus.seat_type == "sleeper"
    assert bus.fare == 3592
    assert bus.boarding_points[0].contact is None  # "0" placeholder dropped
    assert bus.dropping_points[0].time == "1:30 PM"


def test_trusts_structured_fields_and_flags_a_contradicting_label():
    # TRP-128475's label says "2+1 NON AC Seater"; is_ac and bus_seat_type say AC sleeper.
    [bus], _ = process_trips([supplied_trip("TRP-128475")], PARAMS)

    assert bus.is_ac is True
    assert bus.seat_type == "sleeper"
    assert {w.code for w in bus.data_warnings} == {"BUS_TYPE_AC_CONFLICT", "BUS_TYPE_SEAT_CONFLICT"}


def test_flags_a_misleading_route_name():
    [bus], _ = process_trips([supplied_trip("TRP-120807")], PARAMS)

    assert [w.code for w in bus.data_warnings] == ["ROUTE_NAME_MISMATCH"]


def test_consistent_trip_has_no_warnings():
    [bus], _ = process_trips([supplied_trip("TRP-110955")], PARAMS)

    assert bus.data_warnings == []
