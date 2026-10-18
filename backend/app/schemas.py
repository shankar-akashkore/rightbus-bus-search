import re
from datetime import date, datetime
from typing import Self

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from app.utils import normalize_city

ISO_DATE = re.compile(r"\d{4}-\d{2}-\d{2}")


# What the frontend sends
class SearchParams(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    source: str = Field(min_length=1, max_length=60, examples=["Bangalore"])
    destination: str = Field(min_length=1, max_length=60, examples=["Mumbai"])
    journey_date: date = Field(examples=["2026-08-09"])

    @field_validator("journey_date", mode="before")
    @classmethod
    def parse_journey_date(cls, value: object) -> date:
        # Stricter than Pydantic's default date parsing: only YYYY-MM-DD is accepted.
        text = str(value).strip()
        if not text:
            raise ValueError("journey_date is required")
        if not ISO_DATE.fullmatch(text):
            raise ValueError("journey_date must be in YYYY-MM-DD format")
        try:
            return date.fromisoformat(text)
        except ValueError:
            raise ValueError("journey_date is not a real calendar date") from None

    @model_validator(mode="after")
    def check_cities_differ(self) -> Self:
        if normalize_city(self.source) == normalize_city(self.destination):
            raise ValueError("source and destination must be different cities")
        return self


# What the GDS sends: only the fields we use (booking_token etc. are ignored)
class GdsSchedule(BaseModel):
    departure_time: str
    arrival_time: str
    departure_date: date
    estimated_arrival_date: date
    duration_minutes: int = Field(ge=0)


class GdsPricing(BaseModel):
    total_fare: int | float = Field(ge=0)
    currency: str = "INR"


class GdsAvailability(BaseModel):
    seats_available: int = Field(ge=0)
    is_available: bool
    seat_types: list[str] = []


class GdsStop(BaseModel):
    name: str
    time: str
    contact: str | None = None
    distance_km: float | None = None
    is_nearest: bool = False


class GdsCancellationPolicy(BaseModel):
    is_cancellable: bool = False
    reschedule_allowed: bool = False
    reschedule_charge: int | float = 0


class GdsTrip(BaseModel):
    trip_id: str
    operator: str
    bus_type: str
    is_ac: bool
    from_city_name: str
    to_city_name: str
    route_name: str = ""  # free text and unreliable: never used for matching
    bus_seat_type: str = ""
    amenities: list[str] = []
    schedule: GdsSchedule
    pricing: GdsPricing
    availability: GdsAvailability
    boarding_points: list[GdsStop] = []
    dropping_points: list[GdsStop] = []
    cancellation_policy: GdsCancellationPolicy | None = None


# What the backend returns
class Stop(BaseModel):
    name: str
    time: str
    contact: str | None
    distance_km: float | None
    is_nearest: bool


class CancellationPolicy(BaseModel):
    is_cancellable: bool
    reschedule_allowed: bool
    reschedule_charge: int | float


class DataWarning(BaseModel):
    code: str
    message: str


class Bus(BaseModel):
    trip_id: str
    operator: str
    bus_type: str = Field(description="The operator's own label, shown as-is")
    is_ac: bool
    seat_type: str = Field(description="sleeper | seater | semi-sleeper | unknown")
    departure_at: datetime
    arrival_at: datetime
    duration_minutes: int
    fare: int | float
    currency: str
    seats_available: int
    amenities: list[str]
    boarding_points: list[Stop]
    dropping_points: list[Stop]
    cancellation_policy: CancellationPolicy | None
    data_warnings: list[DataWarning]


class ExcludedCounts(BaseModel):
    """How many provider trips were dropped, by the first rule each one failed."""

    route_mismatch: int = 0
    date_mismatch: int = 0
    unavailable: int = 0
    invalid: int = 0


class SearchMeta(BaseModel):
    provider_trip_count: int
    excluded: ExcludedCounts


class SearchResponse(BaseModel):
    source: str
    destination: str
    journey_date: date
    total_results: int
    buses: list[Bus]
    meta: SearchMeta


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] = []


class ErrorResponse(BaseModel):
    error: ErrorBody
