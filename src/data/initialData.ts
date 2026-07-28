import { Loan, NotificationItem, UserProfile, AppSettings } from '../types';

export const INITIAL_LOANS: Loan[] = [];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-welcome',
    title: 'Account Ready',
    message: 'Welcome to your Loan EMI Tracker. Add your first real loan to begin.',
    date: new Date().toISOString().split('T')[0],
    type: 'system',
    isRead: false,
  }
];

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Borrower Account',
  photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  occupation: 'Loan Account Holder',
  income: 100000,
  email: 'user@fintrack.app',
  phone: '+91 90000 00000',
  monthlyIncome: 100000,
  monthlyExpenses: 30000,
  creditScore: 750,
};

export const INITIAL_SETTINGS: AppSettings = {
  theme: 'light',
  currency: '₹',
  language: 'English',
  notificationsEnabled: true,
  emailAlerts: true,
  autoReminders: true,
};
