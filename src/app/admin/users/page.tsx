import { createClient } from '@/lib/supabase-server';
import UsersTable from './UsersTable';
import { UserPlus, Download, Upload } from 'lucide-react';
import Link from 'next/link';

export default async function AdminUsersPage() {
  const supabase = await createClient();

  // Fetch all profiles along with their roles
  const { data: users, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      is_active,
      roles ( id, name )
    `)
    .order('created_at', { ascending: false });

  // Fetch all roles for the Add/Edit form
  const { data: roles } = await supabase.from('roles').select('*');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Users Management</h1>
          <p className="text-zinc-400 text-sm mt-1">Manage system users, roles, and permissions</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Link href="/api/admin/users/export-template" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Download Template
          </Link>
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors cursor-pointer">
            <Upload className="w-4 h-4" />
            Import Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" />
          </label>
        </div>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        <UsersTable initialUsers={users || []} roles={roles || []} />
      </div>
    </div>
  );
}
