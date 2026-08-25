import React, { useState } from 'react';
import { Meeting, MeetingCompletionLog } from '../types/meeting';
import { getNextScheduledDate, formatDateDisplay } from '../utils/frequencyEngine';
import { Clock, User, Users, Camera, CheckCircle2, BellRing, Calendar, Edit3, Image as ImageIcon, Trash2, AlertTriangle, Loader2, Lock } from 'lucide-react';

interface MeetingCardProps {
  meeting: Meeting;
  selectedDate: Date;
  isScheduled: boolean;
  completionLog?: MeetingCompletionLog;
  isAdmin?: boolean;
  onOpenUpload: (meeting: Meeting) => void;
  onTriggerAlarm: (meeting: Meeting) => void;
  onViewPhotos: (log: MeetingCompletionLog) => void;
  onEditMeeting: (meeting: Meeting) => void;
  onDeleteMeeting?: (meetingId: string) => Promise<void>;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  selectedDate,
  isScheduled,
  completionLog,
  isAdmin = false,
  onOpenUpload,
  onTriggerAlarm,
  onViewPhotos,
  onEditMeeting,
  onDeleteMeeting,
}) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const isSunday = selectedDate.getDay() === 0;
  const isCompleted = !!completionLog;

  const nextDate = !isScheduled ? getNextScheduledDate(meeting, new Date(selectedDate.getTime() + 86400000)) : null;

  const handleConfirmDelete = async () => {
    if (!onDeleteMeeting) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await onDeleteMeeting(meeting.id);
      setShowConfirmDelete(false);
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(err.message || 'Failed to delete meeting. Ensure you have Admin privileges.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Unit Badge Colors
  const getUnitTheme = (unit: string) => {
    switch (unit) {
      case 'Windows HO':
        return {
          badge: 'bg-sky-50 text-sky-800 border-sky-200',
          accent: 'from-sky-500 to-blue-600',
        };
      case 'Furniture HO':
        return {
          badge: 'bg-amber-50 text-amber-900 border-amber-200',
          accent: 'from-amber-500 to-orange-500',
        };
      case 'Windows Factory':
        return {
          badge: 'bg-blue-50 text-blue-900 border-blue-200',
          accent: 'from-blue-600 to-indigo-600',
        };
      case 'Kitchen Factory':
        return {
          badge: 'bg-emerald-50 text-emerald-900 border-emerald-200',
          accent: 'from-emerald-500 to-teal-600',
        };
      default:
        return {
          badge: 'bg-slate-100 text-slate-800 border-slate-200',
          accent: 'from-slate-500 to-slate-600',
        };
    }
  };

  const theme = getUnitTheme(meeting.unit);

  return (
    <div
      className={`bg-white rounded-2xl border ${
        isScheduled && !isCompleted
          ? 'border-emerald-300 ring-2 ring-emerald-100 shadow-md'
          : isCompleted
          ? 'border-blue-200 bg-slate-50/50'
          : 'border-slate-200/90 shadow-sm hover:shadow-md'
      } p-5 transition-all duration-200 flex flex-col justify-between relative overflow-hidden group`}
    >
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${theme.accent}`} />

      <div>
        {/* Unit & Status Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${theme.badge}`}>
            {meeting.unit}
          </span>
          <div className="flex items-center gap-1.5">
            {isScheduled ? (
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Scheduled Today
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                Not Scheduled
              </span>
            )}
          </div>
        </div>

        {/* Meeting Name */}
        <h3 className="font-extrabold text-base text-slate-900 leading-snug tracking-tight mb-2 group-hover:text-blue-700 transition-colors">
          {meeting.meetingName}
        </h3>

        {/* Meeting Meta Info */}
        <div className="space-y-1.5 text-xs text-slate-600 mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-bold text-slate-800">{meeting.scheduledTime}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium">{meeting.frequency}</span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-500">{meeting.reportingDay}</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-slate-500">Lead:</span>
            <span className="font-semibold text-slate-800">{meeting.leadBy || 'N/A'}</span>
          </div>

          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-slate-500">Attendees: </span>
              <span className="font-medium text-slate-700">
                {meeting.attendees.length > 0 ? meeting.attendees.join(', ') : 'All Team Members'}
              </span>
            </div>
          </div>

          {meeting.notes && (
            <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 mt-2 font-medium">
              💡 {meeting.notes}
            </p>
          )}
        </div>

        {/* Completed Proof Banner */}
        {completionLog && (
          <div className="mt-3 p-3 rounded-xl bg-blue-50/80 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-blue-900 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Logged Proof
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {new Date(completionLog.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Thumbnail Gallery */}
            {completionLog.photos.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1">
                {completionLog.photos.map((photo, idx) => (
                  <img
                    key={idx}
                    src={photo}
                    alt={`Proof ${idx + 1}`}
                    className="w-12 h-12 rounded-lg object-cover border border-blue-300 cursor-pointer hover:scale-105 transition"
                    onClick={() => onViewPhotos(completionLog)}
                  />
                ))}
                <button
                  onClick={() => onViewPhotos(completionLog)}
                  className="text-xs text-blue-700 font-bold hover:underline px-2"
                >
                  View All ({completionLog.photos.length})
                </button>
              </div>
            )}
            {completionLog.mom && (
              <p className="text-xs text-slate-700 line-clamp-2 italic">
                "{completionLog.mom}"
              </p>
            )}
          </div>
        )}

        {/* Next Scheduled Date */}
        {!isScheduled && nextDate && !isSunday && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Next scheduled:</span>
            <strong className="text-slate-800">{formatDateDisplay(nextDate)}</strong>
          </div>
        )}
      </div>

      {/* Card Actions Footer */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        {/* Trigger Alarm Test */}
        <button
          onClick={() => onTriggerAlarm(meeting)}
          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
          title="Trigger alarm test chime for this meeting"
        >
          <BellRing className="w-3.5 h-3.5 text-amber-600" />
          <span>Alarm</span>
        </button>

        {/* Edit Button (Admin Only) */}
        {isAdmin && (
          <button
            onClick={() => onEditMeeting(meeting)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs transition"
            title="Edit meeting details or time (Admin Only)"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Admin Delete Button */}
        {isAdmin && onDeleteMeeting && (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition"
            title="Delete this meeting (Admin Only)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Primary Action Button */}
        {isCompleted ? (
          <button
            onClick={() => onViewPhotos(completionLog!)}
            className="flex-1 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
            <span>View Proof</span>
          </button>
        ) : isAdmin ? (
          <button
            onClick={() => onOpenUpload(meeting)}
            disabled={isSunday}
            className={`flex-1 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 ${
              isSunday
                ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-800 text-white shadow-blue-700/20'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Upload Photo & Log</span>
          </button>
        ) : (
          <div className="flex-1 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-semibold flex items-center justify-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>Pending Admin Log</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal Dialog */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Delete Meeting Schedule?
            </h3>
            <p className="text-xs text-slate-500 mt-1.5">
              Are you sure you want to delete <strong className="text-slate-800">{meeting.meetingName}</strong> ({meeting.unit})? This action will remove the schedule from Supabase.
            </p>

            {deleteError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-md shadow-rose-600/20 transition flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
