'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderPlus,
  FolderOpen,
  FileSpreadsheet,
  FileText,
  PackageCheck,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowRightLeft,
  CheckCircle2,
  Clock,
  Send,
  Search,
  X,
  Loader2,
  Paperclip,
  Edit3,
  AlertTriangle,
  Check,
  Calendar,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import {
  PettyCashBatch,
  createBatch,
  updateBatchMeta,
  deleteBatch,
  assignInvoicesToBatch,
  removeInvoicesFromBatch,
  reorderBatchInvoices,
  transferInvoicesBetweenBatches
} from '@/app/(dashboard)/petty-cash/actions/batchesActions';
import {
  exportBatchAccountsReport,
  exportBatchMergedPdf,
  exportBatchZipPackage
} from '@/lib/pettyCashBatchExporter';

const MONTH_NAMES = [
  { value: 1, en: 'January', ar: 'يناير' },
  { value: 2, en: 'February', ar: 'فبراير' },
  { value: 3, en: 'March', ar: 'مارس' },
  { value: 4, en: 'April', ar: 'أبريل' },
  { value: 5, en: 'May', ar: 'مايو' },
  { value: 6, en: 'June', ar: 'يونيو' },
  { value: 7, en: 'July', ar: 'يوليو' },
  { value: 8, en: 'August', ar: 'أغسطس' },
  { value: 9, en: 'September', ar: 'سبتمبر' },
  { value: 10, en: 'October', ar: 'أكتوبر' },
  { value: 11, en: 'November', ar: 'نوفمبر' },
  { value: 12, en: 'December', ar: 'ديسمبر' }
];

interface PettyCashBatchesSectionProps {
  initialBatches: PettyCashBatch[];
  expensesData: any[];
  onBatchesChange?: (batches: PettyCashBatch[]) => void;
}

