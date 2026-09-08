'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function TableDateRangePicker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [dateFilter, setDateFilter] = useState(searchParams.get('dateFilter') || 'today');
  const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
  const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');


  const updateUrl = (start: string, end: string, filter: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('startDate', start);
    params.set('endDate', end);
    params.set('dateFilter', filter);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const formatDate = (d: Date) => {
    const offset = d.getTimezoneOffset();
    const adjustedDate = new Date(d.getTime() - (offset * 60 * 1000));
    return adjustedDate.toISOString().split('T')[0];
  };

  const handleFilterChange = (val: string) => {
    setDateFilter(val);
    const today = new Date();
    
    let start = '';
    let end = '';

    if (val === 'today') {
      start = formatDate(today);
      end = formatDate(today);
    } else if (val === 'yesterday') {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      start = formatDate(d);
      end = formatDate(d);
    } else if (val === 'last_week') {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      start = formatDate(d);
      end = formatDate(today);
    } else if (val === 'this_month') {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      start = formatDate(d);
      end = formatDate(today);
    }

    if (val !== 'custom') {
      setStartDate(start);
      setEndDate(end);
      updateUrl(start, end, val);
    }
  };

  // Initialize dates on mount if missing
  useEffect(() => {
    if (!searchParams.get('startDate') && !searchParams.get('endDate')) {
      handleFilterChange('today');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartDateChange = (val: string) => {
    setStartDate(val);
    setDateFilter('custom');
    updateUrl(val, endDate, 'custom');
  };

  const handleEndDateChange = (val: string) => {
    setEndDate(val);
    setDateFilter('custom');
    updateUrl(startDate, val, 'custom');
  };

  return (
    <div className="flex items-center gap-3 bg-zinc-900/50 p-2 rounded-xl border border-zinc-800 flex-wrap w-fit mb-4">
      <select 
        value={dateFilter}
        onChange={e => handleFilterChange(e.target.value)}
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
          onChange={e => handleStartDateChange(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
        />
        <span className="text-zinc-500">-</span>
        <input 
          type="date" 
          value={endDate}
          onChange={e => handleEndDateChange(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700 text-zinc-300 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500/50"
        />
      </div>
    </div>
  );
}
