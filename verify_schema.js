const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

async function verify() {
  const tables = ['production_history', 'water_daily_production', 'electricity_daily_production'];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    console.log(`\nTable: ${table}`);
    if (error) {
      console.log(`Error: ${error.message}`);
    } else if (data && data.length > 0) {
      console.log(`Columns: ${Object.keys(data[0]).join(', ')}`);
    } else {
      console.log('Table exists, but is empty. (Could not infer columns without rpc/postgres schema query)');
    }
  }
}
verify();
