import React, { useState } from 'react';
import { MeetingCompletionLog } from '../types/meeting';
import { X, Search, Calendar, Camera, User, Users, Trash2, Maximize2 } from 'lucide-react';
import { deleteLog } from '../services/storage';

interface MeetingHistoryModalProps {
  logs: MeetingCompletionLog[];
  onClose: () => void;
  onRefresh: () => void;
}

export const MeetingHistoryModal: React.FC<MeetingHistoryModalProps> = ({ logs, onClose, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedUnit, setSelectedUnit] = useState<string>('All');
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.meetingName.toLowerCase().includes(search.toLowerCase()) ||
      log.department.toLowerCase().includes(search.toLowerCase()) ||
      log.leadBy.toLowerCase().includes(search.toLowerCase()) ||
      log.mom.toLowerCase().includes(search.toLowerCase());

    const matchesUnit = selectedUnit === 'All' || log.unit === selectedUnit;
    return matchesSearch && matchesUnit;
  });

  const handleDelete = (logId: string) => {
    if (confirm('Are you sure you want to delete this meeting proof log?')) {
      deleteLog(logId);
      onRefresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-4xl w-full shadow-2xl relative my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Meeting Proof History Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Total {logs.length} completed meetings with uploaded photo verification
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="py-4 flex flex-col sm:flex-row gap-3 shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search history by meeting name, MoM notes, lead..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="All">All Units</option>
            <option value="Windows HO">Windows HO</option>
            <option value="Furniture HO">Furniture HO</option>
            <option value="Windows Factory">Windows Factory</option>
            <option value="Kitchen Factory">Kitchen Factory</option>
          </select>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-300">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
              <Camera className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">No completed meeting logs found.</p>
              <p className="text-xs text-slate-500 mt-1">Upload meeting photos on today's cards to populate history.</p>
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-slate-50/70 border border-slate-200 hover:border-blue-200 rounded-2xl p-5 space-y-3 transition"
              >
                {/* Log Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                        {log.unit}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white text-slate-700 border border-slate-200">
                        {log.department}
                      </span>
                      <span className="text-xs font-mono font-bold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {log.completedDate}
                      </span>
                    </div>

                    <h4 className="text-base font-extrabold text-slate-900 mt-1.5">{log.meetingName}</h4>
                  </div>

                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Delete log entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Photo Gallery Grid */}
                {log.photos.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Camera className="w-3 h-3 text-blue-600" /> Proof Photos ({log.photos.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {log.photos.map((photo, idx) => (
                        <div
                          key={idx}
                          className="relative group rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm"
                          onClick={() => setActiveLightboxImage(photo)}
                        >
                          <img
                            src={photo}
                            alt={`Proof ${idx + 1}`}
                            className="w-20 h-20 object-cover group-hover:scale-105 transition"
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            <Maximize2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MoM Notes */}
                {log.mom && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-800">
                    <strong className="text-blue-900 block mb-1">Minutes of Meeting:</strong>
                    <p className="leading-relaxed whitespace-pre-wrap">{log.mom}</p>
                  </div>
                )}

                {/* Attendees */}
                <div className="flex items-center gap-4 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>Lead: <strong className="text-slate-900">{log.leadBy || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Present: <strong className="text-slate-900">{log.actualAttendees.join(', ')}</strong></span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-60 bg-slate-900/90 flex items-center justify-center p-4"
          onClick={() => setActiveLightboxImage(null)}
        >
          <button
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-4 right-4 p-3 text-white rounded-full bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeLightboxImage}
            alt="Full size proof"
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl border border-slate-700"
          />
        </div>
      )}
    </div>
  );
};
