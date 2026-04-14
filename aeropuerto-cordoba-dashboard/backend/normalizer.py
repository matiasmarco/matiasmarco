from datetime import datetime
from typing import Any, Dict, Optional

ALLOWED_STATUSES = {
    "scheduled",
    "active",
    "landed",
    "delayed",
    "cancelled",
    "diverted",
}


def normalize_status(raw_status: Optional[str]) -> str:
    if not raw_status:
        return "scheduled"

    s = raw_status.strip().lower()
    mapping = {
        "on time": "scheduled",
        "on-time": "scheduled",
        "en route": "active",
        "arrived": "landed",
        "canceled": "cancelled",
    }
    normalized = mapping.get(s, s)
    return normalized if normalized in ALLOWED_STATUSES else "scheduled"


def parse_dt(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def normalize_flight(payload: Dict[str, Any], source: str) -> Dict[str, Any]:
    """
    Normaliza un vuelo al esquema interno. Este mapeo cubre un shape genérico
    y se puede extender por proveedor.
    """
    flight_number = payload.get("flight_number") or payload.get("number") or "UNKNOWN"
    airline = payload.get("airline") or payload.get("airline_name")

    origin = payload.get("origin") or payload.get("departure_iata")
    destination = payload.get("destination") or payload.get("arrival_iata")

    ftype = payload.get("type")
    if ftype not in {"arrival", "departure"}:
        # Inferencia simple cuando no viene explícito.
        ftype = "departure" if (origin == "COR") else "arrival"

    status = normalize_status(payload.get("status"))

    return {
        "id": payload.get("id") or f"{source}:{flight_number}:{payload.get('scheduled_time')}",
        "flight_number": flight_number,
        "airline": airline,
        "origin": origin,
        "destination": destination,
        "scheduled_time": parse_dt(payload.get("scheduled_time") or payload.get("scheduled")),
        "estimated_time": parse_dt(payload.get("estimated_time") or payload.get("estimated")),
        "actual_time": parse_dt(payload.get("actual_time") or payload.get("actual")),
        "status": status,
        "type": ftype,
        "gate": payload.get("gate"),
        "terminal": payload.get("terminal"),
        "aircraft": payload.get("aircraft"),
        "is_international": payload.get("is_international"),
        "source": source,
    }
