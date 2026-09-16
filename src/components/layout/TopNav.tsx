'use client';

import { Search, Bell, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

interface TopNavProps {
  profile?: any;
  roleName?: string;
}

export default function TopNav({ profile, roleName }: TopNavProps) {
  const fullName = profile?.full_name || 'User';
  const displayInitial = fullName.charAt(0).toUpperCase();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  // Extract section from pathname
  const parts = pathname.split('/');
  const section = parts[1] || '';
  
  let sectionTitle = '';
  if (section === 'water') sectionTitle = 'المياه (Water Siconia)';
  else if (section === 'electricity') sectionTitle = 'الكهرباء (Electricity M212)';
  else if (section === 'electricity-ecs1100') sectionTitle = 'الكهرباء (Electricity ECS1100)';
  else if (section === 'admin') sectionTitle = 'لوحة الإدارة (Admin Panel)';
  else if (section === 'home') sectionTitle = 'الرئيسية (Home)';

  return (
    <header className="h-16 border-b border-border bg-card/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-30 glass print:hidden">
      <div className="flex items-center flex-1 max-w-3xl gap-6">
        {sectionTitle && (
          <h2 className="text-lg font-semibold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent whitespace-nowrap">
            {sectionTitle}
          </h2>
        )}
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
            <span className="text-sm font-medium text-zinc-200">{fullName}</span>
            <span className="text-xs text-blue-400">{roleName || 'User'}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-500 flex items-center justify-center text-white font-semibold shadow-inner">
            {displayInitial}
          </div>
          
          <button 
            onClick={handleLogout}
            className="ml-2 p-2 rounded-full hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-colors"
            title="تسجيل الخروج (Logout)"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
