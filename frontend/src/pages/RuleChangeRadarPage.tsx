import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { RegulatorySource, RuleChangeEvent } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Radio, GitCompare, ShieldAlert, CheckCircle, RefreshCw,
  AlertTriangle, FileText, ArrowRight, Eye
} from 'lucide-react';

export const RuleChangeRadarPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [sources, setSources] = useState<RegulatorySource[]>([]);
  const [events, setEvents] = useState<RuleChangeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [diffResult, setDiffResult] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [srcList, evList] = await Promise.all([
        api.getSources(),
        api.getChangeEvents()
      ]);
      setSources(srcList);
      setEvents(evList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunComparison = async (sourceId: number) => {
    setComparing(true);
    try {
      const res = await api.compareVersions(sourceId, 'APH 2023-24', 'APH 2024-27');
      setDiffResult(res);
      await loadData();
    } catch (err) {
      alert('Version comparison failed');
    } finally {
      setComparing(false);
    }
  };

  const handleVerifyEvent = async (eventId: number, action: string) => {
    const notes = prompt(`Please enter justification notes for marking as ${action}:`);
    if (!notes) return;
    try {
      await api.verifyChangeEvent(eventId, action, notes);
      await loadData();
      if (diffResult && diffResult.change_event_id === eventId) {
        setDiffResult({ ...diffResult, status: action });
      }
    } catch (err) {
      alert('Failed to verify change event');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Radio className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
            {t('nav.radar', 'Rule Change Radar & Regulatory Impact Engine')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Detect amendments between AICTE Approval Process Handbook (APH) editions and correlate active application impact.
          </p>
        </div>

        {sources.length > 0 && (
          <button
            onClick={() => handleRunComparison(sources[0].id)}
            disabled={comparing}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center shadow-sm disabled:opacity-50"
          >
            <GitCompare className="w-4 h-4 mr-1.5" />
            <span>{comparing ? 'Analyzing Handbook Diffs...' : 'Compare APH 2023-24 vs 2024-27'}</span>
          </button>
        )}
      </div>

      {/* Trust & Boundary Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-white text-xs flex items-start space-x-3 shadow-sm border border-slate-800">
        <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed text-slate-300">
          <strong className="text-white">Human Verification Guardrail:</strong> AICTE regulations mandate that published handbook amendments do not automatically overwrite active compliance rules. An authorized Reviewing Officer or Bureau Head must verify effective gazette dates and ratify applicability.
        </div>
      </div>

      {/* Comparison Diff Card (If generated) */}
      {diffResult && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider block">
                Diff Analysis Snapshot
              </span>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                Comparing {diffResult.old_version} &rarr; {diffResult.new_version}
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {diffResult.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-200 leading-relaxed">
              <strong>Summary of Changes:</strong>
              <p className="mt-1">{diffResult.summary}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50/60 dark:bg-purple-950/50 border border-purple-100 dark:border-purple-900 text-purple-900 dark:text-purple-200 leading-relaxed">
              <strong>Impact on In-Flight Applications:</strong>
              <p className="mt-1">{diffResult.impact}</p>
            </div>
          </div>

          {/* Diff Text Viewer */}
          <div>
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">Handbook Text Diff:</div>
            <pre className="p-3 bg-slate-950 text-slate-200 font-mono text-[11px] rounded-lg max-h-56 overflow-y-auto leading-relaxed border border-slate-800">
              {diffResult.diff_text.split('\n').map((line: string, idx: number) => {
                let colorClass = 'text-slate-300';
                if (line.startsWith('+')) colorClass = 'text-emerald-400 font-semibold';
                else if (line.startsWith('-')) colorClass = 'text-red-400 font-semibold';
                else if (line.startsWith('@@')) colorClass = 'text-cyan-400 font-mono';
                return (
                  <div key={idx} className={colorClass}>
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>

          {/* Action buttons for officer */}
          {['AICTE Reviewing Officer', 'Senior Approving Authority'].includes(user?.role || '') && diffResult.status === 'Pending Human Review' && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
              <button
                onClick={() => handleVerifyEvent(diffResult.change_event_id, 'Dismissed')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Dismiss / Not Applicable
              </button>
              <button
                onClick={() => handleVerifyEvent(diffResult.change_event_id, 'Verified')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
              >
                Verify & Ratify Amendments
              </button>
            </div>
          )}
        </div>
      )}

      {/* Regulatory Sources List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Registered Official Gazette Sources</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sources.map((src) => (
            <div key={src.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white">{src.title}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-2">[{src.document_code}]</span>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Current Version: <strong>{src.current_version}</strong> • Effective: {src.effective_date}
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                {src.verification_status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Change Events */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Change Event Log ({events.length})</h2>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {events.map((ev) => (
            <div key={ev.id} className="py-3.5 space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {ev.old_version} &rarr; {ev.new_version} [{ev.section_reference}]
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  ev.status === 'Verified'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                }`}>
                  {ev.status}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ev.change_summary}</p>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-400 pt-0.5">
                Impact: {ev.impact_analysis}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
