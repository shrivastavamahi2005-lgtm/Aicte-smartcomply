import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import {
  ShieldCheck, Lock, Mail, ArrowRight, Sparkles, AlertCircle,
  Eye, EyeOff, Globe, Sun, Moon, Monitor
} from 'lucide-react';
import { UserRole } from '../types';
import { SUPPORTED_LANGUAGES } from '../i18n/locales';

export const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('admin@institution.edu');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      showToast('Welcome to SmartComply AI', 'Authenticated successfully', 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      showToast('Authentication Failed', err.message || 'Please check your credentials', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, demoPass: string, roleName: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setSubmitting(true);
    try {
      await login(demoEmail, demoPass);
      showToast('Demo Access Granted', `Signed in as ${roleName}`, 'success');
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  const demoAccounts = [
    { role: 'College Administrator' as UserRole, email: 'admin@institution.edu', pass: 'Admin@123', desc: 'Manage institutional draft applications, upload evidence, assign tasks' },
    { role: 'AICTE Reviewing Officer' as UserRole, email: 'officer@aicte.gov.in', pass: 'Officer@123', desc: 'Inspect extracted evidence, request clarifications, recommend decisions' },
    { role: 'Senior Approving Authority' as UserRole, email: 'senior@aicte.gov.in', pass: 'Senior@123', desc: 'Final approval, rejection, or return with mandatory reasoned remarks' },
    { role: 'Department Coordinator' as UserRole, email: 'faculty.cs@institution.edu', pass: 'Faculty@123', desc: 'Submit departmental documentation, update assigned remediation tasks' },
    { role: 'Auditor' as UserRole, email: 'auditor@qualitycouncil.org', pass: 'Auditor@123', desc: 'Read-only scrutiny across applications, rules, and immutable audit logs' },
  ];

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 transition-colors relative">
      {/* Top Controls: Language & Theme */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        <div className="relative inline-block text-left">
          <select
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value);
              localStorage.setItem('smartcomply_lang', e.target.value);
            }}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.name})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
          title="Toggle Light / Dark mode"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-500/20 mb-3">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {t('appName')}
        </h1>
        <p className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold tracking-wide uppercase">
          {t('appTagline')}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {t('brandSubtitle')}
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-2xl sm:px-10 border border-slate-200/80 dark:border-slate-800 transition-colors">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 flex items-center text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0 text-red-600 dark:text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Persona Login Selection for Judges */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                1-Click Demonstration Login (SIH Evaluation)
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickLogin(acc.email, acc.pass, acc.role)}
                  className="text-left p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:border-blue-200 dark:hover:border-blue-800 transition group"
                >
                  <div className="font-semibold text-xs text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {acc.role}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{acc.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white dark:bg-slate-900 text-slate-400 font-medium">Or enter credentials</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Institutional Email
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-900 dark:text-white"
                  placeholder="admin@institution.edu"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-2 flex justify-center items-center py-2.5 px-4 border border-transparent rounded-xl shadow-md text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 transition disabled:opacity-50"
            >
              {submitting ? t('common.authenticating') : t('common.signIn')}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400 dark:text-slate-500">
              Smart India Hackathon 2026 Prototype • Salted PBKDF2-HMAC-SHA256 Encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
