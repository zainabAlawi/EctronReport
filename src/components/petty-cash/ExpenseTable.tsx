'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Paperclip, 
  X, 
  Edit, 
  Loader2, 
  AlertTriangle, 
  Save, 
  XCircle, 
  Trash2, 
  ArrowRightLeft, 
  FolderArchive, 
  Calendar, 
  Check, 
  Search, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Layers,
  FileSpreadsheet,
  AlertCircle,
  Plus
} from 'lucide-react';
import clsx from 'clsx';
import * as XLSX from 'xlsx';
import { 
  updateExpense, 
  deleteExpenses, 
  transferExpensesMonth, 
  bulkUpdateExpenses 
} from '@/app/(dashboard)/petty-cash/actions/pettyCashActions';
import {
  PettyCashBatch,
  assignInvoicesToBatch
} from '@/app/(dashboard)/petty-cash/actions/batchesActions';

interface ExpenseTableProps {
  expensesData: any[];
  batches?: PettyCashBatch[];
  options?: {
    categories: any[];
    profiles: any[];
    projects: any[];
    recurringDescriptions?: any[];
  };
}

const MONTH_NAMES = [
  { value: 1, en: 'January', ar: 'يناير' },
  { value: 2, en: 'February', ar: 'فبراير' },
  { value: 3, ar: 'مارس', en: 'March' },
  { value: 4, ar: 'أبريل', en: 'April' },
  { value: 5, ar: 'مايو', en: 'May' },
  { value: 6, ar: 'يونيو', en: 'June' },
  { value: 7, ar: 'يوليو', en: 'July' },
  { value: 8, ar: 'أغسطس', en: 'August' },
  { value: 9, ar: 'سبتمبر', en: 'September' },
  { value: 10, ar: 'أكتوبر', en: 'October' },
  { value: 11, ar: 'نوفمبر', en: 'November' },
  { value: 12, ar: 'ديسمبر', en: 'December' },
];

