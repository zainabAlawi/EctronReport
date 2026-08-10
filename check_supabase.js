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

async function check() {
  const { data, error } = await supabase
    .from('production_history')
    .select('filename, summary, rows')
    .eq('division', 'water')
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching data:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Latest file uploaded:', data[0].filename);
    console.log('First 15 rows:');
    for (let i = 0; i < 15; i++) {
        if (data[0].rows[i]) {
            console.log(`Row ${i}:`, JSON.stringify(data[0].rows[i]));
        }
    }
  } else {
    console.log('No data found for water division.');
  }
}

check();
