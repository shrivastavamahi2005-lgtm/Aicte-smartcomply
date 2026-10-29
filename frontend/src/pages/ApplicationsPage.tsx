import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { Application, Institution } from '../types';
import {
  FileText, Plus, Search, Filter, ArrowRight, ShieldCheck,
  AlertCircle, CheckCircle, RefreshCw, X
} from 'lucide-react';

export const ApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New application form state
  const [selectedInstId, setSelectedInstId] = useState<number | ''>('');
  const [academicYear, setAcademicYear] = useState('2026-2027');
  const [appType, setAppType] = useState('Extension of Approval');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadData();
  }, [user, stageFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [apps, insts] = await Promise.all([
        api.getApplications(stageFilter ? { stage: stageFilter } : undefined),
        api.getInstitutions()
      ]);
      setApplications(apps);
      setInstitutions(insts);
      if (insts.length > 0 && selectedInstId === '') {
        setSelectedInstId(insts[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstId) return;
    setCreating(true);
    try {
      const created = await api.createApplication({
        institution_id: Number(selectedInstId),
        academic_year: academicYear,
        application_type: appType,
      });
      setShowCreateModal(false);
      navigate(`/applications/${created.id}`);
    } catch (err) {
      alert('Failed to create application');
    } finally {
      setCreating(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    const q = searchQuery.toLowerCase();
    return (
      app.application_number.toLowerCase().includes(q) ||
      (app.institution_name && app.institution_name.toLowerCase().includes(q))
    );
  });

  const getStageBadge = (stage: string) => {
    const styles: Record<string, string> = {
      'Draft': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
      'Submitted': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
      'Document Validation': 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800',
      'Compliance Review': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
      'Officer Review': 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
      'Recommended for Decision': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
      'Approved': 'bg-green-600 text-white border-green-600 dark:bg-green-600 dark:border-green-600',
      'Rejected': 'bg-red-600 text-white border-red-600 dark:bg-red-600 dark:border-red-600',
      'Returned': 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles[stage] || 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}`}>
        {stage}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.applications', 'Institution Applications')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track approval lifecycle, submitted dossiers, regulatory validation, and decision notes.
          </p>
        </div>
        {user?.role === 'College Administrator' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            <span>Create New Application</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search application number or institution..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Stages</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Document Validation">Document Validation</option>
            <option value="Compliance Review">Compliance Review</option>
            <option value="Officer Review">Officer Review</option>
            <option value="Recommended for Decision">Recommended for Decision</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading application records...</span>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No applications match the current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-3 px-4">Application No.</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredApps.map((app) => (
                  <tr
                    key={app.id}
                    onClick={() => navigate(`/applications/${app.id}`)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 cursor-pointer transition"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-white font-mono">
                      {app.application_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{app.institution_name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">PID: {app.institution_code}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">{app.application_type}</td>
                    <td className="py-3.5 px-4">{getStageBadge(app.workflow_stage)}</td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[11px] font-medium ${
                        app.compliance_status === 'Compliant Against Configured Rules'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : app.compliance_status === 'Potential Gap Detected'
                          ? 'text-red-700 dark:text-red-400 font-semibold'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}>
                        {app.compliance_status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-20">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-0.5">
                          <span>{app.internal_readiness_score}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              app.internal_readiness_score >= 80
                                ? 'bg-emerald-500'
                                : app.internal_readiness_score >= 60
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, app.internal_readiness_score)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-[11px]">
                      {app.deadline ? new Date(app.deadline).toLocaleDateString() : 'Cycle default'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/applications/${app.id}`);
                        }}
                        className="p-1 rounded-md text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Create Application */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Initiate AICTE Approval Application</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select Institution</label>
                <select
                  required
                  value={selectedInstId}
                  onChange={(e) => setSelectedInstId(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-600 outline-none"
                >
                  {institutions.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Academic Year</label>
                <input
                  type="text"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Application Type</label>
                <select
                  value={appType}
                  onChange={(e) => setAppType(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Extension of Approval">Extension of Approval (EOA)</option>
                  <option value="New Institution">Establishment of New Institution</option>
                  <option value="New Course">Introduction of New Program/Course</option>
                  <option value="Intake Change">Change in Intake Capacity</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Draft Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
