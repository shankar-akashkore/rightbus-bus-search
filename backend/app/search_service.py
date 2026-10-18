"""Bus search logic. process_trips() is pure (no I/O), so every rule is easy to unit-test."""

import logging
import re
import time
from datetime import datetime

from pydantic import ValidationError

from app.gds_client import GdsClient
from app.schemas import (
    Bus,
    CancellationPolicy,
    DataWarning,
    ExcludedCounts,
    GdsStop,
    GdsTrip,
    SearchMeta,
    SearchParams,
    SearchResponse,
    Stop,
)
from app.utils import clean_contact, display_city, format_time_12h, normalize_city, parse_time_12h

logger = logging.getLogger("rightbus.search")

SEAT_TYPES = {"sleeper", "seater", "semi-sleeper"}
NON_AC_LABEL = re.compile(r"\bnon[\s-]*a/?c\b", re.IGNORECASE)  # "NON AC", "Non-A/C"
AC_LABEL = re.compile(r"\ba/?c\b", re.IGNORECASE)  # "AC", "A/C"


async def search_buses(params: SearchParams, gds: GdsClient) -> SearchResponse:
    source, destination = display_city(params.source), display_city(params.destination)

    started = time.perf_counter()
    raw_trips = await gds.search_trips(source, destination, params.journey_date.isoformat())
    gds_ms = (time.perf_counter() - started) * 1000

    buses, excluded = process_trips(raw_trips, params)
    logger.info(
        "search %s -> %s on %s: provider_trips=%d kept=%d excluded=%s gds_ms=%.0f",
        source,
        destination,
        params.journey_date,
        len(raw_trips),
        len(buses),
        excluded.model_dump(),
        gds_ms,
    )
    return SearchResponse(
        source=source,
        destination=destination,
        journey_date=params.journey_date,
        total_results=len(buses),
        buses=buses,
        meta=SearchMeta(provider_trip_count=len(raw_trips), excluded=excluded),
    )


def process_trips(raw_trips: list, params: SearchParams) -> tuple[list[Bus], ExcludedCounts]:
    """Keep matching trips; each dropped trip is counted under the first rule it fails."""
    source_key = normalize_city(params.source)
    destination_key = normalize_city(params.destination)
    excluded = ExcludedCounts()
    buses: list[Bus] = []

    for raw in raw_trips:
        try:
            trip = GdsTrip.model_validate(raw)
            departure_at, arrival_at = trip_times(trip)
        except (ValidationError, ValueError) as exc:
            # One broken trip must not fail the whole search: skip it and log why.
            excluded.invalid += 1
            trip_id = raw.get("trip_id") if isinstance(raw, dict) else None
            logger.warning("Skipping malformed trip %s: %s", trip_id, exc)
            continue

        # Match on city fields only: route_name can be wrong (e.g. "Bangalore To Jaisalmer").
        same_route = (
            normalize_city(trip.from_city_name) == source_key
            and normalize_city(trip.to_city_name) == destination_key
        )
        if not same_route:
            excluded.route_mismatch += 1
            continue
        if trip.schedule.departure_date != params.journey_date:
            excluded.date_mismatch += 1
            continue
        if not trip.availability.is_available or trip.availability.seats_available <= 0:
            excluded.unavailable += 1
            continue

        buses.append(to_bus(trip, departure_at, arrival_at))

    # Sort on real datetimes: as text, "11:03 PM" would sort before "4:00 PM".
    buses.sort(key=lambda bus: bus.departure_at)
    return buses, excluded


def trip_times(trip: GdsTrip) -> tuple[datetime, datetime]:
    schedule = trip.schedule
    departure_at = datetime.combine(
        schedule.departure_date, parse_time_12h(schedule.departure_time)
    )
    arrival_at = datetime.combine(
        schedule.estimated_arrival_date, parse_time_12h(schedule.arrival_time)
    )
    if arrival_at <= departure_at:
        raise ValueError(f"arrival {arrival_at} is not after departure {departure_at}")
    return departure_at, arrival_at


def to_bus(trip: GdsTrip, departure_at: datetime, arrival_at: datetime) -> Bus:
    policy = trip.cancellation_policy
    return Bus(
        trip_id=trip.trip_id,
        operator=trip.operator,
        bus_type=trip.bus_type,
        is_ac=trip.is_ac,
        seat_type=seat_type(trip),
        departure_at=departure_at,
        arrival_at=arrival_at,
        duration_minutes=trip.schedule.duration_minutes,
        fare=trip.pricing.total_fare,
        currency=trip.pricing.currency,
        seats_available=trip.availability.seats_available,
        amenities=trip.amenities,
        boarding_points=[to_stop(stop) for stop in trip.boarding_points],
        dropping_points=[to_stop(stop) for stop in trip.dropping_points],
        cancellation_policy=CancellationPolicy(**policy.model_dump()) if policy else None,
        data_warnings=find_data_warnings(trip),
    )


def seat_type(trip: GdsTrip) -> str:
    raw = trip.bus_seat_type or next(iter(trip.availability.seat_types), "")
    value = raw.strip().lower().replace("_", "-").replace(" ", "-")
    return value if value in SEAT_TYPES else "unknown"


def to_stop(stop: GdsStop) -> Stop:
    try:
        stop_time = format_time_12h(parse_time_12h(stop.time))
    except ValueError:
        stop_time = stop.time  # show the provider's text rather than lose the stop
    return Stop(
        name=stop.name,
        time=stop_time,
        contact=clean_contact(stop.contact),
        distance_km=stop.distance_km,
        is_nearest=stop.is_nearest,
    )


def label_seat_type(label: str) -> str | None:
    """Seat type claimed by the free-text label, or None if it is unclear."""
    text = label.casefold()
    says_seater, says_sleeper = "seater" in text, "sleeper" in text
    if "semi" in text or says_seater == says_sleeper:
        return None
    return "seater" if says_seater else "sleeper"


def find_data_warnings(trip: GdsTrip) -> list[DataWarning]:
    """Flag provider text that contradicts the structured fields we trust."""
    warnings = []
    route = trip.route_name.casefold()
    if route and not (
        trip.from_city_name.casefold() in route and trip.to_city_name.casefold() in route
    ):
        warnings.append(
            DataWarning(
                code="ROUTE_NAME_MISMATCH",
                message=(
                    f"Provider route name '{trip.route_name}' doesn't match "
                    f"{trip.from_city_name} → {trip.to_city_name}; matched using the city fields."
                ),
            )
        )

    label = trip.bus_type
    label_says_non_ac = bool(NON_AC_LABEL.search(label))
    label_says_ac = not label_says_non_ac and bool(AC_LABEL.search(label))
    if (label_says_non_ac and trip.is_ac) or (label_says_ac and not trip.is_ac):
        shown = "AC" if trip.is_ac else "Non-AC"
        warnings.append(
            DataWarning(
                code="BUS_TYPE_AC_CONFLICT",
                message=f"Bus type label '{label}' disagrees with the AC flag; shown as {shown}.",
            )
        )

    claimed, actual = label_seat_type(label), seat_type(trip)
    if claimed and actual in {"seater", "sleeper"} and claimed != actual:
        warnings.append(
            DataWarning(
                code="BUS_TYPE_SEAT_CONFLICT",
                message=(
                    f"Bus type label '{label}' says {claimed}, but the seat type field says "
                    f"{actual}; shown as {actual}."
                ),
            )
        )
    return warnings
