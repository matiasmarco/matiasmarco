CREATE TABLE IF NOT EXISTS airlines (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS airports (
  code TEXT PRIMARY KEY,
  name TEXT,
  city TEXT
);

CREATE TABLE IF NOT EXISTS flights (
  id TEXT PRIMARY KEY,
  flight_number TEXT NOT NULL,
  airline TEXT,
  origin TEXT,
  destination TEXT,
  scheduled_time TIMESTAMPTZ,
  estimated_time TIMESTAMPTZ,
  actual_time TIMESTAMPTZ,
  status TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('arrival', 'departure')),
  gate TEXT,
  terminal TEXT,
  aircraft TEXT,
  is_international BOOLEAN,
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flights_type_time ON flights(type, scheduled_time DESC);
CREATE INDEX IF NOT EXISTS idx_flights_status ON flights(status);
CREATE INDEX IF NOT EXISTS idx_flights_airline ON flights(airline);
