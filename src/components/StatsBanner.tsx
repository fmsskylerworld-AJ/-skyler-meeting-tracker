import React from 'react';
import { Calendar, CheckCircle2, Clock, ShieldAlert, Award, Camera } from 'lucide-react';

interface StatsBannerProps {
  totalMeetingsCount: number;
  scheduledTodayCount: number;
  completedTodayCount: number;
  totalPhotosUploaded: number;
  selectedDate: Date;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  totalMeetingsCount,
  scheduledTodayCount,
  completedTodayCount,
  totalPhotosUploaded,
  selectedDate,
}) => {
  const isSunday = selectedDate.getDay() === 0;
  const completionPercentage =
    scheduledTodayCount > 0 ? Math.round((completedTodayCount / scheduledTodayCount) * 100) : 0;

  return (
    <div className="space-y-4 mb-6">
      {/* Sunday Policy Alert Banner */}
      {isSunday && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-amber-100 text-amber-800 rounded-xl ring-1 ring-amber-300/60">
            <ShieldAlert className="w-6 h-6 animate-bounce text-amber-700" />
          </div>
          <div>
            <h3 className="font-bold text-amber-950 text-base flex items-center gap-2">
              Sunday Exception Policy Active
              <span className="text-xs bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-bold border border-amber-300">
                CORPORATE OFF-DAY
              </span>
            </h3>
            <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
              Per Skyler World meeting rules, <strong>no meetings or alarms are scheduled on Sundays</strong> across Windows HO, Furniture HO, Windows Factory, or Kitchen Factory. Have a great off-day!
            </p>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Meetings */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4.5 flex items-center justify-between shadow-sm hover:shadow-md transition">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tracked</p>
            <h4 className="text-2xl font-black text-blue-950 mt-1">{totalMeetingsCount}</h4>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Across 4 Corporate Units</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Scheduled Today */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4.5 flex items-center justify-between shadow-sm hover:shadow-md transition">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Scheduled Today</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-black text-emerald-600">{scheduledTodayCount}</h4>
              <span className="text-xs text-slate-500 font-medium">meetings due</span>
            </div>
            <p className="text-[11px] font-semibold text-emerald-700 mt-1">
              {isSunday ? '0 Scheduled (Sunday Off)' : `${scheduledTodayCount} active alarm rules`}
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Completed Today */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4.5 flex items-center justify-between shadow-sm hover:shadow-md transition">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Today</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h4 className="text-2xl font-black text-blue-700">{completedTodayCount}</h4>
              <span className="text-xs text-slate-500 font-semibold">/ {scheduledTodayCount} ({completionPercentage}%)</span>
            </div>
            {/* Progress bar */}
            <div className="w-28 bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200">
              <div
                className="bg-blue-600 h-full transition-all duration-500 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Stored Proof Photos */}
        <div className="bg-white border border-sky-100 rounded-2xl p-4.5 flex items-center justify-between shadow-sm hover:shadow-md transition">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proof Photos Stored</p>
            <h4 className="text-2xl font-black text-purple-900 mt-1">{totalPhotosUploaded}</h4>
            <p className="text-[11px] text-purple-700 font-semibold mt-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              Verified Attendance Logs
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <Camera className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
};
