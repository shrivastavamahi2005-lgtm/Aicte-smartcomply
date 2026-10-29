import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, FileText, Cpu, CheckSquare, GitFork, ListTodo,
  AlertCircle, Radio, Bot, BarChart3, History, Settings, ShieldCheck, X
} from 'lucide-react';

interface SidebarProps {
  collapsed?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, mobileOpen = false, onCloseMobile }) => {
  const { t } = useTranslation();
  const { user } = useAuth();

  const NAV_ITEMS = [
    { key: 'overview', name: t('nav.overview'), path: '/', icon: LayoutDashboard },
    { key: 'applications', name: t('nav.applications'), path: '/applications', icon: FileText },
    { key: 'documents', name: t('nav.documents'), path: '/documents', icon: Cpu },
    { key: 'compliance', name: t('nav.compliance'), path: '/compliance', icon: CheckSquare },
    { key: 'graph', name: t('nav.graph'), path: '/graph', icon: GitFork },
    { key: 'tasks', name: t('nav.tasks'), path: '/tasks', icon: ListTodo },
    { key: 'alerts', name: t('nav.alerts'), path: '/alerts', icon: AlertCircle },
    { key: 'radar', name: t('nav.radar'), path: '/radar', icon: Radio },
    { key: 'copilot', name: t('nav.copilot'), path: '/copilot', icon: Bot },
    { key: 'reports', name: t('nav.reports'), path: '/reports', icon: BarChart3 },
    { key: 'audit', name: t('nav.audit'), path: '/audit', icon: History },
    { key: 'settings', name: t('nav.settings'), path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 dark:bg-slate-950 text-slate-300 border-r border-slate-800 transition-all select-none">
      {/* Brand Header with Custom Geometric Logo */}
      <div className={`h-16 flex items-center border-b border-slate-800 ${collapsed ? 'justify-center px-2' : 'px-5 justify-between'}`}>
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 flex-shrink-0">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sm tracking-tight text-white block truncate">
                AICTE SmartComply
              </span>
              <span className="text-[10px] font-medium tracking-wider text-blue-400 uppercase block -mt-0.5">
                360 Approval Suite
              </span>
            </div>
          )}
        </div>

        {mobileOpen && (
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {!collapsed && (
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('nav.complianceSuite')}
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              title={collapsed ? item.name : undefined}
              className={({ isActive }) =>
                `flex items-center rounded-xl text-xs font-medium transition group ${
                  collapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2'
                } ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className={`p-4 border-t border-slate-800/80 text-[11px] text-slate-400 bg-slate-900/60 ${collapsed ? 'text-center' : ''}`}>
        {!collapsed ? (
          <div>
            <div className="flex items-center justify-between">
              <span className="font-medium">AICTE APH 2024-27</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="System Operational" />
            </div>
            <div className="text-[10px] text-slate-400 mt-1">SIH Prototype Edition v1.0</div>
          </div>
        ) : (
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Operational" />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:block transition-all duration-300 h-screen sticky top-0 flex-shrink-0 z-20 ${collapsed ? 'w-16' : 'w-64'}`}>
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onCloseMobile} />
          <div className="relative w-64 max-w-[80vw] h-full shadow-2xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
