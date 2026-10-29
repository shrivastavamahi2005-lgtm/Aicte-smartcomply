import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme, Theme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { UserRole, AlertRecord } from '../../types';
import { api } from '../../services/api';
import { SUPPORTED_LANGUAGES } from '../../i18n/locales';
import {
  Bell, CheckCircle2, AlertTriangle, Shield, User as UserIcon,
  LogOut, ChevronDown, Sparkles, Sun, Moon, Monitor, Globe, Menu
} from 'lucide-react';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, switchDemoRole } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { showToast } = useToast();

  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  useEffect(() => {
    if (user) {
      loadAlerts();
      const interval = setInterval(loadAlerts, 20000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err) {
      console.warn('Failed to fetch alerts', err);
    }
  };

  const handleAcknowledge = async (e: React.MouseEvent, alertId: number) => {
    e.stopPropagation();
    try {
      await api.acknowledgeAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, is_acknowledged: true, is_read: true } : a))
      );
      showToast('Alert Acknowledged', 'Record updated in audit log.', 'success');
    } catch (err) {
      showToast('Error', 'Failed to acknowledge alert', 'error');
    }
  };

  const handleLanguageChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('smartcomply_lang', code);
    setShowLangMenu(false);
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    showToast('Language Updated', `Interface language switched to ${lang?.name || code}`, 'info');
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setShowThemeMenu(false);
    showToast('Theme Changed', `Switched to ${newTheme} mode`, 'info');
  };

  const unreadCount = alerts.filter((a) => !a.is_read).length;

  const roles: UserRole[] = [
    'College Administrator',
    'Department Coordinator',
    'AICTE Reviewing Officer',
    'Senior Approving Authority',
    'Auditor'
  ];

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* Left: Mobile hamburger & Institutional info */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
            {user?.institution_name || 'AICTE Central Headquarters'}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <Shield className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
            {user?.role}
          </span>
        </div>
      </div>

      {/* Right: Quick Role Switcher, Language, Theme, Alerts, User Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Judge Role Switcher */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowLangMenu(false);
              setShowThemeMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-800 dark:hover:bg-blue-700 transition shadow-sm"
            title="Switch demo persona for testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t('common.switchRole')}</span>
            <span className="md:hidden">Role</span>
            <ChevronDown className="w-3 h-3 opacity-70" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Demonstration Persona
              </div>
              {roles.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setShowRoleMenu(false);
                    switchDemoRole(r);
                    showToast('Persona Switched', `Logged in as ${r}`, 'success');
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                    user?.role === r
                      ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{r}</span>
                  {user?.role === r && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Multilingual Selector */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLangMenu(!showLangMenu);
              setShowRoleMenu(false);
              setShowThemeMenu(false);
              setShowNotifications(false);
            }}
            className="flex items-center space-x-1 p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-medium"
            title="Switch Language"
          >
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline font-semibold">{currentLang.nativeName}</span>
          </button>

          {showLangMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Interface Language
              </div>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                    i18n.language === lang.code
                      ? 'font-bold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/40'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <span>{lang.nativeName} ({lang.name})</span>
                  {i18n.language === lang.code && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowRoleMenu(false);
              setShowLangMenu(false);
              setShowNotifications(false);
            }}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle theme (Light / Dark / System)"
          >
            {theme === 'dark' ? (
              <Moon className="w-4 h-4 text-indigo-400" />
            ) : theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Monitor className="w-4 h-4 text-blue-500" />
            )}
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
              <button
                onClick={() => handleThemeChange('light')}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  theme === 'light' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  theme === 'dark' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Dark</span>
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center space-x-2 hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  theme === 'system' ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                <Monitor className="w-3.5 h-3.5 text-blue-500" />
                <span>System</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowRoleMenu(false);
              setShowLangMenu(false);
              setShowThemeMenu(false);
            }}
            className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 z-50 max-h-[450px] overflow-y-auto">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-900 dark:text-white">Alerts & Escalations</span>
                <span className="text-xs text-slate-500 dark:text-slate-400">{alerts.length} Total</span>
              </div>
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No active alerts recorded</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {alerts.slice(0, 8).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 text-xs transition ${
                        alert.is_read
                          ? 'bg-white dark:bg-slate-900'
                          : 'bg-blue-50/40 dark:bg-blue-950/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {alert.severity === 'Critical' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                          ) : (
                            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">{alert.title}</p>
                            <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{alert.message}</p>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                              {new Date(alert.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {!alert.is_acknowledged && (
                          <button
                            onClick={(e) => handleAcknowledge(e, alert.id)}
                            className="text-[10px] font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap ml-2 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded bg-white dark:bg-slate-800 shadow-sm"
                          >
                            Ack
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Profile & Sign Out */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-blue-700 text-white flex items-center justify-center font-semibold text-xs shadow-sm">
            {user?.full_name ? user.full_name[0] : 'U'}
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            title={t('common.signOut')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
