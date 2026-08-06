'use client';

import { Search, Bell, User } from 'lucide-react';

export default function TopNav() {
  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 glass">
      <div className="flex items-center flex-1 max-w-2xl gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search by Date, Week, Month, Stage..." 
            className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/50 text-zinc-200 placeholder:text-zinc-500 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 rounded-full hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-100 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-card"></span>
        </button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium text-zinc-200">Admin User</span>
            <span className="text-xs text-emerald-400">Online</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
            A
          </div>
        </div>
      </div>
    </header>
  );
}
