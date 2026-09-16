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
  const { data: history, error } = await supabase.from('production_history').select('id, division, date, shift, rows');
  if (error) {
    console.error(error);
    return;
  }
  
  for (const record of history) {
    if (!record.rows || !Array.isArray(record.rows)) continue;
    
    const { division, date, rows, shift } = record;
    let failers = {
      assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0, cards: 0, insolation: 0, radiation_frequency: 0, calibration: 0, multy_test: 0, metrology: 0
    };

    if (division === 'water') {
      let failKey = '';
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        for (const [key, val] of Object.entries(rows[i])) {
          if (String(val).toUpperCase().trim().includes('NB B. OK XPASS NOT REWORK')) failKey = key;
        }
        if (failKey) break;
      }

      for (const row of rows) {
        const rowStr = JSON.stringify(row).toUpperCase();
        let failVal = 0;
        if (failKey && row[failKey] !== undefined) failVal = parseInt(row[failKey]) || 0;

        if (rowStr.includes('TO PERSO')) { failers.assembly += failVal; }
        if (rowStr.includes('TEST_PERSO') && rowStr.includes('BNR-INMC00094')) { failers.perso += failVal; }
        if (rowStr.includes('TEST_LASER') && rowStr.includes('BNR-INMC00095')) { failers.lasering += failVal; }
        if (rowStr.includes('GO_CARTON') && rowStr.includes('BNR-INMC00096')) { failers.packaging += failVal; }
        if (rowStr.includes('FINCARTON') && rowStr.includes('BNR-INMC00096')) { failers.cartons += failVal; }
        if (rowStr.includes('FINPALET') && rowStr.includes('BNR-INMC00097')) { failers.palets += failVal; }
      }
    } else if (division === 'electricity') {
      let failKey = '';
      for (let i = 0; i < Math.min(20, rows.length); i++) {
        for (const [key, val] of Object.entries(rows[i])) {
          if (String(val).toUpperCase().trim().includes('NB B. OK XPASS NOT REWORK')) failKey = key;
        }
        if (failKey) break;
      }

      for (const row of rows) {
        const rowStr = JSON.stringify(row).toUpperCase();
        let failVal = 0;
        if (failKey && row[failKey] !== undefined) failVal = parseInt(row[failKey]) || 0;

        if (rowStr.includes('254100543S')) { failers.cards += failVal; }
        if (rowStr.includes('BNR-INMC00004')) { failers.assembly += failVal; }
        if (rowStr.includes('BNR-NG6044')) { failers.insolation += failVal; }
        if (rowStr.includes('BNR-NG6045')) { failers.radiation_frequency += failVal; }
        if (rowStr.includes('BNR-NG5998')) { failers.calibration += failVal; }
        if (rowStr.includes('BNR-INMC00017')) { failers.multy_test += failVal; }
        if (rowStr.includes('BNR-NG6032')) { failers.metrology += failVal; }
        if (rowStr.includes('BNR-INMC00003')) { failers.perso += failVal; }
      }
      failers.cards = failers.assembly;
    }

    const shiftKey = shift === 'all' ? 'shift1' : shift; 
    const targetTable = division === 'water' ? 'water_daily_production' : 'electricity_daily_production';

    const { error: updateError } = await supabase
      .from(targetTable)
      .update({ failers })
      .eq('date', date)
      .eq('shift', shiftKey);
      
    if (updateError) console.error(updateError);
    else console.log('Updated', division, date, shiftKey);
  }
  
  console.log('Done!');
}

run();
