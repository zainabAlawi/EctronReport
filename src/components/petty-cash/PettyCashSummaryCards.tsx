'use client';

import React, { useState } from 'react';
import { Target, CheckCircle2, TrendingUp, AlertCircle, Plus, FileSpreadsheet, Users, BarChart3, Settings2 } from 'lucide-react';
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

  let statusColor = "text-[#10B981] dark:text-emerald-400";
  let statusBg = "bg-[#10B981]/10 border border-[#10B981]/20";
  if (isWarning) {
    statusColor = "text-amber-600 dark:text-yellow-400";
    statusBg = "bg-amber-500/10 dark:bg-yellow-400/10 border border-amber-500/20 dark:border-yellow-400/20";
  } else if (isCritical || isOverBudget) {
    statusColor = "text-danger";
    statusBg = "bg-danger/10 border border-danger/20";
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl glass border border-border dark:border-zinc-800/50 hover:border-[#14B8A6]/40 dark:hover:border-zinc-700/50 flex items-center gap-4 transition-all">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#3B82F6]/10 border border-[#3B82F6]/20 shrink-0">
            <Target className="w-6 h-6 text-[#3B82F6] dark:text-blue-400" />
          </div>
          <div>
            <p className="text-[#475569] dark:text-zinc-400 text-sm font-medium">Monthly Budget</p>
            <h3 className="text-2xl font-bold text-[#173B63] dark:text-white mt-0.5">OMR {summary.budget.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border dark:border-zinc-800/50 hover:border-[#14B8A6]/40 dark:hover:border-zinc-700/50 flex items-center gap-4 transition-all">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${statusBg}`}>
            <TrendingUp className={`w-6 h-6 ${statusColor}`} />
          </div>
          <div>
            <p className="text-[#475569] dark:text-zinc-400 text-sm font-medium">Spent This Month</p>
            <h3 className={`text-2xl font-bold mt-0.5 ${statusColor}`}>OMR {summary.spent.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border dark:border-zinc-800/50 hover:border-[#14B8A6]/40 dark:hover:border-zinc-700/50 flex items-center gap-4 transition-all">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOverBudget ? 'bg-danger/10 border border-danger/20' : 'bg-[#14B8A6]/10 dark:bg-emerald-400/10 border border-[#14B8A6]/20 dark:border-emerald-400/20'}`}>
            <CheckCircle2 className={`w-6 h-6 ${isOverBudget ? 'text-danger' : 'text-[#0F766E] dark:text-emerald-400'}`} />
          </div>
          <div>
            <p className="text-[#475569] dark:text-zinc-400 text-sm font-medium">Remaining Budget</p>
            <h3 className={`text-2xl font-bold mt-0.5 ${isOverBudget ? 'text-danger' : 'text-[#173B63] dark:text-white'}`}>OMR {summary.remaining.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</h3>
          </div>
        </div>

        <div className="p-5 rounded-2xl glass border border-border dark:border-zinc-800/50 hover:border-[#14B8A6]/40 dark:hover:border-zinc-700/50 flex items-center gap-4 transition-all">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[#6366F1]/10 dark:bg-purple-400/10 border border-[#6366F1]/20 dark:border-purple-400/20 shrink-0">
            <AlertCircle className="w-6 h-6 text-[#6366F1] dark:text-purple-400" />
          </div>
          <div>
            <p className="text-[#475569] dark:text-zinc-400 text-sm font-medium">Number of Expenses</p>
            <h3 className="text-2xl font-bold text-[#173B63] dark:text-white mt-0.5">{summary.expenseCount}</h3>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 btn-primary-gradient bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-900/20 cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          New Expense
        </button>
        <Link href="/petty-cash/settlement" className="flex items-center gap-2 bg-card hover:bg-[#F0FDFA] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#173B63] dark:text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-border dark:border-zinc-700 shadow-2xs">
          <Users className="w-5 h-5 text-[#0F766E] dark:text-blue-400" />
          Employee Settlement
        </Link>
        <Link href="/petty-cash/resources" className="flex items-center gap-2 bg-card hover:bg-[#F0FDFA] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#173B63] dark:text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-border dark:border-zinc-700 shadow-2xs">
          <Settings2 className="w-5 h-5 text-[#6366F1] dark:text-amber-400" />
          Resources (المصادر)
        </Link>
        <Link href="/petty-cash/analysis" className="flex items-center gap-2 bg-card hover:bg-[#F0FDFA] dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[#173B63] dark:text-white px-5 py-2.5 rounded-xl font-medium transition-colors border border-border dark:border-zinc-700 shadow-2xs">
          <BarChart3 className="w-5 h-5 text-[#0F766E] dark:text-purple-400" />
          Reports & Analysis
        </Link>
        <button className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 dark:bg-emerald-600/20 dark:hover:bg-emerald-600/30 text-emerald-700 dark:text-emerald-400 px-5 py-2.5 rounded-xl font-medium transition-colors border border-emerald-500/25 dark:border-emerald-500/30 ml-auto cursor-pointer">
          <FileSpreadsheet className="w-5 h-5" />
          Export Excel
        </button>
      </div>

      <NewExpenseModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
        }} 
      />
    </div>
  );
}
