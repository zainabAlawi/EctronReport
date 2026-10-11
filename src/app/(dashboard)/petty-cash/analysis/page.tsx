import React from 'react';

export default function PettyCashAnalysis() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Petty Cash Analysis</h1>
          <p className="text-zinc-400 text-sm mt-1">Detailed breakdown of monthly budget and category spending</p>
        </div>
      </div>
      <div className="glass rounded-2xl p-6 border border-border">
        <h2 className="text-xl font-semibold text-white mb-4">قريباً (Coming Soon)</h2>
        <p className="text-zinc-400">واجهة التحليل والمخططات البيانية للبتي كاش قيد التطوير.</p>
      </div>
    </div>
  );
}
