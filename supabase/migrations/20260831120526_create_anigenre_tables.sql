/*
# Create Anigenre game tables

1. New Tables
- `anigenre_entities`: stores all guessable anime entities (characters, techniques, locations, organizations, items, arcs, etc.). Each has a name, comma-separated aliases, and 6 category attributes (genre, type, anime, format, studio, demographic) plus a `shuffle_rank` integer used for deterministic daily rotation.
- `anigenre_config`: single-row table holding the `launch_date` used for daily rotation math.

2. Security
- Enable RLS on both tables.
- Public read-only access (SELECT) to `anigenre_entities` and `anigenre_config` for the anon role — the game runs entirely client-side and needs the full pool for autocomplete and comparison.
- No public INSERT/UPDATE/DELETE — all writes go through an admin edge function using the service-role key.

3. Important Notes
- `anigenre_config` uses a boolean PK with CHECK(id = true) to enforce a single row.
- `shuffle_rank` is assigned on insert with slight randomization; a re-numbering helper may be added later to keep ranks dense.
*/

CREATE TABLE IF NOT EXISTS anigenre_entities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  aliases text NOT NULL DEFAULT '',
  genre text NOT NULL,
  type text NOT NULL,
  anime text NOT NULL,
  format text NOT NULL,
  studio text NOT NULL,
  demographic text NOT NULL,
  shuffle_rank integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS anigenre_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id = true),
  launch_date date NOT NULL
);

ALTER TABLE anigenre_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE anigenre_config ENABLE ROW LEVEL SECURITY;

-- Public read-only access for the game
DROP POLICY IF EXISTS "public_read_entities" ON anigenre_entities;
CREATE POLICY "public_read_entities" ON anigenre_entities FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_read_config" ON anigenre_config;
CREATE POLICY "public_read_config" ON anigenre_config FOR SELECT
  TO anon, authenticated USING (true);

-- Insert the single config row with today's date as launch_date
INSERT INTO anigenre_config (id, launch_date)
VALUES (true, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- Add an index on shuffle_rank for fast daily lookup
CREATE INDEX IF NOT EXISTS idx_anigenre_entities_shuffle_rank ON anigenre_entities (shuffle_rank);
