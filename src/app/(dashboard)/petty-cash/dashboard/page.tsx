import React from 'react';
import { createClient } from '@/lib/supabase-server';
import PettyCashSummaryCards from '@/components/petty-cash/PettyCashSummaryCards';
import ExpenseTable from '@/components/petty-cash/ExpenseTable';

export default async function PettyCashDashboard() {
  const supabase = await createClient();
  
  // Calculate current month's dates
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  let spent = 0;
  let expenseCount = 0;

  let expensesData: any[] = [];
  let categoriesResp: any = { data: [] };
  let profilesResp: any = { data: [] };
  let projectsResp: any = { data: [] };

  try {
    [categoriesResp, profilesResp, projectsResp] = await Promise.all([
      supabase.from('petty_cash_categories').select('id, name').eq('active', true).order('name'),
      supabase.from('profiles').select('id, full_name, username').eq('is_active', true).order('full_name'),
      supabase.from('projects').select('id, name').eq('active', true).order('name')
    ]);

    const { data: expenses, error } = await supabase
      .from('petty_cash_expenses')
      .select(`
        id, 
        expense_no, 
        expense_date, 
        request_description, 
        category_id,
        employee_id,
        project_id,
        amount, 
        attachment_url,
        petty_cash_categories (name),
        profiles (full_name, username),
        projects (name)
      `)
      .gte('expense_date', startOfMonth)
      .lte('expense_date', endOfMonth)
      .order('expense_date', { ascending: true }); // Oldest to newest as requested

    if (!error && expenses) {
      spent = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
      expenseCount = expenses.length;
      expensesData = expenses;
    }
  } catch (e) {
    console.error('Error fetching petty cash expenses:', e);
  }

  const budget = 1000;
  const remaining = Math.max(0, budget - spent);
  const usedPercentage = (spent / budget) * 100;

  const summary = {
    budget,
    spent,
    remaining,
    usedPercentage,
    expenseCount
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Petty Cash Dashboard</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage monthly budget, expenses, and employee settlements</p>
        </div>
      </div>
      
      <PettyCashSummaryCards summary={summary} />

      <div className="glass rounded-2xl p-6 border border-border mt-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Expenses ({new Date().toLocaleString('default', { month: 'long' })})</h2>
        </div>
        
        <ExpenseTable expensesData={expensesData} options={{ categories: categoriesResp.data || [], profiles: profilesResp.data || [], projects: projectsResp.data || [] }} />
      </div>
    </div>
  );
}
