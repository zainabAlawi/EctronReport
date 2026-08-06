'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Download, Printer } from 'lucide-react';
import ReactECharts from 'echarts-for-react';

import { useParams } from 'next/navigation';

const TABS = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

export default function ReportsPage() {
  const params = useParams();
  const division = params.division as string;
  const [activeTab, setActiveTab] = useState('Daily');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Historical Reports</h1>
          <p className="text-zinc-400 text-sm mt-1">Analyze production trends over time</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">
            <Printer className="w-4 h-4" /> Print Report
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Download className="w-4 h-4" /> Export PDF
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
      </div>

      <div className="flex p-1 bg-zinc-900/50 rounded-xl w-fit border border-zinc-800">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab 
                ? "bg-zinc-800 text-white shadow-sm" 
                : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 border border-border min-h-[400px]">
        {activeTab === 'Daily' && <DailyReport division={division} />}
        {activeTab === 'Weekly' && <WeeklyReport />}
        {activeTab === 'Monthly' && <MonthlyReport />}
        {activeTab === 'Yearly' && <YearlyReport />}
      </div>
    </div>
  );
}

function DailyReport({ division }: { division: string }) {
  const isWater = division === 'water';

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-white mb-2">Daily Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Today's Target" value="6,400" />
        <StatBox label="Production" value="5,890" color="text-emerald-400" />
        <StatBox label="Remaining" value="510" color="text-yellow-400" />
        <StatBox label="Efficiency" value="92%" />
      </div>
      
      {isWater ? (
        <div className="mt-4">
          <h4 className="text-sm text-zinc-400 mb-3 font-medium">Production Steps Efficiency</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StepBox name="Assembly" value="100%" status="success" />
            <StepBox name="Perso" value="88%" status="warning" />
            <StepBox name="Lasering" value="95%" status="success" />
            <StepBox name="Packaging" value="98%" status="success" />
            <StepBox name="Cartons" value="96%" status="success" />
            <StepBox name="Pallets" value="94%" status="success" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-400 mb-1 font-medium">Best Department</p>
            <p className="text-xl text-white font-bold">Insulation (100%)</p>
          </div>
          <div className="p-4 rounded-xl bg-danger/10 border border-danger/20">
            <p className="text-sm text-danger mb-1 font-medium">Worst Department</p>
            <p className="text-xl text-white font-bold">Metrology (88%)</p>
            <p className="text-xs text-danger mt-2">Reason: Shortage of SIM Cards</p>
          </div>
        </div>
      )}
    </div>
  );
}

function StepBox({ name, value, status }: { name: string, value: string, status: 'success' | 'warning' | 'danger' }) {
  const bg = status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 
             status === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20' : 
             'bg-danger/10 border-danger/20';
  const text = status === 'success' ? 'text-emerald-400' : 
               status === 'warning' ? 'text-yellow-400' : 
               'text-danger';
  
  return (
    <div className={clsx("p-4 rounded-xl border flex flex-col items-center justify-center text-center", bg)}>
      <p className={clsx("text-sm mb-1 font-medium", text)}>{name}</p>
      <p className="text-xl text-white font-bold">{value}</p>
    </div>
  );
}

function WeeklyReport() {
  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    yAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], axisLabel: { color: '#a1a1aa' } },
    series: [
      {
        type: 'bar',
        data: [15000, 18500, 14200, 21000],
        itemStyle: { color: '#3b82f6', borderRadius: [0, 4, 4, 0] }
      }
    ]
  };
  return <div className="h-full"><h3 className="text-lg font-semibold text-white mb-4">Weekly Production</h3><ReactECharts option={options} style={{ height: '300px' }} /></div>;
}

function MonthlyReport() {
  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], axisLabel: { color: '#a1a1aa' } },
    yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    series: [{ type: 'line', data: [80, 85, 90, 82, 95, 100, 110, 105, 120, 115, 125, 130], itemStyle: { color: '#10b981' }, smooth: true, areaStyle: { opacity: 0.1 } }]
  };
  return <div className="h-full"><h3 className="text-lg font-semibold text-white mb-4">Monthly Comparison</h3><ReactECharts option={options} style={{ height: '300px' }} /></div>;
}

function YearlyReport() {
  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['2023', '2024', '2025', '2026', '2027'], axisLabel: { color: '#a1a1aa' } },
    yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    series: [{ type: 'bar', data: [1.2, 1.5, 1.8, 2.1, 2.5], itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] } }]
  };
  return <div className="h-full"><h3 className="text-lg font-semibold text-white mb-4">Yearly Growth (Millions)</h3><ReactECharts option={options} style={{ height: '300px' }} /></div>;
}

function StatBox({ label, value, color = "text-white" }: { label: string, value: string, color?: string }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className={clsx("text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}
