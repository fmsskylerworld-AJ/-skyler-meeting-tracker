import React, { useState, useEffect, useMemo } from 'react';
import { Meeting, MeetingCompletionLog, UnitType } from './types/meeting';
import {
  fetchMeetingsAsync,
  saveMeetingAsync,
  fetchLogsAsync,
  getAlarmSettings,
  saveAlarmSettings,
  migrateLocalStorageToSupabase
} from './services/storage';
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
import { Calendar, Loader2 } from 'lucide-react';

export function App() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [logs, setLogs] = useState<MeetingCompletionLog[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedUnit, setSelectedUnit] = useState<UnitType | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const [alarmSoundEnabled, setAlarmSoundEnabled] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [activeAlarmMeeting, setActiveAlarmMeeting] = useState<Meeting | null>(null);
  const [uploadModalMeeting, setUploadModalMeeting] = useState<Meeting | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Load state from Supabase / localStorage on mount
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        // Run one-time migration if needed
        await migrateLocalStorageToSupabase();

        const fetchedMeetings = await fetchMeetingsAsync();
        const fetchedLogs = await fetchLogsAsync();
        const settings = getAlarmSettings();

        setMeetings(fetchedMeetings);
        setLogs(fetchedLogs);
        setAlarmSoundEnabled(settings.soundEnabled);
      } catch (err) {
        console.error('Error loading data on app mount:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const refreshLogs = async () => {
    const updated = await fetchLogsAsync();
    setLogs(updated);
  };

  const handleToggleSound = (enabled: boolean) => {
    setAlarmSoundEnabled(enabled);
    saveAlarmSettings({ ...getAlarmSettings(), soundEnabled: enabled });
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
        totalLogsCount={logs.length}
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
            Click "Upload Photo & Log" to record meeting proof
          </span>
        </div>

        {/* Loading Spinner State */}
        {isLoading ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center my-8 shadow-sm flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-slate-800">Connecting to Skyler World Database...</p>
            <p className="text-xs text-slate-500 mt-1">Syncing schedule matrix & proof logs</p>
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
                onOpenUpload={(m) => setUploadModalMeeting(m)}
                onTriggerAlarm={(m) => setActiveAlarmMeeting(m)}
                onViewPhotos={() => setIsHistoryOpen(true)}
                onEditMeeting={(m) => {
                  setEditingMeeting(m);
                  setIsAddModalOpen(true);
                }}
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
    </div>
  );
}

export default App;
