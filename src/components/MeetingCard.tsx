import React from 'react';
import { Meeting, MeetingCompletionLog } from '../types/meeting';
import { getNextScheduledDate, formatDateDisplay } from '../utils/frequencyEngine';
import { Clock, User, Users, Camera, CheckCircle2, BellRing, Calendar, Edit3, Image as ImageIcon } from 'lucide-react';

interface MeetingCardProps {
  meeting: Meeting;
  selectedDate: Date;
  isScheduled: boolean;
  completionLog?: MeetingCompletionLog;
  onOpenUpload: (meeting: Meeting) => void;
  onTriggerAlarm: (meeting: Meeting) => void;
  onViewPhotos: (log: MeetingCompletionLog) => void;
  onEditMeeting: (meeting: Meeting) => void;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({
  meeting,
  selectedDate,
  isScheduled,
  completionLog,
  onOpenUpload,
  onTriggerAlarm,
  onViewPhotos,
  onEditMeeting,
}) => {
  const isSunday = selectedDate.getDay() === 0;
  const isCompleted = !!completionLog;

  const nextDate = !isScheduled ? getNextScheduledDate(meeting, new Date(selectedDate.getTime() + 86400000)) : null;

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
        {/* Card Header: Unit, Department, Status */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Unit Badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${theme.badge}`}>
              {meeting.unit}
            </span>

            {/* Department Badge */}
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {meeting.department}
            </span>

            {/* S.No Badge */}
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-slate-500 bg-slate-50 border border-slate-200">
              #{meeting.sNo}
            </span>
          </div>

          {/* Status Badge */}
          {isCompleted ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Completed
            </span>
          ) : isSunday ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200">
              Sunday Off
            </span>
          ) : isScheduled ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 animate-pulse">
              <BellRing className="w-3.5 h-3.5 text-emerald-600" /> Scheduled
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
              Not Today
            </span>
          )}
        </div>

        {/* Meeting Name */}
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-lg font-extrabold text-slate-900 group-hover:text-blue-700 transition">
            {meeting.meetingName}
          </h3>
          
          {/* Scheduled Time Badge */}
          <div className="flex items-center gap-1 text-blue-950 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 text-xs font-mono font-bold shrink-0">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            <span>{meeting.scheduledTime}</span>
          </div>
        </div>

        {/* Frequency & Reporting Day Box */}
        <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Frequency:</span>
            <span className="font-bold text-blue-900">{meeting.frequency}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Reporting Day:</span>
            <span className="font-bold text-emerald-700">{meeting.reportingDay}</span>
          </div>
        </div>

        {/* Lead By & Attendees List */}
        <div className="mt-3 space-y-2 text-xs">
          {/* Lead By */}
          <div className="flex items-center gap-2">
            <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-slate-500 font-medium">Lead By:</span>
            <span className="font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              {meeting.leadBy || 'N/A'}
            </span>
          </div>

          {/* Attendees */}
          <div className="flex items-start gap-2">
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-slate-500 font-medium mr-1.5">Attendees:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {meeting.attendees.map((person, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {person}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Completion Proof Preview */}
        {isCompleted && completionLog && (
          <div className="mt-4 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
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

        {/* Edit Button */}
        <button
          onClick={() => onEditMeeting(meeting)}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs transition"
          title="Edit meeting details or time"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </button>

        {/* Primary Action Button */}
        {isCompleted ? (
          <button
            onClick={() => onViewPhotos(completionLog!)}
            className="flex-1 px-3.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
          >
            <ImageIcon className="w-3.5 h-3.5 text-blue-700" />
            <span>View Proof</span>
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
};
