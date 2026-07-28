import React from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  BarChart3, 
  Calendar as CalendarIcon, 
  Bell, 
  User, 
  Settings as SettingsIcon,
  Search,
  Moon,
  Sun,
  ShieldCheck,
  Wallet,
  Cloud
} from 'lucide-react';
import { AppSettings, UserProfile } from '../types';
import { User as FirebaseUser } from 'firebase/auth';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  unreadCount: number;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  user: UserProfile;
  currentUser: FirebaseUser | null;
  onOpenAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  unreadCount,
  settings,
  updateSettings,
  user,
  currentUser,
  onOpenAuth,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'entry', label: 'Entry & Payment', icon: PlusCircle },
    { id: 'details', label: 'Loan Profiles', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className={`${settings.theme === 'dark' ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'} border-b sticky top-0 z-30 transition-colors`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <div 
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-500 dark:from-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                FinTrack
              </span>
              <span className={`text-[11px] block font-semibold uppercase tracking-wider -mt-1 ${settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                EMI & Loan Manager
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${settings.theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`} />
              <input
                type="text"
                placeholder="Search SBI, ICICI, Bike Loan, Gold Loan, Account No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border transition-all outline-none ${
                  settings.theme === 'dark'
                    ? 'bg-slate-800/80 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                }`}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync & Auth Button */}
            <button
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentUser
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-sm'
              }`}
              title={currentUser ? 'Cloud Sync Active - Manage Account' : 'Sign In to Sync Data'}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {currentUser ? (currentUser.isAnonymous ? 'Guest Cloud' : 'Cloud Sync') : 'Sign In'}
              </span>
            </button>

            {/* Currency Indicator */}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              settings.theme === 'dark' ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              {settings.currency}
            </span>

            {/* Dark / Light Toggle */}
            <button
              onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
              className={`p-2 rounded-xl transition-colors ${
                settings.theme === 'dark' ? 'hover:bg-slate-800 text-amber-400' : 'hover:bg-slate-100 text-slate-600'
              }`}
              title="Toggle Theme"
            >
              {settings.theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Notification bell button */}
            <button
              onClick={() => setActiveTab('notifications')}
              className={`relative p-2 rounded-xl transition-colors ${
                activeTab === 'notifications' 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400' 
                  : settings.theme === 'dark' ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <button 
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              <img 
                src={user.photoUrl} 
                alt={user.name} 
                className="w-8 h-8 rounded-full object-cover border-2 border-blue-500 shadow-xs"
              />
              <span className="text-sm font-semibold hidden lg:inline-block text-slate-700 dark:text-slate-200">
                {user.name.split(' ')[0]}
              </span>
            </button>
          </div>

        </div>

        {/* Navigation Tabs Bar */}
        <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-100 dark:border-slate-800">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? settings.theme === 'dark'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-xs'
                      : 'bg-blue-50 text-blue-600 border border-blue-200 shadow-2xs'
                    : settings.theme === 'dark'
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-rose-500 text-white'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>

      </div>
    </header>
  );
};
