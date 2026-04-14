import os
from typing import List, Optional

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "")

app = FastAPI(title="COR Flights API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/flights")
def list_flights(
    type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    airline: Optional[str] = Query(default=None),
    origin: Optional[str] = Query(default=None),
    destination: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> List[dict]:
    clauses = []
    params = []

    for field, value in {
        "type": type,
        "status": status,
        "airline": airline,
        "origin": origin,
        "destination": destination,
    }.items():
        if value:
            clauses.append(f"{field} = %s")
            params.append(value)

    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    params.append(limit)

    query = f"""
        SELECT
          id, flight_number, airline, origin, destination,
          scheduled_time, estimated_time, actual_time,
          status, type, gate, terminal, aircraft,
          is_international, source, updated_at
        FROM flights
        {where}
        ORDER BY scheduled_time DESC
        LIMIT %s
    """

    with psycopg2.connect(DATABASE_URL) as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, params)
            rows = cur.fetchall()

    return rows
