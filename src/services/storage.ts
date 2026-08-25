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
  if (photoPath.startsWith('data:') || photoPath.startsWith('http')) {
    return photoPath;
  }

  if (!isSupabaseConfigured || !supabase) {
    return photoPath;
  }

  try {
    const { data, error } = await supabase.storage
      .from('meeting-proofs')
      .createSignedUrl(photoPath, 3600);

    if (error || !data?.signedUrl) {
      console.warn('Failed to create signed URL for path, falling back to public URL:', photoPath, error?.message);
      const { data: pubData } = supabase.storage
        .from('meeting-proofs')
        .getPublicUrl(photoPath);
      return pubData.publicUrl;
    }

    return data.signedUrl;
  } catch (err) {
    console.error('Error getting signed photo URL:', err);
    return photoPath;
  }
}

export async function resolveLogPhotoUrls(log: MeetingCompletionLog): Promise<MeetingCompletionLog> {
  if (!log.photos || log.photos.length === 0) return log;

  const resolvedPhotos = await Promise.all(
    log.photos.map(p => getSignedPhotoUrl(p))
  );

  return {
    ...log,
    photos: resolvedPhotos
  };
}

export async function uploadMeetingPhoto(
  meetingId: string,
  unit: string,
  imageInput: File | string
): Promise<string> {
  if (!isSupabaseConfigured || !supabase) {
    if (typeof imageInput === 'string') return imageInput;
    return await compressImageFile(imageInput as File);
  }

  try {
    let fileBlob: Blob;
    let fileExt = 'jpg';

    if (typeof imageInput === 'string') {
      if (imageInput.startsWith('data:image/')) {
        const mime = imageInput.split(';')[0].split(':')[1];
        fileExt = mime.split('/')[1] || 'jpg';
        const base64Data = imageInput.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        fileBlob = new Blob([byteArray], { type: mime });
      } else {
        return imageInput;
      }
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
      .order('s_no', { ascending: true });

    if (error) {
      console.warn('Supabase fetch error, returning local cache:', error.message);
      return getStoredMeetings();
    }

    if (!data || data.length === 0) {
      console.warn('Supabase query returned 0 meetings, serving initial meetings fallback');
      return getStoredMeetings();
    }

    // Filter out archived items where is_active === false (keeps true or null/undefined)
    const activeItems = data.filter(item => item.is_active !== false);
    if (activeItems.length === 0) {
      return getStoredMeetings();
    }

    const mapped: Meeting[] = activeItems.map(item => ({
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

    saveMeetings(mapped); // Update local cache
    return mapped;
  } catch (e: any) {
    console.error('Failed fetching meetings from Supabase network, returning local cache:', e);
    return getStoredMeetings();
  }
}

export async function saveMeetingAsync(meeting: Meeting): Promise<Meeting[]> {
  const currentLocal = getStoredMeetings();
  const idx = currentLocal.findIndex(m => m.id === meeting.id);
  let updatedLocal: Meeting[];
  if (idx >= 0) {
    updatedLocal = [...currentLocal];
    updatedLocal[idx] = meeting;
  } else {
    updatedLocal = [...currentLocal, meeting];
  }
  saveMeetings(updatedLocal);

  if (!isSupabaseConfigured || !supabase) {
    return updatedLocal;
  }

  try {
    const payload = {
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
      notes: meeting.notes,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('meetings').upsert(payload);
    if (error) {
      console.error('Failed saving meeting to Supabase:', error);
    }
  } catch (e) {
    console.error('Failed saving meeting to Supabase:', e);
  }

  return await fetchMeetingsAsync();
}

export async function deleteMeetingAsync(meetingId: string): Promise<Meeting[]> {
  const currentLocal = getStoredMeetings();
  const updatedLocal = currentLocal.filter(m => m.id !== meetingId);
  saveMeetings(updatedLocal);

  if (!isSupabaseConfigured || !supabase) {
    return updatedLocal;
  }

  try {
    const { error } = await supabase.from('meetings').delete().eq('id', meetingId);
    if (error) {
      console.error('Failed deleting meeting from Supabase:', error);
    }
  } catch (e) {
    console.error('Failed deleting meeting from Supabase:', e);
  }

  return await fetchMeetingsAsync();
}

export async function fetchLogsAsync(): Promise<MeetingCompletionLog[]> {
  if (!isSupabaseConfigured || !supabase) {
    const localLogs = getStoredLogs();
    return await Promise.all(localLogs.map(l => resolveLogPhotoUrls(l)));
  }

  try {
    const { data, error } = await supabase
      .from('meeting_logs')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch logs error, returning local cache:', error.message);
      const localLogs = getStoredLogs();
      return await Promise.all(localLogs.map(l => resolveLogPhotoUrls(l)));
    }

    if (!data || data.length === 0) {
      const localLogs = getStoredLogs();
      return await Promise.all(localLogs.map(l => resolveLogPhotoUrls(l)));
    }

    const mapped: MeetingCompletionLog[] = data.map(item => ({
      id: item.id,
      meetingId: item.meeting_id,
      meetingName: item.meeting_name,
      unit: item.unit,
      department: item.department,
      completedDate: item.completed_date,
      completedAt: item.completed_at,
      photos: item.photos || [],
      mom: item.mom || '',
      actualAttendees: item.actual_attendees || [],
      leadBy: item.lead_by || ''
    }));

    const resolved = await Promise.all(mapped.map(l => resolveLogPhotoUrls(l)));
    try {
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(mapped));
    } catch (e) {
      console.error('Failed caching logs to localStorage:', e);
    }

    return resolved;
  } catch (e: any) {
    console.error('Failed fetching logs from Supabase network, returning local cache:', e);
    const localLogs = getStoredLogs();
    return await Promise.all(localLogs.map(l => resolveLogPhotoUrls(l)));
  }
}

export async function saveLogAsync(
  log: MeetingCompletionLog,
  imageInput?: File | string
): Promise<MeetingCompletionLog[]> {
  let photoStoragePath: string | null = null;
  if (imageInput) {
    photoStoragePath = await uploadMeetingPhoto(log.meetingId, log.unit, imageInput);
  }

  const photosArray = photoStoragePath ? [photoStoragePath] : log.photos;
  const logToSave: MeetingCompletionLog = {
    ...log,
    photos: photosArray
  };

  const updatedLocal = saveLog(logToSave);

  if (!isSupabaseConfigured || !supabase) {
    return await Promise.all(updatedLocal.map(l => resolveLogPhotoUrls(l)));
  }

  try {
    const payload = {
      id: logToSave.id,
      meeting_id: logToSave.meetingId,
      meeting_name: logToSave.meetingName,
      unit: logToSave.unit,
      department: logToSave.department,
      completed_date: logToSave.completedDate,
      completed_at: logToSave.completedAt,
      photos: photosArray,
      mom: logToSave.mom,
      actual_attendees: logToSave.actualAttendees,
      lead_by: logToSave.leadBy
    };

    const { error } = await supabase.from('meeting_logs').upsert(payload, {
      onConflict: 'meeting_id,completed_date'
    });

    if (error) {
      console.error('Failed saving log to Supabase:', error);
    }
  } catch (e) {
    console.error('Failed saving log to Supabase:', e);
  }

  return await fetchLogsAsync();
}

export async function deleteLogAsync(logId: string): Promise<MeetingCompletionLog[]> {
  const updatedLocal = deleteLog(logId);

  if (!isSupabaseConfigured || !supabase) {
    return await Promise.all(updatedLocal.map(l => resolveLogPhotoUrls(l)));
  }

  try {
    const { error } = await supabase.from('meeting_logs').delete().eq('id', logId);
    if (error) {
      console.error('Failed deleting log from Supabase:', error);
    }
  } catch (e) {
    console.error('Failed deleting log from Supabase:', e);
  }

  return await fetchLogsAsync();
}

export async function migrateLocalStorageToSupabase(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const alreadyMigrated = localStorage.getItem(MIGRATED_KEY);
    if (alreadyMigrated === 'true') return;

    const { data: existingDbMeetings } = await supabase.from('meetings').select('id');
    if (!existingDbMeetings || existingDbMeetings.length === 0) {
      const localMeetings = getStoredMeetings();
      const payload = localMeetings.map(m => ({
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
        notes: m.notes
      }));

      await supabase.from('meetings').upsert(payload);
    }

    localStorage.setItem(MIGRATED_KEY, 'true');
  } catch (err) {
    console.error('Error during initial Supabase migration:', err);
  }
}

export async function compressImageFile(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.7
): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = maxDimension;
        const MAX_HEIGHT = maxDimension;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve('');
    };
    reader.onerror = () => resolve('');
  });
}
