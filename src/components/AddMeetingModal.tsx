import React, { useState } from 'react';
import { Meeting, UnitType } from '../types/meeting';
import { X, Sparkles } from 'lucide-react';

interface AddMeetingModalProps {
  initialMeeting?: Meeting | null;
  onClose: () => void;
  onSave: (meeting: Meeting) => void;
}

export const AddMeetingModal: React.FC<AddMeetingModalProps> = ({
  initialMeeting,
  onClose,
  onSave,
}) => {
  const [unit, setUnit] = useState<UnitType>(initialMeeting?.unit || 'Windows HO');
  const [department, setDepartment] = useState(initialMeeting?.department || 'Operation');
  const [meetingName, setMeetingName] = useState(initialMeeting?.meetingName || '');
  const [frequency, setFrequency] = useState(initialMeeting?.frequency || 'Weekly');
  const [reportingDay, setReportingDay] = useState(initialMeeting?.reportingDay || 'Monday');
  const [leadBy, setLeadBy] = useState(initialMeeting?.leadBy || '');
  const [attendeesInput, setAttendeesInput] = useState(initialMeeting?.attendees.join(', ') || '');
  const [scheduledTime, setScheduledTime] = useState(initialMeeting?.scheduledTime || '10:00');
  const [notes, setNotes] = useState(initialMeeting?.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingName.trim()) return;

    const newMeeting: Meeting = {
      id: initialMeeting?.id || `custom-${Date.now()}`,
      unit: unit,
      sNo: initialMeeting?.sNo || Math.floor(Math.random() * 100) + 10,
      department: department,
      meetingName: meetingName,
      frequency: frequency,
      reportingDay: reportingDay,
      leadBy: leadBy,
      attendees: attendeesInput.split(',').map((s) => s.trim()).filter(Boolean),
      scheduledTime: scheduledTime,
      alarmEnabled: true,
      notes: notes,
    };

    onSave(newMeeting);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full bg-slate-100 hover:bg-slate-200 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {initialMeeting ? 'Edit Meeting Schedule' : 'Create New Meeting Schedule'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure corporate frequency, reporting day, and alarm time rules
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 text-xs text-slate-700 font-semibold">
          {/* Unit & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider text-slate-500 mb-1">
                Corporate Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as UnitType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              >
                <option value="Windows HO">Windows HO</option>
                <option value="Furniture HO">Furniture HO</option>
                <option value="Windows Factory">Windows Factory</option>
                <option value="Kitchen Factory">Kitchen Factory</option>
              </select>
            </div>

            <div>
              <label className="block uppercase tracking-wider text-slate-500 mb-1">
                Department
              </label>
              <input
                type="text"
                required
                placeholder="e.g. CRM, HR, Operation"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Meeting Name */}
          <div>
            <label className="block uppercase tracking-wider text-slate-500 mb-1">
              Meeting Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Designer Sync, Inventory Meeting"
              value={meetingName}
              onChange={(e) => setMeetingName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Frequency & Reporting Day */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider text-slate-500 mb-1">
                Frequency Pattern
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Daily, Weekly, Every 1st & 3rd in a Week, 12th of Every Month"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-slate-500 mb-1">
                Reporting Day(s)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Monday, Tuesday & Saturday, Daily"
                value={reportingDay}
                onChange={(e) => setReportingDay(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Lead By & Scheduled Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider text-slate-500 mb-1">
                Lead By
              </label>
              <input
                type="text"
                placeholder="e.g. Garima, Yen, Bajrang"
                value={leadBy}
                onChange={(e) => setLeadBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block uppercase tracking-wider text-slate-500 mb-1">
                Scheduled Time (24h or HH:MM)
              </label>
              <input
                type="time"
                required
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Attendees */}
          <div>
            <label className="block uppercase tracking-wider text-slate-500 mb-1">
              Attendees Members (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Yen, Tanuja, Priyanka, Bhumika"
              value={attendeesInput}
              onChange={(e) => setAttendeesInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block uppercase tracking-wider text-slate-500 mb-1">
              Notes / Agenda
            </label>
            <textarea
              rows={2}
              placeholder="Optional meeting agenda details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold shadow-md shadow-blue-700/20 transition active:scale-95"
            >
              {initialMeeting ? 'Save Changes' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
