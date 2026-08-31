import { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { toJalali, jalaliToTimestamp, todayJalali, formatJalaliDate } from '@/utils';

const MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
];

const WEEKDAY_NAMES = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

function daysInJalaliMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  const isLeap = ((jy % 33) * 4 + 4) % 33 < 4;
  return isLeap ? 30 : 29;
}

interface JalaliDatePickerProps {
  value: number;
  onChange: (ts: number) => void;
  className?: string;
}

export function JalaliDatePicker({ value, onChange, className = '' }: JalaliDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => toJalali(value).jy);
  const [viewMonth, setViewMonth] = useState(() => toJalali(value).jm);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { jy, jm, jd } = toJalali(value);

  const days = daysInJalaliMonth(viewYear, viewMonth);
  const firstDayJalali = toJalali(jalaliToTimestamp(viewYear, viewMonth, 1));
  const firstWeekday = (firstDayJalali.jd + 1) % 7;

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear(y => y - 1);
    } else {
      setViewMonth(m => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear(y => y + 1);
    } else {
      setViewMonth(m => m + 1);
    }
  };

  const selectDay = (day: number) => {
    onChange(jalaliToTimestamp(viewYear, viewMonth, day));
    setOpen(false);
  };

  const selectToday = () => {
    const today = todayJalali();
    onChange(jalaliToTimestamp(today.jy, today.jm, today.jd));
    setViewYear(today.jy);
    setViewMonth(today.jm);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div className="relative">
        <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          readOnly
          className="input w-full !pr-10 cursor-pointer"
          value={formatJalaliDate(value)}
          onClick={() => setOpen(o => !o)}
          placeholder="انتخاب تاریخ"
        />
        <ChevronDown size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
      </div>
      {open && (
        <div className="absolute z-50 top-full mt-1 right-0 bg-slate-800 border border-slate-600 rounded-lg shadow-2xl p-4 w-72">
          <div className="flex items-center justify-between mb-3">
            <button className="btn btn-ghost !p-1.5" onClick={prevMonth}>
              <ChevronRight size={18} />
            </button>
            <span className="text-sm font-bold text-slate-100">
              {MONTH_NAMES[viewMonth - 1]} {viewYear}
            </span>
            <button className="btn btn-ghost !p-1.5" onClick={nextMonth}>
              <ChevronLeft size={18} />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_NAMES.map(w => (
              <div key={w} className="text-center text-xs text-slate-500 font-medium py-1">{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              day === null ? (
                <div key={i} />
              ) : (
                <button
                  key={i}
                  className={`h-9 rounded-lg text-sm transition-all ${
                    day === jd && viewMonth === jm && viewYear === jy
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-200 hover:bg-slate-700'
                  }`}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              ))
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700/50">
            <button className="btn btn-secondary w-full justify-center !text-xs" onClick={selectToday}>
              امروز
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
