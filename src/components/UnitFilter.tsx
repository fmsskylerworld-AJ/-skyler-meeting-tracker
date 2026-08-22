import React from 'react';
import { UnitType } from '../types/meeting';
import { Search, Filter, Layers, Building2, Factory, Home } from 'lucide-react';

interface UnitFilterProps {
  selectedUnit: UnitType | 'All';
  setSelectedUnit: (unit: UnitType | 'All') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'all' | 'scheduled' | 'completed';
  setStatusFilter: (filter: 'all' | 'scheduled' | 'completed') => void;
  unitCounts: Record<string, number>;
}

export const UnitFilter: React.FC<UnitFilterProps> = ({
  selectedUnit,
  setSelectedUnit,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  unitCounts,
}) => {
  const units: Array<{ id: UnitType | 'All'; label: string; icon: React.ReactNode }> = [
    { id: 'All', label: 'All Units', icon: <Layers className="w-4 h-4" /> },
    { id: 'Windows HO', label: 'Windows HO', icon: <Building2 className="w-4 h-4 text-sky-600" /> },
    { id: 'Furniture HO', label: 'Furniture HO', icon: <Home className="w-4 h-4 text-amber-600" /> },
    { id: 'Windows Factory', label: 'Windows Factory', icon: <Factory className="w-4 h-4 text-blue-600" /> },
    { id: 'Kitchen Factory', label: 'Kitchen Factory', icon: <Factory className="w-4 h-4 text-emerald-600" /> },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Unit Tab Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300">
        {units.map((unit) => {
          const isActive = selectedUnit === unit.id;
          const count = unitCounts[unit.id] || 0;

          return (
            <button
              key={unit.id}
              onClick={() => setSelectedUnit(unit.id)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap border ${
                isActive
                  ? 'bg-blue-800 text-white border-blue-900 shadow-md shadow-blue-900/10'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {unit.icon}
              <span>{unit.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Status Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-sky-100 shadow-sm">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search meeting, lead, attendees, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
          <span className="text-xs font-bold text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter:
          </span>
          {(['all', 'scheduled', 'completed'] as const).map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setStatusFilter(filterOption)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition ${
                statusFilter === filterOption
                  ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {filterOption === 'all'
                ? 'All Meetings'
                : filterOption === 'scheduled'
                ? 'Scheduled Only'
                : 'Completed Only'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
