import os
from datetime import datetime, timedelta, timezone
from typing import List, Optional

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from psycopg2.extras import RealDictCursor

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "")
USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "false").strip().lower() == "true"

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


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard() -> str:
    return """
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>COR Flights Dashboard</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: Inter, Segoe UI, Arial, sans-serif;
      }
      body {
        margin: 0;
        background: #0b1220;
        color: #e7ecf5;
      }
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: end;
        gap: 16px;
        margin-bottom: 16px;
      }
      .muted {
        color: #9db0cb;
        font-size: 14px;
      }
      .cards {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      .card, .panel {
        background: #121b2d;
        border: 1px solid #24324d;
        border-radius: 10px;
        padding: 12px;
      }
      .card-title {
        color: #9db0cb;
        font-size: 13px;
      }
      .card-value {
        font-size: 30px;
        font-weight: 600;
      }
      .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 10px;
        margin-bottom: 12px;
      }
      select, input, button {
        width: 100%;
        border-radius: 8px;
        border: 1px solid #314263;
        background: #0f1728;
        color: #e7ecf5;
        padding: 8px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
      }
      th, td {
        text-align: left;
        padding: 8px;
        border-bottom: 1px solid #22314b;
        white-space: nowrap;
      }
      th {
        color: #9db0cb;
        font-weight: 600;
      }
      .status {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 12px;
        display: inline-block;
      }
      .scheduled { background: #1f3a5f; }
      .active { background: #2f5f2a; }
      .delayed { background: #6a4e19; }
      .landed { background: #2f4f4f; }
      .cancelled { background: #5e2630; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div>
          <h1 style="margin:0;">COR Flights Dashboard</h1>
          <div class="muted">Actualiza cada 30s</div>
        </div>
        <div class="muted" id="updatedAt">--</div>
      </div>
      <div class="cards">
        <div class="card"><div class="card-title">Total</div><div class="card-value" id="total">0</div></div>
        <div class="card"><div class="card-title">Departures</div><div class="card-value" id="departures">0</div></div>
        <div class="card"><div class="card-title">Arrivals</div><div class="card-value" id="arrivals">0</div></div>
        <div class="card"><div class="card-title">Delayed</div><div class="card-value" id="delayed">0</div></div>
      </div>
      <div class="panel">
        <div class="filters">
          <select id="type">
            <option value="">Type (all)</option>
            <option value="departure">departure</option>
            <option value="arrival">arrival</option>
          </select>
          <input id="airline" placeholder="Airline (exact match)" />
          <input id="origin" placeholder="Origin (ej: COR)" />
          <input id="destination" placeholder="Destination (ej: AEP)" />
          <select id="status">
            <option value="">Status (all)</option>
            <option value="scheduled">scheduled</option>
            <option value="active">active</option>
            <option value="delayed">delayed</option>
            <option value="landed">landed</option>
            <option value="cancelled">cancelled</option>
            <option value="diverted">diverted</option>
          </select>
          <button id="applyBtn">Aplicar filtros</button>
        </div>
        <div style="overflow:auto;">
          <table>
            <thead>
              <tr>
                <th>Type</th>
                <th>Flight</th>
                <th>Airline</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th>Estimated</th>
                <th>Gate</th>
              </tr>
            </thead>
            <tbody id="rows"></tbody>
          </table>
        </div>
      </div>
    </div>
    <script>
      const rowsEl = document.getElementById("rows");
      const updatedAtEl = document.getElementById("updatedAt");
      const ids = ["total", "departures", "arrivals", "delayed"];
      const els = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
      const fields = {
        type: document.getElementById("type"),
        status: document.getElementById("status"),
        airline: document.getElementById("airline"),
        origin: document.getElementById("origin"),
        destination: document.getElementById("destination")
      };

      function fmtDate(value) {
        if (!value) return "-";
        const d = new Date(value);
        return isNaN(d.getTime()) ? "-" : d.toLocaleString();
      }

      function statusTag(status) {
        const cls = ["scheduled","active","delayed","landed","cancelled","diverted"].includes(status) ? status : "scheduled";
        return `<span class="status ${cls}">${status}</span>`;
      }

      function queryString() {
        const params = new URLSearchParams({ limit: "200" });
        for (const [k, el] of Object.entries(fields)) {
          const val = (el.value || "").trim();
          if (val) params.set(k, val);
        }
        return params.toString();
      }

      async function loadFlights() {
        const res = await fetch(`/api/flights?${queryString()}`);
        if (!res.ok) {
          rowsEl.innerHTML = `<tr><td colspan="9">Error API: ${res.status}</td></tr>`;
          return;
        }
        const data = await res.json();
        const flights = Array.isArray(data) ? data : (data.value || []);

        els.total.textContent = flights.length;
        els.departures.textContent = flights.filter(f => f.type === "departure").length;
        els.arrivals.textContent = flights.filter(f => f.type === "arrival").length;
        els.delayed.textContent = flights.filter(f => f.status === "delayed").length;
        updatedAtEl.textContent = `Actualizado: ${new Date().toLocaleTimeString()}`;

        rowsEl.innerHTML = flights.slice(0, 80).map(f => `
          <tr>
            <td>${f.type || "-"}</td>
            <td>${f.flight_number || "-"}</td>
            <td>${f.airline || "-"}</td>
            <td>${f.origin || "-"}</td>
            <td>${f.destination || "-"}</td>
            <td>${statusTag(f.status || "scheduled")}</td>
            <td>${fmtDate(f.scheduled_time)}</td>
            <td>${fmtDate(f.estimated_time)}</td>
            <td>${f.gate || "-"}</td>
          </tr>
        `).join("");
      }

      document.getElementById("applyBtn").addEventListener("click", loadFlights);
      loadFlights();
      setInterval(loadFlights, 30000);
    </script>
  </body>
</html>
"""


