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
  Users,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react';
import clsx from 'clsx';
import { createClient } from '@/lib/supabase';

interface SidebarProps {
  userPermissions?: string[];
  roleName?: string;
  isCollapsed?: boolean;
  setIsCollapsed?: (val: boolean) => void;
}

export default function Sidebar({ userPermissions = [], roleName = '', isCollapsed = false, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  // Extract division from pathname (e.g. /water/dashboard -> water)
  const parts = pathname.split('/');
  const division = parts[1] && (parts[1] === 'water' || parts[1] === 'electricity' || parts[1] === 'electricity-ecs1100') ? parts[1] : 'electricity'; 

  const hasPermission = (key: string) => {
    if (roleName === 'Admin') return true;
    return userPermissions.includes(key);
  };

  const isHome = pathname === '/home' || pathname === '/coming-soon';
  
  const navItems = [
    { name: 'Home (الرئيسية)', href: '/home', icon: Home, showAlways: true },
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
    if (baseHref.startsWith('/admin') || baseHref === '/home') return baseHref;
    return division ? `/${division}${baseHref}` : baseHref;
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <aside className={clsx(
      "h-screen bg-card border-r border-border flex flex-col glass fixed left-0 top-0 z-40 print:hidden transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={clsx("h-16 flex items-center border-b border-border relative transition-all duration-300", isCollapsed ? "justify-center px-0" : "px-6")}>
        {!isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent flex gap-2">
            ECTRON Smart 
            {!isHome && !pathname.startsWith('/admin') && (
              <span className="text-xs self-end mb-1 px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 capitalize">
                {division === 'water' ? 'Siconia' : division === 'electricity-ecs1100' ? 'ECS1100' : 'M212'}
              </span>
            )}
          </h1>
        )}
        {isCollapsed && (
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            EC
          </h1>
        )}
        <button 
          onClick={() => setIsCollapsed?.(!isCollapsed)}
          className="absolute -right-3 top-5 bg-zinc-800 border border-zinc-700 rounded-full p-1 text-zinc-400 hover:text-white hover:bg-zinc-700 z-50 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(item.permission)) return null;
          if (isHome && !item.showAlways && !item.href.startsWith('/admin')) return null;

          const href = getHref(item.href);
          const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={href}
              title={isCollapsed ? item.name : undefined}
              className={clsx(
                'flex items-center rounded-lg text-sm font-medium transition-all duration-200',
                isCollapsed ? 'justify-center w-12 h-12 mx-auto px-0' : 'gap-3 px-3 py-2.5',
                isActive 
                  ? 'bg-blue-500/10 text-blue-400' 
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className={clsx("p-4 border-t border-border flex flex-col gap-1 transition-all duration-300", isCollapsed ? "items-center" : "")}>
        <button 
          title={isCollapsed ? "Settings" : undefined}
          className={clsx(
            "flex items-center rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-all duration-200",
            isCollapsed ? "justify-center w-12 h-12 px-0" : "gap-3 px-3 py-2.5 w-full"
          )}
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Logout" : undefined}
          className={clsx(
            "flex items-center rounded-lg text-sm font-medium text-zinc-400 hover:text-danger hover:bg-danger/10 transition-all duration-200",
            isCollapsed ? "justify-center w-12 h-12 px-0" : "gap-3 px-3 py-2.5 w-full"
          )}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