export default function ExpenseTable({ expensesData, batches = [], options }: ExpenseTableProps) {
  const router = useRouter();
  const [targetBatchIdForBulk, setTargetBatchIdForBulk] = useState<string>('');

  const invoiceBatchMap = useMemo(() => {
    const map = new Map<string, PettyCashBatch>();
    (batches || []).forEach(b => {
      b.invoiceIds.forEach(id => map.set(id, b));
    });
    return map;
  }, [batches]);

  // Internal data state
  const [dataList, setDataList] = useState<any[]>(expensesData || []);
  useEffect(() => {
    setDataList(expensesData || []);
  }, [expensesData]);

  // View state: 'monthly' or 'master'
  const today = new Date();
  const [viewMode, setViewMode] = useState<'monthly' | 'master'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth() + 1);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [employeeFilter, setEmployeeFilter] = useState('all');

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals state
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);

  // Action feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Single edit form state
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [projectId, setProjectId] = useState('');
  const [projectText, setProjectText] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  // Transfer form state
  const [transferTargetYear, setTransferTargetYear] = useState<number>(today.getFullYear());
  const [transferTargetMonth, setTransferTargetMonth] = useState<number>(today.getMonth() + 1);
  const [transferMode, setTransferMode] = useState<'keep-day' | 'custom-date'>('keep-day');
  const [transferCustomDate, setTransferCustomDate] = useState('');

  // Bulk edit form state
  const [bulkCategoryId, setBulkCategoryId] = useState('');
  const [bulkEmployeeId, setBulkEmployeeId] = useState('');
  const [bulkProjectId, setBulkProjectId] = useState('');
  const [bulkDate, setBulkDate] = useState('');

  // Master checkbox ref for indeterminate state
  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // Filter available years & months from data
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(today.getFullYear());
    dataList.forEach(item => {
      if (item.expense_date) {
        const y = new Date(item.expense_date).getFullYear();
        if (!isNaN(y)) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [dataList, today]);

  // Compute filtered data for current view
  const filteredData = useMemo(() => {
    return dataList.filter(item => {
      // 1. Month / Master filter
      if (viewMode === 'monthly') {
        if (!item.expense_date) return false;
        const [y, m] = item.expense_date.split('-');
        if (parseInt(y, 10) !== selectedYear || parseInt(m, 10) !== selectedMonth) {
          return false;
        }
      }

      // 2. Category filter
      if (categoryFilter !== 'all' && item.category_id !== categoryFilter) {
        return false;
      }

      // 3. Employee filter
      if (employeeFilter !== 'all' && item.employee_id !== employeeFilter) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const no = (item.expense_no || '').toLowerCase();
        const desc = (item.request_description || '').toLowerCase();
        const cat = (item.petty_cash_categories?.name || '').toLowerCase();
        const emp = (item.profiles?.full_name || item.profiles?.username || '').toLowerCase();
        const proj = (item.projects?.name || '').toLowerCase();

        return no.includes(q) || desc.includes(q) || cat.includes(q) || emp.includes(q) || proj.includes(q);
      }

      return true;
    });
  }, [dataList, viewMode, selectedYear, selectedMonth, categoryFilter, employeeFilter, searchQuery]);

  // Set indeterminate state on master checkbox
  useEffect(() => {
    if (masterCheckboxRef.current) {
      const visibleIds = filteredData.map(d => d.id);
      const selectedVisibleCount = visibleIds.filter(id => selectedIds.includes(id)).length;
      const isAllSelected = visibleIds.length > 0 && selectedVisibleCount === visibleIds.length;
      const isIndeterminate = selectedVisibleCount > 0 && !isAllSelected;

      masterCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedIds, filteredData]);

  // Selection handlers
  const handleToggleSelectAll = () => {
    const visibleIds = filteredData.map(d => d.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      // Deselect all visible
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      // Select all visible
      setSelectedIds(prev => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  // Toast auto-clear
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
    setSelectedIds([]);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
    setSelectedIds([]);
  };

  // Row double click -> view details
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
    setProjectText(selectedExpense.projects?.name || '');

    setAttachmentName(selectedExpense.attachment_url ? 'Existing Attachment' : '');
    setIsEditing(true);
    setError(null);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setError(null);
  };

  // Single Edit Save
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
    formData.append('project_text', projectText.trim());
    
    const input = document.getElementById('edit-file-upload') as HTMLInputElement;
    let successMessage = 'تم حفظ البيانات بنجاح.';

    if (input && input.files && input.files.length > 0) {
      const originalFile = input.files[0];
      let fileToUpload = null;
      
      if (originalFile.type.startsWith('image/')) {
        try {
          const imageCompression = (await import('browser-image-compression')).default;
          const opts = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
          fileToUpload = await imageCompression(originalFile, opts);
          
          if (fileToUpload.size < originalFile.size) {
            const origSize = (originalFile.size / 1024 / 1024).toFixed(2);
            const compSize = (fileToUpload.size / 1024 / 1024).toFixed(2);
            successMessage = `تم تقليل حجم المرفق من ${origSize}MB إلى ${compSize}MB وحفظ البيانات بنجاح.`;
          }
        } catch (err) {
          console.error("Error compressing image", err);
          fileToUpload = originalFile;
        }
      } else {
        fileToUpload = originalFile;
      }
      
      formData.append('attachment', fileToUpload || originalFile, (fileToUpload || originalFile).name);
    }

    try {
      const result = await updateExpense(selectedExpense.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        const updatedRow = result.data?.[0];
        const updatedItem = {
          ...selectedExpense,
          expense_date: date,
          request_description: description,
          category_id: categoryId,
          employee_id: employeeId,
          amount: parseFloat(amount),
          project_id: projectId,
          attachment_url: updatedRow?.attachment_url || selectedExpense.attachment_url,
          petty_cash_categories: { name: options.categories.find(c => c.id === categoryId)?.name },
          profiles: { full_name: options.profiles.find(p => p.id === employeeId)?.full_name || options.profiles.find(p => p.id === employeeId)?.username },
          projects: { name: projectText.trim() || undefined }
        };

        setDataList(prev => prev.map(item => item.id === selectedExpense.id ? updatedItem : item));
        setSelectedExpense(updatedItem);
        setToastMessage({ type: 'success', text: successMessage });
        closeDetails();
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating.');
    } finally {
      setLoading(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const result = await deleteExpenses(selectedIds);
      if (result.error) {
        setToastMessage({ type: 'error', text: result.error });
      } else {
        const count = selectedIds.length;
        setDataList(prev => prev.filter(item => !selectedIds.includes(item.id)));
        setSelectedIds([]);
        setIsDeleteModalOpen(false);
        setToastMessage({ type: 'success', text: `تم حذف ${count} سجل بنجاح.` });
        router.refresh();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'فشل في حذف السجلات.' });
    } finally {
      setLoading(false);
    }
  };

  // Transfer to Month Action
  const handleConfirmTransfer = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const specificDate = transferMode === 'custom-date' && transferCustomDate ? transferCustomDate : undefined;
      const result = await transferExpensesMonth(selectedIds, transferTargetYear, transferTargetMonth, specificDate);
      
      if (result.error) {
        setToastMessage({ type: 'error', text: result.error });
      } else {
        const count = selectedIds.length;
        const targetMonthName = MONTH_NAMES.find(m => m.value === transferTargetMonth)?.ar || `شهر ${transferTargetMonth}`;
        
        // Optimistically update local data list dates
        const maxDays = new Date(transferTargetYear, transferTargetMonth, 0).getDate();
        const pad = (n: number) => n.toString().padStart(2, '0');

        setDataList(prev => prev.map(item => {
          if (!selectedIds.includes(item.id)) return item;
          if (specificDate) {
            return { ...item, expense_date: specificDate };
          }
          let day = 1;
          if (item.expense_date) {
            const parts = item.expense_date.split('-');
            if (parts.length === 3) {
              const origDay = parseInt(parts[2], 10);
              day = Math.min(origDay || 1, maxDays);
            }
          }
          return { ...item, expense_date: `${transferTargetYear}-${pad(transferTargetMonth)}-${pad(day)}` };
        }));

        setSelectedIds([]);
        setIsTransferModalOpen(false);
        setToastMessage({ 
          type: 'success', 
          text: `تم نقل ${count} سجل بنجاح إلى ملف ${targetMonthName} ${transferTargetYear}.` 
        });
        router.refresh();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'فشل في نقل السجلات.' });
    } finally {
      setLoading(false);
    }
  };

  // Bulk Edit Action
  const handleConfirmBulkEdit = async () => {
    if (selectedIds.length === 0) return;
    setLoading(true);
    try {
      const updates: any = {};
      if (bulkCategoryId) updates.category_id = bulkCategoryId;
      if (bulkEmployeeId) updates.employee_id = bulkEmployeeId;
      if (bulkProjectId) updates.project_id = bulkProjectId;
      if (bulkDate) updates.expense_date = bulkDate;

      if (Object.keys(updates).length === 0) {
        setToastMessage({ type: 'error', text: 'يرجى تحديد حقل واحد على الأقل للتعديل.' });
        setLoading(false);
        return;
      }

      const result = await bulkUpdateExpenses(selectedIds, updates);
      if (result.error) {
        setToastMessage({ type: 'error', text: result.error });
      } else {
        const count = selectedIds.length;
        // Optimistically update local state
        setDataList(prev => prev.map(item => {
          if (!selectedIds.includes(item.id)) return item;
          const updated = { ...item };
          if (bulkCategoryId) {
            updated.category_id = bulkCategoryId;
            updated.petty_cash_categories = { name: options?.categories.find(c => c.id === bulkCategoryId)?.name };
          }
          if (bulkEmployeeId) {
            updated.employee_id = bulkEmployeeId;
            updated.profiles = { full_name: options?.profiles.find(p => p.id === bulkEmployeeId)?.full_name || options?.profiles.find(p => p.id === bulkEmployeeId)?.username };
          }
          if (bulkProjectId) {
            updated.project_id = bulkProjectId;
            updated.projects = { name: options?.projects.find(p => p.id === bulkProjectId)?.name };
          }
          if (bulkDate) {
            updated.expense_date = bulkDate;
          }
          return updated;
        }));

        setSelectedIds([]);
        setIsBulkEditModalOpen(false);
        setToastMessage({ type: 'success', text: `تم تحديث ${count} سجل بنجاح.` });
        router.refresh();
      }
    } catch (err: any) {
      setToastMessage({ type: 'error', text: err.message || 'فشل في تحديث السجلات.' });
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const exportRows = filteredData.map(item => ({
      'رقم المصروف': item.expense_no,
      'التاريخ': item.expense_date,
      'الوصف': item.request_description,
      'التصنيف': item.petty_cash_categories?.name || 'N/A',
      'الموظف': item.profiles?.full_name || item.profiles?.username || 'N/A',
      'المشروع': item.projects?.name || '-',
      'المبلغ (OMR)': Number(item.amount || 0).toFixed(3),
      'المرفق': item.attachment_url ? 'يوجد مرفق' : 'لا يوجد'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    const sheetName = viewMode === 'master' ? 'Master Data' : `${MONTH_NAMES.find(m => m.value === selectedMonth)?.en || selectedMonth}_${selectedYear}`;
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Petty Cash');
    XLSX.writeFile(workbook, `petty_cash_${sheetName.toLowerCase()}.xlsx`);
  };

  // Totals for current view
  const currentTotalAmount = useMemo(() => {
    return filteredData.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [filteredData]);

  const currentMonthObj = MONTH_NAMES.find(m => m.value === selectedMonth);

  return (
    <div className="flex flex-col gap-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className={clsx(
          "p-4 rounded-xl flex items-center justify-between text-sm font-medium animate-in fade-in duration-200 border shadow-lg",
          toastMessage.type === 'success' 
            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
            : "bg-danger/10 text-danger border-danger/30"
        )}>
          <div className="flex items-center gap-3">
            {toastMessage.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header: View Tabs & Month Navigator */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        {/* Left: View Mode Tabs */}
        <div className="flex items-center gap-2 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <button
            onClick={() => {
              setViewMode('monthly');
              setSelectedIds([]);
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === 'monthly'
                ? "btn-primary-gradient bg-blue-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>ملفات الأشهر (Monthly Files)</span>
          </button>

          <button
            onClick={() => {
              setViewMode('master');
              setSelectedIds([]);
            }}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              viewMode === 'master'
                ? "bg-purple-600 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            )}
          >
            <FolderArchive className="w-4 h-4" />
            <span>ماستر داتا (Master Data - All Records)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-200">
              {dataList.length}
            </span>
          </button>
        </div>

        {/* Middle/Right: Month Selector (if in monthly view) */}
        {viewMode === 'monthly' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
              title="الشهر السابق"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Dropdowns */}
            <select
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(Number(e.target.value));
                setSelectedIds([]);
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {MONTH_NAMES.map(m => (
                <option key={m.value} value={m.value}>
                  {m.ar} ({m.en})
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={e => {
                setSelectedYear(Number(e.target.value));
                setSelectedIds([]);
              }}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-medium"
            >
              {availableYears.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-zinc-700"
              title="الشهر التالي"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Right: Summary Badges & Export */}
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-xs">
            <span className="text-zinc-400">السجلات:</span>
            <span className="font-bold text-white">{filteredData.length}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">الإجمالي:</span>
            <span className="font-bold text-emerald-400">OMR {currentTotalAmount.toFixed(3)}</span>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium transition-colors border border-emerald-500/30"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير Excel</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="بحث في الوصف، رقم المصروف، الموظف، المشروع..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">كل التصنيفات (All Categories)</option>
          {options?.categories?.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        {/* Employee Filter */}
        <select
          value={employeeFilter}
          onChange={e => setEmployeeFilter(e.target.value)}
          className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
        >
          <option value="all">كل الموظفين (All Employees)</option>
          {options?.profiles?.map(p => (
            <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
          ))}
        </select>
      </div>

      {/* BULK ACTIONS TOOLBAR (Appears when records are selected) */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 text-white text-xs font-bold">
              {selectedIds.length}
            </span>
            <span className="text-sm font-semibold text-white">
              تم تحديد {selectedIds.length} سجل من القائمة
            </span>
            <span className="text-xs text-blue-300/80">
              (إجمالي المبالغ المحددة: OMR {filteredData.filter(d => selectedIds.includes(d.id)).reduce((s, d) => s + Number(d.amount || 0), 0).toFixed(3)})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Assign to Batch */}
            {batches.length > 0 && (
              <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-700 rounded-lg px-2 py-1">
                <select
                  value={targetBatchIdForBulk}
                  onChange={e => setTargetBatchIdForBulk(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none"
                >
                  <option value="" className="bg-zinc-900">إضافة إلى مجموعة (Batch)...</option>
                  {batches.map(b => (
                    <option key={b.id} value={b.id} className="bg-zinc-900">
                      {b.name}
                    </option>
                  ))}
                </select>
                <button
                  disabled={!targetBatchIdForBulk || loading}
                  onClick={async () => {
                    if (!targetBatchIdForBulk) return;
                    setLoading(true);
                    try {
                      const res = await assignInvoicesToBatch(targetBatchIdForBulk, selectedIds);
                      if (res.error) {
                        setToastMessage({ type: 'error', text: res.error });
                      } else {
                        setToastMessage({
                          type: 'success',
                          text: `تمت إضافة ${selectedIds.length} فاتورة إلى مجموعة "${res.batch?.name}".`
                        });
                        setSelectedIds([]);
                        setTargetBatchIdForBulk('');
                        router.refresh();
                      }
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#14B8A6] hover:bg-[#0D9488] disabled:opacity-40 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Assign
                </button>
              </div>
            )}

            {/* Update / Edit Button */}
            <button
              onClick={() => {
                if (selectedIds.length === 1) {
                  const singleItem = dataList.find(d => d.id === selectedIds[0]);
                  if (singleItem) {
                    setSelectedExpense(singleItem);
                    startEditing();
                  }
                } else {
                  setBulkCategoryId('');
                  setBulkEmployeeId('');
                  setBulkProjectId('');
                  setBulkDate('');
                  setIsBulkEditModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm"
              title="تعديل السجلات المحددة"
            >
              <Edit className="w-3.5 h-3.5" />
              <span>تعديل (Update)</span>
            </button>

            {/* Transfer to Month Button */}
            <button
              onClick={() => {
                setTransferTargetYear(selectedYear);
                setTransferTargetMonth(selectedMonth === 12 ? 1 : selectedMonth + 1);
                setTransferMode('keep-day');
                setTransferCustomDate('');
                setIsTransferModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors shadow-sm"
              title="نقل السجلات إلى ملف شهر آخر"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>نقل إلى شهر آخر (Transfer)</span>
            </button>

            {/* Delete Button */}
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-danger/80 hover:bg-danger text-white text-xs font-medium transition-colors shadow-sm"
              title="حذف السجلات المحددة"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>حذف (Delete)</span>
            </button>

            {/* Clear Selection */}
            <button
              onClick={handleClearSelection}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              title="إلغاء التحديد"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EXPENSE TABLE */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 bg-zinc-800/60 uppercase">
            <tr>
              {/* Checkbox Column Header */}
              <th className="w-10 px-4 py-3 text-center">
                <input
                  ref={masterCheckboxRef}
                  type="checkbox"
                  checked={filteredData.length > 0 && filteredData.every(d => selectedIds.includes(d.id))}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                  title="تحديد الكل / إلغاء تحديد الكل"
                />
              </th>
              <th className="px-4 py-3">Expense No</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3 text-center">Attachment</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FolderArchive className="w-8 h-8 text-zinc-600" />
                    <p className="font-medium">لا توجد سجلات مطابقة في هذا العرض.</p>
                    <p className="text-xs text-zinc-600">
                      {viewMode === 'monthly' ? `ملف شهر ${currentMonthObj?.ar} ${selectedYear} فارغ أو تم نقل السجلات منه.` : 'لا توجد سجلات في الماستر داتا.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredData.map((exp) => {
                const isSelected = selectedIds.includes(exp.id);
                return (
                  <tr 
                    key={exp.id} 
                    onDoubleClick={() => handleRowDoubleClick(exp)}
                    className={clsx(
                      "border-b border-zinc-800/50 transition-colors select-none cursor-pointer",
                      isSelected 
                        ? "bg-blue-600/15 border-blue-500/40 hover:bg-blue-600/25" 
                        : "hover:bg-zinc-800/40"
                    )}
                    title="انقر مرتين لعرض التفاصيل وتعديل السجل"
                  >
                    {/* Checkbox Cell */}
                    <td 
                      className="w-10 px-4 py-3 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSelect(exp.id);
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}} // handled by td onClick
                        className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 text-blue-600 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-blue-600"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-blue-400 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span>{exp.expense_no}</span>
                        {invoiceBatchMap.has(exp.id) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30">
                            {invoiceBatchMap.get(exp.id)?.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {exp.expense_date}
                    </td>
                    <td className="px-4 py-3 text-white max-w-xs truncate" title={exp.request_description}>
                      {exp.request_description}
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      <span className="bg-zinc-800/90 border border-zinc-700/60 px-2 py-0.5 rounded text-xs">
                        {exp.petty_cash_categories?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-300 whitespace-nowrap">
                      {exp.profiles?.full_name || exp.profiles?.username || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                      {exp.projects?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {exp.attachment_url ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(exp.attachment_url, '_blank');
                          }}
                          className="p-1 hover:bg-zinc-800 rounded transition-colors text-blue-400"
                          title="عرض المرفق"
                        >
                          <Paperclip className="w-4 h-4 inline-block" />
                        </button>
                      ) : (
                        <span className="text-zinc-600">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold text-white whitespace-nowrap">
                      OMR {Number(exp.amount || 0).toFixed(3)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: TRANSFER TO ANOTHER MONTH                                        */}
      {/* ========================================================================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">نقل السجلات إلى ملف شهر آخر</h3>
                  <p className="text-xs text-zinc-400">سيتم نقل {selectedIds.length} سجل محدد إلى ملف الشهر المختار</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                disabled={loading}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">الشهر المنقول إليه</label>
                  <select
                    value={transferTargetMonth}
                    onChange={e => setTransferTargetMonth(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
                  >
                    {MONTH_NAMES.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.ar} ({m.en})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">السنة المنقول إليها</label>
                  <select
                    value={transferTargetYear}
                    onChange={e => setTransferTargetYear(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 font-medium"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date handling options */}
              <div className="space-y-2 bg-zinc-800/40 p-4 rounded-xl border border-zinc-800">
                <label className="block text-xs font-semibold text-zinc-300 mb-2">طريقة تعديل التاريخ في الشهر الجديد:</label>
                
                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="transferMode"
                    value="keep-day"
                    checked={transferMode === 'keep-day'}
                    onChange={() => setTransferMode('keep-day')}
                    className="accent-purple-600"
                  />
                  <span>الحفاظ على نفس رقم اليوم في الشهر الجديد (مثال: يوم 15 يبقى يوم 15)</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="transferMode"
                    value="custom-date"
                    checked={transferMode === 'custom-date'}
                    onChange={() => setTransferMode('custom-date')}
                    className="accent-purple-600"
                  />
                  <span>تحديد تاريخ محدد وموحد لجميع السجلات المنقولة</span>
                </label>

                {transferMode === 'custom-date' && (
                  <input
                    type="date"
                    value={transferCustomDate}
                    onChange={e => setTransferCustomDate(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 mt-2"
                  />
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmTransfer}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRightLeft className="w-4 h-4" />}
                <span>تأكيد النقل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRM DELETE                                                   */}
      {/* ========================================================================= */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-danger/10 text-danger flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">تأكيد حذف السجلات</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  هل أنت متأكد من حذف <span className="text-danger font-bold">{selectedIds.length}</span> سجل محدد؟
                </p>
              </div>
            </div>

            <div className="p-3 bg-zinc-800/50 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1">
              <p className="font-semibold text-zinc-200">تحذير:</p>
              <p>سيتم حذف هذه المصروفات نهائياً من قاعدة البيانات ولا يمكن استرجاعها.</p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-danger hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>حذف نهائي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: BULK UPDATE                                                      */}
      {/* ========================================================================= */}
      {isBulkEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 flex flex-col gap-5"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">تعديل جماعي (Bulk Update)</h3>
                  <p className="text-xs text-zinc-400">تعديل {selectedIds.length} سجل محدد دفعة واحدة</p>
                </div>
              </div>
              <button 
                onClick={() => setIsBulkEditModalOpen(false)}
                disabled={loading}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              اختر الحقول التي ترغب في تطبيقها على جميع السجلات المحددة (اترك الحقل فارغاً إذا كنت لا ترغب بتغييره):
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">تغيير التصنيف (Category)</label>
                <select
                  value={bulkCategoryId}
                  onChange={e => setBulkCategoryId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- بدون تغيير --</option>
                  {options?.categories?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">تغيير الموظف (Employee)</label>
                <select
                  value={bulkEmployeeId}
                  onChange={e => setBulkEmployeeId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- بدون تغيير --</option>
                  {options?.profiles?.map(p => (
                    <option key={p.id} value={p.id}>{p.full_name || p.username}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">تغيير المشروع (Project)</label>
                <select
                  value={bulkProjectId}
                  onChange={e => setBulkProjectId(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- بدون تغيير --</option>
                  {options?.projects?.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">تغيير التاريخ (Date)</label>
                <input
                  type="date"
                  value={bulkDate}
                  onChange={e => setBulkDate(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsBulkEditModalOpen(false)}
                disabled={loading}
                className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkEdit}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>حفظ التعديلات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SINGLE EXPENSE DETAILS & EDIT                                    */}
      {/* ========================================================================= */}
      {selectedExpense && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto" onClick={closeDetails}>
          <div 
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xl shadow-2xl flex flex-col max-h-[82vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-4 border-b border-zinc-800 shrink-0">
              <h2 className="text-lg font-bold text-white">
                {isEditing ? `تعديل المصروف: ${selectedExpense.expense_no}` : `تفاصيل المصروف: ${selectedExpense.expense_no}`}
              </h2>
              <button onClick={closeDetails} disabled={loading} className="text-zinc-400 hover:text-white transition-colors disabled:opacity-50">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
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
                        min="0.001"
                        step="0.001"
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder="0.000 (e.g. 2.835)"
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                      <label className="block text-sm font-medium text-zinc-400">Request Description <span className="text-danger">*</span></label>
                      {options?.recurringDescriptions && options.recurringDescriptions.length > 0 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              setDescription(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="text-xs bg-zinc-900 hover:bg-zinc-800 text-blue-400 border border-blue-500/30 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value="" disabled>⚡ اختيار من الأوصاف المتكررة...</option>
                          {options.recurringDescriptions.map((item: any) => (
                            <option key={item.id} value={item.text} className="bg-zinc-800 text-white">
                              {item.text}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                    <textarea 
                      required
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="اكتب وصف المصروف هنا (أو اختر من الأوصاف المتكررة أعلاه)..."
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 min-h-[75px] resize-y text-sm"
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
                        {options?.categories?.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                        {options?.profiles?.map((prof) => (
                          <option key={prof.id} value={prof.id}>{prof.full_name || prof.username}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Project (المشروع / النسب المئوية)</label>
                    <input 
                      type="text"
                      value={projectText}
                      onChange={e => setProjectText(e.target.value)}
                      placeholder="e.g. Ectron 80%, AAMU 20% أو Head Office"
                      list="project-edit-suggestions"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 text-sm font-medium"
                    />
                    <datalist id="project-edit-suggestions">
                      {options?.projects?.map((proj: any) => (
                        <option key={proj.id} value={proj.name} />
                      ))}
                    </datalist>
                    <p className="text-xs text-zinc-500 mt-1">
                      يتم استرجاع المشروع والنسب المئوية كنص في سطر واحد لتسهيل التعديل المباشر
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">Update Attachment (Optional)</label>
                    <input 
                      type="file" 
                      id="edit-file-upload"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="w-full text-sm text-zinc-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-zinc-800 file:text-white hover:file:bg-zinc-700 cursor-pointer"
                    />
                    {selectedExpense.attachment_url && (
                      <p className="text-xs text-zinc-500 mt-1">يوجد مرفق حالي. اختيار ملف جديد سيستبدل المرفق الحالي.</p>
                    )}
                  </div>
                </>
              ) : (
                // VIEW DETAILS MODE
                <>
                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-800">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Expense Date</p>
                      <p className="text-sm font-medium text-white mt-1">{selectedExpense.expense_date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Amount</p>
                      <p className="text-base font-bold text-emerald-400 mt-1">OMR {Number(selectedExpense.amount).toFixed(3)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Request Description</p>
                    <p className="text-sm text-zinc-300 mt-1 bg-zinc-800/40 p-3 rounded-xl border border-zinc-800 whitespace-pre-wrap">{selectedExpense.request_description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pb-4 border-b border-zinc-800">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Category</p>
                      <p className="text-sm font-medium text-white mt-1">{selectedExpense.petty_cash_categories?.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase font-semibold">Employee</p>
                      <p className="text-sm font-medium text-white mt-1">{selectedExpense.profiles?.full_name || selectedExpense.profiles?.username || 'N/A'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Project</p>
                    <p className="text-sm font-medium text-white mt-1">{selectedExpense.projects?.name || 'None'}</p>
                  </div>

                  <div>
                    <p className="text-xs text-zinc-500 uppercase font-semibold">Attachment</p>
                    {selectedExpense.attachment_url ? (
                      <div 
                        className="w-full h-20 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center justify-between px-4 text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer mt-2"
                        onClick={() => window.open(selectedExpense.attachment_url, '_blank')}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Paperclip className="w-5 h-5 text-blue-400 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">
                            {selectedExpense.attachment_url.split('/').pop()?.split('?')[0] || "View Document"}
                          </span>
                        </div>
                        <span className="text-xs text-blue-400 font-semibold underline flex-shrink-0">عرض الملف</span>
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 mt-2 italic">لا يوجد مرفق لهذا السجل</p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="px-5 py-3.5 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50 rounded-b-2xl shrink-0">
              {isEditing ? (
                <>
                  <button 
                    onClick={cancelEditing}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-zinc-300 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-5 h-5" />
                    إلغاء
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    حفظ التغييرات
                  </button>
                </>
              ) : (
                <>
                  <button 
                    onClick={startEditing}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                    تعديل السجل
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
