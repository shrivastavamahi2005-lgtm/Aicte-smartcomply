import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ComplianceRule, Application } from '../types';
import { useTranslation } from 'react-i18next';
import {
  CheckSquare, ShieldCheck, AlertCircle, ExternalLink, Play,
  RefreshCw, CheckCircle2, AlertTriangle, HelpCircle
} from 'lucide-react';

export const ComplianceCenterPage: React.FC = () => {
  const { t } = useTranslation();
  const [rules, setRules] = useState<ComplianceRule[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [actionPlan, setActionPlan] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [tab, setTab] = useState<'plan' | 'catalog'>('plan');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [r, apps] = await Promise.all([
        api.getRules(),
        api.getApplications()
      ]);
      setRules(r);
      setApplications(apps);
      if (apps.length > 0) {
        setSelectedAppId(apps[0].id);
        const plan = await api.getActionPlan(apps[0].id);
        setActionPlan(plan);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApp = async (appId: number) => {
    setSelectedAppId(appId);
    setLoading(true);
    try {
      const plan = await api.getActionPlan(appId);
      setActionPlan(plan);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!selectedAppId) return;
    setValidating(true);
    try {
      await api.validateApplication(Number(selectedAppId));
      const plan = await api.getActionPlan(Number(selectedAppId));
      setActionPlan(plan);
    } catch (err) {
      alert('Validation run failed');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <CheckSquare className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.compliance', 'Compliance Center & Corrective Action Plan')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configurable rule matrix, clause citations, and automated remediation action plans.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedAppId}
            onChange={(e) => handleSelectApp(Number(e.target.value))}
            className="text-xs border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
          >
            {applications.map((app) => (
              <option key={app.id} value={app.id}>
                {app.application_number} ({app.institution_name})
              </option>
            ))}
          </select>

          <button
            onClick={handleValidate}
            disabled={validating || !selectedAppId}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            <span>{validating ? 'Evaluating...' : 'Re-Run Evaluation'}</span>
          </button>
        </div>
      </div>

      {/* Trust & Methodology Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-white text-xs flex items-start space-x-3 shadow-sm border border-slate-800">
        <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed text-slate-300">
          <strong className="text-white">Statutory Governance Boundary:</strong> SmartComply 360 strictly distinguishes between officially verified AICTE Handbook clauses and demo parameters. The calculated readiness score reflects adherence to configured rules and is <em>never equivalent to official AICTE approval or rejection</em>.
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-xs font-medium">
        <button
          onClick={() => setTab('plan')}
          className={`pb-2.5 transition border-b-2 ${
            tab === 'plan'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Corrective Action Plan ({actionPlan?.action_items?.length || 0} Items)
        </button>
        <button
          onClick={() => setTab('catalog')}
          className={`pb-2.5 transition border-b-2 ${
            tab === 'catalog'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Rule Engine Catalog ({rules.length} Rules Configured)
        </button>
      </div>

      {/* Tab 1: Corrective Action Plan */}
      {tab === 'plan' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Overall Application Compliance Score</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{actionPlan?.readiness_score || 0}%</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Current Regulatory Status</span>
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">{actionPlan?.compliance_status}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {!actionPlan || actionPlan.action_items.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                All configured compliance norms satisfied for this application.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {actionPlan.action_items.map((item: any) => (
                  <div key={item.finding_id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.severity === 'Critical'
                            ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                        }`}>
                          {item.severity}
                        </span>
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">{item.title}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">[{item.rule_code}]</span>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                        {item.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">{item.suggested_action}</p>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] pt-1 text-slate-500 dark:text-slate-400 gap-1">
                      <span><strong>Statutory Clause:</strong> {item.clause}</span>
                      <span><strong>Evidence for Closure:</strong> {item.evidence_required}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Rule Engine Catalog */}
      {tab === 'catalog' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{rule.rule_code}</span>
                    {rule.is_officially_verified ? (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Verified AICTE Norm
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Demo Rule — Not Officially Verified
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{rule.title}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  rule.severity === 'Critical'
                    ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {rule.severity}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{rule.description}</p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                <div>Source: {rule.official_source_title}</div>
                <div>Clause: {rule.clause_reference} • {rule.page_reference || ''}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
