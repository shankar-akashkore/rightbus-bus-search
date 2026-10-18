from datetime import datetime, time

CITY_ALIASES = {
    "bengaluru": "bangalore",
    "bombay": "mumbai",
    "new delhi": "delhi",
    "madras": "chennai",
    "calcutta": "kolkata",
    "gurgaon": "gurugram",
}


def normalize_city(name: str) -> str:
    key = " ".join(name.split()).casefold()
    return CITY_ALIASES.get(key, key)


def display_city(name: str) -> str:
    return normalize_city(name).title()


def parse_time_12h(value: str) -> time:
    """Parse provider times such as "4:00 PM" and "01:30 PM" (both styles appear in the data)."""
    cleaned = " ".join(value.upper().replace("AM", " AM").replace("PM", " PM").split())
    return datetime.strptime(cleaned, "%I:%M %p").time()


def format_time_12h(value: time) -> str:
    return value.strftime("%I:%M %p").lstrip("0")


def clean_contact(value: str | None) -> str | None:
    """Drop placeholder numbers like "0" and tidy comma-separated lists."""
    if not value:
        return None
    numbers = [part.strip() for part in value.split(",") if part.strip() not in {"", "0"}]
    return ", ".join(numbers) or None