@app.get("/api/flights")
def list_flights(
    type: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    airline: Optional[str] = Query(default=None),
    origin: Optional[str] = Query(default=None),
    destination: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
) -> List[dict]:
    if USE_MOCK_DATA:
        return _mock_flights(type=type, status=status, airline=airline, origin=origin, destination=destination, limit=limit)

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

    try:
        with psycopg2.connect(DATABASE_URL) as conn:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(query, params)
                rows = cur.fetchall()
    except psycopg2.OperationalError as exc:
        raise HTTPException(status_code=503, detail="Database unavailable. Set USE_MOCK_DATA=true for local testing.") from exc

    return rows


def _mock_flights(
    type: Optional[str],
    status: Optional[str],
    airline: Optional[str],
    origin: Optional[str],
    destination: Optional[str],
    limit: int,
) -> List[dict]:
    now = datetime.now(timezone.utc)
    data = [
        {
            "id": "mock-1",
            "flight_number": "AR1550",
            "airline": "Aerolineas Argentinas",
            "origin": "COR",
            "destination": "AEP",
            "scheduled_time": now + timedelta(minutes=40),
            "estimated_time": now + timedelta(minutes=50),
            "actual_time": None,
            "status": "delayed",
            "type": "departure",
            "gate": "4",
            "terminal": "T1",
            "aircraft": "B738",
            "is_international": False,
            "source": "mock",
            "updated_at": now,
        },
        {
            "id": "mock-2",
            "flight_number": "LA2421",
            "airline": "LATAM",
            "origin": "SCL",
            "destination": "COR",
            "scheduled_time": now + timedelta(minutes=20),
            "estimated_time": now + timedelta(minutes=20),
            "actual_time": None,
            "status": "scheduled",
            "type": "arrival",
            "gate": "2",
            "terminal": "T1",
            "aircraft": "A320",
            "is_international": True,
            "source": "mock",
            "updated_at": now,
        },
        {
            "id": "mock-3",
            "flight_number": "FO5030",
            "airline": "Flybondi",
            "origin": "COR",
            "destination": "BUE",
            "scheduled_time": now - timedelta(minutes=15),
            "estimated_time": now - timedelta(minutes=5),
            "actual_time": now - timedelta(minutes=3),
            "status": "landed",
            "type": "departure",
            "gate": "6",
            "terminal": "T1",
            "aircraft": "B737",
            "is_international": False,
            "source": "mock",
            "updated_at": now,
        },
    ]

    filtered = data
    if type:
        filtered = [row for row in filtered if row["type"] == type]
    if status:
        filtered = [row for row in filtered if row["status"] == status]
    if airline:
        filtered = [row for row in filtered if row["airline"] == airline]
    if origin:
        filtered = [row for row in filtered if row["origin"] == origin]
    if destination:
        filtered = [row for row in filtered if row["destination"] == destination]

    return filtered[:limit]
