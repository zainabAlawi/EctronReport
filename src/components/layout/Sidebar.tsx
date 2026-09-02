'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, 
  LayoutDashboard, 
  FileText, 
  UploadCloud, 
  BrainCircuit,
  Settings,
  LogOut,
  Users
} from 'lucide-react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase';

interface SidebarProps {
  userPermissions?: string[];
  roleName?: string;
}

export default function Sidebar({ userPermissions = [], roleName = '' }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract division from pathname (e.g. /water/dashboard -> water)
  const parts = pathname.split('/');
  const division = parts[1] && (parts[1] === 'water' || parts[1] === 'electricity') ? parts[1] : 'electricity'; // Default to electricity

  const hasPermission = (key: string) => {
    if (roleName === 'Admin') return true;
    return userPermissions.includes(key);
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: `${division}_dashboard` },
    { name: 'Reports', href: '/reports', icon: FileText, permission: `${division}_reports` },
    { name: 'Upload Data', href: '/upload', icon: UploadCloud, permission: `${division}_daily_entry` },
    { name: 'AI Analysis', href: '/analysis', icon: BrainCircuit, permission: `${division}_reports` },
  ];

  // Admin items
  if (roleName === 'Admin' || userPermissions.includes('admin_panel')) {
    navItems.push({ name: 'Admin Panel', href: '/admin/users', icon: Users, permission: 'admin_panel' });
  }

  const getHref = (baseHref: string) => {
    if (baseHref.startsWith('/admin')) return baseHref;
    return division ? `/${division}${baseHref}` : baseHref;
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col glass fixed left-0 top-0 z-40">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex gap-2">
          ECTRON Smart <span className="text-xs self-end mb-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">{division}</span>
        </h1>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;

          const href = getHref(item.href);
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 w-full transition-all duration-200">
          <Settings className="w-5 h-5" />
          Settings
        </button>
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-400 hover:text-danger hover:bg-danger/10 w-full transition-all duration-200 mt-1"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
