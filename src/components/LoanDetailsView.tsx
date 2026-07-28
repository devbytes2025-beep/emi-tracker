import React, { useState } from 'react';
import { 
  FileText, 
  Building, 
  Calendar, 
  Percent, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Printer, 
  ChevronRight,
  TrendingUp,
  Layers,
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { Loan, AppSettings } from '../types';
import { formatCurrency, generateAmortizationSchedule, exportToCSV } from '../utils/finance';

interface LoanDetailsViewProps {
  loans: Loan[];
  settings: AppSettings;
  selectedLoanId?: string;
  onOpenQuickPay: (loan: Loan) => void;
}

export const LoanDetailsView: React.FC<LoanDetailsViewProps> = ({
  loans,
  settings,
  selectedLoanId,
  onOpenQuickPay,
}) => {
  const [currentId, setCurrentId] = useState<string>(selectedLoanId || loans[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'ledger' | 'amortization'>('ledger');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const currentLoan = loans.find((l) => l.id === currentId) || loans[0];

  if (!currentLoan) {
    return (
      <div className="p-8 text-center text-slate-500">
        No loan selected or found.
      </div>
    );
  }

  const paidAmount = currentLoan.loanAmount - currentLoan.outstandingBalance;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((paidAmount / currentLoan.loanAmount) * 100))
  );

  // Amortization schedule
  const amortizationSchedule = generateAmortizationSchedule(
    currentLoan.loanAmount,
    currentLoan.interestRate,
    currentLoan.tenureMonths,
    currentLoan.startDate,
    currentLoan.dueDateDay,
    currentLoan.payments,
    currentLoan.preclosure ? [currentLoan.preclosure] : []
  );

  // Bank Statement Monthly Ledger
  const ledgerRows = amortizationSchedule.filter((row) => {
    if (statusFilter === 'All') return true;
    return row.status === statusFilter;
  });

  const handleExportLedger = () => {
    exportToCSV(`${currentLoan.name}_Ledger.csv`, ledgerRows);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Top Loan Selector & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Loan Profile & Statement
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            View detailed stats, monthly ledger statements, and amortization schedule for each loan.
          </p>
        </div>

        {/* Loan Select Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 shrink-0">Switch Loan:</label>
          <select
            value={currentId}
            onChange={(e) => setCurrentId(e.target.value)}
            className={`px-4 py-2 text-sm font-bold rounded-xl border outline-none ${
              settings.theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-slate-100'
                : 'bg-white border-slate-200 text-slate-800 shadow-xs'
            }`}
          >
            {loans.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.bank}) - {l.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Hero Overview Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {currentLoan.bank.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
                  {currentLoan.name}
                </h2>
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                  currentLoan.status === 'Active'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                    : currentLoan.status === 'Overdue'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                      : currentLoan.status === 'Preclosed'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                }`}>
                  {currentLoan.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentLoan.bank} • Account No: <span className="font-mono font-semibold">{currentLoan.accountNumber}</span> • Start Date: {currentLoan.startDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(currentLoan.status === 'Active' || currentLoan.status === 'Overdue') && (
              <button
                onClick={() => onOpenQuickPay(currentLoan)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Pay Next EMI</span>
              </button>
            )}
            <button
              onClick={handleExportLedger}
              className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs sm:text-sm rounded-xl hover:bg-slate-200 dark:hover:bg-slate-750 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 6 Key Overview Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-6">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Loan Amount</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(currentLoan.loanAmount, settings.currency)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Interest Rate</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              {currentLoan.interestRate}% p.a.
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Monthly EMI</span>
            <span className="text-lg font-black text-slate-900 dark:text-slate-100">
              {formatCurrency(currentLoan.emiAmount, settings.currency)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Outstanding Balance</span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(currentLoan.outstandingBalance, settings.currency)}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold block">Total Paid So Far</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(paidAmount, settings.currency)}
            </span>
          </div>
        </div>

        {/* Repayment Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span className="text-slate-600 dark:text-slate-300">Repayment Progress ({progressPercent}%)</span>
            <span className="text-slate-500 dark:text-slate-400">
              {formatCurrency(paidAmount, settings.currency)} / {formatCurrency(currentLoan.loanAmount, settings.currency)}
            </span>
          </div>
          <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* Tabs & Ledger View */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'ledger'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📊 Bank Statement Monthly Ledger
            </button>
            <button
              onClick={() => setActiveTab('amortization')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'amortization'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              📅 Complete Amortization Schedule
            </button>
          </div>

          {activeTab === 'ledger' && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border outline-none ${
                  settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <option value="All">All Months</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          )}
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className={`border-b ${settings.theme === 'dark' ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-3 px-3 font-semibold">Month #</th>
                <th className="py-3 px-3 font-semibold">Date</th>
                <th className="py-3 px-3 font-semibold">EMI Amount</th>
                <th className="py-3 px-3 font-semibold">Interest Portion</th>
                <th className="py-3 px-3 font-semibold">Principal Portion</th>
                <th className="py-3 px-3 font-semibold">Remaining Outstanding</th>
                <th className="py-3 px-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {ledgerRows.map((row) => (
                <tr 
                  key={row.monthNo}
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    row.status === 'Paid' ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-bold text-slate-700 dark:text-slate-300">
                    Month {row.monthNo}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{row.date}</td>
                  <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-slate-100">
                    {formatCurrency(row.emi, settings.currency)}
                  </td>
                  <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-bold">
                    {formatCurrency(row.interest, settings.currency)}
                  </td>
                  <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(row.principal, settings.currency)}
                  </td>
                  <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-200">
                    {formatCurrency(row.outstanding, settings.currency)}
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      row.status === 'Paid'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : row.status === 'Overdue'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {row.status === 'Paid' ? '🟢 Paid' : row.status === 'Overdue' ? '🔴 Overdue' : '🟡 Pending'}
                    </span>
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
