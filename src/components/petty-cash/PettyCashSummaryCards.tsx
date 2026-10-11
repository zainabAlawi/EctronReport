'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, TrendingUp, AlertCircle, Plus, FileSpreadsheet, Users, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import NewExpenseModal from './NewExpenseModal';

interface PettyCashSummary {
  budget: number;
  spent: number;
  remaining: number;
  usedPercentage: number;
  expenseCount: number;
}

export default function PettyCashSummaryCards({ summary }: { summary: PettyCashSummary }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isWarning = summary.usedPercentage >= 70 && summary.usedPercentage <= 90;
  const isCritical = summary.usedPercentage > 90 && summary.usedPercentage <= 100;
  const isOverBudget = summary.usedPercentage > 100;

  let statusColor = "text-emerald-400";
  let statusBg = "bg-emerald-500/10";
  if (isWarning) {
    statusColor = "text-yellow-400";
    statusBg = "bg-yellow-500/10";
  } else if (isCritical || isOverBudget) {
    statusColor = "text-danger";
    statusBg = "bg-danger/10";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10">
            <Target className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Monthly Budget</p>
            <h3 className="text-2xl font-bold text-white mt-1">OMR {summary.budget.toLocaleString()}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusBg}`}>
            <TrendingUp className={`w-6 h-6 ${statusColor}`} />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Spent This Month</p>
            <h3 className={`text-2xl font-bold mt-1 ${statusColor}`}>OMR {summary.spent.toLocaleString()}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOverBudget ? 'bg-danger/10' : 'bg-emerald-500/10'}`}>
            <CheckCircle2 className={`w-6 h-6 ${isOverBudget ? 'text-danger' : 'text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Remaining Budget</p>
            <h3 className={`text-2xl font-bold mt-1 ${isOverBudget ? 'text-danger' : 'text-white'}`}>OMR {summary.remaining.toLocaleString()}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-purple-500/10">
            <AlertCircle className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <p className="text-zinc-400 text-sm font-medium">Number of Expenses</p>
            <h3 className="text-2xl font-bold text-white mt-1">{summary.expenseCount}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Expense
        </button>
        <Link href="/petty-cash/settlement" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-zinc-700">
          <Users className="w-5 h-5" />
          Employee Settlement
        </Link>
        <Link href="/petty-cash/analysis" className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-zinc-700">
          <BarChart3 className="w-5 h-5" />
          Reports & Analysis
        </Link>
        <button className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 px-5 py-2.5 rounded-xl font-medium transition-colors border border-emerald-500/30 ml-auto">
          <FileSpreadsheet className="w-5 h-5" />
          Export Excel
        </button>
      </div>

      <NewExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          // Revalidation is handled by server action, just close
          setIsModalOpen(false);
        }} 
      />
    </div>
  );
}
