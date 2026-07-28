import { Loan, PaymentEntry, PreclosureEntry, AmortizationRow } from '../types';

/**
 * Calculates standard reducing balance EMI
 * P = Principal loan amount
 * r = Monthly interest rate (Annual Rate / 12 / 100)
 * n = Tenure in months
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / tenureMonths);

  const r = annualRate / 12 / 100;
  const emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Formats currency values
 */
export function formatCurrency(amount: number, currencySymbol: string = '₹'): string {
  if (isNaN(amount) || amount === null) return `${currencySymbol}0`;
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `${currencySymbol}${formatted}`;
}

/**
 * Generates dynamic Amortization Schedule up to loan tenure
 */
export function generateAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  tenureMonths: number,
  startDateStr: string,
  dueDateDay: number,
  payments: PaymentEntry[] = [],
  preclosures: PreclosureEntry[] = []
): AmortizationRow[] {
  const rows: AmortizationRow[] = [];
  let balance = loanAmount;
  const monthlyRate = annualRate / 12 / 100;
  const emi = calculateEMI(loanAmount, annualRate, tenureMonths);

  const startDate = new Date(startDateStr || '2026-01-01');

  for (let m = 1; m <= tenureMonths; m++) {
    if (balance <= 0) break;

    // Calculate month date
    const currentDate = new Date(startDate);
    currentDate.setMonth(startDate.getMonth() + (m - 1));
    currentDate.setDate(dueDateDay || 5);
    const dateStr = currentDate.toISOString().split('T')[0];
    const monthYearLabel = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    // Check if there is an logged payment for this month or month index
    const loggedPayment = payments.find(p => p.monthYear.toLowerCase() === monthYearLabel.toLowerCase());

    const interest = Math.round(balance * monthlyRate);
    let principal = Math.min(balance, emi - interest);
    if (principal < 0) principal = 0;

    let currentEmi = Math.min(balance + interest, emi);
    let status: 'Paid' | 'Pending' | 'Overdue' = 'Pending';

    // Check if date is in past relative to current date (July 2026)
    const today = new Date('2026-07-28');
    if (loggedPayment) {
      status = loggedPayment.status;
      if (loggedPayment.emiPaid > 0) {
        principal = loggedPayment.principalPortion || principal;
      }
    } else if (currentDate < today) {
      status = 'Paid';
    } else if (currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear()) {
      status = 'Pending';
    }

    balance = Math.max(0, balance - principal);

    rows.push({
      monthNo: m,
      date: dateStr,
      emi: currentEmi,
      interest: interest,
      principal: principal,
      outstanding: balance,
      status: status,
    });
  }

  return rows;
}

/**
 * Utility to export JSON or CSV data
 */
export function exportToCSV(filename: string, rows: object[]) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = (row as Record<string, unknown>)[k] === null || (row as Record<string, unknown>)[k] === undefined ? '' : (row as Record<string, unknown>)[k];
            cell = typeof cell === 'string' ? `"${cell.replace(/"/g, '""')}"` : cell;
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
