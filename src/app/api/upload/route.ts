import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division') || 'water';
  
  try {
    const { data, error } = await (await createClient())
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
      rows: item.rows,
      uploaderName: item.summary?.uploaderName || 'Unknown'
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
    const { division, date, shift, rows, filename, uploaderName, target, note } = body;

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

    // Failers counts
    let failers: any = {
      assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0, cards: 0, insolation: 0, radiation_frequency: 0, calibration: 0, multy_test: 0, metrology: 0
    };
    if (note) {
      failers.note = note;
    }

    // Process rows based on division
    if (division === 'water') {
      // Find the dynamic key for 'Quantité OK' from the header row
      let qtyOkKey = '';
      let failKey = '';
      for (let i = 0; i < Math.min(10, rows.length); i++) {
        for (const [key, val] of Object.entries(rows[i])) {
          if (String(val).trim() === 'Quantité OK') {
            qtyOkKey = key;
          }
          if (String(val).toUpperCase().trim().includes('NB B. OK XPASS NOT REWORK')) {
            failKey = key;
          }
        }
        if (qtyOkKey) break;
      }

      for (const row of rows) {
        const rowStr = JSON.stringify(row).toUpperCase();
        
        let val = 0;
        let failVal = 0;
        if (qtyOkKey && row[qtyOkKey] !== undefined) {
           val = parseInt(row[qtyOkKey] as string) || 0;
        } else {
           // Fallback safety
           const nums = Object.values(row).filter(v => typeof v === 'number' && v < 1000000); 
           val = nums.length > 0 ? Math.max(...(nums as number[])) : 1;
        }

        if (failKey && row[failKey] !== undefined) {
          failVal = parseInt(row[failKey] as string) || 0;
        }

        if (rowStr.includes('TO PERSO')) { assembly += val; failers.assembly += failVal; }
        if (rowStr.includes('TEST_PERSO') && rowStr.includes('BNR-INMC00094')) { perso += val; failers.perso += failVal; }
        if (rowStr.includes('TEST_LASER') && rowStr.includes('BNR-INMC00095')) { lasering += val; failers.lasering += failVal; }
        if (rowStr.includes('GO_CARTON') && rowStr.includes('BNR-INMC00096')) { packaging += val; failers.packaging += failVal; }
        if (rowStr.includes('FINCARTON') && rowStr.includes('BNR-INMC00096')) { cartons += val; failers.cartons += failVal; }
        if (rowStr.includes('FINPALET') && rowStr.includes('BNR-INMC00097')) { palets += val; failers.palets += failVal; }
      }
    } else if (division === 'electricity' || division === 'electricity-ecs1100') {
      // Find the index/key for 'Nb Boards OK' and Failers from the headers
      let okKey = '';
      let failKey = '';
      for (let i = 0; i < Math.min(20, rows.length); i++) {
        for (const [key, val] of Object.entries(rows[i])) {
          if (String(val).toUpperCase().trim().includes('NB BOARDS OK')) {
            okKey = key;
          }
          if (String(val).toUpperCase().trim().includes('NB B. OK XPASS NOT REWORK')) {
            failKey = key;
          }
        }
        if (okKey && failKey) break;
      }

      for (const row of rows) {
        const rowStr = JSON.stringify(row).toUpperCase();
        
        let val = 0;
        let failVal = 0;
        
        if (okKey && row[okKey as keyof typeof row] !== undefined) {
          val = parseInt(row[okKey as keyof typeof row] as string) || 0;
        } else {
          // Fallback if header not found: find the largest number in the row
          const nums = Object.values(row).map(v => parseInt(v as string)).filter(v => !isNaN(v) && v > 0 && v < 10000);
          val = nums.length > 0 ? Math.max(...nums) : 0;
        }

        if (failKey && row[failKey as keyof typeof row] !== undefined) {
          failVal = parseInt(row[failKey as keyof typeof row] as string) || 0;
        }

        if (rowStr.includes('254100543S')) { cards += val; failers.cards += failVal; }
        if (rowStr.includes('BNR-INMC00004')) { assembly += val; failers.assembly += failVal; }
        if (rowStr.includes('BNR-NG6044')) { insolation += val; failers.insolation += failVal; }
        if (rowStr.includes('BNR-NG6045')) { radiation_frequency += val; failers.radiation_frequency += failVal; }
        if (rowStr.includes('BNR-NG5998')) { calibration += val; failers.calibration += failVal; }
        if (rowStr.includes('BNR-INMC00017')) { multy_test += val; failers.multy_test += failVal; }
        if (rowStr.includes('BNR-NG6032')) { metrology += val; failers.metrology += failVal; }
        if (rowStr.includes('BNR-INMC00003')) { perso += val; failers.perso += failVal; }
      }
      
      // Override cards to always equal assembly
      cards = assembly;
      failers.cards = failers.assembly;
    }

    const shiftKey = shift === 'all' ? 'shift1' : shift; 

    // Upsert into respective table
    const targetTable = division === 'water' ? 'water_daily_production' : division === 'electricity-ecs1100' ? 'electricity_ecs1100_daily_production' : 'electricity_daily_production';
    
    const payload = division === 'water' ? {
      date, shift: shiftKey, assembly, perso, lasering, packaging, cartons, palets, failers
    } : {
      date, shift: shiftKey, cards, assembly, insolation, radiation_frequency, calibration, multy_test, metrology, perso, failers
    };

    // Check if everything is zero
    const isZero = division === 'water' 
      ? (assembly === 0 && perso === 0 && lasering === 0 && packaging === 0 && cartons === 0 && palets === 0)
      : (cards === 0 && assembly === 0 && insolation === 0 && radiation_frequency === 0 && calibration === 0 && multy_test === 0 && metrology === 0 && perso === 0);

    if (isZero) {
      return NextResponse.json({ success: true, message: 'File processed but data is all zeros (ignored)' });
    }

    const { error: upsertError } = await (await createClient())
      .from(targetTable)
      .upsert(payload as any, { onConflict: 'date,shift' });

    if (upsertError) throw upsertError;

    const generatedFilename = `${date} - تقرير ${division === 'water' ? 'المياه' : division === 'electricity-ecs1100' ? 'الكهرباء ECS1100' : 'الكهرباء M212'} اليومي`;

    // Insert into production_history table
    const { error: historyError } = await (await createClient())
      .from('production_history')
      .insert({
        division,
        filename: generatedFilename,
        date,
        shift,
        summary: division === 'water' 
          ? { assembly, perso, lasering, packaging, cartons, palets, uploaderName, target }
          : { cards, assembly, insolation, radiation_frequency, calibration, multy_test, metrology, perso, uploaderName, target },
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
    const { data: historyData, error: fetchError } = await (await createClient())
      .from('production_history')
      .select('date, shift, division')
      .eq('id', id)
      .single();

    if (fetchError || !historyData) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const { date, shift, division } = historyData;

    // Delete from history
    const { error: deleteHistoryError } = await (await createClient())
      .from('production_history')
      .delete()
      .eq('id', id);

    if (deleteHistoryError) throw deleteHistoryError;

    // Delete from daily production
    const targetTable = division === 'water' ? 'water_daily_production' : division === 'electricity-ecs1100' ? 'electricity_ecs1100_daily_production' : 'electricity_daily_production';
    const shiftKey = shift === 'all' ? 'shift1' : shift; 

    const { error: deleteDailyError } = await (await createClient())
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
