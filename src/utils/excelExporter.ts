import * as XLSX from 'xlsx';
import { Meeting, MeetingCompletionLog } from '../types/meeting';
import { isMeetingScheduledOnDate, formatDateKey } from './frequencyEngine';

export interface ExcelExportOptions {
  meetings: Meeting[];
  logs: MeetingCompletionLog[];
  exportType: 'single' | 'range' | 'all';
  singleDate: Date;
  fromDate: Date;
  toDate: Date;
}

export function generateExcelReport({
  meetings,
  logs,
  exportType,
  singleDate,
  fromDate,
  toDate,
}: ExcelExportOptions): void {
  // 1. Determine dates array
  let datesToProcess: Date[] = [];

  if (exportType === 'single') {
    datesToProcess = [new Date(singleDate)];
  } else if (exportType === 'range') {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const curr = new Date(start);
    while (curr <= end) {
      datesToProcess.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }
  } else {
    // All available dates from logs + singleDate
    const logDateStrings = Array.from(new Set(logs.map(l => l.completedDate)));
    const dateMap = new Map<string, Date>();

    logDateStrings.forEach(ds => {
      const parts = ds.split('-').map(Number);
      if (parts.length === 3) {
        dateMap.set(ds, new Date(parts[0], parts[1] - 1, parts[2]));
      }
    });

    const singleKey = formatDateKey(singleDate);
    if (!dateMap.has(singleKey)) {
      dateMap.set(singleKey, new Date(singleDate));
    }

    datesToProcess = Array.from(dateMap.values()).sort((a, b) => b.getTime() - a.getTime());
  }

  // 2. Build rows data
  const rows: any[] = [];
  let totalEvaluatedCount = 0;
  let totalCompletedCount = 0;
  let totalPendingCount = 0;
  let totalWithProofCount = 0;
  let totalWithoutProofCount = 0;

  datesToProcess.forEach(d => {
    // Exclude Sundays as per frequency engine rules
    if (d.getDay() === 0) return;

    const dateKey = formatDateKey(d);

    meetings.forEach(m => {
      const isScheduled = isMeetingScheduledOnDate(m, d);
      if (!isScheduled && exportType !== 'all') return; // Skip non-scheduled on specific date range

      totalEvaluatedCount++;
      const completionLog = logs.find(l => l.meetingId === m.id && l.completedDate === dateKey);

      const isCompleted = Boolean(completionLog);
      if (isCompleted) {
        totalCompletedCount++;
      } else {
        totalPendingCount++;
      }

      const photos = completionLog?.photos || [];
      const hasProof = photos.length > 0;

      if (hasProof) {
        totalWithProofCount++;
      } else {
        totalWithoutProofCount++;
      }

      const baseRow = {
        'Meeting Date': dateKey,
        'Meeting ID': m.id,
        'Unit': m.unit,
        'S. No.': m.sNo,
        'Department': m.department,
        'Meeting Name': m.meetingName,
        'Frequency': m.frequency,
        'Reporting Day': m.reportingDay,
        'Lead By': m.leadBy || 'N/A',
        'Scheduled Attendees': Array.isArray(m.attendees) ? m.attendees.join(', ') : '',
        'Scheduled Time': m.scheduledTime,
        'Alarm Enabled': m.alarmEnabled ? 'Yes' : 'No',
        'Active Status': 'Active',
        'Meeting Notes': m.notes || '',
        'Execution Status': isCompleted ? 'Completed' : 'Pending',
        'Completed Date': completionLog?.completedDate || 'N/A',
        'Completed Time': completionLog ? new Date(completionLog.completedAt).toLocaleTimeString('en-US') : 'N/A',
        'Completed / Submitted By': completionLog?.leadBy || m.leadBy || 'N/A',
        'Actual Attendees': completionLog?.actualAttendees ? completionLog.actualAttendees.join(', ') : 'N/A',
        'MoM / Remarks': completionLog?.mom || 'N/A',
      };

      if (photos.length > 0) {
        photos.forEach((photoUrl, idx) => {
          const fileName = photoUrl.split('/').pop() || `proof_${idx + 1}.jpg`;
          rows.push({
            ...baseRow,
            'Proof Photo Index': idx + 1,
            'Proof Photo Name': fileName,
            'Proof Photo Storage Path / URL': photoUrl,
          });
        });
      } else {
        rows.push({
          ...baseRow,
          'Proof Photo Index': 'N/A',
          'Proof Photo Name': 'No Photo',
          'Proof Photo Storage Path / URL': 'N/A',
        });
      }
    });
  });

  // 3. Create Detailed Schedule Sheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  const colWidths = [
    { wch: 14 }, // Meeting Date
    { wch: 12 }, // Meeting ID
    { wch: 16 }, // Unit
    { wch: 8 },  // S. No.
    { wch: 15 }, // Department
    { wch: 22 }, // Meeting Name
    { wch: 24 }, // Frequency
    { wch: 18 }, // Reporting Day
    { wch: 15 }, // Lead By
    { wch: 30 }, // Scheduled Attendees
    { wch: 14 }, // Scheduled Time
    { wch: 12 }, // Alarm Enabled
    { wch: 12 }, // Active Status
    { wch: 35 }, // Meeting Notes
    { wch: 16 }, // Execution Status
    { wch: 14 }, // Completed Date
    { wch: 14 }, // Completed Time
    { wch: 20 }, // Completed / Submitted By
    { wch: 30 }, // Actual Attendees
    { wch: 40 }, // MoM / Remarks
    { wch: 16 }, // Proof Photo Index
    { wch: 28 }, // Proof Photo Name
    { wch: 55 }, // Proof Photo Storage Path / URL
  ];
  worksheet['!cols'] = colWidths;

  // Add AutoFilter
  if (rows.length > 0) {
    worksheet['!autofilter'] = { ref: `A1:W${rows.length + 1}` };
  }

  // 4. Create Summary Worksheet
  const completionRate = totalEvaluatedCount > 0 
    ? ((totalCompletedCount / totalEvaluatedCount) * 100).toFixed(1) + '%' 
    : '0%';

  const summaryData = [
    { Metric: 'Report Title', Value: 'Skyler World Executive Meeting Tracker & Proof Audit Report' },
    { Metric: 'Export Date', Value: new Date().toLocaleString('en-US') },
    { Metric: 'Total Meeting Instances Evaluated', Value: totalEvaluatedCount },
    { Metric: 'Completed Meetings', Value: totalCompletedCount },
    { Metric: 'Pending / Missed Meetings', Value: totalPendingCount },
    { Metric: 'Meetings with Photo Proof', Value: totalWithProofCount },
    { Metric: 'Meetings without Photo Proof', Value: totalWithoutProofCount },
    { Metric: 'Overall Completion Rate', Value: completionRate },
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 35 }, { wch: 45 }];

  // 5. Build Workbook & Download
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Executive Summary');
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Meeting Schedule & Proofs');

  // File Naming
  let dateTag = 'Report';
  if (exportType === 'single') {
    dateTag = formatDateKey(singleDate);
  } else if (exportType === 'range') {
    dateTag = `${formatDateKey(fromDate)}_to_${formatDateKey(toDate)}`;
  } else {
    dateTag = 'All_Dates';
  }

  const fileName = `Skyler_World_Meeting_Tracker_${dateTag}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
