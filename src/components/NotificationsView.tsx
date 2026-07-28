import React from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  CheckCheck, 
  Trash2, 
  Sparkles,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { NotificationItem, Loan, AppSettings } from '../types';

interface NotificationsViewProps {
  notifications: NotificationItem[];
  loans: Loan[];
  settings: AppSettings;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearNotifications: () => void;
  onOpenQuickPay: (loan: Loan) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  loans,
  settings,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearNotifications,
  onOpenQuickPay,
}) => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-500" />
            Alerts & Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time alerts for EMI due dates, missed payments, interest updates, and preclosure confirmations.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onMarkAllAsRead}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
          <button
            onClick={onClearNotifications}
            className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900 transition-all"
            title="Clear All Notifications"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Notifications List Card */}
      <div className={`p-6 rounded-3xl border ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {notifications.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Bell className="w-10 h-10 mx-auto opacity-40 text-slate-400" />
            <p className="font-bold text-sm">No new notifications</p>
            <p className="text-xs">You are all caught up on your EMI schedules!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => {
              const matchedLoan = loans.find((l) => l.id === item.loanId);

              return (
                <div
                  key={item.id}
                  onClick={() => onMarkAsRead(item.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer ${
                    !item.isRead
                      ? settings.theme === 'dark'
                        ? 'bg-slate-800/90 border-blue-500/40'
                        : 'bg-blue-50/40 border-blue-200 shadow-2xs'
                      : settings.theme === 'dark'
                        ? 'bg-slate-900/60 border-slate-800/80 opacity-70'
                        : 'bg-slate-50 border-slate-100 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon depending on type */}
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                      item.type === 'overdue'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                        : item.type === 'due_soon'
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                          : item.type === 'preclosed'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    }`}>
                      {item.type === 'overdue' ? (
                        <ShieldAlert className="w-5 h-5" />
                      ) : item.type === 'due_soon' ? (
                        <Clock className="w-5 h-5" />
                      ) : item.type === 'preclosed' ? (
                        <Sparkles className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h3>
                        {!item.isRead && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        {item.message}
                      </p>
                      <span className="text-[10px] font-semibold text-slate-400 mt-1 block">
                        {item.date}
                      </span>
                    </div>
                  </div>

                  {matchedLoan && (matchedLoan.status === 'Active' || matchedLoan.status === 'Overdue') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenQuickPay(matchedLoan);
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-all shrink-0 self-end sm:self-center cursor-pointer"
                    >
                      Pay EMI Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
