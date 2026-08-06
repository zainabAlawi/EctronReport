import fs from 'fs/promises';
import path from 'path';
import YearlyTable from './YearlyTable';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function YearlyProductionPage(props: { params: Promise<{ division: string }> }) {
  const params = await props.params;
  const division = params.division;

  let flatData = [];

  try {
    const dataFileName = division === 'water' ? 'waterProduction.json' : 'electricityProduction.json';
    const dbPath = path.join(process.cwd(), 'src/data', dataFileName);
    const fileData = await fs.readFile(dbPath, 'utf-8');
    const db = JSON.parse(fileData);

    if (db.dates) {
      for (const [date, shifts] of Object.entries(db.dates)) {
        let assembly = 0, perso = 0, lasering = 0, packaging = 0, cartons = 0, palets = 0;
        
        // Sum across all available shifts/official data for the day
        for (const [shiftName, shiftData] of Object.entries(shifts as any)) {
          assembly += (shiftData as any).assembly || 0;
          perso += (shiftData as any).perso || 0;
          lasering += (shiftData as any).lasering || 0;
          packaging += (shiftData as any).packaging || 0;
          cartons += (shiftData as any).cartons || 0;
          palets += (shiftData as any).palets || 0;
        }

        flatData.push({
          date,
          assembly,
          perso,
          lasering,
          packaging,
          cartons,
          palets
        });
      }
    }
  } catch (e) {
    console.error(e);
  }

  // Sort newest first
  flatData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex items-center gap-4">
        <Link href={`/${division}/dashboard`} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Yearly Production History</h1>
          <p className="text-zinc-400 text-sm mt-1">Complete record of daily production for the entire year</p>
        </div>
      </div>

      <YearlyTable data={flatData} division={division} />
    </div>
  );
}
