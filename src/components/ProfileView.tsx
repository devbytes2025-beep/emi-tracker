import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Edit3, 
  CheckCircle2, 
  Sparkles 
} from 'lucide-react';
import { UserProfile, AppSettings } from '../types';
import { formatCurrency } from '../utils/finance';

interface ProfileViewProps {
  user: UserProfile;
  settings: AppSettings;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  settings,
  onUpdateProfile,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setIsEditing(false);
  };

  const debtToIncomeRatio = Math.round((52000 / user.monthlyIncome) * 100);

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <User className="w-6 h-6 text-blue-500" />
            Borrower Profile
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Personal financial profile, monthly income & credit standing details.
          </p>
        </div>

        <button
          onClick={() => setIsEditing(!isEditing)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Edit3 className="w-4 h-4" />
          <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        settings.theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Occupation</label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly Income ({settings.currency})</label>
                <input
                  type="number"
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })}
                  required
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Monthly Expenses ({settings.currency})</label>
                <input
                  type="number"
                  value={formData.monthlyExpenses}
                  onChange={(e) => setFormData({ ...formData, monthlyExpenses: Number(e.target.value) })}
                  required
                  className={`w-full px-4 py-2.5 text-sm rounded-xl border outline-none ${
                    settings.theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md cursor-pointer transition-all"
            >
              Save Profile Changes
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            
            {/* Top User Info */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-800 text-center sm:text-left">
              <img
                src={user.photoUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-blue-500 shadow-md"
              />
              <div>
                <h2 className="text-2xl font-black">{user.name}</h2>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                  {user.occupation}
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 mt-3">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" /> {user.email}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" /> {user.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Income & Credit Score Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Monthly Income</span>
                <span className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 block">
                  {formatCurrency(user.monthlyIncome, settings.currency)}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">Monthly Expenses</span>
                <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1 block">
                  {formatCurrency(user.monthlyExpenses, settings.currency)}
                </span>
              </div>

              {/* Credit Score Gauge Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-blue-900 to-indigo-950 text-white border border-blue-800 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-200">Credit Score</span>
                  <ShieldCheck className="w-4 h-4 text-blue-300" />
                </div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-white">{user.creditScore}</span>
                  <span className="text-xs font-bold text-blue-200">/ 900</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30 inline-block mt-1">
                  🔵 Excellent Tier
                </span>
              </div>

            </div>

          </div>
        )}

      </div>

    </div>
  );
};
