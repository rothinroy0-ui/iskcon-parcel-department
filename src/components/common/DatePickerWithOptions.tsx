import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Sparkles, 
  Clock, 
  Check, 
  CalendarDays,
  Cake,
  Heart
} from 'lucide-react';

export interface DateOptionEvent {
  day: number;
  month: number; // 1-12
  year?: number;
  formattedDate: string; // e.g. "10-10-2026"
  label: string; // e.g. "10 Oct (Today)"
  count: number; // number of devotees/consignments
  type?: 'birthday' | 'anniversary' | 'parcel';
}

interface DatePickerWithOptionsProps {
  value: string; // e.g. "10-10-2026" or ""
  onChange: (dateStr: string) => void;
  placeholder?: string;
  currentMonthName?: string; // e.g. "October" or "All Months"
  onMonthSelect?: (monthName: string) => void;
  eventDates?: DateOptionEvent[]; // list of dates with events/celebrations
  showCalendarGrid?: boolean;
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DatePickerWithOptions: React.FC<DatePickerWithOptionsProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  currentMonthName,
  onMonthSelect,
  eventDates = [],
  showCalendarGrid = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'options' | 'calendar'>('options');
  const containerRef = useRef<HTMLDivElement>(null);

  // Reference year and month for calendar display
  const today = new Date();
  const refYear = 2026; // System reference year matching devotee records
  
