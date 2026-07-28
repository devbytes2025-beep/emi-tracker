import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Loan, NotificationItem, UserProfile, AppSettings, PaymentEntry } from '../types';
import { INITIAL_LOANS, INITIAL_NOTIFICATIONS, INITIAL_USER_PROFILE, INITIAL_SETTINGS } from '../data/initialData';

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

/**
 * Check if an EMI payment for a loan is a duplicate or invalid
 */
export function validateEMIPayment(
  loan: Loan,
  paymentDate: string,
  monthYear: string,
  emiPaid: number
): ValidationResult {
  // 1. Check if loan is already closed or preclosed
  if (loan.status === 'Closed' || loan.status === 'Preclosed' || loan.outstandingBalance <= 0) {
    return {
      isValid: false,
      errorMessage: `Loan "${loan.name}" is already ${loan.status}. No further EMI payments can be recorded.`
    };
  }

  // 2. Validate payment amount
  if (!emiPaid || Number.isNaN(emiPaid) || emiPaid <= 0) {
    return {
      isValid: false,
      errorMessage: 'EMI payment amount must be a positive number greater than 0.'
    };
  }

  // 3. Prevent Duplicate Payment on Same Date
  const existingSameDate = loan.payments.find((p) => p.date === paymentDate);
  if (existingSameDate) {
    return {
      isValid: false,
      errorMessage: `A payment of ₹${existingSameDate.emiPaid.toLocaleString()} was ALREADY recorded on ${paymentDate} for this loan. Duplicate entry prevented.`
    };
  }

  // 4. Prevent Duplicate Payment for Same Month-Year (e.g. "August 2026")
  const normMonthYear = monthYear.trim().toLowerCase();
  const existingSameMonth = loan.payments.find(
    (p) => p.monthYear.trim().toLowerCase() === normMonthYear
  );
  if (existingSameMonth) {
    return {
      isValid: false,
      errorMessage: `EMI for period "${monthYear}" was ALREADY paid on ${existingSameMonth.date}. Duplicate monthly EMI entry prevented.`
    };
  }

  return { isValid: true };
}

/**
 * Validate New Loan Creation
 */
export function validateNewLoan(
  loanData: {
    name: string;
    bank: string;
    loanAmount: number;
    interestRate: number;
    tenureMonths: number;
    dueDateDay: number;
    accountNumber: string;
  },
  existingLoans: Loan[]
): ValidationResult {
  if (!loanData.name.trim()) {
    return { isValid: false, errorMessage: 'Loan title/nickname is required.' };
  }
  if (!loanData.bank.trim()) {
    return { isValid: false, errorMessage: 'Lending bank name is required.' };
  }
  if (!loanData.loanAmount || loanData.loanAmount <= 0) {
    return { isValid: false, errorMessage: 'Loan principal amount must be greater than 0.' };
  }
  if (loanData.interestRate < 0 || loanData.interestRate > 100) {
    return { isValid: false, errorMessage: 'Interest rate must be between 0% and 100%.' };
  }
  if (!loanData.tenureMonths || loanData.tenureMonths <= 0) {
    return { isValid: false, errorMessage: 'Loan tenure must be at least 1 month.' };
  }
  if (loanData.dueDateDay < 1 || loanData.dueDateDay > 31) {
    return { isValid: false, errorMessage: 'Due date day must be between 1 and 31.' };
  }

  // Duplicate Account Number or exact name/bank check
  if (loanData.accountNumber && loanData.accountNumber.trim()) {
    const duplicateAccount = existingLoans.find(
      (l) => l.accountNumber.trim().toLowerCase() === loanData.accountNumber.trim().toLowerCase()
    );
    if (duplicateAccount) {
      return {
        isValid: false,
        errorMessage: `A loan with Account Number "${loanData.accountNumber}" already exists (${duplicateAccount.name}).`
      };
    }
  }

  return { isValid: true };
}

/**
 * Firestore Real-Time Subscriptions
 */
export function subscribeToUserLoans(
  userId: string,
  onUpdate: (loans: Loan[]) => void
) {
  const loansRef = collection(db, 'users', userId, 'loans');
  return onSnapshot(
    loansRef,
    (snapshot) => {
      const loans: Loan[] = [];
      snapshot.forEach((docSnap) => {
        loans.push({ id: docSnap.id, ...docSnap.data() } as Loan);
      });
      onUpdate(loans);
    },
    (error) => {
      console.error('Error fetching loans from Firestore:', error);
    }
  );
}

