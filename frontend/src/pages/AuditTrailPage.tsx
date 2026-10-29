import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuditEventRecord } from '../types';
import { useTranslation } from 'react-i18next';
import {
  History, Search, ShieldAlert, RefreshCw, User, Calendar
} from 'lucide-react';

export const AuditTrailPage: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<AuditEventRecord[]>([]);
  const [actorFilter, setActorFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAuditEvents();
  }, [actorFilter, actionFilter]);

  const loadAuditEvents = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditTrail({
        actor: actorFilter || undefined,
        action: actionFilter || undefined,
        limit: 100,
      });
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <History className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.audit', 'Immutable Regulatory Audit Trail')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System records of authentication, document parsing, compliance runs, workflow transitions, and approval decisions.
          </p>
        </div>
      </div>

      {/* Compliance Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-white text-xs flex items-start space-x-3 shadow-sm border border-slate-800">
        <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed text-slate-300">
          <strong className="text-white">Audit Standard Disclaimer:</strong> This prototype implements tamper-resistant, append-only database audit event logging for full SIH demonstration. It is not equivalent to a hardware-certified HSM or tamper-proof blockchain ledger.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Filter by actor email..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action name (e.g. LOGIN)..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {events.length} event(s) retrieved
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading audit stream...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No audit records match the current filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Change Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(event.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">{event.actor_email}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300">
                        {event.actor_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-blue-700 dark:text-blue-400 text-[11px]">
                      {event.action}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                      {event.entity_type} #{event.entity_id}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300 max-w-md leading-relaxed">
                      {event.change_summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
