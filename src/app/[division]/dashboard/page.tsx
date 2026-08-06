import fs from 'fs/promises';
import path from 'path';
import MetricsCards from '@/components/dashboard/MetricsCards';
import ProductionTable from '@/components/dashboard/ProductionTable';
import { HourlyProductionChart, TargetVsActualChart, AchievementGauge } from '@/components/dashboard/Charts';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
export default async function DashboardPage(props: {
  params: Promise<{ division: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const division = params.division;
  const selectedDate = searchParams.date || new Date().toISOString().split('T')[0];

  let dataForDate = null;
  if (division === 'water') {
    try {
      const dbPath = path.join(process.cwd(), 'src/data/waterProduction.json');
      const fileData = await fs.readFile(dbPath, 'utf-8');
      const db = JSON.parse(fileData);
      dataForDate = db.dates?.[selectedDate] || null;
    } catch (e) {
      // file might not exist yet
    }
  } else if (division === 'electricity') {
    try {
      const dbPath = path.join(process.cwd(), 'src/data/electricityProduction.json');
      const fileData = await fs.readFile(dbPath, 'utf-8');
      const db = JSON.parse(fileData);
      dataForDate = db.dates?.[selectedDate] || null;
    } catch (e) {
      // file might not exist yet
    }
  }

  const metrics = {
    target: 6400,
    achieved: 5890,
    achievement: 92,
    remaining: 510,
    efficiency: 92,
  };

  const isWarning = metrics.efficiency < 90;
  const isExcellent = metrics.achieved >= metrics.target;

  const displayDate = new Intl.DateTimeFormat('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(selectedDate));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Today's Production - {displayDate}</h1>
          <p className="text-zinc-400 text-sm mt-1">Real-time overview of smart meters assembly</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Link href={`/${division}/yearly-production`} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium flex items-center gap-2 transition-colors">
            <Calendar className="w-4 h-4" />
            عرض إنتاج السنة كاملة
          </Link>
          
          {isWarning && (
            <div className="px-4 py-2 rounded-lg bg-danger/10 border border-danger/20 text-danger text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse"></span>
              Warning: Efficiency below 90%
            </div>
          )}
          {isExcellent && (
            <div className="px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Excellent: Target Reached!
            </div>
          )}
        </div>
      </div>

      <MetricsCards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-6">Production Overview</h3>
            <ProductionTable type={division as 'water' | 'electricity'} dynamicWaterData={dataForDate} date={selectedDate} />
          </div>
          
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-6">Hourly Production</h3>
            <HourlyProductionChart />
          </div>
        </div>
        
        <div className="flex flex-col gap-6">
          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-6">Achievement</h3>
            <AchievementGauge />
          </div>

          <div className="glass rounded-2xl p-6 border border-border">
            <h3 className="text-lg font-semibold text-white mb-6">Target vs Actual</h3>
            <TargetVsActualChart />
          </div>
        </div>
      </div>
    </div>
  );
}
