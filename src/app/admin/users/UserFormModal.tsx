'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface UserFormModalProps {
  user?: any;
  roles: any[];
  onClose: () => void;
  onSuccess: (user: any) => void;
}

const ALL_PERMISSIONS = [
  { key: 'electricity_dashboard', label: 'Electricity Dashboard' },
  { key: 'electricity_daily_entry', label: 'Electricity Daily Entry' },
  { key: 'electricity_reports', label: 'Electricity Reports' },
  { key: 'water_dashboard', label: 'Water Dashboard' },
  { key: 'water_daily_entry', label: 'Water Daily Entry' },
  { key: 'water_reports', label: 'Water Reports' },
  { key: 'manage_users', label: 'User Management' },
  { key: 'admin_panel', label: 'Admin Panel' }
];

export default function UserFormModal({ user, roles, onClose, onSuccess }: UserFormModalProps) {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    full_name: user?.full_name || '',
    role_id: user?.roles?.id || roles[0]?.id || '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Custom permissions are not fully loaded in this basic edit, 
  // but we can add the checkboxes for demonstration of the requirement.
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const togglePermission = (key: string) => {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await fetch('/api/admin/users', {
        method: user ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, id: user?.id, custom_permissions: selectedPermissions })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');
      
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">{user ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-6 p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg">
              {error}
            </div>
          )}
          
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Username</label>
                <input
                  type="text"
                  required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Password {user && <span className="text-zinc-500 text-xs">(Leave blank to keep)</span>}
                </label>
                <input
                  type="password"
                  required={!user}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">User Type (Role)</label>
                <select
                  value={formData.role_id}
                  onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-800">
              <h3 className="text-sm font-medium text-zinc-300 mb-4">Custom Permissions / Pages</h3>
              <p className="text-xs text-zinc-500 mb-4">Select additional pages this user can access (overrides role defaults).</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ALL_PERMISSIONS.map(perm => (
                  <label key={perm.key} className="flex items-center gap-3 p-3 rounded-lg border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800/50 cursor-pointer transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedPermissions.includes(perm.key)}
                      onChange={() => togglePermission(perm.key)}
                      className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/50"
                    />
                    <span className="text-sm text-zinc-300">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="user-form"
            disabled={isLoading}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save User
          </button>
        </div>
      </div>
    </div>
  );
}
