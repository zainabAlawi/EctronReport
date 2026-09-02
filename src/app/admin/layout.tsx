import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';
import Sidebar from '@/components/layout/Sidebar';
import TopNav from '@/components/layout/TopNav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  
  let profile = null;
  let roleName = '';
  let permissions: string[] = [];
  
  // Fetch profile and role
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*, roles(name)')
    .eq('id', user.id)
    .single();
    
  if (profileData) {
    profile = profileData;
    roleName = profileData.roles?.name || '';
    
    if (roleName !== 'Admin') {
      redirect('/electricity/dashboard'); // Restrict access
    }

    // Since it's Admin, we technically don't need to fetch permissions for the sidebar if Admin implies all, 
    // but we will fetch them anyway to keep the sidebar logic consistent.
    const { data: allPerms } = await supabase.from('permissions').select('page_key');
    if (allPerms) {
      permissions = allPerms.map(p => p.page_key);
    }
  } else {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userPermissions={permissions} roleName={roleName} />
      <div className="pl-64 flex flex-col min-h-screen">
        <TopNav profile={profile} roleName={roleName} />
        <main className="flex-1 p-6 relative">
          {/* Subtle background glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
