import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw, AlertTriangle } from 'lucide-react';
import { formatDateDisplay, formatDateKey } from '../utils/frequencyEngine';

interface DateNavigatorProps {
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({ selectedDate, setSelectedDate }) => {
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isSunday = selectedDate.getDay() === 0;

  const handlePrevDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(next);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      setSelectedDate(new Date(y, m - 1, d));
    }
  };

  return (
    <div className="bg-white border border-sky-100 rounded-2xl p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      {/* Current Date Display */}
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className={`p-3 rounded-xl flex items-center justify-center ${isSunday ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}>
          <CalendarIcon className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-lg text-slate-900">
              {formatDateDisplay(selectedDate)}
            </h2>
            {isToday && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                TODAY
              </span>
            )}
            {isSunday && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> SUNDAY OFF
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Showing scheduled meeting rules & alarm triggers for this date
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        {/* Prev Day */}
        <button
          onClick={handlePrevDay}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1 text-xs font-bold"
          title="Previous Day"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev Day</span>
        </button>

        {/* Today Jump */}
        {!isToday && (
          <button
            onClick={handleToday}
            className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 text-xs font-bold flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-700" />
            Today
          </button>
        )}

        {/* Next Day */}
        <button
          onClick={handleNextDay}
          className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition flex items-center gap-1 text-xs font-bold"
          title="Next Day"
        >
          <span className="hidden sm:inline">Next Day</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Date Input Calendar Picker */}
        <div className="relative">
          <input
            type="date"
            value={formatDateKey(selectedDate)}
            onChange={handleDateChange}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
