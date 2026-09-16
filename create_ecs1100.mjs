import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envFile = fs.readFileSync(path.resolve(__dirname, '.env.local'), 'utf-8');
envFile.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, ...rest] = line.split('=');
    if (key.trim()) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const sql = `
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
  `;
  
  // Since we don't have exec_sql, we need to instruct the user to run this in Supabase.
  console.log(sql);
}

run();
