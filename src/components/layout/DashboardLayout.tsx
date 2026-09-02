import { createClient } from '@/lib/supabase-server';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  let profile = null;
  let roleName = '';
  let permissions: string[] = [];

  if (user) {
    // Fetch profile and role
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', user.id)
      .single();
      
    if (profileData) {
      profile = profileData;
      roleName = profileData.roles?.name || '';
      
      // Fetch role permissions
      if (profileData.role_id) {
        const { data: rolePerms } = await supabase
          .from('role_permissions')
          .select('permissions(page_key)')
          .eq('role_id', profileData.role_id);
          
        if (rolePerms) {
          permissions = rolePerms.map((rp: any) => rp.permissions.page_key);
        }
      }
      
      // Fetch user custom permissions
      const { data: userPerms } = await supabase
        .from('user_permissions')
        .select('permissions(page_key)')
        .eq('user_id', user.id);
        
      if (userPerms && userPerms.length > 0) {
        const customPerms = userPerms.map((up: any) => up.permissions.page_key);
        permissions = [...new Set([...permissions, ...customPerms])];
      }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userPermissions={permissions} roleName={roleName} />
      <div className="pl-64 flex flex-col min-h-screen">
        <TopNav profile={profile} roleName={roleName} />
        <main className="flex-1 p-6 relative">
          {/* Subtle background glow */}
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
