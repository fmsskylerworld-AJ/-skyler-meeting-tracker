import { Meeting, MeetingCompletionLog } from '../types/meeting';
import { INITIAL_MEETINGS } from '../data/initialMeetings';
import { supabase, isSupabaseConfigured } from './supabaseClient';

const MEETINGS_STORAGE_KEY = 'meeting_tracker_meetings_v2';
const LOGS_STORAGE_KEY = 'meeting_tracker_logs_v2';
const ALARM_SETTINGS_KEY = 'meeting_tracker_alarm_settings';
const MIGRATED_KEY = 'meeting_tracker_supabase_migrated_v1';

export interface AlarmSettings {
  soundEnabled: boolean;
  browserNotifications: boolean;
  advanceMinutes: number;
}

// ----------------------------------------------------
// 1. LOCAL STORAGE FALLBACK HELPERS (PRESERVED)
// ----------------------------------------------------
export function getStoredMeetings(): Meeting[] {
  try {
    const raw = localStorage.getItem(MEETINGS_STORAGE_KEY);
    if (!raw) return INITIAL_MEETINGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MEETINGS;
  } catch (e) {
    return INITIAL_MEETINGS;
  }
}

export function saveMeetings(meetings: Meeting[]): void {
  try {
    localStorage.setItem(MEETINGS_STORAGE_KEY, JSON.stringify(meetings));
  } catch (e) {
    console.error('Failed to save meetings to localStorage:', e);
  }
}

export function getStoredLogs(): MeetingCompletionLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
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
    console.error('Failed to delete log from localStorage:', e);
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

