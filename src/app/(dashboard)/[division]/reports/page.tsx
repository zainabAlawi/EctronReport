'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Download, Printer } from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import ProductionTable from '@/components/dashboard/ProductionTable';

import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const TABS = ['Daily', 'Weekly', 'Monthly', 'Yearly'];

export default function ReportsPage() {
  const params = useParams();
  const division = params.division as string;
  const [activeTab, setActiveTab] = useState('Daily');
  const [dbData, setDbData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());

  const [dateFilter, setDateFilter] = useState('today');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const years = ['2023', '2024', '2025', '2026', '2027'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    async function fetchData() {
      const targetTable = division === 'water' ? 'water_daily_production' : 'electricity_daily_production';
      const { data, error } = await supabase.from(targetTable).select('*');
      if (data) setDbData(data);
    }
    fetchData();
  }, [division]);

  useEffect(() => {
    const today = new Date();
    
    // Helper to format date as YYYY-MM-DD local time correctly
    const formatDate = (d: Date) => {
      const offset = d.getTimezoneOffset();
      const adjustedDate = new Date(d.getTime() - (offset*60*1000));
      return adjustedDate.toISOString().split('T')[0];
    };

    if (dateFilter === 'today') {
      const str = formatDate(today);
      setStartDate(str);
      setEndDate(str);
    } else if (dateFilter === 'yesterday') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      const str = formatDate(d);
      setStartDate(str);
      setEndDate(str);
    } else if (dateFilter === 'last_week') {
      const start = new Date(today);
      start.setDate(start.getDate() - 7);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    } else if (dateFilter === 'this_month') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(start));
      setEndDate(formatDate(today));
    }
  }, [dateFilter]);

  const [latestTarget, setLatestTarget] = useState(640);

  useEffect(() => {
    async function fetchHistoryTarget() {
      const dateToUse = endDate || new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('production_history')
        .select('summary')
        .eq('division', division)
        .eq('date', dateToUse)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0 && data[0].summary?.target) {
        setLatestTarget(data[0].summary.target);
      }
    }
    fetchHistoryTarget();
  }, [division, endDate]);

  const dailyData = dbData.filter(d => {
    if (!startDate || !endDate) return false;
    return d.date >= startDate && d.date <= endDate;
  });
  
  const shiftTotals = {
    shift1: {} as any,
    shift2: {} as any,
    shift3: {} as any,
    official: {} as any
  };

  const todayTotals = { assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0, cards: 0, insolation: 0, radiation_frequency: 0, calibration: 0, multy_test: 0, metrology: 0 };
  
  dailyData.forEach(d => {
    // Totals for summary and steps efficiency
    todayTotals.assembly += (d.assembly || 0);
    todayTotals.perso += (d.perso || 0);
    todayTotals.lasering += (d.lasering || 0);
    todayTotals.packaging += (d.packaging || 0);
    todayTotals.cartons += (d.cartons || 0);
    todayTotals.palets += (d.palets || 0);
    todayTotals.cards += (d.cards || 0);
    todayTotals.insolation += (d.insolation || 0);
    todayTotals.radiation_frequency += (d.radiation_frequency || 0);
    todayTotals.calibration += (d.calibration || 0);
    todayTotals.multy_test += (d.multy_test || 0);
    todayTotals.metrology += (d.metrology || 0);

    // Totals per shift for ProductionTable
    const s = d.shift || 'official';
    if (shiftTotals[s as keyof typeof shiftTotals]) {
      const targetShift = shiftTotals[s as keyof typeof shiftTotals];
      targetShift.assembly = (targetShift.assembly || 0) + (d.assembly || 0);
      targetShift.perso = (targetShift.perso || 0) + (d.perso || 0);
      targetShift.lasering = (targetShift.lasering || 0) + (d.lasering || 0);
      targetShift.packaging = (targetShift.packaging || 0) + (d.packaging || 0);
      targetShift.cartons = (targetShift.cartons || 0) + (d.cartons || 0);
      targetShift.palets = (targetShift.palets || 0) + (d.palets || 0);
      targetShift.cards = (targetShift.cards || 0) + (d.cards || 0);
      targetShift.insolation = (targetShift.insolation || 0) + (d.insolation || 0);
      targetShift.radiation_frequency = (targetShift.radiation_frequency || 0) + (d.radiation_frequency || 0);
      targetShift.calibration = (targetShift.calibration || 0) + (d.calibration || 0);
      targetShift.multy_test = (targetShift.multy_test || 0) + (d.multy_test || 0);
      targetShift.metrology = (targetShift.metrology || 0) + (d.metrology || 0);
    }
  });

  // Calculate total target across the date range
  const d1 = new Date(startDate);
  const d2 = new Date(endDate);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
  const rangeTarget = latestTarget * (diffDays || 1);

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

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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

        {activeTab === 'Daily' && (
          <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 flex-wrap">
            <select 
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
            >
              <option value="today">اليوم (Today)</option>
              <option value="yesterday">أمس (Yesterday)</option>
              <option value="last_week">الأسبوع الأخير (Last Week)</option>
              <option value="this_month">هذا الشهر (This Month)</option>
              <option value="custom">تحديد فترة (Custom)</option>
            </select>

            <div className="flex items-center gap-2">
              <input 
                type="date" 
                value={startDate}
                onChange={e => {
                  setStartDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
              />
              <span className="text-zinc-500">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={e => {
                  setEndDate(e.target.value);
                  setDateFilter('custom');
                }}
                className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
              />
            </div>
          </div>
        )}

        {(activeTab === 'Weekly' || activeTab === 'Monthly') && (
          <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800">
            <select 
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            {activeTab === 'Weekly' && (
              <select 
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
              >
                {months.map((m, i) => <option key={i} value={i.toString()}>{m}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6 border border-border min-h-[400px]">
        {activeTab === 'Daily' && <DailyReport division={division} totals={todayTotals} date={startDate === endDate ? startDate : `${startDate} to ${endDate}`} target={rangeTarget} shiftData={shiftTotals} />}
        {activeTab === 'Weekly' && <WeeklyReport dbData={dbData} division={division} year={selectedYear} month={selectedMonth} />}
        {activeTab === 'Monthly' && <MonthlyReport dbData={dbData} division={division} year={selectedYear} />}
        {activeTab === 'Yearly' && <YearlyReport dbData={dbData} division={division} />}
      </div>
    </div>
  );
}

function DailyReport({ division, totals, date, target, shiftData }: { division: string, totals: any, date: string, target: number, shiftData: any }) {
  const isWater = division === 'water';
  
  const achieved = isWater ? totals.packaging : totals.multy_test;
  const remaining = Math.max(0, target - achieved);
  const eff = target > 0 ? ((achieved / target) * 100).toFixed(1) : '0';

  const formatStep = (val: number) => {
    const v = target > 0 ? (val / target) * 100 : 0;
    return `${v.toFixed(1)}%`;
  };

  const getStatus = (val: number) => {
    const v = target > 0 ? (val / target) * 100 : 0;
    if (v >= 90) return 'success';
    if (v >= 50) return 'warning';
    return 'danger';
  };

  return (
    <div className="flex flex-col gap-6">
      <h3 className="text-lg font-semibold text-white mb-2">Daily Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatBox label="Today's Target" value={target.toLocaleString()} />
        <StatBox label="Production" value={achieved.toLocaleString()} color="text-emerald-400" />
        <StatBox label="Remaining" value={remaining.toLocaleString()} color="text-yellow-400" />
        <StatBox label="Efficiency" value={`${eff}%`} />
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm text-zinc-400 mb-3 font-medium">Production Steps Efficiency</h4>
        {isWater ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <StepBox name="Assembly" value={formatStep(totals.assembly)} status={getStatus(totals.assembly)} />
            <StepBox name="Perso" value={formatStep(totals.perso)} status={getStatus(totals.perso)} />
            <StepBox name="Lasering" value={formatStep(totals.lasering)} status={getStatus(totals.lasering)} />
            <StepBox name="Packaging" value={formatStep(totals.packaging)} status={getStatus(totals.packaging)} />
            <StepBox name="Cartons" value={formatStep(totals.cartons)} status={getStatus(totals.cartons)} />
            <StepBox name="Pallets" value={formatStep(totals.palets)} status={getStatus(totals.palets)} />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <StepBox name="Cards" value={formatStep(totals.cards)} status={getStatus(totals.cards)} />
            <StepBox name="Assembly" value={formatStep(totals.assembly)} status={getStatus(totals.assembly)} />
            <StepBox name="Insolation" value={formatStep(totals.insolation)} status={getStatus(totals.insolation)} />
            <StepBox name="Radiation Freq" value={formatStep(totals.radiation_frequency)} status={getStatus(totals.radiation_frequency)} />
            <StepBox name="Calibration" value={formatStep(totals.calibration)} status={getStatus(totals.calibration)} />
            <StepBox name="Multy test" value={formatStep(totals.multy_test)} status={getStatus(totals.multy_test)} />
            <StepBox name="Metrology" value={formatStep(totals.metrology)} status={getStatus(totals.metrology)} />
            <StepBox name="Perso" value={formatStep(totals.perso)} status={getStatus(totals.perso)} />
          </div>
        )}
      </div>
      
      <div className="mt-8">
        <h4 className="text-sm text-zinc-400 mb-3 font-medium">Detailed Production Table</h4>
        <ProductionTable 
          type={division as 'water' | 'electricity'} 
          dynamicWaterData={shiftData}
          dateRangeDisplay={date.includes('to') ? date : undefined}
          date={!date.includes('to') ? date : undefined}
          target={target}
        />
      </div>
    </div>
  );
}

function StepBox({ name, value, status }: { name: string, value: string, status: 'success' | 'warning' | 'danger' }) {
  const bg = status === 'success' ? 'bg-emerald-500/10 border-emerald-500/20' : 
             status === 'warning' ? 'bg-zinc-800/50 border-zinc-700' : 
             'bg-danger/10 border-danger/20';
  const text = status === 'success' ? 'text-emerald-400' : 
               status === 'warning' ? 'text-zinc-400' : 
               'text-danger';
  
  return (
    <div className={clsx("p-4 rounded-xl border flex flex-col items-center justify-center text-center", bg)}>
      <p className={clsx("text-sm mb-1 font-medium", text)}>{name}</p>
      <p className="text-xl text-white font-bold">{value}</p>
    </div>
  );
}

function WeeklyReport({ dbData, division, year, month }: { dbData: any[], division: string, year: string, month: string }) {
  const isWater = division === 'water';
  const getDailyTotal = (d: any) => isWater ? (d.packaging || 0) : (d.multy_test || 0);
  
  const data = [0, 0, 0, 0];
  dbData.forEach(d => {
    if (d.date) {
      const dt = new Date(d.date);
      if (dt.getFullYear().toString() === year && dt.getMonth().toString() === month) {
        const day = dt.getDate();
        if (day <= 7) data[0] += getDailyTotal(d);
        else if (day <= 14) data[1] += getDailyTotal(d);
        else if (day <= 21) data[2] += getDailyTotal(d);
        else data[3] += getDailyTotal(d);
      }
    }
  });

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = months[parseInt(month)];

  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Week 1 (1-7)', 'Week 2 (8-14)', 'Week 3 (15-21)', 'Week 4 (22+)'], axisLabel: { color: '#a1a1aa' } },
    yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    series: [
      {
        type: 'bar',
        data: data,
        label: { show: true, position: 'top', color: '#fff' },
        itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }
      }
    ]
  };
  return <div className="h-full"><h3 className="text-lg font-semibold text-white mb-4">Weekly Production - {monthName} {year}</h3><ReactECharts option={options} style={{ height: '300px' }} /></div>;
}

function MonthlyReport({ dbData, division, year }: { dbData: any[], division: string, year: string }) {
  const isWater = division === 'water';
  const getDailyTotal = (d: any) => isWater ? (d.packaging || 0) : (d.multy_test || 0);
  
  const data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  dbData.forEach(d => {
    if (d.date && new Date(d.date).getFullYear().toString() === year) {
      const monthIndex = new Date(d.date).getMonth();
      data[monthIndex] += getDailyTotal(d);
    }
  });

  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], axisLabel: { color: '#a1a1aa' } },
    yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    series: [{ type: 'line', data: data, label: { show: true, position: 'top', color: '#fff' }, itemStyle: { color: '#10b981' }, smooth: true, areaStyle: { opacity: 0.1 } }]
  };
  return <div className="h-full"><h3 className="text-lg font-semibold text-white mb-4">Monthly Production - {year}</h3><ReactECharts option={options} style={{ height: '300px' }} /></div>;
}

