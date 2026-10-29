import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { DashboardMetrics, AuditEventRecord } from '../types';
import {
  FileText, AlertTriangle, Clock, CheckCircle, Activity,
  ArrowUpRight, ShieldCheck, RefreshCw, BarChart2, Plus,
  Upload, Play, FileSpreadsheet, Sparkles, Layers, CheckCircle2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];

export const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditEventRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [m, a] = await Promise.all([
        api.getDashboardMetrics(),
        api.getAuditTrail({ limit: 5 })
      ]);
      setMetrics(m);
      setRecentAudits(a);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCsv = async () => {
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
      showToast('Export Successful', 'Applications CSV report downloaded.', 'success');
    } catch (err) {
      showToast('Export Failed', 'Could not generate CSV export', 'error');
    }
  };

  // Loading Skeletons for smooth transitions
  if (loading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          <div className="h-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // Format stage distribution data for Recharts
  const stageData = Object.entries(metrics.stage_distribution).map(([stage, count]) => ({
    stage,
    count,
  }));

  // Format severity distribution for Pie chart
  const severityData = Object.entries(metrics.severity_distribution).map(([sev, count]) => ({
    name: sev,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner & Quick Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('dashboard.title')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Quick Actions Group */}
        <div className="flex flex-wrap items-center gap-2">
          {user?.role === 'College Administrator' && (
            <button
              onClick={() => navigate('/applications')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition flex items-center shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              <span>New Application</span>
            </button>
          )}

          <button
            onClick={() => navigate('/documents')}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 mr-1 text-slate-500" />
            <span>Upload Document</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mr-1 text-emerald-600" />
            <span>{t('common.exportCsv')}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('dashboard.activeApplications')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{metrics.total_applications}</div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.pending_officer_review} {t('dashboard.awaitingReview')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('dashboard.criticalFindings')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-red-600 dark:text-red-400">{metrics.critical_findings_count}</div>
          <div className="mt-1 text-[11px] text-red-600 dark:text-red-400 font-medium">
            {t('dashboard.requireAttention')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('dashboard.overdueTasks')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{metrics.overdue_tasks_count}</div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {metrics.upcoming_deadlines_count} {t('dashboard.approachingDeadlines')}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {t('dashboard.avgReadiness')}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {metrics.average_readiness_score}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {t('dashboard.evaluatedRules')}
          </div>
        </div>
      </div>

      {/* "How SmartComply Works" Visual Workflow Stepper */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex items-center space-x-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold tracking-tight">{t('dashboard.howItWorksTitle')}</h2>
        </div>
        <p className="text-xs text-slate-300 mb-4">{t('dashboard.howItWorksSubtitle')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="font-bold text-blue-300 mb-1">{t('dashboard.step1')}</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{t('dashboard.step1Desc')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="font-bold text-cyan-300 mb-1">{t('dashboard.step2')}</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{t('dashboard.step2Desc')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="font-bold text-indigo-300 mb-1">{t('dashboard.step3')}</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{t('dashboard.step3Desc')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="font-bold text-purple-300 mb-1">{t('dashboard.step4')}</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{t('dashboard.step4Desc')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="font-bold text-amber-300 mb-1">{t('dashboard.step5')}</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{t('dashboard.step5Desc')}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl border border-white/10">
            <div className="font-bold text-emerald-300 mb-1">{t('dashboard.step6')}</div>
            <div className="text-[11px] text-slate-200 leading-relaxed">{t('dashboard.step6Desc')}</div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications by Workflow Stage */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <BarChart2 className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
              {t('dashboard.applicationsByStage')}
            </h2>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData}>
                <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} angle={-15} textAnchor="end" height={45} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px', backgroundColor: '#0f172a', color: '#fff', border: 'none' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compliance Findings by Severity */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <Activity className="w-4 h-4 mr-2 text-red-600 dark:text-red-400" />
              {t('dashboard.findingsBySeverity')}
            </h2>
          </div>
          <div className="h-64 flex items-center justify-center">
            {severityData.every((d) => d.value === 0) ? (
              <div className="text-xs text-slate-400">No unresolved findings recorded</div>
            ) : (
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
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '10px', backgroundColor: '#0f172a', color: '#fff', border: 'none' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Deadline Risk & Recent Audit Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deadline Risk Radar */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center">
            <Clock className="w-4 h-4 mr-2 text-amber-500" />
            {t('dashboard.deadlineRiskTitle')}
          </h2>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-red-900 dark:text-red-200 block">{t('dashboard.highUrgency')}</span>
                <span className="text-[11px] text-red-700 dark:text-red-400">Readiness &lt; 60% with active deadlines</span>
              </div>
              <span className="text-base font-bold text-red-700 dark:text-red-400">
                {metrics.deadline_risk.high_risk_applications}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 block">{t('dashboard.mediumUrgency')}</span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400">Readiness 60-80%</span>
              </div>
              <span className="text-base font-bold text-amber-700 dark:text-amber-400">
                {metrics.deadline_risk.medium_risk_applications}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 block">{t('dashboard.lowRisk')}</span>
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400">Satisfactory readiness score</span>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">
                {metrics.deadline_risk.low_risk_applications}
              </span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
            Multi-Factor Explainable Regulatory SLA Heuristic Model
          </div>
        </div>

        {/* Live Audit Log Preview */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              {t('dashboard.recentAudits')}
            </h2>
            <button
              onClick={() => navigate('/audit')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 transition"
            >
              Full Log &rarr;
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentAudits.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">No recent events logged</div>
            ) : (
              recentAudits.map((event) => (
                <div key={event.id} className="py-2.5 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{event.action}</span>
                    <span className="text-slate-500 dark:text-slate-400 ml-2 text-[11px] font-mono">
                      [{event.entity_type} #{event.entity_id}]
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5 text-[11px] line-clamp-1">{event.change_summary}</p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 whitespace-nowrap ml-4">
                    <div>{event.actor_email}</div>
                    <div>{new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
