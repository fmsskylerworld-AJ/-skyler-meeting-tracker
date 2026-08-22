import React, { useEffect } from 'react';
import { Meeting } from '../types/meeting';
import { BellRing, Clock, Camera, X, User } from 'lucide-react';
import { playMeetingAlarmSound } from '../utils/soundEngine';

interface AlarmModalProps {
  meeting: Meeting;
  onDismiss: () => void;
  onOpenUpload: (meeting: Meeting) => void;
  soundEnabled: boolean;
}

export const AlarmModal: React.FC<AlarmModalProps> = ({
  meeting,
  onDismiss,
  onOpenUpload,
  soundEnabled,
}) => {
  useEffect(() => {
    if (soundEnabled) {
      playMeetingAlarmSound();
      const interval = setInterval(() => {
        playMeetingAlarmSound();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [soundEnabled]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white border-2 border-emerald-500 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden animate-scale-up">
        {/* Glow Accent */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-emerald-100 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-blue-100 rounded-full blur-2xl" />

        {/* Close Button */}
        <button
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Alarm Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-4 rounded-3xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 animate-bounce">
            <BellRing className="w-10 h-10" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 uppercase tracking-widest">
              MEETING ALARM TRIGGERED
            </span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">
              {meeting.meetingName}
            </h2>
            <p className="text-xs font-bold text-blue-800 mt-1 flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" /> Scheduled at {meeting.scheduledTime} ({meeting.unit})
            </p>
          </div>
        </div>

        {/* Meeting Details Card */}
        <div className="mt-6 bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs text-slate-700">
          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Department:</span>
            <span className="font-bold text-slate-900">{meeting.department}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Frequency & Day:</span>
            <span className="font-bold text-blue-900">{meeting.frequency} ({meeting.reportingDay})</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-medium">Lead By:</span>
            <span className="font-bold text-amber-900 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-amber-600" /> {meeting.leadBy || 'N/A'}
            </span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-slate-500 font-medium">Attendees:</span>
            <div className="flex flex-wrap gap-1 justify-end max-w-[220px]">
              {meeting.attendees.map((person, idx) => (
                <span key={idx} className="bg-white border border-slate-200 text-slate-800 px-2 py-0.5 rounded text-[11px] font-semibold">
                  {person}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          {/* Upload Photo & Complete */}
          <button
            onClick={() => {
              onDismiss();
              onOpenUpload(meeting);
            }}
            className="flex-1 py-3.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md shadow-blue-700/20 flex items-center justify-center gap-2 transition active:scale-95"
          >
            <Camera className="w-5 h-5" />
            Upload Photo & Complete
          </button>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="py-3.5 px-5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};
