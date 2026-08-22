import { Meeting } from '../types/meeting';

const WEEKDAYS_MAP: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6
};

/**
 * Returns array of day numbers (0=Sun, 1=Mon, ..., 6=Sat) extracted from string text
 */
export function extractWeekdays(text: string): number[] {
  const normalized = text.toLowerCase();
  const found: number[] = [];

  for (const [dayName, dayNum] of Object.entries(WEEKDAYS_MAP)) {
    if (normalized.includes(dayName)) {
      if (!found.includes(dayNum)) {
        found.push(dayNum);
      }
    }
  }

  return found;
}

/**
 * Returns which occurrence (1st, 2nd, 3rd, 4th, 5th) of its weekday the date is in the month.
 * e.g. Aug 3rd 2026 (Mon) -> 1st Monday of Aug -> returns 1
 */
export function getWeekdayOccurrenceInMonth(date: Date): number {
  const dayOfMonth = date.getDate();
  return Math.ceil(dayOfMonth / 7);
}

/**
 * Returns true if date is the last given weekday of the month
 */
export function isLastWeekdayOfMonth(date: Date): boolean {
  const nextWeekDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 7);
  return nextWeekDate.getMonth() !== date.getMonth();
}

/**
 * Main Logic Engine: Evaluates if a meeting is scheduled on a given Date.
 * RULE #1 (Strict): Except Sunday! No meetings are scheduled on Sundays.
 */
export function isMeetingScheduledOnDate(meeting: Meeting, targetDate: Date): boolean {
  // STRICT RULE: Except Sunday!
  if (targetDate.getDay() === 0) {
    return false;
  }

  const targetDayOfWeek = targetDate.getDay(); // 1=Mon, 2=Tue, ..., 6=Sat
  const dayOfMonth = targetDate.getDate(); // 1..31
  const month = targetDate.getMonth(); // 0..11
  const occurrence = getWeekdayOccurrenceInMonth(targetDate);

  const freq = meeting.frequency.toLowerCase().trim();
  const repDay = meeting.reportingDay.toLowerCase().trim();
  const combinedText = `${freq} ${repDay}`;

  // 1. Daily Frequency
  if (freq === 'daily' || repDay === 'daily') {
    return targetDayOfWeek >= 1 && targetDayOfWeek <= 6; // Mon-Sat
  }

  // 2. Fixed Date of Month (e.g., "12th of Every Month")
  if (combinedText.includes('12th')) {
    return dayOfMonth === 12;
  }

  // Extract explicit weekdays mentioned in reportingDay or frequency
  const targetWeekdays = extractWeekdays(repDay.length > 0 ? repDay : freq);

  // 3. Every Last of Month
  if (combinedText.includes('last')) {
    if (targetWeekdays.length > 0) {
      return targetWeekdays.includes(targetDayOfWeek) && isLastWeekdayOfMonth(targetDate);
    }
    // Default to last Saturday if no weekday specified
    return targetDayOfWeek === 6 && isLastWeekdayOfMonth(targetDate);
  }

  // 4. Ordinal Weekday Frequencies (1st, 2nd, 3rd, 4th)
  
  // "Every 1st & 3rd in a Week" or "Two Days in a Month"
  if (combinedText.includes('1st & 3rd') || combinedText.includes('1st and 3rd') || freq.includes('two days in a month')) {
    if (targetWeekdays.length > 0 && !targetWeekdays.includes(targetDayOfWeek)) {
      return false;
    }
    return occurrence === 1 || occurrence === 3;
  }

  // "Every 2nd & 4th Week"
  if (combinedText.includes('2nd & 4th') || combinedText.includes('2nd and 4th')) {
    if (targetWeekdays.length > 0 && !targetWeekdays.includes(targetDayOfWeek)) {
      return false;
    }
    return occurrence === 2 || occurrence === 4;
  }

  // "Every 1st & 4th Week"
  if (combinedText.includes('1st & 4th') || combinedText.includes('1st and 4th')) {
    if (targetWeekdays.length > 0 && !targetWeekdays.includes(targetDayOfWeek)) {
      return false;
    }
    return occurrence === 1 || occurrence === 4;
  }

  // "1st of Friday" or "1st of Wednesday"
  if (combinedText.includes('1st of') || combinedText.includes('1st friday') || combinedText.includes('1st wednesday')) {
    if (occurrence !== 1) {
      return false;
    }

    // Check specific weekday
    if (targetWeekdays.length > 0 && !targetWeekdays.includes(targetDayOfWeek)) {
      return false;
    }

    // If Quarterly, check if month is 1st month of quarter (Jan, Apr, Jul, Oct) -> 0, 3, 6, 9
    if (freq.includes('quarterly')) {
      return month % 3 === 0;
    }

    return true;
  }

  // 5. "2 Days in a Week" (e.g. Tuesday & Saturday)
  if (freq.includes('2 days in a week') || freq.includes('two days in a week')) {
    return targetWeekdays.includes(targetDayOfWeek);
  }

  // 6. Standard Weekly or Monthly by Weekday
  if (targetWeekdays.length > 0) {
    if (!targetWeekdays.includes(targetDayOfWeek)) {
      return false;
    }

    // If Monthly and no specific ordinal rule matched, check if it's 1st week of month or general
    if (freq.includes('monthly') && !combinedText.includes('last')) {
      return occurrence === 1; // Default monthly to 1st occurrence if unspecified
    }

    return true;
  }

  return false;
}

/**
 * Finds the next date (starting from `fromDate`) when this meeting is scheduled.
 */
export function getNextScheduledDate(meeting: Meeting, fromDate: Date = new Date()): Date {
  const checkDate = new Date(fromDate);
  checkDate.setHours(0, 0, 0, 0);

  // Search up to 90 days in advance
  for (let i = 0; i <= 90; i++) {
    if (isMeetingScheduledOnDate(meeting, checkDate)) {
      return new Date(checkDate);
    }
    checkDate.setDate(checkDate.getDate() + 1);
  }

  return fromDate; // Fallback
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Formats date for display e.g. "Monday, Aug 24, 2026"
 */
export function formatDateDisplay(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}
