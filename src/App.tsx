import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  subscribeToUserLoans, 
  subscribeToUserNotifications, 
  subscribeToUserProfile, 
  subscribeToUserSettings,
  saveLoanToFirestore,
  saveNotificationToFirestore,
  markNotificationAsReadInFirestore,
  clearAllNotificationsInFirestore,
  saveProfileToFirestore,
  saveSettingsToFirestore,
  seedInitialUserDataIfEmpty
} from './services/db';

import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { EntryView } from './components/EntryView';
import { LoanDetailsView } from './components/LoanDetailsView';
import { ReportsView } from './components/ReportsView';
import { CalendarView } from './components/CalendarView';
import { NotificationsView } from './components/NotificationsView';
import { ProfileView } from './components/ProfileView';
import { SettingsView } from './components/SettingsView';
import { QuickPayModal } from './components/QuickPayModal';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './components/LandingPage';

import { Loan, NotificationItem, UserProfile, AppSettings, PaymentMode } from './types';
import { INITIAL_LOANS, INITIAL_NOTIFICATIONS, INITIAL_USER_PROFILE, INITIAL_SETTINGS } from './data/initialData';

export default function App() {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isLocalSession, setIsLocalSession] = useState<boolean>(() => {
    return localStorage.getItem('fintrack_local_session') === 'true';
  });

  const handleStartLocalSession = () => {
    localStorage.setItem('fintrack_local_session', 'true');
    setIsLocalSession(true);
  };

  // Core App States
  const [loans, setLoans] = useState<Loan[]>(INITIAL_LOANS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [user, setUser] = useState<UserProfile>(INITIAL_USER_PROFILE);
  const [settings, setSettings] = useState<AppSettings>(INITIAL_SETTINGS);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLoanForDetailsId, setSelectedLoanForDetailsId] = useState<string>('');

  // Quick Pay Modal State
  const [quickPayLoan, setQuickPayLoan] = useState<Loan | null>(null);
  const [isQuickPayOpen, setIsQuickPayOpen] = useState<boolean>(false);

  // Firebase Auth & Firestore Subscription Listener
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setCurrentUser(authUser);

      if (authUser) {
        // Ensure initial user data is seeded if new user
        await seedInitialUserDataIfEmpty(authUser.uid, authUser);

        // Subscribe to Firestore Collections for current user
        const unsubLoans = subscribeToUserLoans(authUser.uid, (data) => setLoans(data));
        const unsubNotifs = subscribeToUserNotifications(authUser.uid, (data) => setNotifications(data));
        const unsubProfile = subscribeToUserProfile(authUser.uid, (data) => {
          if (data) setUser(data);
        });
        const unsubSettings = subscribeToUserSettings(authUser.uid, (data) => {
          if (data) setSettings(data);
        });

        return () => {
          unsubLoans();
          unsubNotifs();
          unsubProfile();
          unsubSettings();
        };
      } else {
        // Fallback to local storage if signed out
        const savedLoans = localStorage.getItem('fintrack_loans');
        if (savedLoans) setLoans(JSON.parse(savedLoans));

        const savedNotifs = localStorage.getItem('fintrack_notifications');
        if (savedNotifs) setNotifications(JSON.parse(savedNotifs));

        const savedUser = localStorage.getItem('fintrack_user');
        if (savedUser) setUser(JSON.parse(savedUser));

        const savedSettings = localStorage.getItem('fintrack_settings');
        if (savedSettings) setSettings(JSON.parse(savedSettings));
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Theme Sync
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Fallback LocalStorage Sync when offline
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('fintrack_loans', JSON.stringify(loans));
      localStorage.setItem('fintrack_notifications', JSON.stringify(notifications));
      localStorage.setItem('fintrack_user', JSON.stringify(user));
      localStorage.setItem('fintrack_settings', JSON.stringify(settings));
    }
  }, [loans, notifications, user, settings, currentUser]);

  const unreadNotificationsCount = notifications.filter((n) => !n.isRead).length;

  const handleOpenQuickPay = (loan: Loan) => {
    setQuickPayLoan(loan);
    setIsQuickPayOpen(true);
  };

  const handleCloseQuickPay = () => {
    setIsQuickPayOpen(false);
    setQuickPayLoan(null);
  };

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    if (currentUser) {
      await saveSettingsToFirestore(currentUser.uid, updated);
    }
  };

  // 1. ADD NEW LOAN
  const handleAddNewLoan = async (
    newLoanData: Omit<Loan, 'id' | 'outstandingBalance' | 'totalPaidPrincipal' | 'totalPaidInterest' | 'payments' | 'status'>
  ) => {
    const newId = `loan-${Date.now()}`;
    const createdLoan: Loan = {
      ...newLoanData,
      id: newId,
      outstandingBalance: newLoanData.loanAmount,
      totalPaidPrincipal: 0,
      totalPaidInterest: 0,
      payments: [],
      status: 'Active',
    };

    setLoans((prev) => [createdLoan, ...prev]);

    // Create Notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Loan Added',
      message: `${createdLoan.name} (${createdLoan.bank}) of ${settings.currency}${createdLoan.loanAmount.toLocaleString()} has been registered.`,
      date: new Date().toISOString().split('T')[0],
      type: 'system',
      isRead: false,
      loanId: newId,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Persist to Firestore if user logged in
    if (currentUser) {
      await saveLoanToFirestore(currentUser.uid, createdLoan);
      await saveNotificationToFirestore(currentUser.uid, newNotif);
    }
  };

  // 2. RECORD MONTHLY PAYMENT
  const handleRecordPayment = async (
    loanId: string,
    monthYear: string,
    emiPaid: number,
    extraPayment: number,
    lateFee: number,
    paymentDate: string,
    mode: PaymentMode,
    remark: string
  ) => {
    let updatedLoanToSave: Loan | null = null;

    setLoans((prevLoans) =>
      prevLoans.map((l) => {
        if (l.id !== loanId) return l;

        const monthlyRate = l.interestRate / 12 / 100;
        const interestPortion = Math.round(l.outstandingBalance * monthlyRate);
        const principalPortion = Math.max(0, emiPaid - interestPortion + extraPayment);

        const newOutstanding = Math.max(0, l.outstandingBalance - principalPortion);
        const newTotalPrincipal = l.totalPaidPrincipal + principalPortion;
        const newTotalInterest = l.totalPaidInterest + interestPortion;
        const newStatus = newOutstanding === 0 ? 'Closed' : l.status === 'Overdue' ? 'Active' : l.status;

        const newPaymentEntry = {
          id: `pay-${Date.now()}`,
          loanId,
          monthYear,
          date: paymentDate,
          emiPaid,
          extraPayment,
          lateFee,
          interestPortion,
          principalPortion,
          remainingOutstanding: newOutstanding,
          mode,
          remark,
          status: 'Paid' as const,
        };

        const updated: Loan = {
          ...l,
          outstandingBalance: newOutstanding,
          totalPaidPrincipal: newTotalPrincipal,
          totalPaidInterest: newTotalInterest,
          status: newStatus,
          payments: [newPaymentEntry, ...l.payments],
        };

        updatedLoanToSave = updated;
        return updated;
      })
    );

    // Save Payment Notification
    const targetLoan = loans.find((l) => l.id === loanId);
    if (targetLoan) {
      const paymentNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Payment Logged',
        message: `EMI Payment of ${settings.currency}${emiPaid.toLocaleString()} recorded for ${targetLoan.name}.`,
        date: paymentDate,
        type: 'due_soon',
        isRead: false,
        loanId,
      };
      setNotifications((prev) => [paymentNotif, ...prev]);

      if (currentUser) {
        if (updatedLoanToSave) {
          await saveLoanToFirestore(currentUser.uid, updatedLoanToSave);
        }
        await saveNotificationToFirestore(currentUser.uid, paymentNotif);
      }
    }
  };

  // 3. RECORD PRECLOSURE
  const handleRecordPreclosure = async (
    loanId: string,
    precloseAmount: number,
    date: string,
    charges: number,
    remark: string
  ) => {
    let updatedLoanToSave: Loan | null = null;

    setLoans((prevLoans) =>
      prevLoans.map((l) => {
        if (l.id !== loanId) return l;

        const newOutstanding = Math.max(0, l.outstandingBalance - precloseAmount);
        const isFullyClosed = newOutstanding === 0;
        const estimatedInterestSaved = Math.round(precloseAmount * (l.interestRate / 100) * 1.5);

        const updated: Loan = {
          ...l,
          outstandingBalance: newOutstanding,
          status: isFullyClosed ? ('Preclosed' as const) : l.status,
          totalPaidPrincipal: l.totalPaidPrincipal + precloseAmount,
          preclosure: {
            id: `pre-${Date.now()}`,
            loanId,
            date,
            precloseAmount,
            charges,
            interestSaved: estimatedInterestSaved,
            remark,
          },
        };

        updatedLoanToSave = updated;
        return updated;
      })
    );

    const targetLoan = loans.find((l) => l.id === loanId);
    if (targetLoan) {
      const precloseNotif: NotificationItem = {
        id: `notif-${Date.now()}`,
        title: 'Preclosure Processed',
        message: `Preclosure payment of ${settings.currency}${precloseAmount.toLocaleString()} applied to ${targetLoan.name}.`,
        date,
        type: 'preclosed',
        isRead: false,
        loanId,
      };
      setNotifications((prev) => [precloseNotif, ...prev]);

      if (currentUser) {
        if (updatedLoanToSave) {
          await saveLoanToFirestore(currentUser.uid, updatedLoanToSave);
        }
        await saveNotificationToFirestore(currentUser.uid, precloseNotif);
      }
    }
  };

  // Notification handlers
  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    if (currentUser) {
      await markNotificationAsReadInFirestore(currentUser.uid, id);
    }
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    if (currentUser) {
      for (const n of notifications) {
        if (!n.isRead) {
          await markNotificationAsReadInFirestore(currentUser.uid, n.id);
        }
      }
    }
  };

  const handleClearNotifications = async () => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    if (currentUser && ids.length > 0) {
      await clearAllNotificationsInFirestore(currentUser.uid, ids);
    }
  };

  // Profile handler
  const handleUpdateProfile = async (updated: UserProfile) => {
    setUser(updated);
    if (currentUser) {
      await saveProfileToFirestore(currentUser.uid, updated);
    }
  };

  // Reset handler
  const handleResetToDefaults = () => {
    setLoans(INITIAL_LOANS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setUser(INITIAL_USER_PROFILE);
    setSettings(INITIAL_SETTINGS);
    localStorage.clear();
  };

  // Import handler
  const handleImportData = async (importedLoans: Loan[]) => {
    setLoans(importedLoans);
    if (currentUser) {
      for (const l of importedLoans) {
        await saveLoanToFirestore(currentUser.uid, l);
      }
    }
  };

  const handleNavigateTab = (tab: string, loanId?: string) => {
    setActiveTab(tab);
    if (loanId) setSelectedLoanForDetailsId(loanId);
  };

  // Show Landing Page with Sign In / Sign Up when user is not authenticated and hasn't started a local session
  if (!currentUser && !isLocalSession) {
    return (
      <LandingPage 
        theme={settings.theme} 
        onStartLocalSession={handleStartLocalSession} 
      />
    );
  }

  return (
    <div className={`min-h-screen font-sans transition-colors ${
      settings.theme === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        unreadCount={unreadNotificationsCount}
        settings={settings}
        updateSettings={updateSettings}
        user={user}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && (
          <DashboardView
            loans={loans}
            user={user}
            settings={settings}
            searchQuery={searchQuery}
            onOpenQuickPay={handleOpenQuickPay}
            onNavigateTab={handleNavigateTab}
          />
        )}

        {activeTab === 'entry' && (
          <EntryView
            loans={loans}
            settings={settings}
            onAddNewLoan={handleAddNewLoan}
            onRecordPayment={handleRecordPayment}
            onRecordPreclosure={handleRecordPreclosure}
          />
        )}

        {activeTab === 'details' && (
          <LoanDetailsView
            loans={loans}
            settings={settings}
            selectedLoanId={selectedLoanForDetailsId}
            onOpenQuickPay={handleOpenQuickPay}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            loans={loans}
            settings={settings}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            loans={loans}
            settings={settings}
            onOpenQuickPay={handleOpenQuickPay}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsView
            notifications={notifications}
            loans={loans}
            settings={settings}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onClearNotifications={handleClearNotifications}
            onOpenQuickPay={handleOpenQuickPay}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            user={user}
            settings={settings}
            onUpdateProfile={handleUpdateProfile}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            updateSettings={updateSettings}
            loans={loans}
            onImportData={handleImportData}
            onResetToDefaults={handleResetToDefaults}
          />
        )}
      </main>

      {/* Quick Pay Modal */}
      <QuickPayModal
        isOpen={isQuickPayOpen}
        onClose={handleCloseQuickPay}
        loan={quickPayLoan}
        settings={settings}
        onSavePayment={handleRecordPayment}
      />

      {/* Firebase User Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        currentUser={currentUser}
        theme={settings.theme}
      />

    </div>
  );
}
