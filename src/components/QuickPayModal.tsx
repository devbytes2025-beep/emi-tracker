import React, { useState } from 'react';
import { X, CheckCircle2, DollarSign, Calendar, CreditCard, AlertCircle } from 'lucide-react';
import { Loan, PaymentMode, AppSettings } from '../types';
import { formatCurrency } from '../utils/finance';
import { validateEMIPayment } from '../services/db';

interface QuickPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  settings: AppSettings;
  onSavePayment: (
    loanId: string,
    monthYear: string,
    emiPaid: number,
    extraPayment: number,
    lateFee: number,
    paymentDate: string,
    mode: PaymentMode,
    remark: string
  ) => void;
}

export const QuickPayModal: React.FC<QuickPayModalProps> = ({
  isOpen,
  onClose,
  loan,
  settings,
  onSavePayment,
}) => {
  if (!isOpen || !loan) return null;

  const [monthYear, setMonthYear] = useState<string>('August 2026');
  const [emiPaid, setEmiPaid] = useState<number>(loan.emiAmount);
  const [extraPayment, setExtraPayment] = useState<number>(0);
  const [lateFee, setLateFee] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [mode, setMode] = useState<PaymentMode>('UPI');
  const [remark, setRemark] = useState<string>('Monthly EMI Payment');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    // Validate duplicate payment
    const validation = validateEMIPayment(
      loan,
      paymentDate,
      monthYear,
      Number(emiPaid)
    );

    if (!validation.isValid) {
      setValidationError(validation.errorMessage || 'Invalid payment.');
      return;
    }

    onSavePayment(
      loan.id,
      monthYear,
      Number(emiPaid),
      Number(extraPayment),
      Number(lateFee),
      paymentDate,
      mode,
      remark
    );
    onClose();
  };

  const totalPayment = Number(emiPaid) + Number(extraPayment) + Number(lateFee);
  const projectedOutstanding = Math.max(
    0,
    loan.outstandingBalance - (Number(emiPaid) - Math.round(loan.outstandingBalance * (loan.interestRate / 12 / 100)) + Number(extraPayment))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-all ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-800'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-xs">
              {loan.bank.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-base">{loan.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Outstanding: {formatCurrency(loan.outstandingBalance, settings.currency)}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {validationError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <span className="block font-black uppercase text-[10px] tracking-wider text-rose-700 dark:text-rose-300">Duplicate Payment Blocked</span>
                <span>{validationError}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Month & Year
              </label>
              <input
                type="text"
                value={monthYear}
                onChange={(e) => setMonthYear(e.target.value)}
                placeholder="e.g. July 2026"
                required
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                  settings.theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Payment Date
              </label>
              <input
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
                className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                  settings.theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-slate-100'
                    : 'bg-slate-50 border-slate-200 text-slate-800'
                }`}
              />
            </div>
          </div>

          {/* Amount Inputs */}
          <div className="space-y-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                EMI Paid ({settings.currency})
              </label>
              <input
                type="number"
                value={emiPaid}
                onChange={(e) => setEmiPaid(Number(e.target.value))}
                required
                min={0}
                className={`w-full px-3 py-2 text-base font-bold rounded-xl border outline-none ${
                  settings.theme === 'dark'
                    ? 'bg-slate-800 border-slate-700 text-emerald-400'
                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Extra Payment
                </label>
                <input
                  type="number"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Number(e.target.value))}
                  min={0}
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Late Fee
                </label>
                <input
                  type="number"
                  value={lateFee}
                  onChange={(e) => setLateFee(Number(e.target.value))}
                  min={0}
                  className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
              Payment Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['UPI', 'Bank Transfer', 'Cash'] as PaymentMode[]).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMode(m)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                    mode === m
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : settings.theme === 'dark'
                        ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Remark */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              Remark / Note
            </label>
            <input
              type="text"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="e.g. Paid via GPay"
              className={`w-full px-3 py-2 text-sm rounded-xl border outline-none ${
                settings.theme === 'dark'
                  ? 'bg-slate-800 border-slate-700 text-slate-100'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>

          {/* Summary Box */}
          <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1.5">
            <div className="flex justify-between font-bold">
              <span className="text-slate-600 dark:text-slate-300">Total Deducted:</span>
              <span className="text-blue-600 dark:text-blue-400 text-sm">
                {formatCurrency(totalPayment, settings.currency)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 dark:text-slate-400">
              <span>New Outstanding:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {formatCurrency(projectedOutstanding, settings.currency)}
              </span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Confirm & Record Payment</span>
          </button>

        </form>
      </div>
    </div>
  );
};
