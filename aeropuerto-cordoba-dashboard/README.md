# Dashboard de vuelos — Aeropuerto de Córdoba (COR)

Proyecto separado para publicar en GitHub con un MVP funcional de monitoreo de vuelos (arrivals/departures) del Aeropuerto Internacional Ingeniero Aeronáutico Ambrosio L.V. Taravella (COR, Córdoba, Argentina).

## Objetivo

Construir un dashboard operativo + analítico con refresh en casi tiempo real:

- **Overview**: vuelos hoy, demorados, cancelados, on-time, próximos 5.
- **Departures**: tabla live con filtros por aerolínea/destino/estado.
- **Arrivals**: tabla live con filtros por origen/estado/ETA.
- **Analytics**: puntualidad %, demoras por aerolínea, demoras por franja horaria, volumen diario.

## Stack sugerido (MVP)

- **Backend/API**: Python + FastAPI.
- **Ingesta**: script Python ejecutado por cron cada 10 minutos.
- **DB**: PostgreSQL.
- **Frontend**: Next.js o React (consumiendo `/api/flights`).
- **Deploy rápido**: Railway/Render/Fly + Vercel.

## Estructura inicial

```text
aeropuerto-cordoba-dashboard/
  README.md
  backend/
    .env.example
    requirements.txt
    schema.sql
    normalizer.py
    fetch_cor_flights.py
    api.py
```

## Flujo técnico

1. `fetch_cor_flights.py` consulta APIs configuradas para vuelos COR.
2. `normalizer.py` convierte payloads heterogéneos a un modelo común.
3. Se guarda/upsertea en PostgreSQL (`flights`, `airlines`, `airports`).
4. `api.py` expone endpoint REST (`/api/flights`) para el dashboard.
5. Frontend refresca cada 30s para vista live.

## Variables de entorno

Copiá `backend/.env.example` a `backend/.env`.

```bash
cp backend/.env.example backend/.env
```

## Arranque local (backend)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

## Cron (poll cada 10 minutos)

Ejemplo de crontab:

```cron
*/10 * * * * cd /ruta/a/aeropuerto-cordoba-dashboard/backend && /usr/bin/python3 fetch_cor_flights.py >> /var/log/cor_ingest.log 2>&1
```

## Endpoint base

- `GET /api/flights`
  - filtros: `type`, `status`, `airline`, `origin`, `destination`, `limit`.

## Próximos pasos recomendados

1. Priorizar una API principal (por costo/límites) y usar otra como fallback.
2. Agregar cache (Redis) para reducir llamados.
3. Incorporar autenticación simple para dashboard privado.
4. Crear frontend con cards + tabla live + charts (Recharts/ECharts).
5. Definir pruebas de integración para normalización por proveedor.
