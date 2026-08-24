export type UnitType = 'Windows HO' | 'Furniture HO' | 'Windows Factory' | 'Kitchen Factory';

export interface Meeting {
  id: string;
  unit: UnitType;
  sNo: number;
  department: string;
  meetingName: string;
  frequency: string;
  reportingDay: string;
  leadBy: string;
  attendees: string[];
  scheduledTime: string; // "HH:MM" e.g. "10:00"
  alarmEnabled: boolean;
  notes?: string;
}

export interface MeetingCompletionLog {
  id: string;
  meetingId: string;
  meetingName: string;
  unit: UnitType;
  department: string;
  completedDate: string; // YYYY-MM-DD
  completedAt: string; // ISO timestamp
  photos: string[]; // Base64 Data URLs or storage paths
  mom: string; // Minutes of Meeting
  actualAttendees: string[];
  leadBy: string;
}

export interface DayScheduleStatus {
  meeting: Meeting;
  isToday: boolean;
  isScheduled: boolean;
  completedLog?: MeetingCompletionLog;
  nextScheduledDate?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Team Member' | 'User';
  unit: UnitType | 'All' | null;
  department?: string;
  isActive: boolean;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
}
