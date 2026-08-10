'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertCircle, Clock, Calendar, Download, X, Trash2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

export default function UploadPage() {
  const params = useParams();
  const division = params.division;
  
  const [uploadMode, setUploadMode] = useState<'daily' | 'yearly'>('daily');
  const [shiftType, setShiftType] = useState<'shift' | 'official'>('shift');
  const [shift, setShift] = useState('shift1');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const [history, setHistory] = useState<any[]>([]);
  const [selectedHistory, setSelectedHistory] = useState<any | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api/upload?division=${division}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [division]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setStatus('idle');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { cellDates: true });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];

      if (uploadMode === 'yearly') {
        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let dates: { dateStr: string, achIndex: number }[] = []; 
        let dailyData: Record<string, any> = {}; 

        for (let r = 0; r < json.length; r++) {
          const row = json[r];
          if (!row || !row.length) continue;
          
          const firstCell = String(row[0]).trim();
          
          if (firstCell === 'Date') {
            dates = [];
            for (let c = 1; c < row.length; c++) {
              if (row[c]) {
                let d = row[c];
                let dateStr = '';
                if (d instanceof Date) {
                  dateStr = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
                } else if (typeof d === 'number') {
                  dateStr = new Date((d - 25569) * 86400 * 1000).toISOString().split('T')[0];
                } else {
                  const parsed = new Date(d);
                  if (!isNaN(parsed.getTime())) dateStr = parsed.toISOString().split('T')[0];
                }
                
                if (dateStr) {
                  dates.push({ dateStr, achIndex: c + 1 });
                  if (!dailyData[dateStr]) {
                    dailyData[dateStr] = { date: dateStr, assembly: 0, perso: 0, lasering: 0, packaging: 0, cartons: 0, palets: 0, cards: 0, insolation: 0, radiation_frequency: 0, calibration: 0, multy_test: 0, metrology: 0 };
                  }
                }
              }
            }
          } else if (dates.length > 0) {
            let dbKey = '';
            if (firstCell.includes('Assembly')) dbKey = 'assembly';
            else if (firstCell.includes('Perso')) dbKey = 'perso';
            else if (firstCell.includes('Lazi') || firstCell.includes('Laser')) dbKey = 'lasering';
            else if (firstCell.includes('Backag') || firstCell.includes('Packag')) dbKey = 'packaging';
            else if (firstCell.includes('Carton')) dbKey = 'cartons';
            else if (firstCell.includes('Palet')) dbKey = 'palets';
            else if (firstCell.includes('Card')) dbKey = 'cards';
            else if (firstCell.includes('Insol')) dbKey = 'insolation';
            else if (firstCell.includes('Radia')) dbKey = 'radiation_frequency';
            else if (firstCell.includes('Calib')) dbKey = 'calibration';
            else if (firstCell.includes('Multy')) dbKey = 'multy_test';
            else if (firstCell.includes('Metro')) dbKey = 'metrology';
            
            if (dbKey) {
              for (const d of dates) {
                const val = parseInt(row[d.achIndex]) || 0;
                dailyData[d.dateStr][dbKey] += val;
              }
            }
          }
        }
        
        const daysData = Object.values(dailyData);
        
        const res = await fetch('/api/upload/yearly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ division, filename: file.name, daysData })
        });

        if (!res.ok) throw new Error('Upload processing failed');

      } else {
        const json = XLSX.utils.sheet_to_json(worksheet);
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            division,
            date,
            shift: shiftType === 'official' ? 'official' : shift,
            rows: json,
            filename: file.name
          })
        });

        if (!res.ok) throw new Error('Upload processing failed');
      }

      setStatus('success');
      fetchHistory(); 
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/upload?id=${deletingId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setDeletingId(null);
        fetchHistory();
      } else {
        alert('Failed to delete report.');
      }
    } catch (e) {
      console.error(e);
      alert('An error occurred while deleting.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 py-8 relative">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Upload Production Data</h1>
        <p className="text-zinc-400">Import Excel, CSV, or PDF files to automatically update the dashboard metrics.</p>
      </div>

      <div className="glass rounded-3xl p-8 border border-border flex flex-col gap-8">
        
        {/* Mode Selection */}
        <div className="flex p-1 bg-zinc-900/50 rounded-xl w-fit border border-zinc-800 mb-2">
          <button
            onClick={() => setUploadMode('daily')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              uploadMode === 'daily' ? "bg-blue-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            تقرير شفتات (Daily Report)
          </button>
          <button
            onClick={() => setUploadMode('yearly')}
            className={clsx(
              "px-6 py-2 rounded-lg text-sm font-medium transition-all",
              uploadMode === 'yearly' ? "bg-emerald-600 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"
            )}
          >
            تقرير تراكمي/سنوي (Yearly Report)
          </button>
        </div>

        {uploadMode === 'daily' && (
          <>
            {/* Date Selection */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-4 block">Select Date</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-zinc-300 rounded-xl p-4 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Shift Type Selection */}
            <div>
              <label className="text-sm font-medium text-zinc-300 mb-4 block">Working Hours Type</label>
              <div className="grid grid-cols-2 gap-4 mb-4">
                 <label 
                    className={clsx(
                      "flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      shiftType === 'shift' 
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                    onClick={() => setShiftType('shift')}
                  >
                    <span className="font-medium">شفتات (Shifts)</span>
                  </label>
                  <label 
                    className={clsx(
                      "flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                      shiftType === 'official' 
                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                        : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                    )}
                    onClick={() => setShiftType('official')}
                  >
                    <span className="font-medium">دوام رسمي (Official)</span>
                  </label>
              </div>

              {shiftType === 'shift' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
                  {[
                    { id: 'shift1', label: 'Shift 1' },
                    { id: 'shift2', label: 'Shift 2' },
                    { id: 'shift3', label: 'Shift 3' },
                    { id: 'all', label: 'All Shifts' }
                  ].map(s => (
                    <label 
                      key={s.id} 
                      className={clsx(
                        "flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all",
                        shift === s.id 
                          ? "bg-blue-500/10 border-blue-500/50 text-blue-400" 
                          : "bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700"
                      )}
                      onClick={() => setShift(s.id)}
                    >
                      <div className={clsx(
                        "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                        shift === s.id ? "border-blue-400" : "border-zinc-600"
                      )}>
                        {shift === s.id && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                      </div>
                      <span className="font-medium text-sm">{s.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Drag and Drop Zone */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={clsx(
            "relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-colors text-center",
            dragActive ? "border-blue-500 bg-blue-500/5" : "border-zinc-700 bg-zinc-900/20",
            status === 'success' && "border-emerald-500/50 bg-emerald-500/5",
            status === 'error' && "border-danger/50 bg-danger/5"
          )}
        >
          <input
            type="file"
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          
          {status === 'success' ? (
            <div className="flex flex-col items-center text-emerald-400 animate-in zoom-in">
              <CheckCircle className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold mb-1">Upload Complete</h3>
              <p className="text-sm opacity-80">Data has been successfully imported to the database.</p>
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center text-danger">
              <AlertCircle className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold mb-1">Upload Failed</h3>
              <p className="text-sm opacity-80">There was an error parsing the file. Please try again.</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center text-blue-400">
              <FileSpreadsheet className="w-16 h-16 mb-4" />
              <h3 className="text-xl font-bold mb-1">{file.name}</h3>
              <p className="text-sm opacity-80">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center text-zinc-400">
              <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                <UploadCloud className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-zinc-200 mb-2">Drag & Drop your file here</h3>
              <p className="text-sm max-w-sm mb-6">Supports Excel (.xlsx), CSV, and PDF formats. The system will automatically parse and save the data.</p>
              <button className="px-6 py-2.5 rounded-full bg-zinc-800 text-white text-sm font-medium hover:bg-zinc-700 transition-colors pointer-events-none">
                Browse Files
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button 
          onClick={handleUpload}
          disabled={!file || status === 'uploading' || status === 'success'}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold text-lg hover:from-blue-500 hover:to-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.2)]"
        >
          {status === 'uploading' ? 'Processing...' : 'Upload & Process Data'}
        </button>

      </div>

      {/* History Section */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Download className="w-5 h-5 text-blue-400" />
          سجل الملفات المرفوعة (Downloads)
        </h2>
        
        <div className="flex flex-col gap-4">
          {history.length === 0 ? (
            <div className="text-zinc-500 text-center py-8 glass rounded-2xl border border-border">
              No files uploaded yet.
            </div>
          ) : (
            history.map((item) => (
              <div 
                key={item.id}
                className="glass rounded-xl p-5 border border-border flex items-center justify-between hover:bg-white/5 transition-colors group"
              >
                <div 
                  className="flex items-center gap-4 cursor-pointer flex-1"
                  onClick={() => setSelectedHistory(item)}
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-white mb-1">{item.filename}</h4>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                      <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {item.date}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {new Date(item.timestamp).toLocaleTimeString()}</span>
                      <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-xs text-zinc-300 capitalize">{item.shift}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div 
                    onClick={() => setSelectedHistory(item)}
                    className="text-sm font-medium text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer px-4 py-2 hover:bg-blue-500/10 rounded-lg"
                  >
                    View Data
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(item.id);
                    }}
                    className="p-2 text-zinc-500 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                    title="Delete Report"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2">Delete Report?</h3>
            <p className="text-zinc-400 mb-6 text-sm">
              Are you sure you want to delete this report? This will remove its data from the dashboard entirely. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-white font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-lg bg-danger text-white font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for viewing full data */}
      {selectedHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="glass rounded-3xl border border-border w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-border flex items-center justify-between bg-zinc-900/50">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">{selectedHistory.filename}</h3>
                <p className="text-sm text-zinc-400">Uploaded on {new Date(selectedHistory.timestamp).toLocaleString()} • Shift: {selectedHistory.shift}</p>
              </div>
              <button 
                onClick={() => setSelectedHistory(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-auto bg-zinc-950/50">
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
                {Object.entries(selectedHistory.summary).map(([key, val]) => (
                  <div key={key} className="glass p-4 rounded-xl border border-border text-center">
                    <div className="text-xs text-zinc-400 uppercase tracking-wider mb-1">{key}</div>
                    <div className="text-xl font-bold text-white">{val as number}</div>
                  </div>
                ))}
              </div>

              {/* Full Data Table */}
              <h4 className="font-semibold text-white mb-4">Raw Data Rows</h4>
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-zinc-900/80 text-zinc-400 border-b border-border">
                      <tr>
                        {selectedHistory.rows.length > 0 && Object.keys(selectedHistory.rows[0]).map(key => (
                          <th key={key} className="px-6 py-4 font-medium whitespace-nowrap">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {selectedHistory.rows.map((row: any, i: number) => (
                        <tr key={i} className="bg-transparent hover:bg-white/5 transition-colors">
                          {Object.values(row).map((val: any, j: number) => (
                            <td key={j} className="px-6 py-3 text-zinc-300">{val}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
