import os
from typing import Dict, List

import psycopg2
import requests
from dotenv import load_dotenv
from psycopg2.extras import execute_values

from normalizer import normalize_flight

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "")
AIRPORT_CODE = os.getenv("AIRPORT_CODE", "COR")


def fetch_aviationstack() -> List[Dict]:
    api_key = os.getenv("AVIATIONSTACK_API_KEY")
    if not api_key:
        return []

    url = "http://api.aviationstack.com/v1/flights"
    params = {"access_key": api_key, "dep_iata": AIRPORT_CODE, "limit": 100}
    response = requests.get(url, params=params, timeout=20)
    response.raise_for_status()

    data = response.json().get("data", [])
    flights = []
    for row in data:
        departure = row.get("departure") or {}
        arrival = row.get("arrival") or {}
        aircraft = row.get("aircraft") or {}
        flight = row.get("flight") or {}
        airline = row.get("airline") or {}
        flights.append(
            {
                # Dejar que el normalizador genere un id estable (source:flight_number:scheduled_time)
                # porque el proveedor puede repetir/omitir iata y eso rompe el upsert en batch.
                "id": None,
                "flight_number": flight.get("iata"),
                "airline": airline.get("name"),
                "origin": departure.get("iata"),
                "destination": arrival.get("iata"),
                "scheduled_time": departure.get("scheduled"),
                "estimated_time": departure.get("estimated"),
                "actual_time": departure.get("actual"),
                "status": row.get("flight_status"),
                "type": "departure",
                "gate": departure.get("gate"),
                "terminal": departure.get("terminal"),
                "aircraft": aircraft.get("registration"),
                "is_international": None,
            }
        )
    return flights


def upsert_flights(records: List[Dict]) -> int:
    if not records:
        return 0

    values = [
        (
            r["id"],
            r["flight_number"],
            r["airline"],
            r["origin"],
            r["destination"],
            r["scheduled_time"],
            r["estimated_time"],
            r["actual_time"],
            r["status"],
            r["type"],
            r["gate"],
            r["terminal"],
            r["aircraft"],
            r["is_international"],
            r["source"],
        )
        for r in records
    ]

    sql = """
    INSERT INTO flights (
      id, flight_number, airline, origin, destination, scheduled_time,
      estimated_time, actual_time, status, type, gate, terminal, aircraft,
      is_international, source
    ) VALUES %s
    ON CONFLICT (id) DO UPDATE SET
      flight_number = EXCLUDED.flight_number,
      airline = EXCLUDED.airline,
      origin = EXCLUDED.origin,
      destination = EXCLUDED.destination,
      scheduled_time = EXCLUDED.scheduled_time,
      estimated_time = EXCLUDED.estimated_time,
      actual_time = EXCLUDED.actual_time,
      status = EXCLUDED.status,
      type = EXCLUDED.type,
      gate = EXCLUDED.gate,
      terminal = EXCLUDED.terminal,
      aircraft = EXCLUDED.aircraft,
      is_international = EXCLUDED.is_international,
      source = EXCLUDED.source,
      updated_at = NOW();
    """

    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            execute_values(cur, sql, values)
    return len(records)


def main() -> None:
    provider_rows = fetch_aviationstack()
    normalized = [normalize_flight(r, source="aviationstack") for r in provider_rows]
    deduped_by_id: Dict[str, Dict] = {}
    for r in normalized:
        deduped_by_id[r["id"]] = r
    count = upsert_flights(list(deduped_by_id.values()))
    print(f"Ingesta COR completada: {count} vuelos procesados")


if __name__ == "__main__":
    main()
