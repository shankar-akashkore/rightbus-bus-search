from datetime import time

import pytest

from app.utils import clean_contact, display_city, format_time_12h, normalize_city, parse_time_12h


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("4:00 PM", time(16, 0)),
        ("01:30 PM", time(13, 30)),
        ("12:00 AM", time(0, 0)),
        ("12:30 PM", time(12, 30)),
        ("11:03 pm", time(23, 3)),
        ("4:00PM", time(16, 0)),
    ],
)
def test_parse_time_12h_accepts_provider_formats(text, expected):
    assert parse_time_12h(text) == expected


@pytest.mark.parametrize("text", ["", "noon", "13:00 PM", "4 PM", "25:99 XM"])
def test_parse_time_12h_rejects_garbage(text):
    with pytest.raises(ValueError):
        parse_time_12h(text)


def test_format_time_12h_drops_the_leading_zero():
    assert format_time_12h(time(13, 30)) == "1:30 PM"
    assert format_time_12h(time(0, 5)) == "12:05 AM"


@pytest.mark.parametrize(
    ("name", "key"), [("Mumbai", "mumbai"), ("  New   Delhi ", "delhi"), ("BENGALURU", "bangalore")]
)
def test_normalize_city(name, key):
    assert normalize_city(name) == key


def test_display_city_uses_the_canonical_name():
    assert display_city(" bengaluru ") == "Bangalore"


@pytest.mark.parametrize(
    ("raw", "cleaned"),
    [
        (None, None),
        ("", None),
        ("0", None),
        ("08022377777", "08022377777"),
        ("8105149909,8105147606", "8105149909, 8105147606"),
    ],
)
def test_clean_contact(raw, cleaned):
    assert clean_contact(raw) == cleaned
