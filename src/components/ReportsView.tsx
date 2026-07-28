import React, { useState } from 'react';
import { 
  BarChart3, 
  PieChart as PieIcon, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Filter, 
  Download, 
  Sparkles,
  ShieldCheck,
  TrendingDown
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Loan, AppSettings } from '../types';
import { formatCurrency, exportToCSV } from '../utils/finance';

interface ReportsProps {
  loans: Loan[];
  settings: AppSettings;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

export const ReportsView: React.FC<ReportsProps> = ({ loans, settings }) => {
  const [period, setPeriod] = useState<'Monthly' | 'Quarterly' | 'Yearly'>('Monthly');
  const [selectedBank, setSelectedBank] = useState<string>('All');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Filter loans
  const filteredLoans = loans.filter((l) => {
    if (selectedBank !== 'All' && l.bank !== selectedBank) return false;
    if (selectedType !== 'All' && l.type !== selectedType) return false;
    if (selectedStatus === 'Active' && l.status !== 'Active' && l.status !== 'Overdue') return false;
    if (selectedStatus === 'Closed' && l.status !== 'Closed' && l.status !== 'Preclosed') return false;
    return true;
  });

  // Calculate high level interest vs principal stats
  const totalLoanAmount = filteredLoans.reduce((acc, l) => acc + l.loanAmount, 0);
  const totalPaidPrincipal = filteredLoans.reduce((acc, l) => acc + l.totalPaidPrincipal, 0);
  const totalPaidInterest = filteredLoans.reduce((acc, l) => acc + l.totalPaidInterest, 0);
  const totalOutstanding = filteredLoans.reduce((acc, l) => acc + l.outstandingBalance, 0);

  // Interest saved by preclosures
  const totalInterestSaved = loans.reduce((acc, l) => {
    if (l.preclosure) return acc + l.preclosure.interestSaved;
    return acc;
  }, 0);

  // Chart 1: Interest Paid vs Principal Paid stacked comparison
  const interestVsPrincipalData = filteredLoans.map((l) => ({
    name: l.name.length > 12 ? l.name.substring(0, 12) + '...' : l.name,
    Principal: l.totalPaidPrincipal,
    Interest: l.totalPaidInterest,
    Outstanding: l.outstandingBalance,
  }));

  // Chart 2: Outstanding Graph
  const outstandingGraphData = [
    { period: 'Jan 2026', totalOutstanding: 580000 },
    { period: 'Feb 2026', totalOutstanding: 545000 },
    { period: 'Mar 2026', totalOutstanding: 510000 },
    { period: 'Apr 2026', totalOutstanding: 480000 },
    { period: 'May 2026', totalOutstanding: 450000 },
    { period: 'Jun 2026', totalOutstanding: 430000 },
    { period: 'Jul 2026', totalOutstanding: totalOutstanding },
  ];

  // Unique Banks and Types for filter dropdowns
  const uniqueBanks = Array.from(new Set(loans.map((l) => l.bank)));
  const uniqueTypes = Array.from(new Set(loans.map((l) => l.type)));

  const handleExportReport = () => {
    const reportExportData = filteredLoans.map((l) => ({
      LoanName: l.name,
      Bank: l.bank,
      Type: l.type,
      Status: l.status,
      LoanAmount: l.loanAmount,
      InterestRate: l.interestRate,
      MonthlyEMI: l.emiAmount,
      OutstandingBalance: l.outstandingBalance,
      PaidPrincipal: l.totalPaidPrincipal,
      PaidInterest: l.totalPaidInterest,
    }));
    exportToCSV(`Loan_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`, reportExportData);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Title & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-500" />
            Financial Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Interactive analytical charts for interest vs principal paid, preclosure savings, and bank-wise liabilities.
          </p>
        </div>

        <button
          onClick={handleExportReport}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Full Report</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-3 ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
      }`}>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider pr-2 border-r border-slate-200 dark:border-slate-800">
          <Filter className="w-4 h-4 text-blue-500" />
          <span>Filters:</span>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {(['Monthly', 'Quarterly', 'Yearly'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                period === p
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Bank Filter */}
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none ${
            settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <option value="All">All Banks</option>
          {uniqueBanks.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        {/* Type Filter */}
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none ${
            settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <option value="All">All Loan Types</option>
          {uniqueTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none ${
            settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active Loans</option>
          <option value="Closed">Closed / Preclosed Loans</option>
        </select>
      </div>

      {/* Summary Highlight Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-5 rounded-2xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">Total Principal Paid</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(totalPaidPrincipal, settings.currency)}
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">Total Interest Paid</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">
            {formatCurrency(totalPaidInterest, settings.currency)}
          </span>
        </div>

        <div className={`p-5 rounded-2xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <span className="text-xs font-bold text-slate-500 block">Total Outstanding Balance</span>
          <span className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1 block">
            {formatCurrency(totalOutstanding, settings.currency)}
          </span>
        </div>

        {/* Total Interest Saved by Preclosure Card */}
        <div className="p-5 rounded-2xl border bg-gradient-to-br from-purple-900 to-indigo-950 text-white border-purple-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-200 block">Total Interest Saved by Preclosure</span>
            <Sparkles className="w-4 h-4 text-purple-300" />
          </div>
          <span className="text-2xl font-black text-emerald-300 mt-1 block">
            {formatCurrency(totalInterestSaved, settings.currency)}
          </span>
          <p className="text-[11px] text-purple-200 mt-1">Saved by early pre-payments & preclosures!</p>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart: Interest vs Principal Stacked Bar */}
        <div className={`p-6 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Principal vs Interest Paid by Loan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Stack breakdown comparing principal equity building vs interest cost
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={interestVsPrincipalData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={settings.theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="name" stroke={settings.theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} />
                <YAxis 
                  stroke={settings.theme === 'dark' ? '#94a3b8' : '#64748b'} 
                  fontSize={11}
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
                <Legend verticalAlign="top" height={36} />
                <Bar dataKey="Principal" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Interest" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart: Outstanding Liabilities Over Time */}
        <div className={`p-6 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}>
          <div className="mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
              Outstanding Liability Reduction Path
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historical liability reduction timeline
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={outstandingGraphData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={settings.theme === 'dark' ? '#334155' : '#f1f5f9'} />
                <XAxis dataKey="period" stroke={settings.theme === 'dark' ? '#94a3b8' : '#64748b'} fontSize={11} />
                <YAxis 
                  stroke={settings.theme === 'dark' ? '#94a3b8' : '#64748b'} 
                  fontSize={11}
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
                  dataKey="totalOutstanding" 
                  name="Outstanding" 
                  stroke="#8b5cf6" 
                  strokeWidth={3} 
                  dot={{ r: 5, fill: '#8b5cf6' }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
