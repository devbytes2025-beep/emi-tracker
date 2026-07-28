import React, { useState } from 'react';
import { 
  PlusCircle, 
  CreditCard, 
  DollarSign, 
  Calculator, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Zap,
  Building,
  User,
  Calendar,
  Layers,
  Percent,
  ShieldCheck,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { Loan, LoanType, PaymentFrequency, PaymentMode, AppSettings } from '../types';
import { formatCurrency, calculateEMI } from '../utils/finance';
import { validateEMIPayment, validateNewLoan } from '../services/db';

interface EntryViewProps {
  loans: Loan[];
  settings: AppSettings;
  onAddNewLoan: (newLoan: Omit<Loan, 'id' | 'outstandingBalance' | 'totalPaidPrincipal' | 'totalPaidInterest' | 'payments' | 'status'>) => void;
  onRecordPayment: (
    loanId: string,
    monthYear: string,
    emiPaid: number,
    extraPayment: number,
    lateFee: number,
    paymentDate: string,
    mode: PaymentMode,
    remark: string
  ) => void;
  onRecordPreclosure: (
    loanId: string,
    precloseAmount: number,
    date: string,
    charges: number,
    remark: string
  ) => void;
}

export const EntryView: React.FC<EntryViewProps> = ({
  loans,
  settings,
  onAddNewLoan,
  onRecordPayment,
  onRecordPreclosure,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'add_loan' | 'add_payment' | 'preclosure'>('add_payment');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Loan State
  const [loanName, setLoanName] = useState('');
  const [bank, setBank] = useState('');
  const [loanType, setLoanType] = useState<LoanType>('Personal');
  const [borrowerName, setBorrowerName] = useState('Rakesh Sharma');
  const [accountNumber, setAccountNumber] = useState('');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(11.5);
  const [emiAmount, setEmiAmount] = useState<number>(3300);
  const [tenureMonths, setTenureMonths] = useState<number>(36);
  const [paymentFrequency, setPaymentFrequency] = useState<PaymentFrequency>('Monthly');
  const [dueDateDay, setDueDateDay] = useState<number>(5);

  // Payment State
  const activeLoans = loans.filter((l) => l.status === 'Active' || l.status === 'Overdue');
  const [selectedPaymentLoanId, setSelectedPaymentLoanId] = useState<string>(activeLoans[0]?.id || '');
  const selectedPaymentLoan = loans.find((l) => l.id === selectedPaymentLoanId) || activeLoans[0];

  const [paymentMonth, setPaymentMonth] = useState<string>('August 2026');
  const [emiPaid, setEmiPaid] = useState<number>(selectedPaymentLoan?.emiAmount || 8560);
  const [extraPayment, setExtraPayment] = useState<number>(2000);
  const [lateFee, setLateFee] = useState<number>(100);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('UPI');
  const [paymentRemark, setPaymentRemark] = useState<string>('Regular EMI payment');

  // Preclosure State
  const [selectedPrecloseLoanId, setSelectedPrecloseLoanId] = useState<string>(activeLoans[0]?.id || '');
  const selectedPrecloseLoan = loans.find((l) => l.id === selectedPrecloseLoanId) || activeLoans[0];

  const [precloseAmount, setPrecloseAmount] = useState<number>(40000);
  const [precloseDate, setPrecloseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [precloseCharges, setPrecloseCharges] = useState<number>(500);
  const [precloseRemark, setPrecloseRemark] = useState<string>('Lumpsum preclosure using bonus');

  // Auto calculate EMI helper
  const handleAutoCalcEMI = () => {
    const calculated = calculateEMI(Number(loanAmount), Number(interestRate), Number(tenureMonths));
    setEmiAmount(calculated);
  };

  // Handle Add Loan Form
  const handleAddLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const validation = validateNewLoan(
      {
        name: loanName,
        bank,
        loanAmount: Number(loanAmount),
        interestRate: Number(interestRate),
        tenureMonths: Number(tenureMonths),
        dueDateDay: Number(dueDateDay),
        accountNumber,
      },
      loans
    );

    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || 'Invalid loan configuration.');
      return;
    }

    onAddNewLoan({
      name: loanName,
      bank,
      type: loanType,
      borrowerName,
      accountNumber: accountNumber || `ACC-${Math.floor(100000 + Math.random() * 900000)}`,
      startDate,
      loanAmount: Number(loanAmount),
      interestRate: Number(interestRate),
      emiAmount: Number(emiAmount),
      tenureMonths: Number(tenureMonths),
      paymentFrequency,
      dueDateDay: Number(dueDateDay),
      notes: 'Added from Entry Page',
    });

    setSuccessMsg(`🎉 New Loan "${loanName}" added successfully!`);
    setTimeout(() => setSuccessMsg(null), 4000);

    // Reset Form
    setLoanName('');
    setBank('');
    setAccountNumber('');
  };

  // Handle Payment Submit
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedPaymentLoan) {
      setErrorMsg('Please select a valid active loan.');
      return;
    }

    // DUPLICATE & VALIDATION CHECK
    const validation = validateEMIPayment(
      selectedPaymentLoan,
      paymentDate,
      paymentMonth,
      Number(emiPaid)
    );

    if (!validation.isValid) {
      setErrorMsg(validation.errorMessage || 'Invalid payment entry.');
      return;
    }

    onRecordPayment(
      selectedPaymentLoan.id,
      paymentMonth,
      Number(emiPaid),
      Number(extraPayment),
      Number(lateFee),
      paymentDate,
      paymentMode,
      paymentRemark
    );

    const oldOutstanding = selectedPaymentLoan?.outstandingBalance || 0;
    const estInterest = Math.round(oldOutstanding * (selectedPaymentLoan.interestRate / 12 / 100));
    const newEstOutstanding = Math.max(0, oldOutstanding - (Number(emiPaid) - estInterest + Number(extraPayment)));

    setSuccessMsg(
      `✅ Payment recorded! Outstanding updated: ${formatCurrency(oldOutstanding, settings.currency)} ↓ ${formatCurrency(newEstOutstanding, settings.currency)}`
    );
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  // Handle Preclosure Submit
  const handlePreclosureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!selectedPrecloseLoan) {
      setErrorMsg('Please select a valid loan for preclosure.');
      return;
    }

    if (selectedPrecloseLoan.status === 'Closed' || selectedPrecloseLoan.status === 'Preclosed' || selectedPrecloseLoan.outstandingBalance <= 0) {
      setErrorMsg(`Loan "${selectedPrecloseLoan.name}" is already closed. No preclosure possible.`);
      return;
    }

    if (!precloseAmount || Number(precloseAmount) <= 0) {
      setErrorMsg('Preclosure amount must be a positive number greater than 0.');
      return;
    }

    if (Number(precloseAmount) > selectedPrecloseLoan.outstandingBalance) {
      setErrorMsg(
        `Preclosure amount (${formatCurrency(Number(precloseAmount), settings.currency)}) cannot exceed current outstanding balance (${formatCurrency(selectedPrecloseLoan.outstandingBalance, settings.currency)}).`
      );
      return;
    }

    const currentOut = selectedPrecloseLoan?.outstandingBalance || 0;
    const newOut = Math.max(0, currentOut - Number(precloseAmount));

    onRecordPreclosure(
      selectedPrecloseLoan.id,
      Number(precloseAmount),
      precloseDate,
      Number(precloseCharges),
      precloseRemark
    );

    setSuccessMsg(
      `🚀 Preclosure recorded! Outstanding reduced from ${formatCurrency(currentOut, settings.currency)} ↓ ${formatCurrency(newOut, settings.currency)}`
    );
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-500" />
            Entry & Payment Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Add new loans, log monthly payments with extra principal reduction, or process loan preclosures.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveSubTab('add_payment')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'add_payment'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            💳 Record Payment
          </button>
          <button
            onClick={() => setActiveSubTab('add_loan')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'add_loan'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            ➕ Add New Loan
          </button>
          <button
            onClick={() => setActiveSubTab('preclosure')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeSubTab === 'preclosure'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            🔓 Loan Preclosure
          </button>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm font-bold flex items-center gap-3 animate-in fade-in duration-200">
          <Sparkles className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-sm font-bold flex items-start gap-3 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="block font-black text-xs uppercase tracking-wider text-rose-800 dark:text-rose-200">
              Entry Prevented / Duplicate Alert
            </span>
            <span>{errorMsg}</span>
          </div>
        </div>
      )}

      {/* 1. RECORD MONTHLY PAYMENT TAB */}
      {activeSubTab === 'add_payment' && (
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-500" />
                Record Monthly Payment
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Log regular EMI, extra pre-payments, or late fees. Outstanding updates automatically upon saving.
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              
              {/* Select Loan */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Select Loan
                </label>
                <select
                  value={selectedPaymentLoanId}
                  onChange={(e) => {
                    setSelectedPaymentLoanId(e.target.value);
                    const found = loans.find((l) => l.id === e.target.value);
                    if (found) setEmiPaid(found.emiAmount);
                  }}
                  className={`w-full px-4 py-3 text-sm font-bold rounded-xl border outline-none ${
                    settings.theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {activeLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.bank}) - Outstanding: {formatCurrency(l.outstandingBalance, settings.currency)} | EMI: {formatCurrency(l.emiAmount, settings.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Month
                  </label>
                  <input
                    type="text"
                    value={paymentMonth}
                    onChange={(e) => setPaymentMonth(e.target.value)}
                    placeholder="e.g. July 2026"
                    required
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
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
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* EMI Paid, Extra Payment, Late Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    EMI Paid ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={emiPaid}
                    onChange={(e) => setEmiPaid(Number(e.target.value))}
                    required
                    min={0}
                    className={`w-full px-4 py-2.5 text-base font-bold rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-emerald-400'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Extra Payment ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={extraPayment}
                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                    min={0}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Late Fee ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={lateFee}
                    onChange={(e) => setLateFee(Number(e.target.value))}
                    min={0}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Mode & Remark */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Payment Mode
                  </label>
                  <div className="flex gap-2">
                    {(['UPI', 'Bank Transfer', 'Cash'] as PaymentMode[]).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setPaymentMode(mode)}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                          paymentMode === mode
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Remark
                  </label>
                  <input
                    type="text"
                    value={paymentRemark}
                    onChange={(e) => setPaymentRemark(e.target.value)}
                    placeholder="e.g. Paid via PhonePe"
                    className={`w-full px-4 py-2 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Outstanding Impact Banner */}
              {selectedPaymentLoan && (
                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Current Outstanding:</span>
                    <span className="text-slate-900 dark:text-slate-100">
                      {formatCurrency(selectedPaymentLoan.outstandingBalance, settings.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-600 dark:text-blue-400">
                    <span>Projected Outstanding After Payment:</span>
                    <span className="text-sm">
                      {formatCurrency(
                        Math.max(
                          0,
                          selectedPaymentLoan.outstandingBalance - (Number(emiPaid) - Math.round(selectedPaymentLoan.outstandingBalance * (selectedPaymentLoan.interestRate / 12 / 100)) + Number(extraPayment))
                        ),
                        settings.currency
                      )}
                    </span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Save & Update Outstanding</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 2. ADD NEW LOAN TAB */}
      {activeSubTab === 'add_loan' && (
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="max-w-3xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                Add New Loan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Register a new loan into your profile. Automatic EMI calculation available.
              </p>
            </div>

            <form onSubmit={handleAddLoanSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Loan Name *
                  </label>
                  <input
                    type="text"
                    value={loanName}
                    onChange={(e) => setLoanName(e.target.value)}
                    placeholder="e.g. SBI Home Loan"
                    required
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Bank / Financial Institution *
                  </label>
                  <input
                    type="text"
                    value={bank}
                    onChange={(e) => setBank(e.target.value)}
                    placeholder="e.g. SBI, HDFC, ICICI, Axis"
                    required
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Loan Type
                  </label>
                  <select
                    value={loanType}
                    onChange={(e) => setLoanType(e.target.value as LoanType)}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Personal">Personal</option>
                    <option value="Home">Home</option>
                    <option value="Bike">Bike</option>
                    <option value="Education">Education</option>
                    <option value="Gold">Gold</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Borrower Name
                  </label>
                  <input
                    type="text"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    required
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Loan Amount ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(Number(e.target.value))}
                    required
                    min={1000}
                    className={`w-full px-4 py-2.5 text-sm font-bold rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Interest Rate (% p.a.)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                    required
                    className={`w-full px-4 py-2.5 text-sm font-bold rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Tenure (Months)
                  </label>
                  <input
                    type="number"
                    value={tenureMonths}
                    onChange={(e) => setTenureMonths(Number(e.target.value))}
                    required
                    min={1}
                    className={`w-full px-4 py-2.5 text-sm font-bold rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* EMI Calculation row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Calculated EMI Amount ({settings.currency})
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoCalcEMI}
                      className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      Auto-Calculate
                    </button>
                  </div>
                  <input
                    type="number"
                    value={emiAmount}
                    onChange={(e) => setEmiAmount(Number(e.target.value))}
                    required
                    className={`w-full px-4 py-2 text-lg font-black rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-emerald-400'
                        : 'bg-white border-emerald-200 text-emerald-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Payment Frequency
                  </label>
                  <select
                    value={paymentFrequency}
                    onChange={(e) => setPaymentFrequency(e.target.value as PaymentFrequency)}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Quarterly">Quarterly</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Account / Loan Reference Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. SBI-HL-901823"
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    EMI Due Day of Month
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dueDateDay}
                    onChange={(e) => setDueDateDay(Number(e.target.value))}
                    required
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm shadow-xl shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-5 h-5" />
                <span>Save New Loan</span>
              </button>

            </form>
          </div>
        </div>
      )}

      {/* 3. PRECLOSURE TAB */}
      {activeSubTab === 'preclosure' && (
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-purple-500" />
                Preclose / Lumpsum Reduction
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pay a lump sum amount to drastically reduce your outstanding balance or close the loan early.
              </p>
            </div>

            <form onSubmit={handlePreclosureSubmit} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Select Loan to Preclose
                </label>
                <select
                  value={selectedPrecloseLoanId}
                  onChange={(e) => setSelectedPrecloseLoanId(e.target.value)}
                  className={`w-full px-4 py-3 text-sm font-bold rounded-xl border outline-none ${
                    settings.theme === 'dark'
                      ? 'bg-slate-800 border-slate-700 text-slate-100'
                      : 'bg-slate-50 border-slate-200 text-slate-800'
                  }`}
                >
                  {activeLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} - Outstanding: {formatCurrency(l.outstandingBalance, settings.currency)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedPrecloseLoan && (
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs space-y-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-slate-600 dark:text-slate-300">Current Outstanding:</span>
                    <span className="text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(selectedPrecloseLoan.outstandingBalance, settings.currency)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Preclose Amount ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={precloseAmount}
                    onChange={(e) => setPrecloseAmount(Number(e.target.value))}
                    required
                    min={1}
                    className={`w-full px-4 py-2.5 text-base font-bold rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-purple-400'
                        : 'bg-purple-50 border-purple-200 text-purple-700'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Preclosure Date
                  </label>
                  <input
                    type="date"
                    value={precloseDate}
                    onChange={(e) => setPrecloseDate(e.target.value)}
                    required
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Preclosure Charges / Fees ({settings.currency})
                  </label>
                  <input
                    type="number"
                    value={precloseCharges}
                    onChange={(e) => setPrecloseCharges(Number(e.target.value))}
                    min={0}
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Remark
                  </label>
                  <input
                    type="text"
                    value={precloseRemark}
                    onChange={(e) => setPrecloseRemark(e.target.value)}
                    placeholder="e.g. Closed with annual bonus"
                    className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                      settings.theme === 'dark'
                        ? 'bg-slate-800 border-slate-700 text-slate-100'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Before/After Outstanding Indicator */}
              {selectedPrecloseLoan && (
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 font-semibold">Outstanding Change</p>
                    <div className="flex items-center gap-2 mt-1 text-sm font-extrabold">
                      <span className="text-slate-700 dark:text-slate-300">
                        {formatCurrency(selectedPrecloseLoan.outstandingBalance, settings.currency)}
                      </span>
                      <ArrowRight className="w-4 h-4 text-purple-500" />
                      <span className="text-purple-600 dark:text-purple-400 text-base">
                        {formatCurrency(
                          Math.max(0, selectedPrecloseLoan.outstandingBalance - Number(precloseAmount)),
                          settings.currency
                        )}
                      </span>
                    </div>
                  </div>

                  {Number(precloseAmount) >= selectedPrecloseLoan.outstandingBalance && (
                    <span className="px-3 py-1 bg-purple-600 text-white rounded-lg font-bold text-xs">
                      Loan Fully Closed! 🟣
                    </span>
                  )}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-sm shadow-xl shadow-purple-600/25 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Preclosure & Update Balance</span>
              </button>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
