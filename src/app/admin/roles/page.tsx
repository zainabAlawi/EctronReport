import { createClient } from '@/lib/supabase-server';
import RolesTable from './RolesTable';

export default async function RolesPage() {
  const supabase = await createClient();

  const { data: roles } = await supabase.from('roles').select('*').order('name');
  const { data: permissions } = await supabase.from('permissions').select('*').order('page_name');
  const { data: rolePermissions } = await supabase.from('role_permissions').select('*');

  // Map permissions to roles
  const rolesWithPerms = roles?.map(role => {
    return {
      ...role,
      permissions: rolePermissions
        ?.filter(rp => rp.role_id === role.id)
        .map(rp => rp.permission_id) || []
    };
  }) || [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Role Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Configure default access permissions for each user type</p>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border p-6 overflow-hidden">
        <RolesTable initialRoles={rolesWithPerms} allPermissions={permissions || []} />
      </div>
    </div>
  );
}
