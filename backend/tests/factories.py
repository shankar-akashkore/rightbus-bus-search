import copy
import json

from mock_gds.main import DATA_FILE

SUPPLIED = json.loads(DATA_FILE.read_text(encoding="utf-8"))


def supplied_trip(trip_id: str) -> dict:
    return copy.deepcopy(next(t for t in SUPPLIED["trips"] if t["trip_id"] == trip_id))


def make_trip(trip_id: str = "TRP-TEST", **changes) -> dict:
    """A valid Bangalore -> Mumbai trip on 2026-08-09."""
    trip = supplied_trip("TRP-128475")
    trip["trip_id"] = trip_id
    # "a__b" keys set nested fields, e.g. availability__seats_available=0
    for path, value in changes.items():
        *parents, leaf = path.split("__")
        target = trip
        for key in parents:
            target = target[key]
        target[leaf] = value
    return trip