  // Parse currently selected value or determine view month
  const parseSelected = useMemo(() => {
    if (!value || !value.trim()) return null;
    const clean = value.trim();
    // Match dd-mm-yyyy or yyyy-mm-dd
    const dashMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (dashMatch) {
      return {
        day: parseInt(dashMatch[1], 10),
        month: parseInt(dashMatch[2], 10),
        year: parseInt(dashMatch[3], 10),
      };
    }
    const isoMatch = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
      return {
        day: parseInt(isoMatch[3], 10),
        month: parseInt(isoMatch[2], 10),
        year: parseInt(isoMatch[1], 10),
      };
    }
    return null;
  }, [value]);

  // Determine view month (1-12) and view year
  const [viewMonth, setViewMonth] = useState<number>(() => {
    if (parseSelected) return parseSelected.month;
    if (currentMonthName && currentMonthName !== 'All Months') {
      const idx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === currentMonthName.toLowerCase());
      if (idx >= 0) return idx + 1;
    }
    return 10; // Default to October
  });

  const [viewYear, setViewYear] = useState<number>(() => {
    if (parseSelected) return parseSelected.year;
    return refYear;
  });

  // Keep viewMonth in sync when currentMonthName changes from outside
  useEffect(() => {
    if (currentMonthName && currentMonthName !== 'All Months') {
      const idx = MONTH_NAMES.findIndex((m) => m.toLowerCase() === currentMonthName.toLowerCase());
      if (idx >= 0) {
        setViewMonth(idx + 1);
      }
    }
  }, [currentMonthName]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Quick preset date options
  const quickPresets = [
    {
      label: 'All Dates (Clear)',
      value: '',
      desc: 'Show all in current month',
      icon: '✨',
      badge: null,
    },
    {
      label: 'Today (10 Oct 2026)',
      value: '10-10-2026',
      desc: 'Active festival & celebrations today',
      icon: '🌟',
      badge: 'Today',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      label: 'Tomorrow (11 Oct 2026)',
      value: '11-10-2026',
      desc: 'Next day dispatches & wishes',
      icon: '🌅',
      badge: 'Tomorrow',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      label: 'Day After (12 Oct 2026)',
      value: '12-10-2026',
      desc: 'Upcoming milestone queue',
      icon: '⏩',
      badge: '+2 Days',
      badgeColor: 'bg-slate-100 text-slate-700',
    },
  ];

  // Helper to select a date
  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  // Helper to format date string
  const formatDisplay = (val: string) => {
    if (!val) return null;
    if (val === '10-10-2026') return '10 Oct 2026 (Today)';
    if (val === '11-10-2026') return '11 Oct 2026 (Tomorrow)';
    if (val === '12-10-2026') return '12 Oct 2026';
    const match = val.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (match) {
      const d = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const y = match[3];
      const mName = MONTH_NAMES[m - 1] || '';
      return `${d} ${mName} ${y}`;
    }
    return val;
  };

  // Calendar calculations
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blankDays = Array.from({ length: firstDayOfWeek }, (_, i) => i);

  // Map of event counts by day for the current viewMonth
  const eventMap = useMemo(() => {
    const map: Record<number, DateOptionEvent> = {};
    eventDates.forEach((ev) => {
      if (ev.month === viewMonth) {
        map[ev.day] = ev;
      }
    });
    return map;
  }, [eventDates, viewMonth]);

  // Navigate calendar month
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      
      {/* 1. Input Trigger Bar */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between text-xs bg-slate-50 hover:bg-white border transition-all rounded-xl px-2.5 py-2 font-medium cursor-pointer select-none group shadow-2xs ${
          isOpen 
            ? 'ring-2 ring-amber-500/30 border-amber-500 bg-white' 
            : value 
            ? 'border-amber-300 text-amber-950 font-bold bg-amber-50/50' 
            : 'border-slate-200 text-slate-800'
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          <CalendarIcon className={`w-3.5 h-3.5 shrink-0 ${value ? 'text-amber-600' : 'text-slate-400 group-hover:text-amber-500'}`} />
          <span className="truncate">
            {value ? formatDisplay(value) : <span className="text-slate-400">{placeholder}</span>}
          </span>
        </div>

        <div className="flex items-center space-x-1 shrink-0 ml-1.5">
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              title="Clear Date"
              className="p-0.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-md transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold transition-colors ${
            isOpen ? 'bg-amber-100 text-amber-800' : 'bg-slate-200/60 text-slate-500 group-hover:bg-amber-50 group-hover:text-amber-700'
          }`}>
            📅 Options
          </span>
        </div>
      </div>

      {/* 2. Popover Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 sm:right-auto w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
          
          {/* Header & Tabs */}
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-3 text-white flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <CalendarDays className="w-4 h-4" />
              <span className="font-bold text-xs uppercase tracking-wider">Date Options & Picker</span>
            </div>

            {/* Sub Tabs */}
            <div className="flex bg-black/15 p-0.5 rounded-lg text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('options')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'options' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-white hover:text-amber-100'
                }`}
              >
                ⚡ Quick Options
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeTab === 'calendar' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-white hover:text-amber-100'
                }`}
              >
                🗓️ Calendar
              </button>
            </div>
          </div>

          {/* TAB 1: QUICK DATE OPTIONS */}
          {activeTab === 'options' && (
            <div className="p-3 space-y-3 max-h-[360px] overflow-y-auto">
              
              {/* Presets List */}
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Frequently Used Dates:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  {quickPresets.map((preset) => {
                    const isSelected = value === preset.value;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => handleSelectDate(preset.value)}
                        className={`w-full text-left p-2 rounded-xl border transition-all flex items-center justify-between group ${
                          isSelected
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400 font-bold text-amber-950'
                            : 'bg-slate-50/70 hover:bg-amber-50/50 border-slate-200/70 hover:border-amber-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">{preset.icon}</span>
                          <div>
                            <div className="text-xs font-semibold group-hover:text-amber-900">
                              {preset.label}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {preset.desc}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          {preset.badge && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${preset.badgeColor}`}>
                              {preset.badge}
                            </span>
                          )}
                          {isSelected && (
                            <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Celebration Dates with Records in This Month */}
              {eventDates.length > 0 && (
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      <span>Dates With Celebrations ({MONTH_NAMES[viewMonth - 1]}):</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-semibold">
                      {eventDates.filter((e) => e.month === viewMonth).length} dates found
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {eventDates
                      .filter((e) => e.month === viewMonth)
                      .sort((a, b) => a.day - b.day)
                      .map((ev) => {
                        const isSelected = value === ev.formattedDate;
                        return (
                          <button
                            key={ev.formattedDate}
                            type="button"
                            onClick={() => handleSelectDate(ev.formattedDate)}
                            className={`p-2 rounded-xl border text-left transition-all flex items-center justify-between group ${
                              isSelected
                                ? 'bg-amber-100/70 border-amber-400 ring-1 ring-amber-400 text-amber-950 font-bold'
                                : 'bg-white hover:bg-amber-50 border-slate-200 hover:border-amber-300 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center space-x-1.5 truncate">
                              <span className="text-xs">
                                {ev.type === 'anniversary' ? '💍' : '🎂'}
                              </span>
                              <span className="truncate text-xs font-medium group-hover:text-amber-900">
                                {ev.day} {MONTH_NAMES[ev.month - 1].slice(0, 3)}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900 shrink-0 ml-1">
                              {ev.count}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Direct Manual Date Input */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium">Or type / pick custom:</span>
                <input
                  type="date"
                  value={
                    parseSelected
                      ? `${parseSelected.year}-${String(parseSelected.month).padStart(2, '0')}-${String(parseSelected.day).padStart(2, '0')}`
                      : ''
                  }
                  onChange={(e) => {
                    const raw = e.target.value; // yyyy-mm-dd
                    if (raw) {
                      const [y, m, d] = raw.split('-');
                      const formatted = `${d}-${m}-${y}`;
                      onChange(formatted);
                    } else {
                      onChange('');
                    }
                  }}
                  className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

            </div>
          )}

          {/* TAB 2: INTERACTIVE CALENDAR GRID */}
          {activeTab === 'calendar' && (
            <div className="p-3 space-y-3">
              
              {/* Month & Year Navigation Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-1.5">
                  <select
                    value={viewMonth}
                    onChange={(e) => {
                      const m = parseInt(e.target.value, 10);
                      setViewMonth(m);
                      if (onMonthSelect) onMonthSelect(MONTH_NAMES[m - 1]);
                    }}
                    className="font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={viewYear}
                    onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                    className="font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
                  >
                    {[2024, 2025, 2026, 2027, 2028].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400">
                <span>Su</span>
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span>Sa</span>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {blankDays.map((_, i) => (
                  <div key={`blank-${i}`} className="p-1.5"></div>
                ))}

                {daysArray.map((day) => {
                  const dayStr = String(day).padStart(2, '0');
                  const monthStr = String(viewMonth).padStart(2, '0');
                  const fullDateStr = `${dayStr}-${monthStr}-${viewYear}`;
                  const isSelected = value === fullDateStr;
                  const hasEvents = eventMap[day];
                  const isTodayCell = day === 10 && viewMonth === 10 && viewYear === 2026;

                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelectDate(fullDateStr)}
                      className={`relative p-1.5 rounded-xl text-xs font-semibold transition-all flex flex-col items-center justify-center min-h-[32px] ${
                        isSelected
                          ? 'bg-amber-500 text-white shadow-sm font-bold'
                          : isTodayCell
                          ? 'border border-amber-400 text-amber-900 bg-amber-50/70 hover:bg-amber-100'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <span>{day}</span>

                      {/* Event badge / dot */}
                      {hasEvents && !isSelected && (
                        <span 
                          title={`${hasEvents.count} celebrations`}
                          className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-0.5"
                        />
                      )}
                      {hasEvents && isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Quick Jump Footer */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={() => handleSelectDate('10-10-2026')}
                  className="font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
                >
                  <span>🌟 Jump to Today (10 Oct)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectDate('')}
                  className="text-slate-400 hover:text-slate-600 font-medium"
                >
                  Clear Selection
                </button>
              </div>

            </div>
          )}

          {/* Bottom Bar: Action Helper */}
          <div className="p-2 bg-slate-50 border-t border-slate-200/80 text-center text-[10px] text-slate-500 flex items-center justify-between px-3">
            <span>
              Selected: <strong className="text-slate-800">{value ? formatDisplay(value) : 'None (All in Month)'}</strong>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-amber-700 hover:text-amber-800"
            >
              Done ✓
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
