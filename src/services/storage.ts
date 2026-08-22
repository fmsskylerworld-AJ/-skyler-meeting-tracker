import { Meeting, MeetingCompletionLog } from '../types/meeting';
import { INITIAL_MEETINGS } from '../data/initialMeetings';

const MEETINGS_STORAGE_KEY = 'meeting_tracker_meetings_v2';
const LOGS_STORAGE_KEY = 'meeting_tracker_logs_v2';
const ALARM_SETTINGS_KEY = 'meeting_tracker_alarm_settings';

export interface AlarmSettings {
  soundEnabled: boolean;
  browserNotifications: boolean;
  advanceMinutes: number; // e.g. 0 = on time, 5 = 5 mins before
}

export function getStoredMeetings(): Meeting[] {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (!raw) return INITIAL_MEETINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MEETINGS;
  } catch (e) {
    console.error('Failed to load meetings from storage:', e);
    return INITIAL_MEETINGS;
  }
}

export function saveMeetings(meetings: Meeting[]): void {
  try {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
  } catch (e) {
    console.error('Failed to save meetings:', e);
  }
}

export function getStoredLogs(): MeetingCompletionLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load logs:', e);
    return [];
  }
}

export function saveLog(log: MeetingCompletionLog): MeetingCompletionLog[] {
  const existing = getStoredLogs();
  const index = existing.findIndex(l => l.meetingId === log.meetingId && l.completedDate === log.completedDate);
  
  let updated: MeetingCompletionLog[];
  if (index >= 0) {
    updated = [...existing];
    updated[index] = log;
  } else {
    updated = [log, ...existing];
  }

  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save log to localStorage:', e);
  }

  return updated;
}

export function deleteLog(logId: string): MeetingCompletionLog[] {
  const existing = getStoredLogs();
  const updated = existing.filter(l => l.id !== logId);
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete log:', e);
  }
  return updated;
}

export function getAlarmSettings(): AlarmSettings {
  try {
    const raw = localStorage.getItem(ALARM_SETTINGS_KEY);
    if (!raw) return { soundEnabled: true, browserNotifications: false, advanceMinutes: 0 };
    return JSON.parse(raw);
  } catch (e) {
    return { soundEnabled: true, browserNotifications: false, advanceMinutes: 0 };
  }
}

export function saveAlarmSettings(settings: AlarmSettings): void {
  try {
    localStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save alarm settings:', e);
  }
}

/**
 * Utility to compress uploaded image files to lightweight base64 Data URLs
 */
export function compressImageFile(file: File, maxWidth = 900, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
