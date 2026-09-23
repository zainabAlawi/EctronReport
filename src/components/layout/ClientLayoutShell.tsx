'use client';

import { useState } from 'react';
import clsx from 'clsx';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default function ClientLayoutShell({ 
  children, 
  userPermissions, 
  roleName, 
  profile 
}: { 
  children: React.ReactNode, 
  userPermissions: string[], 
  roleName: string, 
  profile: any 
}) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar 
        userPermissions={userPermissions} 
        roleName={roleName} 
        isCollapsed={isCollapsed} 
        setIsCollapsed={setIsCollapsed} 
      />
      <div className={clsx(
        "print:pl-0 flex flex-col min-h-screen transition-all duration-300",
        isCollapsed ? "pl-20" : "pl-64"
      )}>
        <TopNav profile={profile} roleName={roleName} />
        <main className="flex-1 p-6 relative">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
