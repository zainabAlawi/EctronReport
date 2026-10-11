'use client';

import React, { useState } from 'react';
import { Paperclip, X, Edit, Loader2, AlertTriangle, Save, XCircle } from 'lucide-react';
import { updateExpense } from '@/app/(dashboard)/petty-cash/actions/pettyCashActions';

interface ExpenseTableProps {
  expensesData: any[];
  options?: {
    categories: any[];
    profiles: any[];
    projects: any[];
  };
}

export default function ExpenseTable({ expensesData, options }: ExpenseTableProps) {
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const handleRowDoubleClick = (exp: any) => {
    setSelectedExpense(exp);
    setIsEditing(false);
    setError(null);
  };

  const closeDetails = () => {
    if (loading) return;
    setSelectedExpense(null);
    setIsEditing(false);
    setError(null);
  };

  const startEditing = () => {
    setDate(selectedExpense.expense_date || '');
    setDescription(selectedExpense.request_description || '');
    setCategoryId(selectedExpense.category_id || '');
    setEmployeeId(selectedExpense.employee_id || '');
    setAmount(selectedExpense.amount?.toString() || '');
    setProjectId(selectedExpense.project_id || '');
    setAttachmentName(selectedExpense.attachment_url ? 'Existing Attachment (Cannot preview edit yet)' : '');
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!options) return;
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('expense_date', date);
    formData.append('request_description', description);
    formData.append('category_id', categoryId);
    formData.append('employee_id', employeeId);
    formData.append('amount', amount);
    if (projectId) formData.append('project_id', projectId);
    
    const input = document.getElementById('edit-file-upload') as HTMLInputElement;
    let successMessage = 'تم حفظ البيانات بنجاح.';

    if (input && input.files && input.files.length > 0) {
      const originalFile = input.files[0];
      let fileToUpload = null;
      
      if (originalFile.type.startsWith('image/')) {
        try {
          const imageCompression = (await import('browser-image-compression')).default;
          const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
          fileToUpload = await imageCompression(originalFile, options);
          
          if (fileToUpload.size < originalFile.size) {
            const origSize = (originalFile.size / 1024 / 1024).toFixed(2);
            const compSize = (fileToUpload.size / 1024 / 1024).toFixed(2);
            successMessage = `تم تقليل حجم الملف المرفق من ${origSize}MB إلى ${compSize}MB وتم حفظ البيانات بنجاح.`;
          }
        } catch (error) {
          console.error("Error compressing image", error);
          fileToUpload = originalFile;
        }
      } else {
        fileToUpload = originalFile;
        if (originalFile.type === 'application/pdf') {
          successMessage = `تم حفظ البيانات بنجاح. (ملاحظة: تم حفظ ملف الـ PDF بحجمه الأصلي ${(originalFile.size / 1024 / 1024).toFixed(2)}MB)`;
        }
      }
      
      formData.append('attachment', fileToUpload || originalFile, (fileToUpload || originalFile).name);
    }

    try {
      const result = await updateExpense(selectedExpense.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        alert(successMessage);
        const updatedRow = result.data?.[0];
        // Update the local selectedExpense so it reflects immediately without closing
        setSelectedExpense({
          ...selectedExpense,
          expense_date: date,
          request_description: description,
          category_id: categoryId,
          employee_id: employeeId,
          amount: amount,
          project_id: projectId,
          attachment_url: updatedRow?.attachment_url || selectedExpense.attachment_url,
          petty_cash_categories: { name: options.categories.find(c => c.id === categoryId)?.name },
          profiles: { full_name: options.profiles.find(p => p.id === employeeId)?.full_name || options.profiles.find(p => p.id === employeeId)?.username },
          projects: { name: options.projects.find(p => p.id === projectId)?.name }
        });
        closeDetails();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-800/50 uppercase">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Expense No</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3 text-center">Attachment</th>
              <th className="px-4 py-3 rounded-tr-lg">Amount</th>
            </tr>
          </thead>
          <tbody>
            {expensesData.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500 border-b border-zinc-800/50">
                  No expenses found for this month.
                </td>
              </tr>
            ) : (
              expensesData.map((exp) => (
                <tr 
                  key={exp.id} 
                  onDoubleClick={() => handleRowDoubleClick(exp)}
                  className="border-b border-zinc-800/50 hover:bg-zinc-800/40 transition-colors cursor-pointer select-none"
                  title="Double click to view details"
                >
                  <td className="px-4 py-3 font-medium text-blue-400">{exp.expense_no}</td>
                  <td className="px-4 py-3 text-zinc-300">{exp.expense_date}</td>
                  <td className="px-4 py-3 text-white max-w-xs truncate">{exp.request_description}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    <span className="bg-zinc-800 px-2 py-1 rounded text-xs whitespace-nowrap">
                      {exp.petty_cash_categories?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">{exp.profiles?.full_name || exp.profiles?.username || 'N/A'}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{exp.projects?.name || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    {exp.attachment_url ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(exp.attachment_url, '_blank');
                        }}
                        className="p-1 hover:bg-zinc-800 rounded transition-colors"
                        title="View Attachment"
                      >
                        <Paperclip className="w-4 h-4 text-blue-400 inline-block" />
                      </button>
                    ) : (
                      <span className="text-zinc-600">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-bold text-white whitespace-nowrap">OMR {Number(exp.amount).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Details Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeDetails}>
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">
                {isEditing ? `Edit Expense: ${selectedExpense.expense_no}` : `Expense Details: ${selectedExpense.expense_no}`}
              </h2>
              <button onClick={closeDetails} disabled={loading} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              {error && (
                <div className="p-4 rounded-xl flex items-start gap-3 bg-danger/10 border border-danger/20 text-danger">
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="font-medium text-sm">{error}</p>
                </div>
              )}

              {isEditing ? (
                // EDIT MODE
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Date <span className="text-danger">*</span></label>
                      <input 
                        type="date" 
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Amount (OMR) <span className="text-danger">*</span></label>
                      <input 
                        type="number" 
                        required
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Request Description <span className="text-danger">*</span></label>
                    <textarea 
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-y"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Category <span className="text-danger">*</span></label>
                      <select 
                        required
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Category</option>
                        {options?.categories.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Employee <span className="text-danger">*</span></label>
                      <select 
                        required
                        value={employeeId}
                        onChange={e => setEmployeeId(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">Select Employee</option>
                        {options?.profiles.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project Name</label>
                      <select 
                        value={projectId}
                        onChange={e => setProjectId(e.target.value)}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="">None / N/A</option>
                        {options?.projects.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Replace Attachment (Optional)</label>
                    <div 
                      className="w-full h-24 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                      onClick={() => document.getElementById('edit-file-upload')?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                          const file = e.dataTransfer.files[0];
                          const input = document.getElementById('edit-file-upload') as HTMLInputElement;
                          if (input) {
                            const dataTransfer = new DataTransfer();
                            dataTransfer.items.add(file);
                            input.files = dataTransfer.files;
                            setAttachmentName(file.name);
                          }
                        }
                      }}
                    >
                      <input 
                        id="edit-file-upload" 
                        type="file" 
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            setAttachmentName(e.target.files[0].name);
                          }
                        }}
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-medium px-4 text-center truncate w-full">{attachmentName || "Click to browse or drag and drop new file"}</p>
                    </div>
                  </div>
                </>
              ) : (
                // VIEW MODE
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Expense No</p>
                      <p className="text-sm font-medium text-blue-400 mt-1">{selectedExpense.expense_no}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Date</p>
                      <p className="text-sm font-medium text-white mt-1">{selectedExpense.expense_date}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Category</p>
                      <p className="text-sm font-medium text-white mt-1">
                        <span className="bg-zinc-800 px-2 py-1 rounded text-xs inline-block mt-1">
                          {selectedExpense.petty_cash_categories?.name || 'N/A'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Amount</p>
                      <p className="text-xl font-bold text-emerald-400 mt-1">OMR {Number(selectedExpense.amount).toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/50 pt-4">
                    <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Description</p>
                    <div className="mt-2 bg-zinc-800/30 p-3 rounded-xl border border-zinc-800">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap break-words leading-relaxed">
                        {selectedExpense.request_description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-4">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Employee</p>
                      <p className="text-sm font-medium text-white mt-1">{selectedExpense.profiles?.full_name || selectedExpense.profiles?.username || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Project</p>
                      <p className="text-sm font-medium text-zinc-300 mt-1">{selectedExpense.projects?.name || 'None / N/A'}</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800/50 pt-4">
                    <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider">Attachment</p>
                    {selectedExpense.attachment_url ? (
                      <div 
                        className="w-full h-24 bg-zinc-800/50 border-2 border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer mt-2"
                        onClick={() => window.open(selectedExpense.attachment_url, '_blank')}
                        title="Double click to view attachment (simulate)"
                        onDoubleClick={(e) => {
                           e.stopPropagation();
                           window.open(selectedExpense.attachment_url, '_blank');
                        }}
                      >
                        <Paperclip className="w-6 h-6 mb-1 text-blue-400" />
                        <p className="text-sm font-medium px-4 text-center truncate w-full">
                          {selectedExpense.attachment_url.split('/').pop()?.split('?')[0] || "View Document"}
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">Double click or click to open</p>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 mt-2 italic">No attachment provided</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50 rounded-b-2xl">
              {isEditing ? (
                <>
                  <button 
                    onClick={cancelEditing}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={startEditing}
                    className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors border border-zinc-700"
                  >
                    <Edit className="w-5 h-5" />
                    Edit Record
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