export function subscribeToUserNotifications(
  userId: string,
  onUpdate: (notifications: NotificationItem[]) => void
) {
  const notifsRef = collection(db, 'users', userId, 'notifications');
  return onSnapshot(
    notifsRef,
    (snapshot) => {
      const notifs: NotificationItem[] = [];
      snapshot.forEach((docSnap) => {
        notifs.push({ id: docSnap.id, ...docSnap.data() } as NotificationItem);
      });
      // Sort newest first
      notifs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      onUpdate(notifs);
    },
    (error) => {
      console.error('Error fetching notifications:', error);
    }
  );
}

export function subscribeToUserProfile(
  userId: string,
  onUpdate: (profile: UserProfile | null) => void
) {
  const userRef = doc(db, 'users', userId);
  return onSnapshot(
    userRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as UserProfile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error fetching user profile:', error);
    }
  );
}

export function subscribeToUserSettings(
  userId: string,
  onUpdate: (settings: AppSettings | null) => void
) {
  const settingsRef = doc(db, 'users', userId, 'settings', 'config');
  return onSnapshot(
    settingsRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data() as AppSettings);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      console.error('Error fetching user settings:', error);
    }
  );
}

/**
 * Firestore Write Operations
 */
export async function saveLoanToFirestore(userId: string, loan: Loan): Promise<void> {
  const loanRef = doc(db, 'users', userId, 'loans', loan.id);
  await setDoc(loanRef, loan, { merge: true });
}

export async function deleteLoanFromFirestore(userId: string, loanId: string): Promise<void> {
  const loanRef = doc(db, 'users', userId, 'loans', loanId);
  await deleteDoc(loanRef);
}

export async function saveNotificationToFirestore(userId: string, notification: NotificationItem): Promise<void> {
  const notifRef = doc(db, 'users', userId, 'notifications', notification.id);
  await setDoc(notifRef, notification, { merge: true });
}

export async function markNotificationAsReadInFirestore(userId: string, notifId: string): Promise<void> {
  const notifRef = doc(db, 'users', userId, 'notifications', notifId);
  await setDoc(notifRef, { isRead: true }, { merge: true });
}

export async function clearAllNotificationsInFirestore(userId: string, notifIds: string[]): Promise<void> {
  const batch = writeBatch(db);
  notifIds.forEach((id) => {
    const ref = doc(db, 'users', userId, 'notifications', id);
    batch.delete(ref);
  });
  await batch.commit();
}

export async function saveProfileToFirestore(userId: string, profile: UserProfile): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, profile, { merge: true });
}

export async function saveSettingsToFirestore(userId: string, settings: AppSettings): Promise<void> {
  const settingsRef = doc(db, 'users', userId, 'settings', 'config');
  await setDoc(settingsRef, settings, { merge: true });
}

/**
 * Seed initial sample user data in Firestore for brand new users
 */
export async function seedInitialUserDataIfEmpty(
  userId: string,
  userAuthInfo?: { displayName?: string | null; email?: string | null; photoURL?: string | null }
): Promise<void> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Create User Profile
    const newProfile: UserProfile = {
      ...INITIAL_USER_PROFILE,
      name: userAuthInfo?.displayName || userAuthInfo?.email?.split('@')[0] || 'Borrower Account',
      email: userAuthInfo?.email || 'user@fintrack.app',
      photoUrl: userAuthInfo?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
    };
    await setDoc(userRef, newProfile);

    // Save initial settings
    const settingsRef = doc(db, 'users', userId, 'settings', 'config');
    await setDoc(settingsRef, INITIAL_SETTINGS);

    // Initial welcome notification
    const welcomeNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Welcome to Loan EMI Tracker',
      message: 'Your account is ready. Add your first real loan to start tracking EMIs safely!',
      date: new Date().toISOString().split('T')[0],
      type: 'system',
      isRead: false,
    };
    const notifRef = doc(db, 'users', userId, 'notifications', welcomeNotif.id);
    await setDoc(notifRef, welcomeNotif);
  }
}
