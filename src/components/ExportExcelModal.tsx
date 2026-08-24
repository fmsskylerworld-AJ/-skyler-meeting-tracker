import React, { useState } from 'react';
import { FileSpreadsheet, Calendar, X, Download, CheckCircle2, Loader2, Filter } from 'lucide-react';
import { Meeting, MeetingCompletionLog } from '../types/meeting';
import { generateExcelReport } from '../utils/excelExporter';
import { formatDateKey } from '../utils/frequencyEngine';

interface ExportExcelModalProps {
  meetings: Meeting[];
  logs: MeetingCompletionLog[];
  selectedDate: Date;
  onClose: () => void;
}

export const ExportExcelModal: React.FC<ExportExcelModalProps> = ({
  meetings,
  logs,
  selectedDate,
  onClose,
}) => {
  const [exportType, setExportType] = useState<'single' | 'range' | 'all'>('single');
  const [fromDate, setFromDate] = useState<string>(formatDateKey(selectedDate));
  const [toDate, setToDate] = useState<string>(formatDateKey(selectedDate));
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExport = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsExporting(true);
    setErrorMsg(null);
    setIsSuccess(false);

    try {
      const fromParts = fromDate.split('-').map(Number);
      const toParts = toDate.split('-').map(Number);

      const parsedFrom = new Date(fromParts[0], fromParts[1] - 1, fromParts[2]);
      const parsedTo = new Date(toParts[0], toParts[1] - 1, toParts[2]);

      if (exportType === 'range' && parsedFrom > parsedTo) {
        throw new Error('From Date cannot be after To Date.');
      }

      await new Promise(res => setTimeout(res, 300));

      generateExcelReport({
        meetings,
        logs,
        exportType,
        singleDate: selectedDate,
        fromDate: parsedFrom,
        toDate: parsedTo,
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Excel Export Error:', err);
      setErrorMsg(err.message || 'Failed to generate Excel report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">
                Export Executive Meeting Report
              </h3>
              <p className="text-xs text-slate-400">
                Generate formatted Excel (.xlsx) matrix with proof logs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExport} className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
              {errorMsg}
            </div>
          )}

          {isSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Excel Report downloaded successfully!</span>
            </div>
          )}

          {/* Export Scope Option */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" />
              Select Date Reporting Scope
            </label>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setExportType('single')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  exportType === 'single'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Selected Date</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('range')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  exportType === 'range'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Date Range</span>
              </button>

              <button
                type="button"
                onClick={() => setExportType('all')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  exportType === 'all'
                    ? 'bg-blue-50 border-blue-600 text-blue-900 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>All Dates</span>
              </button>
            </div>
          </div>

          {/* Date Picker Controls */}
          {exportType === 'single' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="block text-xs font-bold text-slate-600 mb-1">Target Single Date</span>
              <p className="text-sm font-extrabold text-blue-900">
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          )}

          {exportType === 'range' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">From Date</label>
                <input
                  type="date"
                  required
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">To Date</label>
                <input
                  type="date"
                  required
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white"
                />
              </div>
            </div>
          )}

          {exportType === 'all' && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600">
              Exports all recorded meetings and history proof logs across all available dates into a consolidated report.
            </div>
          )}

          {/* Report Features Included Banner */}
          <div className="border-t border-slate-100 pt-3">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Features Included in .XLSX:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Executive Summary Sheet</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Individual Proof Photos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Auto-sized Columns</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                <span>Column Auto-Filters</span>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isExporting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition flex items-center gap-2 disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Generating Excel...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download .XLSX</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
