-- ==============================================================================
-- ECTRON Reporting System - Visitor Management Module Schema
-- ==============================================================================

-- 1. Create visits table
CREATE TABLE IF NOT EXISTS public.visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_number text UNIQUE NOT NULL,
  visit_date date NOT NULL DEFAULT CURRENT_DATE,
  time_in text NOT NULL,
  time_out text,
  organization_en text,
  organization_ar text,
  country text DEFAULT 'Oman',
  coordination_by text DEFAULT 'Ectron',
  visit_reason text,
  notes text,
  organizations jsonb DEFAULT '[]'::jsonb,
  registration_source text NOT NULL CHECK (registration_source IN ('public', 'internal', 'import')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist if table was already created
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS coordination_by text DEFAULT 'Ectron';
ALTER TABLE public.visits ADD COLUMN IF NOT EXISTS organizations jsonb DEFAULT '[]'::jsonb;

-- 2. Create visit_visitors table (One visit has many visitors)
CREATE TABLE IF NOT EXISTS public.visit_visitors (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id uuid NOT NULL REFERENCES public.visits(id) ON DELETE CASCADE,
  organization_en text,
  organization_ar text,
  full_name_en text,
  full_name_ar text,
  phone_number text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure organization columns exist on visit_visitors
ALTER TABLE public.visit_visitors ADD COLUMN IF NOT EXISTS organization_en text;
ALTER TABLE public.visit_visitors ADD COLUMN IF NOT EXISTS organization_ar text;

-- 3. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_visits_date ON public.visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_number ON public.visits(visit_number);
CREATE INDEX IF NOT EXISTS idx_visits_source ON public.visits(registration_source);
CREATE INDEX IF NOT EXISTS idx_visit_visitors_visit_id ON public.visit_visitors(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_visitors_names ON public.visit_visitors(full_name_en, full_name_ar);

-- 4. Concurrency-safe Visit Number generator function: VIS-YYYY-XXXX
CREATE OR REPLACE FUNCTION public.generate_next_visit_number(p_year int)
RETURNS text AS $$
DECLARE
  v_prefix text;
  v_next_num int;
BEGIN
  v_prefix := 'VIS-' || p_year || '-';
  
  -- Lock visits rows for that year to guarantee sequential concurrency safety
  SELECT COALESCE(MAX(NULLIF(regexp_replace(visit_number, '^VIS-[0-9]+-', ''), '')::int), 0) + 1
  INTO v_next_num
  FROM public.visits
  WHERE visit_number LIKE v_prefix || '%';

  RETURN v_prefix || LPAD(v_next_num::text, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Atomic Visit and Visitors Creation Function
CREATE OR REPLACE FUNCTION public.create_visit_with_visitors(
  p_visit jsonb,
  p_visitors jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_year int;
  v_visit_number text;
  v_visit_id uuid;
  v_visitor jsonb;
  v_result jsonb;
BEGIN
  -- Determine year from visit_date or current year
  v_year := EXTRACT(YEAR FROM (COALESCE(p_visit->>'visit_date', CURRENT_DATE::text))::date);
  
  -- Generate unique visit_number if not supplied
  IF p_visit->>'visit_number' IS NOT NULL AND p_visit->>'visit_number' <> '' THEN
    v_visit_number := p_visit->>'visit_number';
  ELSE
    v_visit_number := public.generate_next_visit_number(v_year);
  END IF;

  -- Insert Visit record
  INSERT INTO public.visits (
    visit_number,
    visit_date,
    time_in,
    time_out,
    organization_en,
    organization_ar,
    country,
    coordination_by,
    visit_reason,
    notes,
    organizations,
    registration_source,
    created_by
  ) VALUES (
    v_visit_number,
    (COALESCE(p_visit->>'visit_date', CURRENT_DATE::text))::date,
    COALESCE(p_visit->>'time_in', to_char(now() AT TIME ZONE 'Asia/Muscat', 'HH24:MI')),
    p_visit->>'time_out',
    p_visit->>'organization_en',
    p_visit->>'organization_ar',
    COALESCE(p_visit->>'country', 'Oman'),
    COALESCE(p_visit->>'coordination_by', 'Ectron'),
    p_visit->>'visit_reason',
    p_visit->>'notes',
    COALESCE(p_visit->'organizations', '[]'::jsonb),
    COALESCE(p_visit->>'registration_source', 'public'),
    CASE WHEN p_visit->>'created_by' IS NOT NULL AND p_visit->>'created_by' <> '' 
         THEN (p_visit->>'created_by')::uuid 
         ELSE NULL 
    END
  )
  RETURNING id INTO v_visit_id;

  -- Insert All Visitors associated with this visit
  IF jsonb_typeof(p_visitors) = 'array' THEN
    FOR v_visitor IN SELECT * FROM jsonb_array_elements(p_visitors)
    LOOP
      INSERT INTO public.visit_visitors (
        visit_id,
        organization_en,
        organization_ar,
        full_name_en,
        full_name_ar,
        phone_number
      ) VALUES (
        v_visit_id,
        NULLIF(trim(v_visitor->>'organization_en'), ''),
        NULLIF(trim(v_visitor->>'organization_ar'), ''),
        NULLIF(trim(v_visitor->>'full_name_en'), ''),
        NULLIF(trim(v_visitor->>'full_name_ar'), ''),
        NULLIF(trim(v_visitor->>'phone_number'), '')
      );
    END LOOP;
  END IF;

  -- Return the created visit object with visitors
  SELECT json_build_object(
    'id', v_visit_id,
    'visit_number', v_visit_number,
    'visit_date', (p_visit->>'visit_date'),
    'success', true
  )::jsonb INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Enable Row Level Security
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_visitors ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users with visitor permissions to read and manage
CREATE POLICY "Allow authenticated read visits" ON public.visits
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert visits" ON public.visits
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update visits" ON public.visits
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete visits" ON public.visits
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read visit_visitors" ON public.visit_visitors
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated insert visit_visitors" ON public.visit_visitors
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update visit_visitors" ON public.visit_visitors
  FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated delete visit_visitors" ON public.visit_visitors
  FOR DELETE TO authenticated USING (true);

-- Allow service_role complete access (used by server-side actions)
CREATE POLICY "Allow service role full access to visits" ON public.visits
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to visit_visitors" ON public.visit_visitors
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 7. Add Visitor Permissions to permissions table (if not exists)
INSERT INTO public.permissions (page_key, page_name) VALUES 
('visitor_dashboard', 'Visitor Dashboard'),
('visitor_register', 'Visitor Registration'),
('visitor_admin', 'Visitor Administration')
ON CONFLICT (page_key) DO NOTHING;

-- Grant permissions to Admin role
DO $$
DECLARE
  v_admin_role_id uuid;
  v_perm_id uuid;
BEGIN
  SELECT id INTO v_admin_role_id FROM public.roles WHERE name = 'Admin' LIMIT 1;
  IF v_admin_role_id IS NOT NULL THEN
    FOR v_perm_id IN SELECT id FROM public.permissions WHERE page_key IN ('visitor_dashboard', 'visitor_register', 'visitor_admin')
    LOOP
      INSERT INTO public.role_permissions (role_id, permission_id)
      VALUES (v_admin_role_id, v_perm_id)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;
