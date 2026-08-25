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
  userName?: string;
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
  userName,
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

  const displayName = userName || (userEmail ? userEmail.split('@')[0] : '');

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 text-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 lg:gap-4">
          
          {/* Skyler World Logo & Dynamic User Name */}
          <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto justify-between lg:justify-start">
            <div className="flex items-center gap-3">
              <img
                src="/skyler-logo.jpg"
                alt="Skyler World Logo"
                className="h-10 sm:h-11 object-contain rounded-lg border border-slate-100 shadow-sm shrink-0"
              />
              <div className="min-w-0">
                <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-blue-900 whitespace-nowrap flex items-center gap-2">
                  <span>Skyler World</span>
                  {displayName && (
                    <span className="text-slate-300 font-light">|</span>
                  )}
                  {displayName && (
                    <span className="text-blue-700 font-bold tracking-normal">{displayName}</span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  Meeting Scheduler
                </p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="lg:hidden flex items-center gap-1.5">
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

              {onSignOut && (
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                </button>
              )}
            </div>
          </div>

          {/* Center/Right Container: Live Clock + Action Controls */}
          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto">
            {/* Live Clock Badge */}
            <div className="shrink-0 flex items-center gap-3 bg-slate-50 px-3.5 py-1.5 sm:py-2 rounded-xl border border-slate-200/80 shadow-inner">
              <div className="flex items-center gap-1.5 text-blue-900">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-xs font-bold tracking-wide uppercase">
                  {formatDateDisplay(currentTime)}
                </span>
              </div>
              <div className="h-3.5 w-px bg-slate-300"></div>
              <div className="font-mono text-xs sm:text-sm font-extrabold text-blue-700 tracking-wider">
                {currentTime.toLocaleTimeString('en-US', { hour12: true })}
              </div>
            </div>

            {/* Desktop Controls & Actions */}
            <div className="hidden lg:flex items-center gap-2 sm:gap-2.5 flex-wrap justify-end">
              {/* Admin User Management Button */}
              {isAdmin && onOpenManageUsers && (
                <button
                  onClick={onOpenManageUsers}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
                  title="Admin: Manage user access requests"
                >
                  <Users className="w-3.5 h-3.5 text-amber-700" />
                  <span>Manage Users</span>
                </button>
              )}

              {/* Sound Alarm Toggle */}
              <button
                onClick={() => setAlarmSoundEnabled(!alarmSoundEnabled)}
                title={alarmSoundEnabled ? "Alarm Sound Enabled" : "Alarm Sound Muted"}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
                  alarmSoundEnabled
                    ? 'bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100'
                    : 'bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {alarmSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                <span className="hidden xl:inline">{alarmSoundEnabled ? 'Sound On' : 'Muted'}</span>
              </button>

              {/* Test Alarm Sound */}
              <button
                onClick={handleTestSound}
                className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0"
                title="Test meeting alarm audio tone"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                <span className="hidden xl:inline">Test Alarm</span>
              </button>

              {/* Export Excel Report Button */}
              <button
                onClick={onOpenExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
                title="Export formatted Excel report with meeting proofs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel</span>
              </button>

              {/* Desktop Notification Request */}
              {notificationPermission !== 'granted' && (
                <button
                  onClick={requestNotificationPermission}
                  className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold flex items-center gap-1.5 transition shrink-0"
                  title="Enable Desktop Alerts"
                >
                  <Bell className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden xl:inline">Allow Alerts</span>
                </button>
              )}

              {/* Proof Logs Button */}
              <button
                onClick={onOpenHistory}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-900 text-xs font-bold shadow-sm transition active:scale-95 shrink-0"
              >
                <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                <span>Proof Logs ({totalLogsCount})</span>
              </button>

              {/* Add Custom Meeting (Admin Only) */}
              {isAdmin && (
                <button
                  onClick={onOpenAddMeeting}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold shadow-md shadow-blue-700/20 transition active:scale-95 shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span className="hidden xl:inline">+ Add Meeting</span>
                </button>
              )}

              {/* Clearly Visible Sign-Out Button */}
              {onSignOut && (
                <button
                  onClick={handleSignOut}
                  title={userEmail ? `Signed in as ${userEmail}. Click to Sign Out` : "Sign Out of Dashboard"}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition active:scale-95 shadow-sm shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden xl:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
