import { createClient } from '@/lib/supabase-server';
import ClientLayoutShell from './ClientLayoutShell';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/');
  }
  
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
    <ClientLayoutShell 
      userPermissions={permissions} 
      roleName={roleName} 
      profile={profile}
    >
      {children}
    </ClientLayoutShell>
  );
}