function YearlyReport({ dbData, division }: { dbData: any[], division: string }) {
  const isWater = division === 'water';
  const getDailyTotal = (d: any) => isWater ? (d.packaging || 0) : (d.multy_test || 0);

  const startYear = isWater ? 2025 : 2023;
  const numYears = 5;
  const data = Array(numYears).fill(0);
  const yearsLabels = Array.from({ length: numYears }, (_, i) => (startYear + i).toString());

  dbData.forEach(d => {
    if (d.date) {
      const year = new Date(d.date).getFullYear();
      const index = year - startYear;
      if (index >= 0 && index < numYears) {
        data[index] += getDailyTotal(d);
      }
    }
  });

  const options = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: yearsLabels, axisLabel: { color: '#a1a1aa' } },
    yAxis: { type: 'value', axisLabel: { color: '#a1a1aa' }, splitLine: { lineStyle: { color: '#27272a' } } },
    series: [{ type: 'bar', data: data, label: { show: true, position: 'top', color: '#fff' }, itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] } }]
  };
  return <div className="h-full"><h3 className="text-lg font-semibold text-white mb-4">Yearly Growth</h3><ReactECharts option={options} style={{ height: '300px' }} /></div>;
}

function StatBox({ label, value, color = "text-white" }: { label: string, value: string | number, color?: string }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800">
      <p className="text-sm text-zinc-400 mb-1">{label}</p>
      <p className={clsx("text-2xl font-bold", color)}>{value}</p>
    </div>
  );
}
