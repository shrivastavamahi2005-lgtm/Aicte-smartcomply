import React, { useEffect, useState } from 'react';
import {
  ReactFlow, Background, Controls, Node, Edge
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { api } from '../services/api';
import { Application } from '../types';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import {
  GitFork, RefreshCw, List, Network, Info, CheckCircle2,
  AlertTriangle, FileText
} from 'lucide-react';

export const ComplianceGraphPage: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNodeData, setSelectedNodeData] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    if (selectedAppId) {
      loadGraph(Number(selectedAppId));
    }
  }, [isDark]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const apps = await api.getApplications();
      setApplications(apps);
      if (apps.length > 0) {
        setSelectedAppId(apps[0].id);
        await loadGraph(apps[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGraph = async (appId: number) => {
    try {
      const g = await api.getApplicationGraph(appId);
      // Map nodes with styled borders adapted to dark/light theme
      const styledNodes = (g.nodes || []).map((n: any) => ({
        ...n,
        style: {
          background: isDark ? '#1e293b' : '#ffffff',
          color: isDark ? '#f8fafc' : '#0f172a',
          border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '11px',
          fontWeight: '500',
          boxShadow: isDark ? '0 1px 3px 0 rgb(0 0 0 / 0.5)' : '0 1px 3px 0 rgb(0 0 0 / 0.1)',
          minWidth: 140,
        },
      }));
      setNodes(styledNodes);
      setEdges(g.edges || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectApp = async (appId: number) => {
    setSelectedAppId(appId);
    setLoading(true);
    await loadGraph(appId);
    setLoading(false);
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeData(node);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <GitFork className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.graph', 'Compliance Dependency Graph & Root-Cause Trace')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visual dependency graph connecting Institution &rarr; Courses &rarr; Documents &rarr; Rules &rarr; Findings &rarr; Tasks.
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

          <div className="flex border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden bg-white dark:bg-slate-800 shadow-sm">
            <button
              onClick={() => setViewMode('graph')}
              className={`p-1.5 text-xs flex items-center space-x-1 transition ${
                viewMode === 'graph'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Graph</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 text-xs flex items-center space-x-1 transition ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List Fallback</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Graph Canvas or Fallback View */}
      {viewMode === 'graph' ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-[580px] relative overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-xs text-slate-500 dark:text-slate-400 space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Tracing entity dependencies...</span>
            </div>
          ) : (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodeClick={onNodeClick}
              fitView
              className={isDark ? 'bg-slate-950' : 'bg-slate-50/50'}
            >
              <Background color={isDark ? '#334155' : '#cbd5e1'} gap={16} />
              <Controls />
            </ReactFlow>
          )}

          {/* Side Inspection Drawer when node clicked */}
          {selectedNodeData && (
            <div className="absolute top-4 right-4 w-72 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl z-20 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[10px]">
                  Node Type: {selectedNodeData.type}
                </span>
                <button
                  onClick={() => setSelectedNodeData(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                >
                  ✕
                </button>
              </div>
              <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
                {Object.entries(selectedNodeData.data).map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400 dark:text-slate-500 capitalize">{k}:</span>
                    <span className="font-semibold text-right truncate max-w-[150px] dark:text-slate-200">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Accessible List/Table Fallback View */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
          <div className="text-xs font-semibold text-slate-900 dark:text-white">
            Tabular Dependency Fallback (Nodes: {nodes.length}, Edges: {edges.length})
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {nodes.map((n) => (
              <div key={n.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white">[{n.type}]</span>{' '}
                  <span className="text-slate-700 dark:text-slate-300">{(n.data as any)?.label || n.id}</span>
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px] font-mono">ID: {n.id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
