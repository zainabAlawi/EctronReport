'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Calendar as CalendarIcon, Clock, Filter } from 'lucide-react';
import clsx from 'clsx';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardControls({ currentMode, currentDate, currentYear, division }: { currentMode: string, currentDate: string, currentYear: string, division: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const handleModeChange = (mode: 'daily' | 'yearly') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('mode', mode);
    router.push(`/${division}/dashboard?${params.toString()}`);
  };

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('date', date);
    router.push(`/${division}/dashboard?${params.toString()}`);
  };

  const handleYearChange = (year: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', year);
    router.push(`/${division}/dashboard?${params.toString()}`);
  };

  const years = ['2023', '2024', '2025', '2026', '2027'];

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3">
      {/* Mode Toggle */}
      <div className="flex p-1 bg-zinc-900/80 rounded-xl border border-zinc-800">
        <Link
          href={`/${division}/dashboard?mode=daily&date=${currentDate}&year=${currentYear}`}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
            currentMode === 'daily' ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <Clock className="w-4 h-4" />
          يومي (Daily)
        </Link>
        <Link
          href={`/${division}/dashboard?mode=yearly&date=${currentDate}&year=${currentYear}`}
          className={clsx(
            "px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all",
            currentMode === 'yearly' ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          <CalendarIcon className="w-4 h-4 text-white" />
          سنوي (Yearly)
        </Link>
      </div>

      {/* Date/Year Picker */}
      <div className="flex items-center gap-2">
        {currentMode === 'daily' ? (
          <div className="relative">
            <input 
              type="date" 
              value={currentDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100"
            />
          </div>
        ) : (
          <div className="relative">
             <select 
               value={currentYear}
               onChange={(e) => handleYearChange(e.target.value)}
               className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 text-sm rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500/50 appearance-none pr-10"
             >
               {years.map(y => <option key={y} value={y}>{y}</option>)}
             </select>
             <Filter className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}
      </div>
    </div>
  );
}
