'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { getFormData, createExpense } from '@/app/(dashboard)/petty-cash/actions/pettyCashActions';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NewExpenseModal({ isOpen, onClose, onSuccess }: ModalProps) {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [formDataOptions, setFormDataOptions] = useState<any>(null);
  
  const [expenseNo, setExpenseNo] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setDataLoading(true);
      setError(null);
      setDuplicateWarning(false);
      getFormData().then((data) => {
        setFormDataOptions(data);
        setExpenseNo(data.nextExpenseNo);
        // Reset form
        setDescription('');
        setCategoryId('');
        setEmployeeId('');
        setAmount('');
        setProjectId('');
        setAttachmentName('');
        setDataLoading(false);
      }).catch(err => {
        console.error(err);
        setError('Failed to load form data');
        setDataLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent, confirmDuplicate = false) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append('expense_no', expenseNo);
    formData.append('expense_date', date);
    formData.append('request_description', description);
    formData.append('category_id', categoryId);
    formData.append('employee_id', employeeId);
    formData.append('amount', amount);
    if (projectId) formData.append('project_id', projectId);
    if (confirmDuplicate) formData.append('confirm_duplicate', 'true');

    const input = document.getElementById('file-upload') as HTMLInputElement;
    let fileToUpload = null;
    let originalFile = null;
    let successMessage = 'تم حفظ البيانات بنجاح.';

    if (input && input.files && input.files.length > 0) {
      originalFile = input.files[0];
      
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
      const result = await createExpense(formData);
      if (result.error) {
        if (result.error === 'DUPLICATE_WARNING') {
          setDuplicateWarning(true);
          setError(result.message || 'Duplicate detected');
        } else {
          setError(result.error);
        }
      } else if (result.success) {
        alert(successMessage);
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-zinc-800">
          <h2 className="text-xl font-bold text-white">New Petty Cash Expense</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {dataLoading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
              <p className="text-zinc-400">Loading form data...</p>
            </div>
          ) : (
            <form id="expense-form" onSubmit={(e) => handleSubmit(e, false)} className="space-y-5">
              
              {error && (
                <div className={`p-4 rounded-xl flex items-start gap-3 ${duplicateWarning ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400' : 'bg-danger/10 border border-danger/20 text-danger'}`}>
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{error}</p>
                    {duplicateWarning && (
                      <button 
                        type="button"
                        onClick={(e) => handleSubmit(e, true)}
                        className="mt-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 px-3 py-1.5 rounded-lg text-sm transition-colors"
                      >
                        Yes, save anyway
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Expense No</label>
                  <input 
                    type="text" 
                    value={expenseNo} 
                    readOnly 
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-2.5 text-zinc-300 cursor-not-allowed"
                  />
                </div>
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
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Request Description <span className="text-danger">*</span></label>
                <input 
                  type="text" 
                  required
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g., Office stationary from local store"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
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
                    {formDataOptions?.categories.map((c: any) => (
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
                    {formDataOptions?.profiles.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Amount (OMR) <span className="text-danger">*</span></label>
                  <input 
                    type="number" 
                    required
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project Name</label>
                  <select 
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="">None / N/A</option>
                    {formDataOptions?.projects.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Receipt / Attachment (Optional)</label>
                <div 
                  className="w-full h-24 bg-zinc-800/50 border-2 border-dashed border-zinc-700 rounded-xl flex flex-col items-center justify-center text-zinc-400 hover:border-blue-500 hover:text-blue-400 transition-colors cursor-pointer"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      const file = e.dataTransfer.files[0];
                      // Display file name (simulated attach)
                      const input = document.getElementById('file-upload') as HTMLInputElement;
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
                    id="file-upload" 
                    type="file" 
                    className="hidden" 
                    name="attachment"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setAttachmentName(e.target.files[0].name);
                      }
                    }}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium px-4 text-center truncate w-full">{attachmentName || "Click to browse or drag and drop"}</p>
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="p-6 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50 rounded-b-2xl">
          <button 
            type="button" 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="expense-form"
            disabled={loading || dataLoading || duplicateWarning}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            Save Expense
          </button>
        </div>
      </div>
    </div>
  );
}
