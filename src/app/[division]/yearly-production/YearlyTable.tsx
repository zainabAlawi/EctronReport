'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, FileSpreadsheet } from 'lucide-react';

interface DailyData {
  date: string;
  assembly: number;
  perso: number;
  lasering: number;
  packaging: number;
  cartons: number;
  palets: number;
}

export default function YearlyTable({ data, division }: { data: DailyData[], division: string }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(d => d.date.includes(searchTerm));

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Yearly Production");
    XLSX.writeFile(workbook, `${division}_yearly_production.xlsx`);
  };

  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${division}_yearly_production.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <input 
          type="text" 
          placeholder="Filter by date (YYYY-MM-DD)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-xl p-3 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
        />

        <div className="flex gap-3">
          <button 
            onClick={exportToExcel}
            className="px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 font-medium flex items-center gap-2 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button 
            onClick={exportToCSV}
            className="px-4 py-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 font-medium flex items-center gap-2 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-400 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Date</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Assembly</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Perso</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Lasering</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Packaging</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Cartons</th>
                <th className="px-6 py-4 font-medium whitespace-nowrap">Pallets</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-zinc-500">No data found.</td>
                </tr>
              ) : (
                filteredData.map((row) => (
                  <tr key={row.date} className="bg-transparent hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{row.date}</td>
                    <td className="px-6 py-4 text-zinc-300">{row.assembly}</td>
                    <td className="px-6 py-4 text-zinc-300">{row.perso}</td>
                    <td className="px-6 py-4 text-zinc-300">{row.lasering}</td>
                    <td className="px-6 py-4 text-zinc-300">{row.packaging}</td>
                    <td className="px-6 py-4 text-zinc-300">{row.cartons}</td>
                    <td className="px-6 py-4 text-zinc-300">{row.palets}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
