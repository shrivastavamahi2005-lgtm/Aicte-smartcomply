import React from 'react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useTheme, Theme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  Settings, Shield, User, Key, CheckCircle, Info, Sparkles,
  Sun, Moon, Monitor, Globe, Check
} from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
];

export const SettingsPage: React.FC = () => {
  const { user, switchDemoRole } = useAuth();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();

  const currentLang = i18n.language || 'en';

  const demoAccounts = [
    {
      role: 'College Administrator',
      email: 'admin@institution.edu',
      desc: 'Manage institutional draft applications, upload documents, assign internal remediation tasks'
    },
    {
      role: 'Department Coordinator',
      email: 'faculty.cs@institution.edu',
      desc: 'Departmental faculty and lab documentation, task updates'
    },
    {
      role: 'AICTE Reviewing Officer',
      email: 'officer@aicte.gov.in',
      desc: 'Verify evidence, review extraction confidence, request clarifications, recommend decisions'
    },
    {
      role: 'Senior Approving Authority',
      email: 'senior@aicte.gov.in',
      desc: 'Exclusive approval, rejection, or return authority with mandatory reasoned remarks'
    },
    {
      role: 'Auditor',
      email: 'auditor@qualitycouncil.org',
      desc: 'Read-only scrutiny across applications, rules, and immutable audit logs'
    },
  ];

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('smartcomply_lang', code);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
          <Settings className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
          {t('settings.title', 'Settings & System Preferences')}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {t('settings.subtitle', 'Manage display theme, regional language, profile information, and demo personas.')}
        </p>
      </div>

      {/* Visual Mode / Theme & Language Switchers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Appearance Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
              <Sun className="w-4 h-4 mr-2 text-amber-500" />
              {t('settings.appearance', 'Appearance & Theme')}
            </h2>
            <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              {theme}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.appearanceDesc', 'Select your preferred visual mode.')}
          </p>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border text-left transition flex flex-col items-center justify-center space-y-2 ${
                theme === 'light'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold ring-2 ring-blue-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span className="text-xs">{t('settings.lightMode', 'Light')}</span>
            </button>

            <button
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border text-left transition flex flex-col items-center justify-center space-y-2 ${
                theme === 'dark'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold ring-2 ring-blue-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span className="text-xs">{t('settings.darkMode', 'Dark')}</span>
            </button>

            <button
              onClick={() => setTheme('system')}
              className={`p-3 rounded-xl border text-left transition flex flex-col items-center justify-center space-y-2 ${
                theme === 'system'
                  ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold ring-2 ring-blue-600/20'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50'
              }`}
            >
              <Monitor className="w-5 h-5 text-emerald-500" />
              <span className="text-xs">{t('settings.systemMode', 'System')}</span>
            </button>
          </div>
        </div>

        {/* Regional Language Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
              <Globe className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              {t('settings.language', 'Regional Language')}
            </h2>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
              7 Languages Available
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('settings.languageDesc', 'Choose your preferred Indian national language.')}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
            {LANGUAGES.map((lang) => {
              const active = currentLang === lang.code;
              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`p-2.5 rounded-lg border text-left transition flex items-center justify-between text-xs ${
                    active
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 font-bold shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/40'
                  }`}
                >
                  <div className="truncate">
                    <div className="font-medium text-xs">{lang.native}</div>
                    <div className="text-[10px] text-slate-400">{lang.label}</div>
                  </div>
                  {active && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
            <User className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
            {t('settings.currentUser', 'Current Authenticated Persona')}
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Full Name:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.full_name}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Email:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{user?.email}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Assigned Role:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{user?.role}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 dark:text-slate-400">Institution:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.institution_name || 'AICTE Central HQ'}</span>
            </div>
          </div>
        </div>

        {/* Security & Password Hash Notice */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
            <Key className="w-4 h-4 mr-2 text-indigo-600 dark:text-indigo-400" />
            {t('settings.security', 'Security & Cryptographic Identity')}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            All user authentication uses cryptographically secure salted PBKDF2-HMAC-SHA256 password hashing. Sessions are managed through stateless HS256 JWT bearer tokens with expiration.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Token Standard: Stateless HS256 JWT</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Password Hashing: PBKDF2-HMAC-SHA256 (100,000 iterations)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Document Integrity: SHA-256 binary hash generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5-Role Persona Switcher Grid */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center">
            <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
            {t('settings.demoAccounts', 'Demonstration Personas (SIH Evaluation)')}
          </h2>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            One-click role evaluation
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {demoAccounts.map((acc) => {
            const isActive = user?.role === acc.role;
            return (
              <div
                key={acc.role}
                className={`p-3.5 rounded-xl border text-xs space-y-2 flex flex-col justify-between transition ${
                  isActive
                    ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-600 ring-1 ring-blue-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{acc.role}</span>
                    {isActive && (
                      <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-2 py-0.5 rounded-full">
                        {t('common.active', 'Active')}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{acc.email}</div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">{acc.desc}</p>
                </div>

                <button
                  onClick={() => switchDemoRole(acc.role as UserRole)}
                  disabled={isActive}
                  className={`w-full mt-2 py-1.5 px-3 text-xs font-semibold rounded-lg transition ${
                    isActive
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default'
                      : 'bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700'
                  }`}
                >
                  {isActive ? 'Currently Active' : 'Switch to Persona'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
