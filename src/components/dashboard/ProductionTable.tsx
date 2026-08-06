import clsx from 'clsx';

const electricityProductionData = [
  { department: 'Assembly', target: 640, shift1: 640, shift2: 635, shift3: 620, total: 1895, percentage: 98.7 },
  { department: 'Insulation', target: 640, shift1: 640, shift2: 640, shift3: 640, total: 1920, percentage: 100 },
  { department: 'Calibration', target: 640, shift1: 620, shift2: 618, shift3: 610, total: 1848, percentage: 96 },
];



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
  date
}: { 
  type?: 'water' | 'electricity',
  dynamicWaterData?: any,
  date?: string
}) {
  if (type === 'water') {
    const shifts = dynamicWaterData || {
      shift1: { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 },
      shift2: { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 },
      shift3: { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0 },
    };

    const buildRow = (department: string, target: number, key: string) => {
      const s1 = shifts.shift1?.[key] || 0;
      const s2 = shifts.shift2?.[key] || 0;
      const s3 = shifts.shift3?.[key] || 0;
      const total = s1 + s2 + s3;
      const percentage = target > 0 ? Number(((total / target) * 100).toFixed(1)) : 0;
      return { department, target, meterAchievement: '', shift1: s1 || '', shift2: s2 || '', shift3: s3 || '', total, percentage };
    };

    const waterProductionData = [
      buildRow('Assembly', 640, 'assembly'),
      buildRow('Perso', 640, 'perso'),
      buildRow('lasering', 640, 'lasering'),
      buildRow('Packaging (Meters)', 640, 'packaging'),
      buildRow('Cartons', 64, 'cartons'),
      buildRow('Palets', 1, 'palets'),
    ];

    const dateObj = date ? new Date(date) : new Date();
    const dayString = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const dateString = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).replace(/ /g, '-');

    return (
      <div className="w-full overflow-x-auto rounded-xl border border-teal-800/30">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-teal-800/50 bg-teal-900/30">
              <th className="py-3 px-4 text-sm font-semibold text-teal-100 border-r border-teal-800/50 w-1/4">Day</th>
              <th colSpan={7} className="py-3 px-4 text-sm font-semibold text-teal-100 text-center">{dayString}</th>
            </tr>
            <tr className="border-b border-teal-800/50 bg-teal-900/30">
              <th className="py-3 px-4 text-sm font-semibold text-teal-100 border-r border-teal-800/50">Date</th>
              <th colSpan={7} className="py-3 px-4 text-sm font-semibold text-teal-100 text-center">{dateString}</th>
            </tr>
            <tr className="border-b border-teal-800/50 bg-teal-950/40">
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50">Step</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Target</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Meter Achievement</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Shift 1</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Shift 2</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Shift 3</th>
              <th className="py-3 px-4 text-sm font-semibold text-teal-200 border-r border-teal-800/50 text-center">Total</th>
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
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50">{row.meterAchievement}</td>
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50 bg-zinc-800/20">{row.shift1}</td>
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50 bg-zinc-800/20">{row.shift2}</td>
                <td className="py-3 px-4 text-sm text-zinc-300 text-center border-r border-teal-800/50 bg-zinc-800/20">{row.shift3}</td>
                <td className="py-3 px-4 text-sm font-bold text-teal-100 text-center border-r border-teal-800/50 bg-teal-900/30">{row.total}</td>
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
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="py-4 px-4 text-sm font-semibold text-zinc-400 whitespace-nowrap">Department</th>
            <th className="py-4 px-4 text-sm font-semibold text-zinc-400 whitespace-nowrap text-right">Target</th>
            <th className="py-4 px-4 text-sm font-semibold text-zinc-400 whitespace-nowrap text-right">Shift 1</th>
            <th className="py-4 px-4 text-sm font-semibold text-zinc-400 whitespace-nowrap text-right">Shift 2</th>
            <th className="py-4 px-4 text-sm font-semibold text-zinc-400 whitespace-nowrap text-right">Shift 3</th>
            <th className="py-4 px-4 text-sm font-semibold text-zinc-400 whitespace-nowrap text-right">Total</th>
            <th className="py-4 px-4 text-sm font-semibold text-zinc-400 whitespace-nowrap text-right">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/50">
          {electricityProductionData.map((row) => (
            <tr key={row.department} className="hover:bg-zinc-800/30 transition-colors">
              <td className="py-4 px-4 text-sm font-medium text-zinc-100 flex items-center gap-2">
                <span className="text-[10px]">{getStatusDot(row.percentage)}</span>
                {row.department}
              </td>
              <td className="py-4 px-4 text-sm text-zinc-300 text-right">{row.target}</td>
              <td className="py-4 px-4 text-sm text-zinc-300 text-right">{row.shift1}</td>
              <td className="py-4 px-4 text-sm text-zinc-300 text-right">{row.shift2}</td>
              <td className="py-4 px-4 text-sm text-zinc-300 text-right">{row.shift3}</td>
              <td className="py-4 px-4 text-sm font-bold text-white text-right">{row.total}</td>
              <td className="py-4 px-4 text-right">
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
  );
}
