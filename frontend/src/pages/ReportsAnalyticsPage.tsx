import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  BarChart3, Download, Printer, RefreshCw, CheckCircle2,
  FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export const ReportsAnalyticsPage: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = async () => {
    setExporting(true);
    try {
      const csvText = await api.exportApplicationsCsv();
      const blob = new Blob([csvText], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AICTE_SmartComply_Applications_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('CSV export failed');
    } finally {
      setExporting(false);
    }
  };

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    );
  }

  const stageData = Object.entries(metrics.stage_distribution).map(([stage, count]) => ({
    stage,
    count,
  }));

  const severityData = Object.entries(metrics.severity_distribution).map(([sev, count]) => ({
    name: sev,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.reports', 'Regulatory Analytics & Compliance Reports')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Data aggregated in real-time from active applications, verification runs, and audit logs.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadCsv}
            disabled={exporting}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center shadow-sm disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            <span>{exporting ? 'Generating CSV...' : 'Export Applications CSV'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <Printer className="w-4 h-4 mr-1.5 text-slate-500 dark:text-slate-400" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Top Category Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Top Root-Cause Non-Compliance Finding Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {metrics.top_finding_categories.map((cat, idx) => (
            <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block">
                Rank #{idx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 truncate">
                {cat.category}
              </span>
              <span className="text-lg font-bold text-red-600 dark:text-red-400 block mt-1">
                {cat.count} occurrences
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Approval Progression Breakdown
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 10, fill: isDark ? '#94a3b8' : '#64748b' }}
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                  height={45}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: isDark ? '#94a3b8' : '#64748b' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">
            Finding Severity Distribution
          </h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    fontSize: '11px',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', color: isDark ? '#cbd5e1' : '#475569' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
