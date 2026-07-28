import React from 'react';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  DollarSign, 
  Globe, 
  Bell, 
  Download, 
  Upload, 
  RefreshCw, 
  Trash2,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { AppSettings, Loan } from '../types';
import { exportToCSV } from '../utils/finance';

interface SettingsProps {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  loans: Loan[];
  onImportData: (data: Loan[]) => void;
  onResetToDefaults: () => void;
}

export const SettingsView: React.FC<SettingsProps> = ({
  settings,
  updateSettings,
  loans,
  onImportData,
  onResetToDefaults,
}) => {

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(loans, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Loan_Tracker_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onImportData(parsed);
            alert("Backup restored successfully!");
          }
        } catch (err) {
          alert("Invalid backup file format.");
        }
      };
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-500" />
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Manage visual appearance, currency preferences, notifications, data export & backups.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* 1. Theme & Regional Settings Card */}
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h2 className="text-base font-extrabold mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            Appearance & Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Theme Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Theme Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    settings.theme === 'light'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Sun className="w-4 h-4" />
                  <span>Light Mode</span>
                </button>
                <button
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    settings.theme === 'dark'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  <span>Dark Mode</span>
                </button>
              </div>
            </div>

            {/* Currency Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">Currency Symbol</label>
              <div className="grid grid-cols-4 gap-2">
                {['₹', '$', '€', '£'].map((curr) => (
                  <button
                    key={curr}
                    onClick={() => updateSettings({ currency: curr })}
                    className={`py-2.5 text-sm font-black rounded-xl border transition-all cursor-pointer ${
                      settings.currency === curr
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* 2. Notification Settings */}
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h2 className="text-base font-extrabold mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            Notification Alerts
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Push Notifications</p>
                <p className="text-xs text-slate-500">Receive instant alerts on upcoming EMI due dates</p>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold">Auto Payment Reminders</p>
                <p className="text-xs text-slate-500">Send automatic reminders 3 days before EMI due date</p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoReminders}
                onChange={(e) => updateSettings({ autoReminders: e.target.checked })}
                className="w-5 h-5 accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 3. Export & Backup Section */}
        <div className={`p-6 sm:p-8 rounded-3xl border ${
          settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <h2 className="text-base font-extrabold mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
            Data Backup & Restore
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleExportJSON}
              className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 font-bold text-xs hover:bg-blue-100 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Backup Data (Export JSON)</span>
            </button>

            <label className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Restore Data (Import JSON)</span>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* 4. Reset & Danger Zone */}
        <div className="p-6 sm:p-8 rounded-3xl border bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-300">
          <h2 className="text-base font-extrabold mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            Danger Zone
          </h2>
          <p className="text-xs mb-4 text-slate-600 dark:text-slate-400">
            Resetting data restores initial sample loans for Rakesh Sharma.
          </p>

          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset all loan data to default initial state?')) {
                onResetToDefaults();
              }
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset All Data to Initial Demo State</span>
          </button>
        </div>

      </div>

    </div>
  );
};
