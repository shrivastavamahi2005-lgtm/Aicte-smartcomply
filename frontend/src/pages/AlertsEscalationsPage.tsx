import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AlertRecord } from '../types';
import { useTranslation } from 'react-i18next';
import {
  AlertCircle, AlertTriangle, Bell, CheckCircle2, Clock,
  RefreshCw, Check
} from 'lucide-react';

export const AlertsEscalationsPage: React.FC = () => {
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [unreadOnly]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(unreadOnly);
      setAlerts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: number) => {
    try {
      const updated = await api.acknowledgeAlert(alertId);
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? updated : a)));
    } catch (err) {
      alert('Failed to acknowledge alert');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.alerts', 'Alert Management & Escalation Dispatch')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Approaching deadline risks, missing document escalations, and automated reminder broadcasts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center space-x-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={unreadOnly}
              onChange={(e) => setUnreadOnly(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            <span>Show Unread Only</span>
          </label>
        </div>
      </div>

      {/* Alerts Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading notifications...</span>
          </div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No active alerts recorded.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                  alert.is_read
                    ? 'bg-white dark:bg-slate-900'
                    : 'bg-blue-50/40 dark:bg-blue-950/30'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      alert.severity === 'Critical'
                        ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                        : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {alert.severity === 'Critical' ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">{alert.title}</span>
                      <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {alert.alert_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      Target Role: <strong>{alert.target_role || 'All Stakeholders'}</strong> • Generated: {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 sm:self-center">
                  {alert.is_acknowledged ? (
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
                      Acknowledged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alert.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center shadow-sm"
                    >
                      <Check className="w-3.5 h-3.5 mr-1" />
                      <span>Acknowledge</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
