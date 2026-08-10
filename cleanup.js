const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = envFile.split('\n').reduce((acc, line) => {
  const [key, value] = line.split('=');
  if (key && value) {
    acc[key.trim()] = value.trim();
  }
  return acc;
}, {});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clean() {
  console.log('Cleaning water_daily_production...');
  const { data: water, error: we } = await supabase.from('water_daily_production').select('*');
  if (we) console.error(we);
  else {
    let deleted = 0;
    for (const row of water) {
      if ((row.assembly || 0) === 0 && (row.perso || 0) === 0 && (row.lasering || 0) === 0 && (row.packaging || 0) === 0 && (row.cartons || 0) === 0 && (row.palets || 0) === 0) {
        await supabase.from('water_daily_production').delete().eq('id', row.id);
        console.log(`Deleted water row for date ${row.date}`);
        deleted++;
      }
    }
    console.log(`Total water rows deleted: ${deleted}`);
  }

  console.log('Cleaning electricity_daily_production...');
  const { data: elec, error: ee } = await supabase.from('electricity_daily_production').select('*');
  if (ee) console.error(ee);
  else {
    let deleted = 0;
    for (const row of elec) {
      if ((row.cards || 0) === 0 && (row.assembly || 0) === 0 && (row.insolation || 0) === 0 && (row.radiation_frequency || 0) === 0 && (row.calibration || 0) === 0 && (row.multy_test || 0) === 0 && (row.metrology || 0) === 0 && (row.perso || 0) === 0) {
        await supabase.from('electricity_daily_production').delete().eq('id', row.id);
        console.log(`Deleted electricity row for date ${row.date}`);
        deleted++;
      }
    }
    console.log(`Total electricity rows deleted: ${deleted}`);
  }
}

clean();
