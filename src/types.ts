export type LoanType = 
  | 'Personal'
  | 'Home'
  | 'Bike'
  | 'Education'
  | 'Gold'
  | 'Credit Card'
  | 'Others';

export type PaymentFrequency = 'Monthly' | 'Weekly' | 'Quarterly';

export type LoanStatus = 'Active' | 'Overdue' | 'Closed' | 'Preclosed' | 'Upcoming';

export type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer';

export interface PaymentEntry {
  id: string;
  loanId: string;
  monthYear: string; // e.g. "July 2026"
  date: string; // YYYY-MM-DD
  emiPaid: number;
  extraPayment: number;
  lateFee: number;
  interestPortion: number;
  principalPortion: number;
  remainingOutstanding: number;
  mode: PaymentMode;
  remark: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface PreclosureEntry {
  id: string;
  loanId: string;
  date: string;
  precloseAmount: number;
  charges: number;
  interestSaved: number;
  remark: string;
}

export interface Loan {
  id: string;
  name: string;
  bank: string;
  type: LoanType;
  borrowerName: string;
  accountNumber: string;
  startDate: string; // YYYY-MM-DD
  loanAmount: number;
  interestRate: number; // annual %
  emiAmount: number;
  tenureMonths: number;
  paymentFrequency: PaymentFrequency;
  dueDateDay: number; // e.g., 5 for 5th of every month
  status: LoanStatus;
  outstandingBalance: number;
  totalPaidPrincipal: number;
  totalPaidInterest: number;
  payments: PaymentEntry[];
  preclosure?: PreclosureEntry;
  notes?: string;
}

export interface AmortizationRow {
  monthNo: number;
  date: string;
  emi: number;
  interest: number;
  principal: number;
  outstanding: number;
  status: 'Paid' | 'Pending' | 'Overdue';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'due_soon' | 'overdue' | 'completed' | 'interest_change' | 'preclosed' | 'system';
  isRead: boolean;
  loanId?: string;
}

export interface UserProfile {
  name: string;
  photoUrl: string;
  occupation: string;
  income: number;
  email: string;
  phone: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  creditScore: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  currency: string; // '₹' | '$' | '€' | '£'
  language: string;
  notificationsEnabled: boolean;
  emailAlerts: boolean;
  autoReminders: boolean;
}
