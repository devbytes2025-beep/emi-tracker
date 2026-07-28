import React from 'react';
import { 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  ArrowUpRight, 
  PieChart as PieIcon, 
  Activity, 
  Plus, 
  ShieldAlert,
  ArrowDownRight,
  Clock,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { Loan, AppSettings, UserProfile } from '../types';
import { formatCurrency } from '../utils/finance';

interface DashboardProps {
  loans: Loan[];
  user: UserProfile;
  settings: AppSettings;
  searchQuery: string;
  onOpenQuickPay: (loan: Loan) => void;
  onNavigateTab: (tab: string, loanId?: string) => void;
}

const COLORS = ['#3b82f6', '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export const DashboardView: React.FC<DashboardProps> = ({
  loans,
  user,
  settings,
  searchQuery,
  onOpenQuickPay,
  onNavigateTab,
}) => {
  // Filter loans based on global search query
  const filteredLoans = loans.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.name.toLowerCase().includes(q) ||
      l.bank.toLowerCase().includes(q) ||
      l.type.toLowerCase().includes(q) ||
      l.accountNumber.toLowerCase().includes(q)
    );
  });

  const activeLoans = filteredLoans.filter((l) => l.status === 'Active' || l.status === 'Overdue');
  const closedLoansCount = loans.filter((l) => l.status === 'Closed').length;
  const preclosedLoansCount = loans.filter((l) => l.status === 'Preclosed').length;

  const totalActiveLoans = activeLoans.length;
  const totalLoanAmount = activeLoans.reduce((acc, l) => acc + l.loanAmount, 0);
  const totalOutstanding = activeLoans.reduce((acc, l) => acc + l.outstandingBalance, 0);
  const totalMonthlyEMI = activeLoans.reduce((acc, l) => acc + l.emiAmount, 0);

  const overdueLoans = activeLoans.filter((l) => l.status === 'Overdue');
  const emiDueThisMonthCount = activeLoans.filter((l) => l.dueDateDay >= 1 && l.dueDateDay <= 31).length;

  // Upcoming EMIs explicitly sorted by due date
  const upcomingEMIs = [...activeLoans]
    .sort((a, b) => a.dueDateDay - b.dueDateDay)
    .slice(0, 4);

  // Distribution chart data
  const distributionData = activeLoans.map((l) => ({
    name: l.type,
    value: l.outstandingBalance,
    loanName: l.name,
  }));

  // Trend chart data (mock monthly trend)
  const trendData = [
    { month: 'Jan', outstanding: 580000, emi: 19650 },
    { month: 'Feb', outstanding: 550000, emi: 19650 },
    { month: 'Mar', outstanding: 520000, emi: 19650 },
    { month: 'Apr', outstanding: 490000, emi: 19650 },
    { month: 'May', outstanding: 460000, emi: 19650 },
    { month: 'Jun', outstanding: 435000, emi: 19650 },
    { month: 'Jul', outstanding: totalOutstanding, emi: totalMonthlyEMI },
    { month: 'Aug (Proj)', outstanding: Math.max(0, totalOutstanding - 15000), emi: totalMonthlyEMI },
  ];

  // Recent Transactions gathered from all loan payments
  const recentTransactions = loans
    .flatMap((l) =>
      l.payments.map((p) => ({
        id: p.id,
        loanName: l.name,
        bank: l.bank,
        date: p.date,
        emi: p.emiPaid,
        mode: p.mode,
        outstanding: p.remainingOutstanding,
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Welcome Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden transition-all ${
        settings.theme === 'dark' 
          ? 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 border-slate-800' 
          : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white border-blue-500 shadow-xl shadow-blue-500/10'
      }`}>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 text-white backdrop-blur-xs border border-white/20 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Smart Debt Overview
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Good Morning, {user.name.split(' ')[0]} 👋
            </h1>
            <p className="text-xs sm:text-sm text-blue-100 dark:text-slate-300 mt-1 max-w-xl font-medium">
              Here is your complete personal loan and EMI breakdown. All metrics, due dates, and outstanding balances are updated in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateTab('entry')}
              className="px-4 py-2.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Loan</span>
            </button>
            <button
              onClick={() => onNavigateTab('entry')}
              className="px-4 py-2.5 rounded-xl bg-blue-500/30 hover:bg-blue-500/40 text-white font-bold text-sm backdrop-blur-xs border border-white/20 transition-all"
            >
              Log Payment
            </button>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Active Loans */}
        <div className={`p-5 rounded-2xl border transition-all ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Active Loans</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {totalActiveLoans}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Total Borrowed:</span>
            <span>{formatCurrency(totalLoanAmount, settings.currency)}</span>
          </div>
        </div>

        {/* Total Loan Amount */}
        <div className={`p-5 rounded-2xl border transition-all ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Total Loan Amount</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalLoanAmount, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold">{totalActiveLoans} Active Accounts</span>
          </div>
        </div>

        {/* Outstanding Balance */}
        <div className={`p-5 rounded-2xl border transition-all ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Outstanding Balance</span>
            <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-pink-600 dark:text-pink-400">
            {formatCurrency(totalOutstanding, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span>Progress: </span>
            <span className="font-bold text-slate-700 dark:text-slate-200">
              {Math.round(((totalLoanAmount - totalOutstanding) / totalLoanAmount) * 100)}% Paid
            </span>
          </div>
        </div>

        {/* Monthly EMI */}
        <div className={`p-5 rounded-2xl border transition-all ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider">Monthly EMI</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalMonthlyEMI, settings.currency)}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>Deducted monthly</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Auto-calculated</span>
          </div>
        </div>

      </div>

      {/* Empty Slate Prompt if 0 loans */}
      {loans.length === 0 && (
        <div className={`p-8 sm:p-12 rounded-3xl border text-center space-y-4 ${
          settings.theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="w-16 h-16 mx-auto rounded-3xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
            <Plus className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-black">Your Loan Tracker is Clean & Empty</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              No template or demo loans added. Register your real personal, home, vehicle, or education loan to start tracking EMIs and preventing duplicate payment logs.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('entry')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-black shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Loan Now</span>
          </button>
        </div>
      )}

      {/* Secondary Status Chips / Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          settings.theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">EMI Due This Month</p>
            <p className="text-lg font-black text-slate-800 dark:text-slate-100">{emiDueThisMonthCount}</p>
          </div>
          <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-full text-[11px] font-bold">
            Upcoming
          </span>
        </div>

        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          settings.theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold font-bold">Overdue Notice</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">{overdueLoans.length}</p>
          </div>
          <span className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 rounded-full text-[11px] font-bold">
            Overdue
          </span>
        </div>

        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          settings.theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Loans Closed</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{closedLoansCount}</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 rounded-full text-[11px] font-bold">
            Paid
          </span>
        </div>

        <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
          settings.theme === 'dark' ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Preclosed</p>
            <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{preclosedLoansCount}</p>
          </div>
          <span className="px-2.5 py-1 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 rounded-full text-[11px] font-bold">
            Preclosed
          </span>
        </div>
      </div>

      {/* Main Grid: Upcoming EMIs + Loan Distribution Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Upcoming EMI Panel */}
        <div className={`lg:col-span-1 p-6 rounded-3xl border flex flex-col justify-between ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Clock className="w-4 h-4 text-blue-500" />
                Upcoming EMIs
              </h2>
              <button 
                onClick={() => onNavigateTab('calendar')}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <span>Calendar</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEMIs.map((loan) => {
                const monthName = 'Aug';
                const dueFormatted = `${loan.dueDateDay < 10 ? '0' + loan.dueDateDay : loan.dueDateDay} ${monthName}`;
                const isOverdue = loan.status === 'Overdue';

                return (
                  <div
                    key={loan.id}
                    className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                      isOverdue
                        ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                        : settings.theme === 'dark'
                          ? 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl font-bold flex items-center justify-center text-xs shrink-0 ${
                        isOverdue 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                      }`}>
                        {loan.bank.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                          {loan.name}
                        </p>
                        <p className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${
                          isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'
                        }`}>
                          <span>Due: {dueFormatted}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                        {formatCurrency(loan.emiAmount, settings.currency)}
                      </p>
                      <button
                        onClick={() => onOpenQuickPay(loan)}
                        className={`mt-1 px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all shadow-2xs ${
                          isOverdue
                            ? 'bg-rose-600 hover:bg-rose-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isOverdue ? 'Pay Overdue' : 'Pay EMI'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('entry')}
            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-all text-center"
          >
            + Record Custom Payment or Preclosure
          </button>
        </div>

        {/* Loan Distribution Pie Chart */}
        <div className={`lg:col-span-2 p-6 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <PieIcon className="w-4 h-4 text-blue-500" />
                Loan Distribution
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Breakdown of outstanding balance by loan type
              </p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value, settings.currency)}
                  contentStyle={{
                    backgroundColor: settings.theme === 'dark' ? '#1e293b' : '#ffffff',
                    borderColor: settings.theme === 'dark' ? '#334155' : '#e2e8f0',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Outstanding Trend Line Chart */}
      <div className={`p-6 rounded-3xl border ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              Outstanding Balance Trend
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Track how your overall liability reduces over months
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
            📉 Steady Reduction
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={settings.theme === 'dark' ? '#334155' : '#f1f5f9'} />
              <XAxis dataKey="month" stroke={settings.theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={12} />
              <YAxis 
                stroke={settings.theme === 'dark' ? '#94a3b8' : '#64748b'} 
                fontSize={12}
                tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value, settings.currency)}
                contentStyle={{
                  backgroundColor: settings.theme === 'dark' ? '#1e293b' : '#ffffff',
                  borderColor: settings.theme === 'dark' ? '#334155' : '#e2e8f0',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="outstanding" 
                name="Outstanding" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={{ r: 5, fill: '#3b82f6' }} 
                activeDot={{ r: 8 }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className={`p-6 rounded-3xl border ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Recent Transactions</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Latest payments logged across all active loans</p>
          </div>
          <button
            onClick={() => onNavigateTab('details')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            View Full Ledgers →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${settings.theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Date</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Loan Name</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Bank</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">EMI Paid</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Mode</th>
                <th className="py-3 px-3 font-bold uppercase tracking-wider text-[10px]">Outstanding Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-semibold">{tx.date}</td>
                  <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-slate-100">{tx.loanName}</td>
                  <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{tx.bank}</td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-extrabold">
                    {formatCurrency(tx.emi, settings.currency)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-[11px] font-bold">
                      {tx.mode}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                    {formatCurrency(tx.outstanding, settings.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