// ----------------------------------------------------
// 2. SUPABASE PRIVATE STORAGE BUCKET SIGNED URL HANDLING
// ----------------------------------------------------
export async function getSignedPhotoUrl(photoPath: string): Promise<string> {
  if (!photoPath) return '';
  if (photoPath.startsWith('data:image') || photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
    return photoPath; // Base64 or full URL
  }

  if (!isSupabaseConfigured || !supabase) {
    return photoPath;
  }

  try {
    const { data, error } = await supabase.storage
      .from('meeting-proofs')
      .createSignedUrl(photoPath, 3600); // 1-hour signed URL

    if (error || !data) {
      console.warn('Failed creating signed URL for photo:', photoPath, error);
      return photoPath;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error resolving signed photo URL:', err);
    return photoPath;
  }
}

/**
 * Uploads photo file or base64 to path proofs/<unit>/<meeting_id>/<filename>
 */
export async function uploadPhotoToSupabase(
  imageInput: File | string,
  unit = 'General',
  meetingId = 'general'
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof imageInput === 'string') return imageInput;
    return await compressImageFile(imageInput);
  }

  try {
    let fileBlob: Blob;
    let fileExt = 'jpg';

    if (typeof imageInput === 'string') {
      const res = await fetch(imageInput);
      fileBlob = await res.blob();
    } else {
      fileBlob = imageInput;
      fileExt = imageInput.name.split('.').pop() || 'jpg';
    }

    const safeUnit = unit.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const safeMeetingId = meetingId.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const storagePath = `proofs/${safeUnit}/${safeMeetingId}/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('meeting-proofs')
      .upload(storagePath, fileBlob, {
        cacheControl: '3600',
        upsert: true,
        contentType: fileBlob.type || 'image/jpeg'
      });

    if (uploadError) {
      console.error('Supabase image upload failed, returning fallback:', uploadError);
      if (typeof imageInput === 'string') return imageInput;
      return await compressImageFile(imageInput as File);
    }

    return storagePath;
  } catch (err) {
    console.error('Failed uploading photo to Supabase storage:', err);
    if (typeof imageInput === 'string') return imageInput;
    return await compressImageFile(imageInput as File);
  }
}

// ----------------------------------------------------
// 3. ASYNC SUPABASE DATA MANAGEMENT (PRIMARY)
// ----------------------------------------------------
export async function fetchMeetingsAsync(): Promise<Meeting[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getStoredMeetings();
  }

  try {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('is_active', true)
      .order('s_no', { ascending: true });

    if (error) {
      if (error.code === '42501') {
        console.warn('Supabase RLS Error (42501): Select permission denied for unauthenticated or non-permitted role.');
        return [];
      }
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    const mapped: Meeting[] = data.map(item => ({
      id: item.id,
      unit: item.unit,
      sNo: item.s_no,
      department: item.department,
      meetingName: item.meeting_name,
      frequency: item.frequency,
      reportingDay: item.reporting_day,
      leadBy: item.lead_by || '',
      attendees: item.attendees || [],
      scheduledTime: item.scheduled_time || '10:00',
      alarmEnabled: item.alarm_enabled ?? true,
      notes: item.notes || ''
    }));

    saveMeetings(mapped); // Local cache fallback update
    return mapped;
  } catch (e: any) {
    if (e?.code === '42501') {
      return [];
    }
    console.error('Failed fetching meetings from Supabase network, returning local cache:', e);
    return getStoredMeetings();
  }
}

export async function saveMeetingAsync(meeting: Meeting): Promise<Meeting[]> {
  const localList = getStoredMeetings();
  const idx = localList.findIndex(m => m.id === meeting.id);
  let updatedList: Meeting[];
  if (idx >= 0) {
    updatedList = [...localList];
    updatedList[idx] = meeting;
  } else {
    updatedList = [meeting, ...localList];
  }
  saveMeetings(updatedList);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('meetings').upsert({
        id: meeting.id,
        unit: meeting.unit,
        s_no: meeting.sNo,
        department: meeting.department,
        meeting_name: meeting.meetingName,
        frequency: meeting.frequency,
        reporting_day: meeting.reportingDay,
        lead_by: meeting.leadBy,
        attendees: meeting.attendees,
        scheduled_time: meeting.scheduledTime,
        alarm_enabled: meeting.alarmEnabled,
        is_active: true,
        notes: meeting.notes
      });
      if (error) {
        console.error('Supabase meeting upsert error:', error.message, error);
        throw error;
      }
    } catch (e) {
      console.error('Failed upserting meeting to Supabase:', e);
      throw e;
    }
  }

  return updatedList;
}

export async function deleteMeetingAsync(meetingId: string): Promise<Meeting[]> {
  const localList = getStoredMeetings();
  const updatedList = localList.filter(m => m.id !== meetingId);
  saveMeetings(updatedList);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
      if (error) {
        console.error('Supabase meeting delete error:', error.message, error);
        throw error;
      }
    } catch (e) {
      console.error('Failed deleting meeting from Supabase:', e);
      throw e;
    }
  }

  return updatedList;
}

export async function fetchLogsAsync(): Promise<MeetingCompletionLog[]> {
  if (!isSupabaseConfigured || !supabase) {
    return getStoredLogs();
  }

  try {
    const { data, error } = await supabase
      .from('meeting_logs')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      if (error.code === '42501') {
        console.warn('Supabase RLS Error (42501): Logs select permission denied.');
        return [];
      }
      throw error;
    }

    if (!data) return [];

    const mapped: MeetingCompletionLog[] = await Promise.all(
      data.map(async item => {
        const rawPhotos: string[] = item.photos || [];
        const resolvedPhotos = await Promise.all(
          rawPhotos.map(photoPath => getSignedPhotoUrl(photoPath))
        );

        return {
          id: item.id,
          meetingId: item.meeting_id,
          meetingName: item.meeting_name,
          unit: item.unit,
          department: item.department,
          completedDate: item.completed_date,
          completedAt: item.completed_at,
          photos: resolvedPhotos,
          mom: item.mom || '',
          actualAttendees: item.actual_attendees || [],
          leadBy: item.lead_by || ''
        };
      })
    );

    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(mapped));
    } catch (err) {}

    return mapped;
  } catch (e: any) {
    if (e?.code === '42501') return [];
    console.error('Failed fetching logs from Supabase, returning local logs:', e);
    return getStoredLogs();
  }
}

export async function saveLogAsync(log: MeetingCompletionLog): Promise<MeetingCompletionLog[]> {
  const localLogs = saveLog(log);

  if (isSupabaseConfigured && supabase) {
    try {
      const processedPhotos: string[] = [];
      for (const photo of log.photos) {
        if (photo.startsWith('data:image') || photo.startsWith('blob:')) {
          const storagePath = await uploadPhotoToSupabase(photo, log.unit, log.meetingId);
          processedPhotos.push(storagePath);
        } else {
          processedPhotos.push(photo);
        }
      }

      const dbLog = {
        id: log.id,
        meeting_id: log.meetingId,
        meeting_name: log.meetingName,
        unit: log.unit,
        department: log.department,
        completed_date: log.completedDate,
        completed_at: log.completedAt,
        photos: processedPhotos,
        mom: log.mom,
        actual_attendees: log.actualAttendees,
        lead_by: log.leadBy
      };

      const { error } = await supabase.from('meeting_logs').upsert(dbLog);
      if (error) console.error('Supabase log upsert error:', error.message, error);
    } catch (e) {
      console.error('Failed saving log to Supabase:', e);
    }
  }

  return localLogs;
}

export async function deleteLogAsync(logId: string): Promise<MeetingCompletionLog[]> {
  const localLogs = deleteLog(logId);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('meeting_logs').delete().eq('id', logId);
      if (error) console.error('Supabase log delete error:', error.message, error);
    } catch (e) {
      console.error('Failed deleting log from Supabase:', e);
    }
  }

  return localLogs;
}

// ----------------------------------------------------
// 4. ONE-TIME LOCALSTORAGE MIGRATION MECHANISM (MANUAL / AUTHENTICATED ONLY)
// ----------------------------------------------------
export async function migrateLocalStorageToSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;
  if (localStorage.getItem(MIGRATED_KEY) === 'true') return;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      return;
    }

    const localMeetings = getStoredMeetings();
    if (localMeetings.length > 0) {
      const dbMeetings = localMeetings.map(m => ({
        id: m.id,
        unit: m.unit,
        s_no: m.sNo,
        department: m.department,
        meeting_name: m.meetingName,
        frequency: m.frequency,
        reporting_day: m.reportingDay,
        lead_by: m.leadBy,
        attendees: m.attendees,
        scheduled_time: m.scheduledTime,
        alarm_enabled: m.alarmEnabled,
        is_active: true,
        notes: m.notes
      }));
      await supabase.from('meetings').upsert(dbMeetings);
    }

    const localLogs = getStoredLogs();
    for (const log of localLogs) {
      const cloudPhotos: string[] = [];
      for (const photo of log.photos) {
        if (photo.startsWith('data:image')) {
          const path = await uploadPhotoToSupabase(photo, log.unit, log.meetingId);
          cloudPhotos.push(path);
        } else {
          cloudPhotos.push(photo);
        }
      }

      await supabase.from('meeting_logs').upsert({
        id: log.id,
        meeting_id: log.meetingId,
        meeting_name: log.meetingName,
        unit: log.unit,
        department: log.department,
        completed_date: log.completedDate,
        completed_at: log.completedAt,
        photos: cloudPhotos,
        mom: log.mom,
        actual_attendees: log.actualAttendees,
        lead_by: log.leadBy
      });
    }

    localStorage.setItem(MIGRATED_KEY, 'true');
  } catch (err) {
    console.warn('One-time migration skipped or failed (session/RLS):', err);
  }
}

/**
 * Utility to compress image file locally before upload
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
