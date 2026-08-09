-- Run this script in your Supabase SQL Editor to create the necessary tables.

-- 1. Create table for daily production totals
CREATE TABLE IF NOT EXISTS public.daily_production (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    division TEXT NOT NULL, -- 'water' or 'electricity'
    date DATE NOT NULL,
    shift TEXT NOT NULL, -- 'shift1', 'shift2', 'shift3', 'official'
    assembly INTEGER DEFAULT 0,
    perso INTEGER DEFAULT 0,
    lasering INTEGER DEFAULT 0,
    packaging INTEGER DEFAULT 0,
    cartons INTEGER DEFAULT 0,
    palets INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(division, date, shift) -- Ensure only one record per shift per day per division
);

-- 2. Create table for upload history
CREATE TABLE IF NOT EXISTS public.production_history (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    division TEXT NOT NULL,
    filename TEXT NOT NULL,
    date DATE NOT NULL,
    shift TEXT NOT NULL,
    summary JSONB NOT NULL,
    rows JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.daily_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_history ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for development purposes)
-- You may want to restrict this in production!
CREATE POLICY "Allow all operations for daily_production" ON public.daily_production FOR ALL USING (true);
CREATE POLICY "Allow all operations for production_history" ON public.production_history FOR ALL USING (true);
