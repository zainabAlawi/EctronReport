-- Run this script in your Supabase SQL Editor to add the new electricity columns

ALTER TABLE public.daily_production 
ADD COLUMN IF NOT EXISTS insolation INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS radiation_frequency INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS calibration INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS multy_test INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS metrology INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cards INTEGER DEFAULT 0;
