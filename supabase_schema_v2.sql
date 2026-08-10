-- Drop the old table if it exists (Optional, you can keep it as backup)
-- DROP TABLE IF EXISTS public.daily_production;

-- 1. Water Production Table (Séquania)
CREATE TABLE IF NOT EXISTS public.water_daily_production (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  shift text NOT NULL,
  assembly integer DEFAULT 0,
  perso integer DEFAULT 0,
  lasering integer DEFAULT 0,
  packaging integer DEFAULT 0,
  cartons integer DEFAULT 0,
  palets integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(date, shift)
);

-- 2. Electricity Production Table (MT212)
CREATE TABLE IF NOT EXISTS public.electricity_daily_production (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  shift text NOT NULL,
  cards integer DEFAULT 0,
  assembly integer DEFAULT 0,
  insolation integer DEFAULT 0,
  radiation_frequency integer DEFAULT 0,
  calibration integer DEFAULT 0,
  multy_test integer DEFAULT 0,
  metrology integer DEFAULT 0,
  perso integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(date, shift)
);

-- 3. Production History (Kept as one table using JSON for flexibility)
CREATE TABLE IF NOT EXISTS public.production_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  division text NOT NULL,
  filename text NOT NULL,
  date date NOT NULL,
  shift text NOT NULL,
  summary jsonb NOT NULL,
  rows jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS and create open policies for the new tables
ALTER TABLE public.water_daily_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for water_daily_production" ON public.water_daily_production FOR ALL USING (true);

ALTER TABLE public.electricity_daily_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for electricity_daily_production" ON public.electricity_daily_production FOR ALL USING (true);
