import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division') || 'water';
  
  try {
    const { data, error } = await supabase
      .from('production_history')
      .select('*')
      .eq('division', division)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Map database fields to the expected frontend format
    const history = data.map(item => ({
      id: item.id,
      timestamp: item.created_at,
      filename: item.filename,
      date: item.date,
      shift: item.shift,
      summary: item.summary,
      rows: item.rows
    }));

    return NextResponse.json({ history });
  } catch (e) {
    console.error('Error fetching history:', e);
    return NextResponse.json({ history: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { division, date, shift, rows, filename } = body;

    if (!division || !date || !shift || !Array.isArray(rows)) {
      return NextResponse.json({ error: 'Missing division, date, shift, or rows' }, { status: 400 });
    }

    // Initialize counts
    let assembly = 0;
    let perso = 0;
    let lasering = 0;
    let packaging = 0;
    let cartons = 0;
    let palets = 0;
    
    // Electricity counts
    let insolation = 0;
    let radiation_frequency = 0;
    let calibration = 0;
    let multy_test = 0;
    let metrology = 0;
    let cards = 0;

    // Process rows based on division
    if (division === 'water') {
      // Find the dynamic key for 'Quantité OK' from the header row
      let qtyOkKey = '';
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        for (const [key, val] of Object.entries(rows[i])) {
          if (String(val).trim() === 'Quantité OK') {
            qtyOkKey = key;
            break;
          }
        }
        if (qtyOkKey) break;
      }

      for (const row of rows) {
        const rowStr = JSON.stringify(row).toUpperCase();
        
        let val = 0;
        if (qtyOkKey && row[qtyOkKey] !== undefined) {
           val = parseInt(row[qtyOkKey] as string) || 0;
        } else {
           // Fallback safety
           const nums = Object.values(row).filter(v => typeof v === 'number' && v < 1000000); 
           val = nums.length > 0 ? Math.max(...(nums as number[])) : 1;
        }

        if (rowStr.includes('TO PERSO')) assembly += val;
        if (rowStr.includes('TEST_PERSO') && rowStr.includes('BNR-INMC00094')) perso += val;
        if (rowStr.includes('TEST_LASER') && rowStr.includes('BNR-INMC00095')) lasering += val;
        if (rowStr.includes('GO_CARTON') && rowStr.includes('BNR-INMC00096')) packaging += val;
        if (rowStr.includes('FINCARTON') && rowStr.includes('BNR-INMC00096')) cartons += val;
        if (rowStr.includes('FINPALET') && rowStr.includes('BNR-INMC00097')) palets += val;
      }
    } else if (division === 'electricity') {
      for (const row of rows) {
        const rowStr = JSON.stringify(row).toUpperCase();
        
        // Find the column for "Nb Boards OK" dynamically in case of whitespace issues
        const okKey = Object.keys(row).find(k => String(k).toUpperCase().includes('NB BOARDS OK')) || 'Nb Boards OK';
        const val = parseInt(row[okKey]) || 0;

        if (rowStr.includes('254100543S')) cards += val;
        if (rowStr.includes('BNR-INMC00004')) assembly += val;
        if (rowStr.includes('BNR-NG6044')) insolation += val;
        if (rowStr.includes('BNR-NG6045')) radiation_frequency += val;
        if (rowStr.includes('BNR-NG5998')) calibration += val;
        if (rowStr.includes('BNR-INMC00017')) multy_test += val;
        if (rowStr.includes('BNR-NG6032')) metrology += val;
        if (rowStr.includes('BNR-INMC00003')) perso += val;
      }
    }

    const shiftKey = shift === 'all' ? 'shift1' : shift; 

    // Upsert into respective table
    const targetTable = division === 'water' ? 'water_daily_production' : 'electricity_daily_production';
    
    const payload = division === 'water' ? {
      date, shift: shiftKey, assembly, perso, lasering, packaging, cartons, palets
    } : {
      date, shift: shiftKey, cards, assembly, insolation, radiation_frequency, calibration, multy_test, metrology, perso
    };

    // Check if everything is zero
    const isZero = division === 'water' 
      ? (assembly === 0 && perso === 0 && lasering === 0 && packaging === 0 && cartons === 0 && palets === 0)
      : (cards === 0 && assembly === 0 && insolation === 0 && radiation_frequency === 0 && calibration === 0 && multy_test === 0 && metrology === 0 && perso === 0);

    if (isZero) {
      return NextResponse.json({ success: true, message: 'File processed but data is all zeros (ignored)' });
    }

    const { error: upsertError } = await supabase
      .from(targetTable)
      .upsert(payload as any, { onConflict: 'date,shift' });

    if (upsertError) throw upsertError;

    // Insert into production_history table
    const { error: historyError } = await supabase
      .from('production_history')
      .insert({
        division,
        filename: filename || 'Unknown file',
        date,
        shift,
        summary: division === 'water' 
          ? { assembly, perso, lasering, packaging, cartons, palets }
          : { cards, assembly, insolation, radiation_frequency, calibration, multy_test, metrology, perso },
        rows
      });

    if (historyError) throw historyError;

    return NextResponse.json({ success: true, message: 'Data processed successfully' });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // Fetch the history record to know which daily_production row to delete
    const { data: historyData, error: fetchError } = await supabase
      .from('production_history')
      .select('date, shift, division')
      .eq('id', id)
      .single();

    if (fetchError || !historyData) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { date, shift, division } = historyData;

    // Delete from history
    const { error: deleteHistoryError } = await supabase
      .from('production_history')
      .delete()
      .eq('id', id);

    if (deleteHistoryError) throw deleteHistoryError;

    // Delete from daily production
    const targetTable = division === 'water' ? 'water_daily_production' : 'electricity_daily_production';
    const shiftKey = shift === 'all' ? 'shift1' : shift; 

    const { error: deleteDailyError } = await supabase
      .from(targetTable)
      .delete()
      .eq('date', date)
      .eq('shift', shiftKey);

    if (deleteDailyError) throw deleteDailyError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting upload:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
