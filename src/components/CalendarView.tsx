import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { Loan, AppSettings } from '../types';
import { formatCurrency } from '../utils/finance';

interface CalendarViewProps {
  loans: Loan[];
  settings: AppSettings;
  onOpenQuickPay: (loan: Loan) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  loans,
  settings,
  onOpenQuickPay,
}) => {
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 7 = August (0-indexed 7 = August)
  const [selectedDay, setSelectedDay] = useState<number | null>(5);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();

  // Active loans
  const activeLoans = loans.filter((l) => l.status === 'Active' || l.status === 'Overdue');

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Helper to find loans due on a specific day of month
  const getLoansForDay = (day: number) => {
    return activeLoans.filter((l) => l.dueDateDay === day);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-blue-500" />
            EMI Calendar Schedule
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Visual month grid tracking upcoming due dates, paid status, and overdue alerts.
          </p>
        </div>

        {/* Status Colour Legend */}
        <div className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold shrink-0">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> 🟢 Paid
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 🟡 Upcoming
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> 🔴 Missed
          </span>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        {/* Month Switcher Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setCurrentYear(2026);
                setCurrentMonth(7); // August 2026
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty prefix cells for start of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 sm:h-28 rounded-2xl bg-slate-50/40 dark:bg-slate-950/20" />
          ))}

          {/* Month Day Cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayLoans = getLoansForDay(dayNum);
            const isSelected = selectedDay === dayNum;

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => setSelectedDay(dayNum)}
                className={`h-24 sm:h-28 p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSelected
                    ? 'border-blue-500 ring-2 ring-blue-500/30 shadow-md'
                    : dayLoans.length > 0
                      ? settings.theme === 'dark' ? 'bg-slate-800/80 border-slate-700 hover:border-blue-500' : 'bg-slate-50/80 border-slate-200 hover:border-blue-500'
                      : settings.theme === 'dark' ? 'bg-slate-900 border-slate-800/60' : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ${
                    dayNum === 5 || dayNum === 12 || dayNum === 25
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {dayNum}
                  </span>
                  {dayLoans.length > 0 && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      {dayLoans.length} Due
                    </span>
                  )}
                </div>

                {/* Loan Badges Inside Day */}
                <div className="space-y-1 overflow-y-auto scrollbar-none my-1">
                  {dayLoans.map((loan) => {
                    const isOverdue = loan.status === 'Overdue';
                    return (
                      <div
                        key={loan.id}
                        className={`p-1 rounded-lg text-[10px] font-bold leading-tight truncate ${
                          isOverdue
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                            : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300/50'
                        }`}
                      >
                        {loan.bank} - {formatCurrency(loan.emiAmount, settings.currency)}
                      </div>
                    );
                  })}
                </div>

                {dayLoans.length > 0 && (
                  <span className="text-[9px] font-semibold text-slate-400 block text-right">
                    Click to Pay
                  </span>
                )}
              </div>
            );
          })}
        </div>

      </div>

      {/* Selected Day Drawer / Summary */}
      {selectedDay && (
        <div className={`p-6 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h3 className="text-base font-bold mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            EMIs Due on {selectedDay} {monthNames[currentMonth]} {currentYear}
          </h3>

          {getLoansForDay(selectedDay).length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
              No EMI due on this date.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getLoansForDay(selectedDay).map((loan) => (
                <div 
                  key={loan.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-extrabold text-sm">{loan.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {loan.bank} • EMI: <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrency(loan.emiAmount, settings.currency)}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => onOpenQuickPay(loan)}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                  >
                    Pay EMI Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
