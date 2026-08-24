import React, { useState, useEffect } from 'react';
import { Bell, Volume2, VolumeX, Calendar, Sparkles, Image as ImageIcon, LogOut, FileSpreadsheet, Users } from 'lucide-react';
import { playTestAlarmSound } from '../utils/soundEngine';
import { formatDateDisplay } from '../utils/frequencyEngine';
import { supabase } from '../services/supabaseClient';

interface NavbarProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  alarmSoundEnabled: boolean;
  setAlarmSoundEnabled: (enabled: boolean) => void;
  onOpenHistory: () => void;
  onOpenAddMeeting: () => void;
  onOpenExportExcel: () => void;
  onOpenManageUsers?: () => void;
  totalLogsCount: number;
  userEmail?: string;
  isAdmin?: boolean;
  onSignOut?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  selectedDate,
  setSelectedDate,
  alarmSoundEnabled,
  setAlarmSoundEnabled,
  onOpenHistory,
  onOpenAddMeeting,
  onOpenExportExcel,
  onOpenManageUsers,
  totalLogsCount,
  userEmail,
  isAdmin = false,
  onSignOut,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const handleTestSound = () => {
    playTestAlarmSound();
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    if (onSignOut) {
      onSignOut();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Skyler World Logo & Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <img
                src="/skyler-logo.jpg"
                alt="Skyler World Logo"
                className="h-11 object-contain rounded-lg border border-slate-100 shadow-sm"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="font-extrabold text-xl tracking-tight text-blue-900">
                    Skyler World
                  </h1>
                  <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-blue-200">
                    Corporate
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Meeting Schedule & Proof Alarm Dashboard
                </p>
              </div>
            </div>

            {/* Mobile History Logs & Actions */}
            <div className="md:hidden flex items-center gap-1.5">
              {isAdmin && onOpenManageUsers && (
                <button
                  onClick={onOpenManageUsers}
                  className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition"
                  title="Manage User Requests"
                >
                  <Users className="w-4 h-4 text-amber-700" />
                </button>
              )}

              <button
                onClick={onOpenExportExcel}
                className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 transition"
                title="Export Excel Report"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              </button>

              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-900 hover:bg-blue-100 transition"
              >
                <ImageIcon className="w-4 h-4 text-blue-700" />
                Logs ({totalLogsCount})
              </button>
            </div>
          </div>

          {/* Live Corporate Clock & Date Badge */}
          <div className="flex items-center gap-3.5 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/80 shadow-inner">
            <div className="flex items-center gap-2 text-blue-900">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold tracking-wide uppercase">
                {formatDateDisplay(currentTime)}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-300"></div>
            <div className="font-mono text-sm font-extrabold text-blue-700 tracking-wider">
              {currentTime.toLocaleTimeString('en-US', { hour12: true })}
            </div>
          </div>

          {/* Controls & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin User Management Button */}
            {isAdmin && onOpenManageUsers && (
              <button
                onClick={onOpenManageUsers}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold shadow-sm transition active:scale-95"
                title="Admin: Manage user access requests"
              >
                <Users className="w-4 h-4 text-amber-700" />
                <span>Manage Users</span>
              </button>
            )}

            {/* Sound Alarm Toggle */}
            <button
              onClick={() => setAlarmSoundEnabled(!alarmSoundEnabled)}
              title={alarmSoundEnabled ? "Alarm Sound Enabled" : "Alarm Sound Muted"}
              className={`p-2.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold ${
                alarmSoundEnabled
                  ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                  : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {alarmSoundEnabled ? <Volume2 className="w-4 h-4 text-blue-600" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
              <span className="hidden sm:inline">{alarmSoundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            {/* Test Alarm Sound */}
            <button
              onClick={handleTestSound}
              className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
              title="Test meeting alarm audio tone"
            >
              <Bell className="w-4 h-4 text-amber-600 animate-bounce" />
              <span className="hidden sm:inline">Test Alarm</span>
            </button>

            {/* Export Excel Report Button */}
            <button
              onClick={onOpenExportExcel}
              className="hidden md:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-sm transition active:scale-95"
              title="Export formatted Excel report with meeting proofs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Export Excel</span>
            </button>

            {/* Desktop Notification Request */}
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition"
                title="Enable Desktop Alerts"
              >
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="hidden lg:inline">Allow Alerts</span>
              </button>
            )}

            {/* Proof Logs Button */}
            <button
              onClick={onOpenHistory}
              className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-900 text-xs font-bold shadow-sm transition active:scale-95"
            >
              <ImageIcon className="w-4 h-4 text-blue-600" />
              <span>Proof Logs ({totalLogsCount})</span>
            </button>

            {/* Add Custom Meeting */}
            <button
              onClick={onOpenAddMeeting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">+ Add Meeting</span>
            </button>

            {/* Subtle Sign-Out Button */}
            {userEmail && (
              <button
                onClick={handleSignOut}
                title={`Signed in as ${userEmail}. Click to Sign Out`}
                className="p-2 rounded-xl bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-600 transition flex items-center gap-1 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
