import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Application, DocumentRecord, ComplianceFinding, TaskRecord,
} from '../types';
import {
  FileText, Shield, CheckCircle, AlertTriangle, ArrowLeft,
  Upload, Play, RefreshCw, Clock, ArrowRight, MessageSquare,
  FileCheck, ShieldAlert, GitFork, UserCheck, X
} from 'lucide-react';

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState<Application | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [findings, setFindings] = useState<ComplianceFinding[]>([]);
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'compliance' | 'mismatches' | 'tasks'>('overview');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);

  // Transition modal
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [targetStage, setTargetStage] = useState('');
  const [transitionRemarks, setTransitionRemarks] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  // Upload modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadDocType, setUploadDocType] = useState('Fire Safety NOC');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (id) {
      loadApplicationData(Number(id));
    }
  }, [id, user]);

  const loadApplicationData = async (appId: number) => {
    setLoading(true);
    try {
      const [app, docs, fnds, tsks] = await Promise.all([
        api.getApplication(appId),
        api.getApplicationDocuments(appId),
        api.getApplicationFindings(appId),
        api.getTasks({ application_id: appId }),
      ]);
      setApplication(app);
      setDocuments(docs);
      setFindings(fnds);
      setTasks(tsks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!application) return;
    setValidating(true);
    try {
      await api.validateApplication(application.id);
      await loadApplicationData(application.id);
    } catch (err) {
      alert('Validation run failed');
    } finally {
      setValidating(false);
    }
  };

  const handleTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !targetStage) return;
    setTransitioning(true);
    try {
      await api.transitionStage(application.id, {
        target_stage: targetStage,
        remarks: transitionRemarks,
      });
      setShowTransitionModal(false);
      setTransitionRemarks('');
      await loadApplicationData(application.id);
    } catch (err: any) {
      alert(err.message || 'Transition not permitted');
    } finally {
      setTransitioning(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application || !selectedFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('application_id', String(application.id));
      formData.append('document_type', uploadDocType);
      formData.append('file', selectedFile);

      await api.uploadDocument(formData);
      setShowUploadModal(false);
      setSelectedFile(null);
      await loadApplicationData(application.id);
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateTasks = async () => {
    if (!application) return;
    try {
      await api.generateCorrectiveTasks(application.id);
      const updatedTasks = await api.getTasks({ application_id: application.id });
      setTasks(updatedTasks);
      setActiveTab('tasks');
    } catch (err) {
      alert('Failed to generate tasks');
    }
  };

  if (loading || !application) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
      </div>
    );
  }

  const STAGES = [
    'Draft', 'Submitted', 'Document Validation', 'Compliance Review',
    'Officer Review', 'Recommended for Decision', 'Approved'
  ];

  const currentStageIndex = STAGES.indexOf(application.workflow_stage);

  // Available transitions based on user role
  const getPermittedTransitions = () => {
    if (user?.role === 'College Administrator') {
      if (['Draft', 'Clarification Requested', 'Resubmission Required'].includes(application.workflow_stage)) {
        return ['Submitted'];
      }
    } else if (user?.role === 'AICTE Reviewing Officer') {
      if (application.workflow_stage === 'Submitted') {
        return ['Document Validation', 'Returned'];
      }
      if (application.workflow_stage === 'Document Validation') {
        return ['Compliance Review', 'Clarification Requested'];
      }
      if (application.workflow_stage === 'Compliance Review') {
        return ['Officer Review', 'Clarification Requested'];
      }
      if (application.workflow_stage === 'Officer Review') {
        return ['Recommended for Decision', 'Clarification Requested', 'Returned'];
      }
    } else if (user?.role === 'Senior Approving Authority') {
      if (application.workflow_stage === 'Recommended for Decision') {
        return ['Approved', 'Rejected', 'Returned'];
      }
    }
    return [];
  };

  const permittedNextStages = getPermittedTransitions();
  const mismatches = findings.filter(f => f.finding_category === 'Cross-Doc Mismatch' || f.finding_category === 'Expired Certificate');

  return (
    <div className="space-y-6">
      {/* Top Bar with back link and title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/applications')}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
                {application.application_number}
              </h1>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                {application.application_type}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {application.institution_name} • PID: {application.institution_code} • AY {application.academic_year}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2 flex-wrap gap-y-2">
          {user?.role === 'College Administrator' && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center shadow-sm"
            >
              <Upload className="w-3.5 h-3.5 mr-1 text-slate-500 dark:text-slate-400" />
              <span>Upload Document</span>
            </button>
          )}

          <button
            onClick={handleValidate}
            disabled={validating}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center shadow-sm disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 mr-1" />
            <span>{validating ? 'Evaluating...' : 'Run Compliance Engine'}</span>
          </button>

          {permittedNextStages.length > 0 && (
            <div className="flex items-center space-x-1.5">
              {permittedNextStages.map((stage) => (
                <button
                  key={stage}
                  onClick={() => {
                    setTargetStage(stage);
                    setShowTransitionModal(true);
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition ${
                    stage === 'Approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : stage === 'Rejected'
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : stage.includes('Return') || stage.includes('Clarification')
                      ? 'bg-amber-600 hover:bg-amber-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {stage === 'Approved' ? 'Approve Dossier' : stage === 'Rejected' ? 'Reject' : `Move to: ${stage}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Stepper for Approval Stages */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-x-auto">
        <div className="flex items-center justify-between min-w-[700px]">
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStageIndex || application.workflow_stage === 'Approved';
            const isCurrent = application.workflow_stage === s;
            return (
              <div key={s} className="flex-1 flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition ${
                      isCompleted
                        ? 'bg-emerald-500 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium mt-1 text-center whitespace-nowrap ${
                      isCurrent
                        ? 'text-blue-700 dark:text-blue-400 font-bold'
                        : isCompleted
                        ? 'text-slate-700 dark:text-slate-300'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {idx < STAGES.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      idx < currentStageIndex ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Notes Display (If exists) */}
      {application.decision_notes && (
        <div className="p-3.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-white text-xs border border-slate-800 shadow-sm flex items-start space-x-3">
          <ShieldAlert className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-slate-200">Official Decision & Reviewer Remarks:</span>
            <div className="mt-1 whitespace-pre-wrap text-slate-300 leading-relaxed font-mono text-[11px]">
              {application.decision_notes}
            </div>
          </div>
        </div>
      )}

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-6 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Programs & Institution
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'documents'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Submitted Documents</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {documents.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('compliance')}
          className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'compliance'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Compliance Rule Matrix</span>
          <span className="px-1.5 py-0.2 rounded-full bg-blue-100 dark:bg-blue-950 text-[10px] font-bold text-blue-700 dark:text-blue-300">
            {application.internal_readiness_score}%
          </span>
        </button>
        <button
          onClick={() => setActiveTab('mismatches')}
          className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'mismatches'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Cross-Doc Mismatches</span>
          {mismatches.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950 text-[10px] font-bold text-red-700 dark:text-red-300">
              {mismatches.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('tasks')}
          className={`pb-2.5 transition border-b-2 flex items-center space-x-1.5 ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <span>Corrective Tasks</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
            {tasks.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Academic Programs & Capacity</h2>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {application.courses.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">{c.course_name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">Dept: {c.department} • Level: {c.level}</div>
                    </div>
                    <div className="flex items-center space-x-4 text-right">
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Intake</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.approved_intake}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Students</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.student_count}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Faculty</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{c.faculty_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Audit Readiness Status</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Readiness Score:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{application.internal_readiness_score}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Compliance Status:</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-400">{application.compliance_status}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Assigned Officer:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{application.assigned_officer_name || 'Pending Allocation'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Statutory Deadline:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">{application.deadline ? new Date(application.deadline).toLocaleDateString() : 'Cycle default'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Submitted Documents & Side-by-side Extracted Fields */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {documents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No documents uploaded yet. Use "Upload Document" button above.
                </div>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-xs text-slate-900 dark:text-white">{doc.document_type}</span>
                            <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                              v{doc.version}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{doc.file_name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            SHA-256: {doc.sha256_checksum}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 italic block">
                          {doc.authenticity_status}
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          Extraction Confidence: {Math.round(doc.extraction_confidence * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* Extracted Fields Matrix */}
                    {doc.extracted_fields.length > 0 && (
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                        <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                          Extracted Structured Metadata
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                          {doc.extracted_fields.map((ef) => (
                            <div key={ef.id} className="bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                              <span className="text-[10px] text-slate-400 dark:text-slate-400 block capitalize">
                                {ef.field_name.replace('_', ' ')}
                              </span>
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block truncate">
                                {ef.field_value || 'None'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Compliance Rule Matrix */}
      {activeTab === 'compliance' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Regulatory Clause Checks ({findings.length} findings recorded)
            </h2>
            <button
              onClick={handleGenerateTasks}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
            >
              <span>Convert Open Findings to Action Tasks</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>

          <div className="space-y-3">
            {findings.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                Run the Compliance Engine to evaluate configured AICTE rules.
              </div>
            ) : (
              findings.map((f) => (
                <div key={f.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        f.severity === 'Critical'
                          ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                          : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="font-semibold text-xs text-slate-900 dark:text-white">{f.title}</span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">[{f.rule_code}]</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{f.description}</p>
                    {f.suggested_action && (
                      <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-950/50 p-2 rounded border border-blue-100 dark:border-blue-900 mt-2">
                        <strong>Corrective Action:</strong> {f.suggested_action}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 ml-4">
                    {f.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Cross-Document Mismatches */}
      {activeTab === 'mismatches' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/50 p-4 rounded-xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong>Cross-Document Inconsistency Protocol:</strong> Findings below represent potential discrepancies or expired validity between submitted proofs and official records. Terminology strictly utilizes "Potential inconsistency" or "Manual verification required" (no automatic fraud allegations).
          </div>

          <div className="space-y-3">
            {mismatches.length === 0 ? (
              <div className="p-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
                No cross-document inconsistencies detected.
              </div>
            ) : (
              mismatches.map((m) => (
                <div key={m.id} className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900 dark:text-white flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-1.5 text-red-600 dark:text-red-400" />
                      {m.title}
                    </span>
                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 px-2 py-0.5 rounded-full">
                      {m.finding_category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{m.description}</p>
                  {m.conflicting_values && (
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-700 dark:text-slate-300">
                      {JSON.stringify(m.conflicting_values, null, 2)}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    <strong>Reference:</strong> {m.evidence_reference}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Corrective Tasks */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Assigned Department Corrective Tasks</h2>
            <button
              onClick={() => navigate('/tasks')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800"
            >
              Open Full Task Board &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {tasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No corrective tasks assigned. Click "Convert Open Findings to Action Tasks" in Compliance tab.
              </div>
            ) : (
              tasks.map((t) => (
                <div key={t.id} className="p-4 flex items-start justify-between text-xs">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-900 dark:text-white">{t.title}</span>
                      <span className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                        {t.department}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1 whitespace-pre-wrap">{t.description}</p>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                      Due: {t.due_date ? new Date(t.due_date).toLocaleDateString() : 'None'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.status === 'Completed'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Workflow Stage Transition */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Authorize Stage Transition</h2>
              <button
                onClick={() => setShowTransitionModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleTransition} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-lg text-xs text-blue-900 dark:text-blue-200">
                Moving application from <strong>{application.workflow_stage}</strong> to <strong>{targetStage}</strong>.
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reasoned Decision Notes / Official Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={transitionRemarks}
                  onChange={(e) => setTransitionRemarks(e.target.value)}
                  placeholder="Record justification, inspected evidence, or compliance verification notes..."
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowTransitionModal(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transitioning}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {transitioning ? 'Recording...' : 'Confirm Transition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Document */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Upload Regulatory Document</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Document Category</label>
                <select
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Fire Safety NOC">State Fire Services Safety NOC</option>
                  <option value="Land Title Certificate">Land Title Deed / Registered Lease</option>
                  <option value="Building Safety Certificate">Structural Building Safety Certificate</option>
                  <option value="Faculty Roster">Approved Faculty Cadre Roster</option>
                  <option value="Principal Appointment & Qualification">Principal Ph.D. Ratification Order</option>
                  <option value="Student Grievance Redressal Order">SGRC Office Order</option>
                  <option value="Anti-Ragging Committee Order">Anti-Ragging Committee Notification</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Select File (.pdf, .png, .jpg, .xlsx)</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-2 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-50 dark:file:bg-blue-950 file:text-blue-700 dark:file:text-blue-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {uploading ? 'Processing Extraction...' : 'Upload & Extract'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
