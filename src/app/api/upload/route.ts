import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const division = searchParams.get('division') || 'water';
  const dataFileName = division === 'water' ? 'waterProduction.json' : 'electricityProduction.json';
  const DATA_FILE_PATH = path.join(process.cwd(), 'src/data', dataFileName);
  
  try {
    const fileData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const db = JSON.parse(fileData);
    return NextResponse.json({ history: db.history || [] });
  } catch (e) {
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

    const dataFileName = division === 'water' ? 'waterProduction.json' : 'electricityProduction.json';
    const DATA_FILE_PATH = path.join(process.cwd(), 'src/data', dataFileName);

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

      if (transaction.includes('to Perso')) {
        assembly++;
      }
      if (transaction.includes('TEST_PERSO') && post.includes('BNR-INMC00094')) {
        perso++;
      }
      if (transaction.includes('TEST_LASER') && post.includes('BNR-INMC00095')) {
        lasering++;
      }
      if (transaction.includes('GO_CARTON') && post.includes('BNR-INMC00096')) {
        packaging++;
      }
      if (transaction.includes('FINCARTON') && post.includes('BNR-INMC00096')) {
        cartons++;
      }
      if (transaction.includes('FINPALET') && post.includes('BNR-INMC00097')) {
        palets++;
      }
    }

    // Read existing data
    let db: any = { dates: {}, history: [] };
    try {
      const fileData = await fs.readFile(DATA_FILE_PATH, 'utf-8');
      db = JSON.parse(fileData);
    } catch (e) {
      // File doesn't exist or is invalid, use default empty db
    }

    // Ensure structure for date exists
    if (!db.dates) db.dates = {};
    if (!db.history) db.history = [];
    
    if (!db.dates[date]) {
      db.dates[date] = {
        shift1: { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 },
        shift2: { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 },
        shift3: { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 },
        official: { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 },
      };
    } else if (!db.dates[date].official) {
      db.dates[date].official = { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 };
    }

    const shiftKey = shift === 'all' ? 'shift1' : shift; 

    if (db.dates[date][shiftKey]) {
        db.dates[date][shiftKey] = { assembly, perso, lasering, packaging, cartons, palets };
    }

    // Add to history
    db.history.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      filename: filename || 'Unknown file',
      date,
      shift,
      summary: { assembly, perso, lasering, packaging, cartons, palets },
      rows
    });

    // Write back to file
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');

    return NextResponse.json({ success: true, message: 'Data processed successfully' });
  } catch (error) {
    console.error('Error processing upload:', error);
    return NextResponse.json({ error: 'Failed to process data' }, { status: 500 });
  }
}
