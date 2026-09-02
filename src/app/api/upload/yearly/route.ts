import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { division, filename, daysData, uploaderName, target } = body;

    if (!division || !Array.isArray(daysData)) {
      return NextResponse.json({ error: 'Missing division or daysData' }, { status: 400 });
    }

    if (daysData.length === 0) {
      return NextResponse.json({ error: 'No valid daily data found in file' }, { status: 400 });
    }

    const targetTable = division === 'water' ? 'water_daily_production' : 'electricity_daily_production';
    
    // Calculate overall summary and filter out 0-value days
    const summary: any = {};
    const bulkPayloads = daysData.filter(day => {
      const keys = division === 'water' 
        ? ['assembly', 'perso', 'lasering', 'packaging', 'cartons', 'palets']
        : ['cards', 'assembly', 'insolation', 'radiation_frequency', 'calibration', 'multy_test', 'metrology', 'perso'];
      
      const hasValue = keys.some(k => (day[k] || 0) > 0);
      return hasValue;
    }).map(day => {
      const payload: any = {
        date: day.date,
        shift: 'official' // Default to official shift for yearly/daily aggregate reports
      };
      
      const keys = division === 'water' 
        ? ['assembly', 'perso', 'lasering', 'packaging', 'cartons', 'palets']
        : ['cards', 'assembly', 'insolation', 'radiation_frequency', 'calibration', 'multy_test', 'metrology', 'perso'];
        
      keys.forEach(k => {
        payload[k] = day[k] || 0;
        summary[k] = (summary[k] || 0) + (day[k] || 0);
      });
      
      return payload;
    });

    if (bulkPayloads.length === 0) {
      return NextResponse.json({ error: 'No valid daily data > 0 found in file' }, { status: 400 });
    }

    // Upsert all days
    // Supabase JS client supports bulk upsert arrays
    const { error: upsertError } = await (await createClient())
      .from(targetTable)
      .upsert(bulkPayloads, { onConflict: 'date,shift' });

    if (upsertError) throw upsertError;

    // Insert a single history record for this upload
    const uploadDate = new Date().toISOString().split('T')[0];
    const generatedFilename = `${uploadDate} - تقرير ${division === 'water' ? 'المياه' : 'الكهرباء'} السنوي`;

    const { error: historyError } = await (await createClient())
      .from('production_history')
      .insert({
        division,
        filename: generatedFilename,
        date: uploadDate, // The date this was uploaded
        shift: 'official', // Mark as official
        summary: { ...summary, uploaderName, target },
        rows: bulkPayloads // Store the simplified daily payloads as rows for reference
      });

    if (historyError) throw historyError;

    return NextResponse.json({ success: true, message: `Processed ${bulkPayloads.length} days successfully`, count: bulkPayloads.length });
  } catch (error) {
    console.error('Error processing yearly upload:', error);
    return NextResponse.json({ error: 'Failed to process bulk data' }, { status: 500 });
  }
}
