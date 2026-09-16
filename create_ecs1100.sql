CREATE TABLE IF NOT EXISTS public.electricity_ecs1100_daily_production (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    shift TEXT NOT NULL,
    cards INTEGER DEFAULT 0,
    assembly INTEGER DEFAULT 0,
    insolation INTEGER DEFAULT 0,
    radiation_frequency INTEGER DEFAULT 0,
    calibration INTEGER DEFAULT 0,
    multy_test INTEGER DEFAULT 0,
    metrology INTEGER DEFAULT 0,
    perso INTEGER DEFAULT 0,
    failers JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, shift)
);
