import clsx from 'clsx';

function getStatusColor(percentage: number) {
  if (percentage >= 98) return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'; // 🟢
  if (percentage >= 90) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'; // 🟡
  return 'text-danger bg-danger/10 border-danger/20'; // 🔴
}

function getStatusDot(percentage: number) {
  if (percentage >= 98) return '🟢';
  if (percentage >= 90) return '🟡';
  return '🔴';
}

export default function ProductionTable({ 
  type = 'electricity',
  dynamicWaterData,
  date,
  latestFileName,
  latestFileTime,
  target = 640
}: { 
  type?: 'water' | 'electricity',
  dynamicWaterData?: any,
  date?: string,
  latestFileName?: string | null,
  latestFileTime?: string | null,
  target?: number
}) {
  const shifts = dynamicWaterData || {
    shift1: {},
    shift2: {},
    shift3: {},
    official: {},
  };

  const buildRow = (department: string, target: number, key: string) => {
    const s1 = shifts.shift1?.[key] || 0;
    const s2 = shifts.shift2?.[key] || 0;
    const s3 = shifts.shift3?.[key] || 0;
    const official = shifts.official?.[key] || 0;
    const total = s1 + s2 + s3 + official;
    const percentage = target > 0 ? Number(((total / target) * 100).toFixed(1)) : 0;
    return { department, target, shift1: s1 || '', shift2: s2 || '', shift3: s3 || '', total, percentage };
  };

  const dateObj = date ? new Date(date) : new Date();
  const dayString = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const dateString = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');

  const LastUploadedHeader = () => {
    if (!latestFileName) return null;
    return (
      <div className="mb-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-blue-400">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
          <span className="font-medium">أحدث ملف مرفوع:</span>
          <span className="text-white">{latestFileName}</span>
        </div>
        <div className="text-zinc-400">
          وقت الرفع: <span className="text-zinc-300">{latestFileTime}</span>
        </div>
      </div>
    );
  };

  if (type === 'water') {
    const waterProductionData = [
      buildRow('Assembly', target, 'assembly'),
      buildRow('Perso', target, 'perso'),
      buildRow('Lasering', target, 'lasering'),
      buildRow('Packaging (Meters)', target, 'packaging'),
      buildRow('Cartons', Math.round(target / 10), 'cartons'),
      buildRow('Palets', 1, 'palets'),
    ];

    return (
      <div className="flex flex-col gap-4">
        <LastUploadedHeader />
        <div className="w-full overflow-x-auto rounded-xl border border-teal-800/30">
          <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-teal-800/50 bg-teal-900/30">
              <th className="py-3 px-4 text-sm font-semibold text-teal-100 border-r border-teal-800/50 w-1/4">Day</th>
              <th colSpan={6} className="py-3 px-4 text-sm font-semibold text-teal-100 text-center">{dayString}</th>
            </tr>
            <tr className="border-b border-teal-800/50 bg-teal-900/30">
              <th className="py-3 px-4 text-sm font-semibold text-teal-100 border-r border-teal-800/50">Date</th>
              <th colSpan={6} className="py-3 px-4 text-sm font-semibold text-teal-100 text-center">{dateString}</th>
            </tr>
            <tr className="border-b border-teal-800/50 bg-teal-950/40">
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50">Step</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Target</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Total</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Shift 1</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Shift 2</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Shift 3</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 text-center">%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-teal-800/30">
            {waterProductionData.map((row) => (
              <tr key={row.department} className="hover:bg-teal-900/20 transition-colors bg-zinc-900/40">
                <td className="py-3 px-4 text-sm font-medium text-teal-100 border-r border-teal-800/50 bg-teal-950/20 flex items-center gap-2">
                  <span className="text-[10px]">{getStatusDot(row.percentage)}</span>
                  {row.department}
                </td>
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50 bg-zinc-800/20">{row.target}</td>
                <td className="py-3 px-4 text-sm font-bold text-teal-100 text-center border-r border-teal-800/50 bg-teal-900/30">{row.total}</td>
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50 bg-zinc-800/20">{row.shift1}</td>
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50 bg-zinc-800/20">{row.shift2}</td>
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50 bg-zinc-800/20">{row.shift3}</td>
                <td className="py-3 px-4 text-center">
                  <span className={clsx(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                    getStatusColor(row.percentage)
                  )}>
                    {row.percentage}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    );
  }

  // Electricity
  const electricityProductionData = [
    buildRow('Assembly', target, 'assembly'),
    buildRow('Insolation', target, 'insolation'),
    buildRow('Radiation Frequency', target, 'radiation_frequency'),
    buildRow('Calibration', target, 'calibration'),
    buildRow('Multy test', target, 'multy_test'),
    buildRow('Metrology', target, 'metrology'),
    buildRow('Perso', target, 'perso'),
    buildRow('Cards', target, 'cards'),
  ];

  return (
    <div className="flex flex-col gap-4">
      <LastUploadedHeader />
      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800/50 bg-zinc-900/50">
            <th className="py-3 px-4 text-sm font-semibold text-zinc-300 border-r border-zinc-800/50 w-1/4">Day</th>
            <th colSpan={6} className="py-3 px-4 text-sm font-semibold text-zinc-300 text-center">{dayString}</th>
          </tr>
          <tr className="border-b border-zinc-800/50 bg-zinc-900/50">
            <th className="py-3 px-4 text-sm font-semibold text-zinc-300 border-r border-zinc-800/50">Date</th>
            <th colSpan={6} className="py-3 px-4 text-sm font-semibold text-zinc-300 text-center">{dateString}</th>
          </tr>
          <tr className="border-b border-zinc-800 bg-zinc-900/80">
            <th className="py-3 px-4 text-sm font-semibold text-zinc-400 border-r border-zinc-800">Step</th>
            <th className="py-3 px-4 text-sm font-semibold text-zinc-400 border-r border-zinc-800 text-center">Target</th>
            <th className="py-3 px-4 text-sm font-semibold text-zinc-400 border-r border-zinc-800 text-center">Total</th>
            <th className="py-3 px-4 text-sm font-semibold text-zinc-400 border-r border-zinc-800 text-center">Shift 1</th>
            <th className="py-3 px-4 text-sm font-semibold text-zinc-400 border-r border-zinc-800 text-center">Shift 2</th>
            <th className="py-3 px-4 text-sm font-semibold text-zinc-400 border-r border-zinc-800 text-center">Shift 3</th>
            <th className="py-3 px-4 text-sm font-semibold text-zinc-400 text-center">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {electricityProductionData.map((row) => (
            <tr key={row.department} className="hover:bg-zinc-800/30 transition-colors">
              <td className="py-3 px-4 text-sm font-medium text-zinc-100 border-r border-zinc-800 bg-zinc-900/20 flex items-center gap-2">
                <span className="text-[10px]">{getStatusDot(row.percentage)}</span>
                {row.department}
              </td>
              <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-zinc-800 bg-zinc-900/40">{row.target}</td>
              <td className="py-3 px-4 text-sm font-bold text-white text-center border-r border-zinc-800 bg-zinc-800/30">{row.total}</td>
              <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-zinc-800 bg-zinc-900/40">{row.shift1}</td>
              <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-zinc-800 bg-zinc-900/40">{row.shift2}</td>
              <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-zinc-800 bg-zinc-900/40">{row.shift3}</td>
              <td className="py-3 px-4 text-center">
                <span className={clsx(
                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                  getStatusColor(row.percentage)
                )}>
                  {row.percentage}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
