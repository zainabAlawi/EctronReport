'use client';

import { useState } from 'react';
import { UserPlus, Trash2, Edit2, ShieldAlert, Upload, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import clsx from 'clsx';
import UserFormModal from './UserFormModal';
import { createClient } from '@/lib/supabase';
import * as xlsx from 'xlsx';

interface User {
  id: string;
  username: string;
  full_name: string;
  is_active: boolean;
  roles: { id: string; name: string } | null;
}

export default function UsersTable({ initialUsers, roles }: { initialUsers: User[], roles: any[] }) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  // Import State
  const [importSummary, setImportSummary] = useState<any>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    await fetch(`/api/admin/users?id=${userToDelete.id}`, { method: 'DELETE' });
    setUsers(users.filter(u => u.id !== userToDelete.id));
    setUserToDelete(null);
  };

  const handleBulkDelete = async () => {
    await fetch(`/api/admin/users/bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ ids: selectedUsers })
    });
    setUsers(users.filter(u => !selectedUsers.includes(u.id)));
    setSelectedUsers([]);
    setIsBulkDeleteModalOpen(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = xlsx.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = xlsx.utils.sheet_to_json(ws);

      let valid: any[] = [];
      let existCount = 0;
      let missingPassCount = 0;

      data.forEach((row: any) => {
        if (!row.password) {
          missingPassCount++;
          return;
        }
        
        // Check if user already exists locally
        if (users.find(u => u.username === row.username)) {
          existCount++;
          return;
        }

        valid.push(row);
      });

      setImportSummary({
        total: data.length,
        valid,
        existCount,
        missingPassCount
      });
      setIsImportModalOpen(true);
    };
    reader.readAsBinaryString(file);
    e.target.value = ''; // Reset input
  };

  const confirmImport = async () => {
    setIsImporting(true);
    const res = await fetch('/api/admin/users/import', {
      method: 'POST',
      body: JSON.stringify({ users: importSummary.valid })
    });
    const result = await res.json();
    
    if (result.success) {
      // Reload page to get new users
      window.location.reload();
    }
    setIsImporting(false);
    setIsImportModalOpen(false);
  };

  return (
    <>
      <div className="p-4 border-b border-border flex justify-between items-center bg-zinc-900/50">
        <div className="flex items-center gap-2">
          {selectedUsers.length > 0 && (
            <button 
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-danger/10 hover:bg-danger/20 text-danger text-sm font-medium transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete Selected ({selectedUsers.length})
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-sm font-medium transition-colors cursor-pointer border border-emerald-500/20">
            <Upload className="w-4 h-4" />
            Upload Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => { setEditingUser(null); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/80">
              <th className="py-3 px-4 w-12 text-center">
                <input 
                  type="checkbox" 
                  checked={selectedUsers.length > 0 && selectedUsers.length === users.length}
                  onChange={toggleSelectAll}
                  className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/50"
                />
              </th>
              <th className="py-3 px-4 text-sm font-semibold text-zinc-400">Name</th>
              <th className="py-3 px-4 text-sm font-semibold text-zinc-400">Username</th>
              <th className="py-3 px-4 text-sm font-semibold text-zinc-400">Role</th>
              <th className="py-3 px-4 text-sm font-semibold text-zinc-400 text-center">Status</th>
              <th className="py-3 px-4 text-sm font-semibold text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-zinc-500 text-sm">No users found.</td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors">
                <td className="py-3 px-4 text-center">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleSelect(user.id)}
                    className="rounded border-zinc-700 bg-zinc-800 text-blue-500 focus:ring-blue-500/50"
                  />
                </td>
                <td className="py-3 px-4 text-sm text-zinc-200">{user.full_name}</td>
                <td className="py-3 px-4 text-sm text-zinc-400">{user.username}</td>
                <td className="py-3 px-4 text-sm">
                  <span className={clsx(
                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                    user.roles?.name === 'Admin' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" :
                    user.roles?.name === 'Manager' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                    "bg-zinc-800 border-zinc-700 text-zinc-400"
                  )}>
                    {user.roles?.name || 'Unknown'}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-center">
                  <span className={clsx(
                    "px-2.5 py-1 rounded-full text-xs font-medium border",
                    user.is_active ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"
                  )}>
                    {user.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4 flex items-center justify-end gap-2">
                  <button 
                    onClick={() => { setEditingUser(user); setIsModalOpen(true); }}
                    className="p-1.5 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setUserToDelete(user)}
                    className="p-1.5 text-zinc-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <UserFormModal 
          user={editingUser} 
          roles={roles}
          onClose={() => setIsModalOpen(false)} 
          onSuccess={(newUser) => {
            if (editingUser) {
              setUsers(users.map(u => u.id === newUser.id ? newUser : u));
            } else {
              setUsers([newUser, ...users]);
            }
            setIsModalOpen(false);
          }} 
        />
      )}

      {/* Delete Single User Confirmation */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-warning mb-4">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="text-lg font-bold">تأكيد الحذف</h3>
            </div>
            <p className="text-zinc-300 text-sm mb-2">
              هل أنت متأكد من حذف المستخدم <strong>"{userToDelete.full_name}"</strong>؟
            </p>
            <p className="text-zinc-500 text-xs mb-6">
              لن يتمكن من تسجيل الدخول بعد الحذف.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-danger hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="flex items-center gap-3 text-danger mb-4">
              <Trash2 className="w-6 h-6" />
              <h3 className="text-lg font-bold">حذف جماعي</h3>
            </div>
            <p className="text-zinc-300 text-sm mb-6">
              سيتم حذف <strong>{selectedUsers.length}</strong> مستخدمين بشكل نهائي. هل أنت متأكد؟
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
              >
                إلغاء
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-lg bg-danger hover:bg-red-600 text-white text-sm font-medium transition-colors"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportModalOpen && importSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">ملخص استيراد المستخدمين</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 bg-zinc-950 rounded-lg border border-zinc-800">
                <span className="text-zinc-400 text-sm">إجمالي المستخدمين في الملف</span>
                <span className="font-bold text-white">{importSummary.total}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400 text-sm">صالح للإضافة</span>
                </div>
                <span className="font-bold text-emerald-400">{importSummary.valid.length}</span>
              </div>
              
              {importSummary.existCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-warning text-sm">موجود مسبقاً (تم التجاهل)</span>
                  </div>
                  <span className="font-bold text-warning">{importSummary.existCount}</span>
                </div>
              )}
              
              {importSummary.missingPassCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-danger/10 rounded-lg border border-danger/20">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-danger" />
                    <span className="text-danger text-sm">ينقصها كلمة مرور</span>
                  </div>
                  <span className="font-bold text-danger">{importSummary.missingPassCount}</span>
                </div>
              )}
            </div>

            <p className="text-zinc-300 text-sm mb-6 text-center">
              هل تريد إضافة الـ <strong>{importSummary.valid.length}</strong> مستخدم الصالحين؟
            </p>
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
                disabled={isImporting}
              >
                إلغاء
              </button>
              <button 
                onClick={confirmImport}
                disabled={importSummary.valid.length === 0 || isImporting}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium transition-colors"
              >
                {isImporting ? 'جاري الاستيراد...' : 'تأكيد الاستيراد'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
