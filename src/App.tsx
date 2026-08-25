import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { Meeting, MeetingCompletionLog, UnitType, UserProfile } from './types/meeting';
import {
  fetchMeetingsAsync,
  saveMeetingAsync,
  deleteMeetingAsync,
  fetchLogsAsync,
  getAlarmSettings,
  saveAlarmSettings,
  migrateLocalStorageToSupabase
} from './services/storage';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
import { isMeetingScheduledOnDate, formatDateKey } from './utils/frequencyEngine';
import { Navbar } from './components/Navbar';
import { StatsBanner } from './components/StatsBanner';
import { UnitFilter } from './components/UnitFilter';
import { DateNavigator } from './components/DateNavigator';
import { MeetingCard } from './components/MeetingCard';
import { AlarmModal } from './components/AlarmModal';
import { UploadPhotoModal } from './components/UploadPhotoModal';
import { MeetingHistoryModal } from './components/MeetingHistoryModal';
import { AddMeetingModal } from './components/AddMeetingModal';
import { ExportExcelModal } from './components/ExportExcelModal';
import { AdminUsersModal } from './components/AdminUsersModal';
import { LoginModal } from './components/LoginModal';
import { Calendar, Loader2, Clock, XCircle, LogOut } from 'lucide-react';

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string>('Admin');
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [logs, setLogs] = useState<MeetingCompletionLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedUnit, setSelectedUnit] = useState<UnitType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [alarmSoundEnabled, setAlarmSoundEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Modals state
  const [activeAlarmMeeting, setActiveAlarmMeeting] = useState<Meeting | null>(null);
  const [uploadModalMeeting, setUploadModalMeeting] = useState<Meeting | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isExportExcelOpen, setIsExportExcelOpen] = useState<boolean>(false);
  const [isManageUsersOpen, setIsManageUsersOpen] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Helper to load dashboard meetings & logs for an authenticated approved session
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      await migrateLocalStorageToSupabase();

      const fetchedMeetings = await fetchMeetingsAsync();
      const fetchedLogs = await fetchLogsAsync();
      const settings = getAlarmSettings();

      setMeetings(fetchedMeetings);
      setLogs(fetchedLogs);
      setAlarmSoundEnabled(settings.soundEnabled);
    } catch (err) {
      console.error('Error loading data for authenticated session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch Profile & Verify Approval Status
  const verifyUserProfile = useCallback(async (activeUser: User) => {
    if (!supabase) return;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', activeUser.id)
        .maybeSingle();

      const isAdmin = activeUser.email === 'fms.skylerworld@gmail.com' || 
                      activeUser.email === 'ope.skylerworld@gmail.com' || 
                      profileData?.role === 'Admin';

      if (profileData) {
        const prof: UserProfile = {
          id: profileData.id,
          name: profileData.name || activeUser.email?.split('@')[0] || 'User',
          email: profileData.email || activeUser.email || '',
          role: isAdmin ? 'Admin' : (profileData.role || 'Team Member'),
          unit: profileData.unit || (isAdmin ? 'All' : null),
          department: profileData.department || '',
          isActive: profileData.is_active ?? isAdmin,
          approvalStatus: isAdmin ? 'approved' : (profileData.approval_status || (profileData.is_active ? 'approved' : 'pending')),
          createdAt: profileData.created_at,
        };
        setUserProfile(prof);
        setUserRole(prof.role);

        if (isAdmin || prof.approvalStatus === 'approved') {
          await loadDashboardData();
        } else {
          setIsLoading(false);
        }
      } else {
        const prof: UserProfile = {
          id: activeUser.id,
          name: activeUser.email?.split('@')[0] || 'User',
          email: activeUser.email || '',
          role: isAdmin ? 'Admin' : 'Team Member',
          unit: isAdmin ? 'All' : null,
          isActive: isAdmin,
          approvalStatus: isAdmin ? 'approved' : 'pending',
        };
        setUserProfile(prof);
        setUserRole(prof.role);

        if (isAdmin) {
          await loadDashboardData();
        } else {
          setIsLoading(false);
        }
      }
    } catch (err) {
      console.error('Error verifying user profile:', err);
      if (activeUser.email === 'fms.skylerworld@gmail.com' || activeUser.email === 'ope.skylerworld@gmail.com') {
        setUserRole('Admin');
        await loadDashboardData();
      } else {
        setIsLoading(false);
      }
    }
  }, [loadDashboardData]);

  // Check initial Supabase Session on Mount & subscribe to auth changes
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured || !supabase) {
        setIsAuthChecking(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (mounted) {
          const currentSession = data.session;
          setSession(currentSession);
          const activeUser = currentSession?.user || null;
          setUser(activeUser);

          if (activeUser) {
            await verifyUserProfile(activeUser);
          } else {
            setIsLoading(false);
          }
        }
      } catch (err) {
        console.error('Error checking initial auth session:', err);
        setIsLoading(false);
      } finally {
        if (mounted) {
          setIsAuthChecking(false);
        }
      }
    }

    initAuth();

    let authListener: { unsubscribe: () => void } | null = null;
    if (isSupabaseConfigured && supabase) {
      const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !newSession) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setMeetings([]);
          setLogs([]);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(newSession);
          const newUser = newSession.user;
          setUser(newUser);
          if (newUser) {
            verifyUserProfile(newUser);
          }
        }
      });
      authListener = listener.subscription;
    }

    return () => {
      mounted = false;
      if (authListener) authListener.unsubscribe();
    };
  }, [loadDashboardData, verifyUserProfile]);

  const refreshLogs = async () => {
    const updated = await fetchLogsAsync();
    setLogs(updated);
  };

  const handleToggleSound = (enabled: boolean) => {
    setAlarmSoundEnabled(enabled);
    saveAlarmSettings({ ...getAlarmSettings(), soundEnabled: enabled });
  };

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setUserProfile(null);
    setMeetings([]);
    setLogs([]);
    setIsLoading(false);
  };

  // Real-time alarm scheduler tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      if (now.toDateString() !== selectedDate.toDateString()) return;

      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const dateKey = formatDateKey(now);

      meetings.forEach((m) => {
        if (!m.alarmEnabled) return;

        const isScheduledToday = isMeetingScheduledOnDate(m, now);
        if (isScheduledToday && m.scheduledTime === currentHHMM) {
          const alreadyCompleted = logs.some((l) => l.meetingId === m.id && l.completedDate === dateKey);

          if (!alreadyCompleted && (!activeAlarmMeeting || activeAlarmMeeting.id !== m.id)) {
            setActiveAlarmMeeting(m);

            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(`Skyler World Alarm: ${m.meetingName}`, {
                body: `Scheduled at ${m.scheduledTime} (${m.unit}). Lead by ${m.leadBy}`,
                icon: '/skyler-logo.jpg',
              });
            }
          }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [meetings, logs, selectedDate, activeAlarmMeeting]);

  const handleSaveMeeting = async (updated: Meeting) => {
    const newList = await saveMeetingAsync(updated);
    setMeetings(newList);
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    const newList = await deleteMeetingAsync(meetingId);
    setMeetings(newList);
  };

  const dateKey = formatDateKey(selectedDate);

  const evaluatedMeetings = useMemo(() => {
    return meetings.map((m) => {
      const isScheduled = isMeetingScheduledOnDate(m, selectedDate);
      const completionLog = logs.find((l) => l.meetingId === m.id && l.completedDate === dateKey);
      return {
        meeting: m,
        isScheduled,
        completionLog,
      };
    });
  }, [meetings, selectedDate, logs, dateKey]);

  const unitCounts = useMemo(() => {
    const counts: Record<string, number> = { All: meetings.length };
    meetings.forEach((m) => {
      counts[m.unit] = (counts[m.unit] || 0) + 1;
    });
    return counts;
  }, [meetings]);

  const scheduledTodayCount = useMemo(() => {
    return evaluatedMeetings.filter((item) => item.isScheduled).length;
  }, [evaluatedMeetings]);

  const completedTodayCount = useMemo(() => {
    return evaluatedMeetings.filter((item) => item.isScheduled && item.completionLog).length;
  }, [evaluatedMeetings]);

  const totalPhotosUploaded = useMemo(() => {
    return logs.reduce((acc, log) => acc + log.photos.length, 0);
  }, [logs]);

  const filteredList = useMemo(() => {
    return evaluatedMeetings.filter(({ meeting, isScheduled, completionLog }) => {
      if (selectedUnit !== 'All' && meeting.unit !== selectedUnit) return false;
      if (statusFilter === 'scheduled' && !isScheduled) return false;
      if (statusFilter === 'completed' && !completionLog) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = meeting.meetingName.toLowerCase().includes(q);
        const matchesDept = meeting.department.toLowerCase().includes(q);
        const matchesLead = meeting.leadBy.toLowerCase().includes(q);
        const matchesFreq = meeting.frequency.toLowerCase().includes(q);
        const matchesAttendees = meeting.attendees.some((a) => a.toLowerCase().includes(q));
        if (!matchesName && !matchesDept && !matchesLead && !matchesFreq && !matchesAttendees) {
          return false;
        }
      }

      return true;
    });
  }, [evaluatedMeetings, selectedUnit, statusFilter, searchQuery]);

  // 1. Show Loading Spinner while inspecting initial authentication session
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xl max-w-sm w-full flex flex-col items-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
          <h2 className="text-base font-extrabold text-slate-800">Verifying Security Session...</h2>
          <p className="text-xs text-slate-500 mt-1">Connecting to Skyler World Auth Portal</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated State -> Render ONLY Login Page
  if (!session) {
    return (
      <LoginModal
        onSuccess={() => {
          supabase?.auth.getSession().then(({ data }) => {
            if (data.session?.user) {
              setSession(data.session);
              setUser(data.session.user);
              verifyUserProfile(data.session.user);
            }
          });
        }}
      />
    );
  }

  // 3. Pending Approval State -> Render ONLY Pending Screen
  const isPendingApproval = session && userProfile && userProfile.role !== 'Admin' && userProfile.approvalStatus === 'pending';
  if (isPendingApproval) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-200 selection:text-blue-900">
        <div className="bg-white border border-amber-200 rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4 border border-amber-300">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Account Awaiting Admin Approval
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your registration request for <strong className="text-slate-800">{user?.email}</strong> has been submitted. An Administrator must review and approve your account before you can access the Meeting Tracker.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Rejected State -> Render ONLY Rejected Screen
  const isRejected = session && userProfile && userProfile.role !== 'Admin' && userProfile.approvalStatus === 'rejected';
  if (isRejected) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 selection:bg-blue-200 selection:text-blue-900">
        <div className="bg-white border border-rose-200 rounded-3xl p-8 text-center shadow-xl max-w-md w-full">
          <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-300">
            <XCircle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">
            Account Not Approved
          </h2>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Your account (<strong className="text-slate-800">{user?.email}</strong>) has not been approved for Meeting Tracker access. Please contact your Administrator.
          </p>
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center">
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isAdminUser = userRole === 'Admin';

  // 5. Authenticated & Approved State -> Render Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-200 selection:text-blue-900">
      {/* Top Navbar with Skyler World Logo */}
      <Navbar
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        alarmSoundEnabled={alarmSoundEnabled}
        setAlarmSoundEnabled={handleToggleSound}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAddMeeting={() => {
          setEditingMeeting(null);
          setIsAddModalOpen(true);
        }}
        onOpenExportExcel={() => setIsExportExcelOpen(true)}
        onOpenManageUsers={() => setIsManageUsersOpen(true)}
        totalLogsCount={logs.length}
        userEmail={user?.email}
        isAdmin={isAdminUser}
        onSignOut={handleSignOut}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Date Navigator */}
        <DateNavigator selectedDate={selectedDate} setSelectedDate={setSelectedDate} />

        {/* Overview Stats Banner */}
        <StatsBanner
          totalMeetingsCount={meetings.length}
          scheduledTodayCount={scheduledTodayCount}
          completedTodayCount={completedTodayCount}
          totalPhotosUploaded={totalPhotosUploaded}
          selectedDate={selectedDate}
        />

        {/* Unit Filter Tabs & Search */}
        <UnitFilter
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          unitCounts={unitCounts}
        />

        {/* Grid Section Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            Meeting Schedule Matrix ({filteredList.length})
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {isAdminUser ? 'Click "Upload Photo & Log" to record meeting proof' : 'Read-Only Employee Dashboard'}
          </span>
        </div>

        {/* Loading Spinner State */}
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center my-8 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-800">Syncing Skyler World Schedule Matrix...</p>
            <p className="text-xs text-slate-500 mt-1">Retrieving active meetings from Supabase</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center my-8 shadow-sm">
            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800">No meetings match your filter</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Try selecting a different unit tab, date, or clearing search query.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredList.map(({ meeting, isScheduled, completionLog }) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                selectedDate={selectedDate}
                isScheduled={isScheduled}
                completionLog={completionLog}
                isAdmin={isAdminUser}
                onOpenUpload={(m) => setUploadModalMeeting(m)}
                onTriggerAlarm={(m) => setActiveAlarmMeeting(m)}
                onViewPhotos={() => setIsHistoryOpen(true)}
                onEditMeeting={(m) => {
                  setEditingMeeting(m);
                  setIsAddModalOpen(true);
                }}
                onDeleteMeeting={handleDeleteMeeting}
              />
            ))}
          </div>
        )}
      </main>

      {/* Alarm Modal */}
      {activeAlarmMeeting && (
        <AlarmModal
          meeting={activeAlarmMeeting}
          soundEnabled={alarmSoundEnabled}
          onDismiss={() => setActiveAlarmMeeting(null)}
          onOpenUpload={(m) => setUploadModalMeeting(m)}
        />
      )}

      {/* Upload Photo Modal */}
      {uploadModalMeeting && (
        <UploadPhotoModal
          meeting={uploadModalMeeting}
          selectedDate={selectedDate}
          existingLog={logs.find((l) => l.meetingId === uploadModalMeeting.id && l.completedDate === dateKey)}
          onClose={() => setUploadModalMeeting(null)}
          onSuccess={refreshLogs}
        />
      )}

      {/* History Modal */}
      {isHistoryOpen && (
        <MeetingHistoryModal
          logs={logs}
          onClose={() => setIsHistoryOpen(false)}
          onRefresh={refreshLogs}
        />
      )}

      {/* Add / Edit Meeting Modal */}
      {isAddModalOpen && (
        <AddMeetingModal
          initialMeeting={editingMeeting}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingMeeting(null);
          }}
          onSave={handleSaveMeeting}
        />
      )}

      {/* Export Excel Modal */}
      {isExportExcelOpen && (
        <ExportExcelModal
          meetings={meetings}
          logs={logs}
          selectedDate={selectedDate}
          onClose={() => setIsExportExcelOpen(false)}
        />
      )}

      {/* Admin User Management Modal */}
      {isManageUsersOpen && isAdminUser && (
        <AdminUsersModal
          onClose={() => setIsManageUsersOpen(false)}
          onRefreshProfiles={() => user && verifyUserProfile(user)}
        />
      )}
    </div>
  );
}

export default App;
