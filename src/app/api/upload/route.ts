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

    // Process rows based on rules
    for (const row of rows) {
      const transaction = String(row['Transaction'] || row['transaction'] || '').trim();
      const post = String(row['Post'] || row['post'] || '').trim();

      if (transaction.includes('to Perso')) assembly++;
      if (transaction.includes('TEST_PERSO') && post.includes('BNR-INMC00094')) perso++;
      if (transaction.includes('TEST_LASER') && post.includes('BNR-INMC00095')) lasering++;
      if (transaction.includes('GO_CARTON') && post.includes('BNR-INMC00096')) packaging++;
      if (transaction.includes('FINCARTON') && post.includes('BNR-INMC00096')) cartons++;
      if (transaction.includes('FINPALET') && post.includes('BNR-INMC00097')) palets++;
    }

    const shiftKey = shift === 'all' ? 'shift1' : shift; 

    // Upsert into daily_production table
    const { error: upsertError } = await supabase
      .from('daily_production')
      .upsert({
        division,
        date,
        shift: shiftKey,
        assembly,
        perso,
        lasering,
        packaging,
        cartons,
        palets
      }, { onConflict: 'division,date,shift' });

    if (upsertError) throw upsertError;

    // Insert into production_history table
    const { error: historyError } = await supabase
      .from('production_history')
      .insert({
        division,
        filename: filename || 'Unknown file',
        date,
        shift,
        summary: { assembly, perso, lasering, packaging, cartons, palets },
        rows
      });

    if (historyError) throw historyError;

    return NextResponse.json({ success: true, message: 'Data processed successfully' });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}