export default function PettyCashBatchesSection({
  initialBatches,
  expensesData,
  onBatchesChange
}: PettyCashBatchesSectionProps) {
  const router = useRouter();
  const today = new Date();

  const [batches, setBatches] = useState<PettyCashBatch[]>(initialBatches || []);
  useEffect(() => {
    setBatches(initialBatches || []);
  }, [initialBatches]);

  const updateLocalBatches = (updater: (prev: PettyCashBatch[]) => PettyCashBatch[]) => {
    setBatches(prev => {
      const next = updater(prev);
      onBatchesChange?.(next);
      return next;
    });
  };

  // Filter state
  const [filterMonth, setFilterMonth] = useState<number | 'all'>(today.getMonth() + 1);
  const [filterYear, setFilterYear] = useState<number>(today.getFullYear());

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<'current' | 'assign'>('current');

  // Create Batch Form
  const [newBatchName, setNewBatchName] = useState('');
  const [newBatchMonth, setNewBatchMonth] = useState<number>(today.getMonth() + 1);
  const [newBatchYear, setNewBatchYear] = useState<number>(today.getFullYear());
  const [newBatchPcvNo, setNewBatchPcvNo] = useState('');
  const [newBatchAdvance, setNewBatchAdvance] = useState('1000');
  const [newBatchStatus, setNewBatchStatus] = useState<'In Progress' | 'Ready' | 'Submitted'>('In Progress');

  // Edit Batch Meta inside Workspace
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPcvNo, setEditPcvNo] = useState('');
  const [editAdvance, setEditAdvance] = useState('1000');

  // Assign tab state
  const [assignSearch, setAssignSearch] = useState('');
  const [assignMonthScope, setAssignMonthScope] = useState<'batch-month' | 'all'>('batch-month');
  const [selectedToAssign, setSelectedToAssign] = useState<string[]>([]);

  // Current Batch tab selection (for remove or transfer)
  const [selectedInBatch, setSelectedInBatch] = useState<string[]>([]);
  const [transferTargetBatchId, setTransferTargetBatchId] = useState<string>('');

  // Loading & Feedback
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Map of expenseId -> expense object
  const expenseMap = useMemo(() => {
    const map = new Map<string, any>();
    (expensesData || []).forEach(exp => map.set(exp.id, exp));
    return map;
  }, [expensesData]);

  // Map of expenseId -> { batchId, batchName } for duplicate prevention
  const invoiceAssignmentMap = useMemo(() => {
    const map = new Map<string, { batchId: string; batchName: string }>();
    batches.forEach(b => {
      b.invoiceIds.forEach(invId => {
        map.set(invId, { batchId: b.id, batchName: b.name });
      });
    });
    return map;
  }, [batches]);

  // Filtered batches for display
  const displayedBatches = useMemo(() => {
    return batches.filter(b => {
      if (filterMonth !== 'all' && b.month !== filterMonth) return false;
      if (b.year !== filterYear) return false;
      return true;
    });
  }, [batches, filterMonth, filterYear]);

  const activeBatch = useMemo(
    () => batches.find(b => b.id === activeBatchId) || null,
    [batches, activeBatchId]
  );

  // Ordered invoice objects for a given batch
  const getBatchInvoices = (batch: PettyCashBatch) => {
    return batch.invoiceIds
      .map(id => expenseMap.get(id))
      .filter(Boolean);
  };

  // Auto-suggest next batch name e.g. "October 1", "October 2"
  const openCreateBatchModal = () => {
    const targetM = filterMonth === 'all' ? today.getMonth() + 1 : filterMonth;
    const targetY = filterYear;
    const monthEn = MONTH_NAMES.find(m => m.value === targetM)?.en || 'Batch';
    const existingInMonth = batches.filter(b => b.month === targetM && b.year === targetY);
    const suggestedName = `${monthEn} ${existingInMonth.length + 1}`;

    setNewBatchMonth(targetM);
    setNewBatchYear(targetY);
    setNewBatchName(suggestedName);
    setNewBatchPcvNo('');
    setNewBatchAdvance('1000');
    setNewBatchStatus('In Progress');
    setIsCreateModalOpen(true);
  };

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchName.trim()) return;
    setBusyAction('create');
    try {
      const res = await createBatch({
        name: newBatchName.trim(),
        month: newBatchMonth,
        year: newBatchYear,
        status: newBatchStatus,
        pcvNo: newBatchPcvNo.trim(),
        advanceAmount: parseFloat(newBatchAdvance) || 1000
      });
      if (res.error) {
        setToast({ type: 'error', text: res.error });
      } else if (res.batch) {
        updateLocalBatches(prev => [...prev, res.batch!]);
        setIsCreateModalOpen(false);
        setToast({ type: 'success', text: `تم إنشاء المجموعة "${res.batch.name}" بنجاح.` });
        // Open workspace directly on Assign tab so user can pick invoices immediately
        setActiveBatchId(res.batch.id);
        setWorkspaceTab('assign');
        setSelectedToAssign([]);
        router.refresh();
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleStatusChange = async (batch: PettyCashBatch, newStatus: 'In Progress' | 'Ready' | 'Submitted') => {
    setBusyAction(`status-${batch.id}`);
    try {
      const res = await updateBatchMeta(batch.id, { status: newStatus });
      if (res.batch) {
        updateLocalBatches(prev => prev.map(b => (b.id === batch.id ? res.batch! : b)));
        router.refresh();
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveMeta = async () => {
    if (!activeBatch) return;
    setBusyAction('save-meta');
    try {
      const res = await updateBatchMeta(activeBatch.id, {
        name: editName.trim(),
        pcvNo: editPcvNo.trim(),
        advanceAmount: parseFloat(editAdvance) || 1000
      });
      if (res.error) {
        setToast({ type: 'error', text: res.error });
      } else if (res.batch) {
        updateLocalBatches(prev => prev.map(b => (b.id === activeBatch.id ? res.batch! : b)));
        setIsEditingMeta(false);
        setToast({ type: 'success', text: 'تم تحديث بيانات المجموعة.' });
        router.refresh();
      }
    } finally {
      setBusyAction(null);
    }
  };

  const handleDeleteBatch = async (batch: PettyCashBatch) => {
    if (!window.confirm(`هل أنت متأكد من حذف المجموعة "${batch.name}"؟ (لن يتم حذف الفواتير الأصلية من النظام)`)) {
      return;
    }
    setBusyAction(`delete-${batch.id}`);
    try {
      await deleteBatch(batch.id);
      updateLocalBatches(prev => prev.filter(b => b.id !== batch.id));
      if (activeBatchId === batch.id) setActiveBatchId(null);
      setToast({ type: 'success', text: `تم حذف المجموعة "${batch.name}" مع الحفاظ على الفواتير الأصلية.` });
      router.refresh();
    } finally {
      setBusyAction(null);
    }
  };

  // Assign selected invoices to activeBatch
  const handleAssignInvoices = async () => {
    if (!activeBatch || selectedToAssign.length === 0) return;
    setBusyAction('assign');
    try {
      const res = await assignInvoicesToBatch(activeBatch.id, selectedToAssign);
      if (res.error) {
        setToast({ type: 'error', text: res.error });
      } else if (res.batch) {
        updateLocalBatches(prev => prev.map(b => (b.id === activeBatch.id ? res.batch! : b)));
        setToast({
          type: 'success',
          text: `تمت إضافة ${selectedToAssign.length} فاتورة إلى "${activeBatch.name}".`
        });
        setSelectedToAssign([]);
        setWorkspaceTab('current');
        router.refresh();
      }
    } finally {
      setBusyAction(null);
    }
  };

  // Remove invoices from activeBatch
  const handleRemoveFromBatch = async (idsToRemove: string[]) => {
    if (!activeBatch || idsToRemove.length === 0) return;
    setBusyAction('remove');
    try {
      const res = await removeInvoicesFromBatch(activeBatch.id, idsToRemove);
      if (res.batch) {
        updateLocalBatches(prev => prev.map(b => (b.id === activeBatch.id ? res.batch! : b)));
        setSelectedInBatch(prev => prev.filter(id => !idsToRemove.includes(id)));
        setToast({ type: 'success', text: `تمت إزالة ${idsToRemove.length} فاتورة من المجموعة.` });
        router.refresh();
      }
    } finally {
      setBusyAction(null);
    }
  };

  // Move invoice up/down in activeBatch
  const handleMoveInvoice = async (index: number, direction: 'up' | 'down') => {
    if (!activeBatch) return;
    const ids = [...activeBatch.invoiceIds];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= ids.length) return;

    const temp = ids[index];
    ids[index] = ids[targetIdx];
    ids[targetIdx] = temp;

    // Optimistic update
    updateLocalBatches(prev =>
      prev.map(b => (b.id === activeBatch.id ? { ...b, invoiceIds: ids } : b))
    );
    await reorderBatchInvoices(activeBatch.id, ids);
  };

  // Sort batch invoices by Date or Expense No
  const handleSortBatchInvoices = async (by: 'date' | 'expense_no') => {
    if (!activeBatch) return;
    const items = getBatchInvoices(activeBatch);
    items.sort((a, b) => {
      if (by === 'date') {
        return String(a.expense_date || '').localeCompare(String(b.expense_date || ''));
      }
      return String(a.expense_no || '').localeCompare(String(b.expense_no || ''));
    });
    const sortedIds = items.map(i => i.id);
    updateLocalBatches(prev =>
      prev.map(b => (b.id === activeBatch.id ? { ...b, invoiceIds: sortedIds } : b))
    );
    await reorderBatchInvoices(activeBatch.id, sortedIds);
    setToast({ type: 'success', text: 'تم إعادة ترتيب الفواتير في المجموعة.' });
  };

  // Transfer invoices between batches
  const handleTransferInvoices = async (
    sourceId: string,
    targetId: string,
    invoiceIds: string[]
  ) => {
    if (!sourceId || !targetId || invoiceIds.length === 0) return;
    setBusyAction('transfer');
    try {
      const res = await transferInvoicesBetweenBatches(sourceId, targetId, invoiceIds);
      if (res.error) {
        setToast({ type: 'error', text: res.error });
      } else if (res.sourceBatch && res.targetBatch) {
        updateLocalBatches(prev =>
          prev.map(b => {
            if (b.id === res.sourceBatch!.id) return res.sourceBatch!;
            if (b.id === res.targetBatch!.id) return res.targetBatch!;
            return b;
          })
        );
        setSelectedInBatch([]);
        setTransferTargetBatchId('');
        setToast({
          type: 'success',
          text: `تم نقل ${invoiceIds.length} فاتورة إلى "${res.targetBatch.name}".`
        });
        router.refresh();
      }
    } finally {
      setBusyAction(null);
    }
  };

  // Export handlers
  const handleExportExcel = async (batch: PettyCashBatch) => {
    const invs = getBatchInvoices(batch);
    if (invs.length === 0) {
      setToast({ type: 'error', text: 'هذه المجموعة فارغة. أضف فواتير أولاً لتصدير تقرير الحسابات.' });
      return;
    }
    setBusyAction(`excel-${batch.id}`);
    try {
      await exportBatchAccountsReport(batch, invs);
      setToast({
        type: 'success',
        text: `تم تصدير تقرير الحسابات (Accounts Report) للمجموعة "${batch.name}".`
      });
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'فشل تصدير ملف الإكسل.' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportPdf = async (batch: PettyCashBatch) => {
    const invs = getBatchInvoices(batch);
    if (invs.length === 0) {
      setToast({ type: 'error', text: 'هذه المجموعة فارغة. أضف فواتير أولاً لدمج المرفقات.' });
      return;
    }
    setBusyAction(`pdf-${batch.id}`);
    try {
      const { attachedCount } = await exportBatchMergedPdf(batch, invs);
      setToast({
        type: 'success',
        text: `تم تصدير ملف الـ PDF المدمج (${attachedCount} مرفقات) بالترتيب المحدد.`
      });
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'فشل دمج ملف الـ PDF.' });
    } finally {
      setBusyAction(null);
    }
  };

  const handleExportZip = async (batch: PettyCashBatch) => {
    const invs = getBatchInvoices(batch);
    if (invs.length === 0) {
      setToast({ type: 'error', text: 'هذه المجموعة فارغة. أضف فواتير أولاً لتصدير الحزمة.' });
      return;
    }
    setBusyAction(`zip-${batch.id}`);
    try {
      await exportBatchZipPackage(batch, invs);
      setToast({
        type: 'success',
        text: `تم تصدير حزمة ZIP (تقرير الحسابات + المرفقات المدمجة) للمجموعة "${batch.name}".`
      });
    } catch (err: any) {
      setToast({ type: 'error', text: err.message || 'فشل تصدير حزمة ZIP.' });
    } finally {
      setBusyAction(null);
    }
  };

  // Candidate invoices for the "Assign Invoices" tab
  const candidateInvoices = useMemo(() => {
    if (!activeBatch) return [];
    return (expensesData || []).filter(exp => {
      if (assignMonthScope === 'batch-month' && exp.expense_date) {
        const [y, m] = exp.expense_date.split('-');
        if (parseInt(y, 10) !== activeBatch.year || parseInt(m, 10) !== activeBatch.month) {
          return false;
        }
      }
      if (assignSearch.trim()) {
        const q = assignSearch.toLowerCase().trim();
        const no = (exp.expense_no || '').toLowerCase();
        const desc = (exp.request_description || '').toLowerCase();
        const cat = (exp.petty_cash_categories?.name || '').toLowerCase();
        const proj = (exp.projects?.name || '').toLowerCase();
        return no.includes(q) || desc.includes(q) || cat.includes(q) || proj.includes(q);
      }
      return true;
    });
  }, [expensesData, activeBatch, assignMonthScope, assignSearch]);

  const selectableUnassignedIds = useMemo(() => {
    return candidateInvoices
      .filter(exp => !invoiceAssignmentMap.has(exp.id))
      .map(exp => exp.id);
  }, [candidateInvoices, invoiceAssignmentMap]);

  const currentMonthLabel =
    filterMonth === 'all'
      ? `All Months ${filterYear}`
      : `${MONTH_NAMES.find(m => m.value === filterMonth)?.en || ''} ${filterYear}`;

  return (
    <div className="glass rounded-2xl p-6 border border-border dark:border-zinc-800/60 flex flex-col gap-5">
      {/* Toast Notification */}
      {toast && (
        <div
          className={clsx(
            'p-3.5 rounded-xl flex items-center justify-between text-sm font-medium border shadow-md animate-in fade-in duration-200',
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              : 'bg-danger/10 text-danger border-danger/30'
          )}
        >
          <div className="flex items-center gap-2.5">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{toast.text}</span>
          </div>
          <button onClick={() => setToast(null)} className="text-zinc-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={openCreateBatchModal}
            className="flex items-center gap-2 px-4 py-2 rounded-full btn-primary-gradient bg-zinc-100 hover:bg-white text-zinc-900 font-semibold text-sm transition-all shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Batch +</span>
          </button>

          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={e =>
                setFilterMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-300 focus:outline-none focus:border-teal-500"
            >
              <option value="all">كل الأشهر (All Months)</option>
              {MONTH_NAMES.map(m => (
                <option key={m.value} value={m.value}>
                  {m.en} ({m.ar})
                </option>
              ))}
            </select>

            <select
              value={filterYear}
              onChange={e => setFilterYear(Number(e.target.value))}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs font-medium text-zinc-300 focus:outline-none focus:border-teal-500"
            >
              {[2024, 2025, 2026, 2027].map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-right">
          <h2 className="text-lg font-bold text-white flex items-center sm:justify-end gap-2">
            <span>Petty Cash Batches</span>
            <FolderOpen className="w-5 h-5 text-[#14B8A6]" />
          </h2>
          <p className="text-xs text-zinc-400">{currentMonthLabel} — مجموعات تجهيز ملفات الحسابات</p>
        </div>
      </div>

      {/* Batches Grid */}
      {displayedBatches.length === 0 ? (
        <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
            <FolderPlus className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              لا توجد مجموعات فواتير في {currentMonthLabel}
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              أنشئ مجموعات مخصصة مثل (October 1, October 2) واختر الفواتير المرفوعة مسبقاً لتصدير تقرير الحسابات الرسمي وملف الـ PDF المدمج بضغطة زر.
            </p>
          </div>
          <button
            onClick={openCreateBatchModal}
            className="mt-1 flex items-center gap-2 px-5 py-2 rounded-xl btn-primary-gradient bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء أول مجموعة ({MONTH_NAMES.find(m => m.value === (filterMonth === 'all' ? today.getMonth() + 1 : filterMonth))?.en} 1)</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {displayedBatches.map(batch => {
            const batchInvoices = getBatchInvoices(batch);
            const totalAmount = batchInvoices.reduce(
              (sum, item) => sum + Number(item.amount || 0),
              0
            );
            const attachmentsCount = batchInvoices.filter(item => Boolean(item.attachment_url)).length;
            const progressPct =
              batch.status === 'Ready' || batch.status === 'Submitted'
                ? 100
                : batchInvoices.length > 0
                ? Math.min(90, Math.max(35, Math.round((totalAmount / (batch.advanceAmount || 1000)) * 100)))
                : 12;

            return (
              <div
                key={batch.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 flex flex-col gap-4 hover:border-[#14B8A6]/50 transition-all shadow-xs"
              >
                {/* Top row: Status pill + Actions (Left) & Batch Title + Invoice Count (Right) */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Selector Pill */}
                    <select
                      value={batch.status}
                      onChange={e =>
                        handleStatusChange(batch, e.target.value as 'In Progress' | 'Ready' | 'Submitted')
                      }
                      className={clsx(
                        'text-xs font-semibold px-3 py-1 rounded-full border cursor-pointer focus:outline-none transition-colors',
                        batch.status === 'Ready'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : batch.status === 'Submitted'
                          ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                      )}
                    >
                      <option value="In Progress" className="bg-zinc-900 text-zinc-200">
                        In Progress
                      </option>
                      <option value="Ready" className="bg-zinc-900 text-emerald-400">
                        Ready
                      </option>
                      <option value="Submitted" className="bg-zinc-900 text-blue-400">
                        Submitted
                      </option>
                    </select>

                    <button
                      onClick={() => {
                        setActiveBatchId(batch.id);
                        setWorkspaceTab(batchInvoices.length === 0 ? 'assign' : 'current');
                        setSelectedInBatch([]);
                        setSelectedToAssign([]);
                        setIsEditingMeta(false);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30 hover:bg-[#14B8A6]/25 transition-colors cursor-pointer"
                    >
                      إدارة الفواتير ({batchInvoices.length})
                    </button>

                    <button
                      onClick={() => handleDeleteBatch(batch)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                      title="حذف المجموعة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div
                    className="text-right cursor-pointer group"
                    onClick={() => {
                      setActiveBatchId(batch.id);
                      setWorkspaceTab(batchInvoices.length === 0 ? 'assign' : 'current');
                      setSelectedInBatch([]);
                      setSelectedToAssign([]);
                      setIsEditingMeta(false);
                    }}
                  >
                    <div className="flex items-center justify-end gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#14B8A6] transition-colors">
                        {batch.name}
                      </h3>
                      <FolderOpen className="w-4 h-4 text-zinc-400 group-hover:text-[#14B8A6] transition-colors" />
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Invoices {batchInvoices.length} • Attachments {attachmentsCount}
                    </p>
                  </div>
                </div>

                {/* Middle row: Amount & Total Amount label */}
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-bold text-white tracking-tight">
                    OMR {totalAmount.toFixed(3)}
                  </div>
                  <div className="text-xs text-zinc-400 flex items-center gap-2">
                    <span className="font-mono text-[11px] text-zinc-500">{batch.id}</span>
                    <span>•</span>
                    <span>Total Amount</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#0F766E] to-[#14B8A6] rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Bottom Export & Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <button
                    onClick={() => handleExportPdf(batch)}
                    disabled={busyAction !== null}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 hover:border-[#14B8A6]/40 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === `pdf-${batch.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#14B8A6]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#14B8A6]" />
                    )}
                    <span>Merged PDF</span>
                  </button>

                  <button
                    onClick={() => handleExportExcel(batch)}
                    disabled={busyAction !== null}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800 hover:border-[#14B8A6]/40 text-xs font-semibold text-white transition-all cursor-pointer disabled:opacity-50"
                  >
                    {busyAction === `excel-${batch.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Accounts Report</span>
                  </button>

                  <button
                    onClick={() => handleExportZip(batch)}
                    disabled={busyAction !== null}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 text-xs font-semibold text-[#14B8A6] transition-all cursor-pointer disabled:opacity-50"
                    title="تصدير تقرير الحسابات + ملف المرفقات المدمج معاً في ملف ZIP واحد"
                  >
                    {busyAction === `zip-${batch.id}` ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <PackageCheck className="w-4 h-4" />
                    )}
                    <span>ZIP Package</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW BATCH                                                 */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsCreateModalOpen(false)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-5 flex flex-col gap-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-[#14B8A6]" />
                <span>Create New Petty Cash Batch</span>
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Batch Name (اسم المجموعة) *
                </label>
                <input
                  type="text"
                  required
                  value={newBatchName}
                  onChange={e => setNewBatchName(e.target.value)}
                  placeholder="e.g. October 1, October 2..."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#14B8A6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Month</label>
                  <select
                    value={newBatchMonth}
                    onChange={e => {
                      const m = Number(e.target.value);
                      setNewBatchMonth(m);
                      const monthEn = MONTH_NAMES.find(item => item.value === m)?.en || 'Batch';
                      const count = batches.filter(b => b.month === m && b.year === newBatchYear).length;
                      setNewBatchName(`${monthEn} ${count + 1}`);
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#14B8A6]"
                  >
                    {MONTH_NAMES.map(m => (
                      <option key={m.value} value={m.value}>
                        {m.en} ({m.ar})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Year</label>
                  <select
                    value={newBatchYear}
                    onChange={e => setNewBatchYear(Number(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#14B8A6]"
                  >
                    {[2024, 2025, 2026, 2027].map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    PCV No (اختياري)
                  </label>
                  <input
                    type="text"
                    value={newBatchPcvNo}
                    onChange={e => setNewBatchPcvNo(e.target.value)}
                    placeholder="e.g. PCV-2026-10"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">
                    Advance OMR (العهدة)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={newBatchAdvance}
                    onChange={e => setNewBatchAdvance(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={busyAction === 'create'}
                  className="flex items-center gap-2 btn-primary-gradient bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer"
                >
                  {busyAction === 'create' && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Create & Assign Invoices</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BATCH WORKSPACE (MANAGE, REORDER, TRANSFER & ASSIGN INVOICES)    */}
      {/* ========================================================================= */}
      {activeBatch && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm overflow-y-auto"
          onClick={() => setActiveBatchId(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[84vh] my-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#14B8A6]/15 border border-[#14B8A6]/30 flex items-center justify-center text-[#14B8A6]">
                  <FolderOpen className="w-5 h-5" />
                </div>
                {isEditingMeta ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-sm text-white font-bold w-40"
                      placeholder="Batch Name"
                    />
                    <input
                      type="text"
                      value={editPcvNo}
                      onChange={e => setEditPcvNo(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white w-28"
                      placeholder="PCV No"
                    />
                    <input
                      type="number"
                      value={editAdvance}
                      onChange={e => setEditAdvance(e.target.value)}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white w-24"
                      placeholder="Advance"
                    />
                    <button
                      onClick={handleSaveMeta}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                    >
                      حفظ
                    </button>
                    <button
                      onClick={() => setIsEditingMeta(false)}
                      className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 text-xs"
                    >
                      إلغاء
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{activeBatch.name}</h3>
                      <span className="text-xs font-mono text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
                        {activeBatch.id}
                      </span>
                      <button
                        onClick={() => {
                          setEditName(activeBatch.name);
                          setEditPcvNo(activeBatch.pcvNo || '');
                          setEditAdvance(String(activeBatch.advanceAmount ?? 1000));
                          setIsEditingMeta(true);
                        }}
                        className="text-zinc-400 hover:text-white p-1 rounded"
                        title="تعديل اسم المجموعة أو رقم PCV"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-xs text-zinc-400">
                      Created: {activeBatch.createdAt} •{' '}
                      {MONTH_NAMES.find(m => m.value === activeBatch.month)?.en} {activeBatch.year} •
                      Total:{' '}
                      <strong className="text-[#14B8A6]">
                        OMR{' '}
                        {getBatchInvoices(activeBatch)
                          .reduce((s, i) => s + Number(i.amount || 0), 0)
                          .toFixed(3)}
                      </strong>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportExcel(activeBatch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Accounts Report</span>
                </button>
                <button
                  onClick={() => handleExportPdf(activeBatch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-semibold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Merged PDF</span>
                </button>
                <button
                  onClick={() => handleExportZip(activeBatch)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-primary-gradient bg-teal-600 text-white text-xs font-semibold cursor-pointer"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>ZIP</span>
                </button>
                <button
                  onClick={() => setActiveBatchId(null)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div className="px-5 pt-3 border-b border-zinc-800 flex items-center justify-between gap-4 bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWorkspaceTab('current')}
                  className={clsx(
                    'px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer',
                    workspaceTab === 'current'
                      ? 'border-[#14B8A6] text-[#14B8A6]'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  )}
                >
                  فواتير المجموعة وترتيب التصدير ({getBatchInvoices(activeBatch).length})
                </button>
                <button
                  onClick={() => setWorkspaceTab('assign')}
                  className={clsx(
                    'px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5',
                    workspaceTab === 'assign'
                      ? 'border-[#14B8A6] text-[#14B8A6]'
                      : 'border-transparent text-zinc-400 hover:text-white'
                  )}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Invoices to {activeBatch.name} (إضافة فواتير)</span>
                </button>
              </div>

              {workspaceTab === 'current' && getBatchInvoices(activeBatch).length > 1 && (
                <div className="flex items-center gap-2 pb-2">
                  <button
                    onClick={() => handleSortBatchInvoices('date')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>ترتيب بالتاريخ</span>
                  </button>
                  <button
                    onClick={() => handleSortBatchInvoices('expense_no')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>ترتيب برقم الفاتورة</span>
                  </button>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              {workspaceTab === 'current' ? (
                /* ========================================================= */
                /* TAB 1: INVOICES IN THIS BATCH (REORDER / TRANSFER / REMOVE) */
                /* ========================================================= */
                <div className="flex flex-col gap-4">
                  {/* Bulk Bar for selected items inside batch */}
                  {selectedInBatch.length > 0 && (
                    <div className="p-3 rounded-xl bg-zinc-800/80 border border-zinc-700 flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-white">
                        تم تحديد {selectedInBatch.length} فاتورة من المجموعة
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {batches.filter(b => b.id !== activeBatch.id).length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <select
                              value={transferTargetBatchId}
                              onChange={e => setTransferTargetBatchId(e.target.value)}
                              className="bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white"
                            >
                              <option value="">نقل إلى مجموعة أخرى...</option>
                              {batches
                                .filter(b => b.id !== activeBatch.id)
                                .map(b => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              disabled={!transferTargetBatchId || busyAction === 'transfer'}
                              onClick={() =>
                                handleTransferInvoices(
                                  activeBatch.id,
                                  transferTargetBatchId,
                                  selectedInBatch
                                )
                              }
                              className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <ArrowRightLeft className="w-3 h-3" />
                              <span>نقل</span>
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => handleRemoveFromBatch(selectedInBatch)}
                          className="px-3 py-1 rounded-lg bg-danger/20 hover:bg-danger/30 text-danger border border-danger/30 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>إزالة من المجموعة</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {getBatchInvoices(activeBatch).length === 0 ? (
                    <div className="py-12 text-center flex flex-col items-center gap-3">
                      <p className="text-sm text-zinc-400">
                        لا توجد فواتير مضافة في مجموعة <strong>{activeBatch.name}</strong> حالياً.
                      </p>
                      <button
                        onClick={() => setWorkspaceTab('assign')}
                        className="px-4 py-2 rounded-xl btn-primary-gradient bg-blue-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        + اختيار فواتير لإضافتها للمجموعة
                      </button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-zinc-800">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-zinc-800/60 text-zinc-400 uppercase">
                          <tr>
                            <th className="p-3 w-8 text-center">
                              <input
                                type="checkbox"
                                checked={
                                  getBatchInvoices(activeBatch).length > 0 &&
                                  getBatchInvoices(activeBatch).every(i =>
                                    selectedInBatch.includes(i.id)
                                  )
                                }
                                onChange={() => {
                                  const allIds = getBatchInvoices(activeBatch).map(i => i.id);
                                  if (allIds.every(id => selectedInBatch.includes(id))) {
                                    setSelectedInBatch([]);
                                  } else {
                                    setSelectedInBatch(allIds);
                                  }
                                }}
                                className="rounded accent-[#14B8A6] cursor-pointer"
                              />
                            </th>
                            <th className="p-3 w-16 text-center">Order</th>
                            <th className="p-3">Expense No</th>
                            <th className="p-3">Date</th>
                            <th className="p-3">Request Description</th>
                            <th className="p-3">Category</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Project Name</th>
                            <th className="p-3 text-center">File</th>
                            <th className="p-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800/60">
                          {getBatchInvoices(activeBatch).map((exp, idx, arr) => (
                            <tr key={exp.id} className="hover:bg-zinc-800/30 transition-colors">
                              <td className="p-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={selectedInBatch.includes(exp.id)}
                                  onChange={() =>
                                    setSelectedInBatch(prev =>
                                      prev.includes(exp.id)
                                        ? prev.filter(i => i !== exp.id)
                                        : [...prev, exp.id]
                                    )
                                  }
                                  className="rounded accent-[#14B8A6] cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <div className="inline-flex items-center gap-1">
                                  <span className="font-mono font-bold text-zinc-400 w-6">
                                    {String(idx + 1).padStart(2, '0')}
                                  </span>
                                  <div className="flex flex-col">
                                    <button
                                      disabled={idx === 0}
                                      onClick={() => handleMoveInvoice(idx, 'up')}
                                      className="text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                      title="تحريك لأعلى"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                    <button
                                      disabled={idx === arr.length - 1}
                                      onClick={() => handleMoveInvoice(idx, 'down')}
                                      className="text-zinc-400 hover:text-white disabled:opacity-20 cursor-pointer"
                                      title="تحريك لأسفل"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </td>
                              <td className="p-3 font-semibold text-blue-400 whitespace-nowrap">
                                {exp.expense_no}
                              </td>
                              <td className="p-3 text-zinc-300 whitespace-nowrap">
                                {exp.expense_date}
                              </td>
                              <td className="p-3 text-white max-w-[200px] truncate">
                                {exp.request_description}
                              </td>
                              <td className="p-3 text-zinc-300 whitespace-nowrap">
                                {exp.petty_cash_categories?.name || '-'}
                              </td>
                              <td className="p-3 font-bold text-emerald-400 whitespace-nowrap">
                                OMR {Number(exp.amount || 0).toFixed(3)}
                              </td>
                              <td className="p-3 text-zinc-300 whitespace-nowrap">
                                {exp.projects?.name || 'HEAD OFFICE'}
                              </td>
                              <td className="p-3 text-center">
                                {exp.attachment_url ? (
                                  <button
                                    onClick={() => window.open(exp.attachment_url, '_blank')}
                                    className="text-[#14B8A6] hover:underline"
                                    title="عرض المرفق"
                                  >
                                    <Paperclip className="w-3.5 h-3.5 inline" />
                                  </button>
                                ) : (
                                  <span className="text-zinc-600">-</span>
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => handleRemoveFromBatch([exp.id])}
                                  className="text-zinc-400 hover:text-danger p-1 rounded cursor-pointer"
                                  title="إزالة من المجموعة"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                /* ========================================================= */
                /* TAB 2: ASSIGN EXISTING INVOICES TO BATCH                  */
                /* ========================================================= */
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-800 text-white">
                        Selected {selectedToAssign.length}
                      </span>
                      <button
                        onClick={() => {
                          if (
                            selectableUnassignedIds.length > 0 &&
                            selectableUnassignedIds.every(id => selectedToAssign.includes(id))
                          ) {
                            setSelectedToAssign([]);
                          } else {
                            setSelectedToAssign(selectableUnassignedIds);
                          }
                        }}
                        className="text-xs text-[#14B8A6] hover:underline cursor-pointer"
                      >
                        تحديد كل الفواتير المتاحة ({selectableUnassignedIds.length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={assignSearch}
                          onChange={e => setAssignSearch(e.target.value)}
                          placeholder="بحث برقم الفاتورة، الوصف، المشروع..."
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#14B8A6]"
                        />
                      </div>
                      <select
                        value={assignMonthScope}
                        onChange={e =>
                          setAssignMonthScope(e.target.value as 'batch-month' | 'all')
                        }
                        className="bg-zinc-800 border border-zinc-700 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300"
                      >
                        <option value="batch-month">
                          فواتير شهر المجموعة (
                          {MONTH_NAMES.find(m => m.value === activeBatch.month)?.en})
                        </option>
                        <option value="all">كل الفواتير المرفوعة</option>
                      </select>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-zinc-800 max-h-[42vh]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-zinc-800/70 text-zinc-400 uppercase sticky top-0 z-10">
                        <tr>
                          <th className="p-3">OMR</th>
                          <th className="p-3">Category / Project</th>
                          <th className="p-3">Description</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Invoice</th>
                          <th className="p-3 text-right">Status / Select</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60">
                        {candidateInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-zinc-500">
                              لا توجد فواتير مطابقة. يمكنك التبديل إلى &quot;كل الفواتير المرفوعة&quot;.
                            </td>
                          </tr>
                        ) : (
                          candidateInvoices.map(exp => {
                            const assignedInfo = invoiceAssignmentMap.get(exp.id);
                            const isAssignedHere = assignedInfo?.batchId === activeBatch.id;
                            const isAssignedOther =
                              assignedInfo && assignedInfo.batchId !== activeBatch.id;
                            const isChecked = selectedToAssign.includes(exp.id);

                            return (
                              <tr
                                key={exp.id}
                                onClick={() => {
                                  if (isAssignedHere || isAssignedOther) return;
                                  setSelectedToAssign(prev =>
                                    prev.includes(exp.id)
                                      ? prev.filter(id => id !== exp.id)
                                      : [...prev, exp.id]
                                  );
                                }}
                                className={clsx(
                                  'transition-colors',
                                  isAssignedHere || isAssignedOther
                                    ? 'opacity-65 bg-zinc-900/40'
                                    : 'hover:bg-zinc-800/40 cursor-pointer',
                                  isChecked && 'bg-[#14B8A6]/10'
                                )}
                              >
                                <td className="p-3 font-bold text-white whitespace-nowrap">
                                  {Number(exp.amount || 0).toFixed(3)}
                                </td>
                                <td className="p-3 text-zinc-300 whitespace-nowrap">
                                  <div>{exp.petty_cash_categories?.name || '-'}</div>
                                  <div className="text-[10px] text-zinc-500">
                                    {exp.projects?.name || 'HEAD OFFICE'}
                                  </div>
                                </td>
                                <td className="p-3 text-zinc-300 max-w-[220px] truncate">
                                  {exp.request_description}
                                </td>
                                <td className="p-3 text-zinc-400 whitespace-nowrap">
                                  {exp.expense_date}
                                </td>
                                <td className="p-3 font-semibold text-blue-400 whitespace-nowrap">
                                  {exp.expense_no}
                                </td>
                                <td
                                  className="p-3 text-right whitespace-nowrap"
                                  onClick={e => e.stopPropagation()}
                                >
                                  {isAssignedHere ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                      <Check className="w-3 h-3" /> مضافة هنا
                                    </span>
                                  ) : isAssignedOther ? (
                                    <div className="inline-flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30">
                                        في: {assignedInfo.batchName}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleTransferInvoices(
                                            assignedInfo.batchId,
                                            activeBatch.id,
                                            [exp.id]
                                          )
                                        }
                                        className="text-[11px] text-purple-400 hover:underline font-semibold cursor-pointer"
                                        title="نقل هذه الفاتورة إلى هذه المجموعة"
                                      >
                                        نقل لهنا
                                      </button>
                                    </div>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() =>
                                        setSelectedToAssign(prev =>
                                          prev.includes(exp.id)
                                            ? prev.filter(id => id !== exp.id)
                                            : [...prev, exp.id]
                                        )
                                      }
                                      className="w-4 h-4 rounded-full accent-[#14B8A6] cursor-pointer"
                                    />
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Bottom Assign Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
                    <button
                      disabled={selectedToAssign.length === 0 || busyAction === 'assign'}
                      onClick={handleAssignInvoices}
                      className="flex items-center gap-2 px-5 py-2 rounded-full btn-primary-gradient bg-zinc-100 hover:bg-white text-zinc-900 font-bold text-xs transition-all disabled:opacity-40 cursor-pointer"
                    >
                      {busyAction === 'assign' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Assign to {activeBatch.name}</span>
                    </button>

                    <span className="text-xs text-zinc-400">
                      Selected: <strong className="text-white">{selectedToAssign.length}</strong>{' '}
                      invoices (OMR{' '}
                      {candidateInvoices
                        .filter(i => selectedToAssign.includes(i.id))
                        .reduce((s, i) => s + Number(i.amount || 0), 0)
                        .toFixed(3)}
                      )
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
