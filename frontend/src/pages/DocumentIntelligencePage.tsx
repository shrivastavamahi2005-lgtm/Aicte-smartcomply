import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Application, DocumentRecord, ExtractedField } from '../types';
import { useTranslation } from 'react-i18next';
import {
  Cpu, FileText, Search, CheckCircle2, AlertCircle, Edit2,
  RefreshCw, Hash, ShieldCheck, X
} from 'lucide-react';

export const DocumentIntelligencePage: React.FC = () => {
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit field modal state
  const [editingField, setEditingField] = useState<ExtractedField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editReason, setEditReason] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const apps = await api.getApplications();
      setApplications(apps);
      if (apps.length > 0) {
        setSelectedAppId(apps[0].id);
        const docs = await api.getApplicationDocuments(apps[0].id);
        setDocuments(docs);
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
      const docs = await api.getApplicationDocuments(appId);
      setDocuments(docs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFieldCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;
    setSavingEdit(true);
    try {
      await api.correctField(editingField.id, {
        field_value: editValue,
        reason: editReason || 'Manual reviewer correction',
      });
      if (selectedAppId) {
        const docs = await api.getApplicationDocuments(Number(selectedAppId));
        setDocuments(docs);
      }
      setEditingField(null);
    } catch (err) {
      alert('Failed to update extracted field');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Cpu className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.documents', 'Document Intelligence Hub')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated PDF/OCR parsing, SHA-256 integrity checksums, and human-in-the-loop field correction.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Application:</label>
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
        </div>
      </div>

      {/* Disclaimers & Integrity Notice */}
      <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start space-x-3">
        <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <div className="leading-relaxed">
          <strong>Regulatory Authenticity Standard:</strong> Document authenticity is not certified merely because OCR succeeds or a SHA-256 hash exists. All unverified files reflect <em>"Authenticity not independently verified"</em> until cross-checked with issuing authorities.
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Scanning document records...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No documents uploaded for this application yet.
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{doc.document_type}</span>
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                        v{doc.version}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{doc.file_name} • {(doc.file_size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 italic block">
                    {doc.authenticity_status}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                    Extraction Confidence: {Math.round(doc.extraction_confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* SHA-256 Hash */}
              <div className="flex items-center space-x-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-200/60 dark:border-slate-800 overflow-hidden">
                <Hash className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                <span className="truncate">SHA-256: {doc.sha256_checksum}</span>
              </div>

              {/* Extracted Fields Table with Edit Option */}
              <div>
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-2">Extracted Structured Key-Values:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {doc.extracted_fields.map((field) => (
                    <div
                      key={field.id}
                      className={`p-2.5 rounded-lg border text-xs flex items-start justify-between ${
                        field.is_manually_corrected
                          ? 'bg-amber-50/50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block capitalize">
                          {field.field_name.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                          {field.field_value || 'None'}
                        </span>
                        {field.is_manually_corrected && (
                          <span className="text-[9px] text-amber-700 dark:text-amber-400 font-semibold block mt-0.5">
                            Overridden by Reviewer
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setEditingField(field);
                          setEditValue(field.field_value || '');
                          setEditReason('');
                        }}
                        className="text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                        title="Correct this extracted field"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Field Correction Modal */}
      {editingField && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Correct Extracted Field: {editingField.field_name}
              </h2>
              <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFieldCorrection} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Field Value</label>
                <input
                  type="text"
                  required
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Manual Override <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  placeholder="e.g. Scanned font illegibility, verified against stamped registrar seal"
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingField(null)}
                  className="px-3 py-2 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Correction & Log Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
