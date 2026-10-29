import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Application } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  Bot, Send, Sparkles, Copy, Check, ShieldCheck, AlertCircle,
  HelpCircle, RefreshCw, User
} from 'lucide-react';

interface ChatMessage {
  id: number;
  sender_role: 'user' | 'assistant';
  content: string;
  citations?: { rule: string; clause: string }[];
  is_fallback?: boolean;
}

export const CopilotPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAppId, setSelectedAppId] = useState<number | ''>('');
  const [conversationId, setConversationId] = useState<number | undefined>(undefined);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadApplications = async () => {
    try {
      const apps = await api.getApplications();
      setApplications(apps);
      if (apps.length > 0) {
        setSelectedAppId(apps[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now(),
      sender_role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const resp = await api.queryCopilot({
        message: textToSend,
        application_id: selectedAppId ? Number(selectedAppId) : undefined,
        conversation_id: conversationId,
      });

      setConversationId(resp.conversation_id);
      const assistantMsg: ChatMessage = {
        id: resp.id,
        sender_role: 'assistant',
        content: resp.content,
        citations: resp.citations,
        is_fallback: resp.is_fallback,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: Date.now() + 1,
        sender_role: 'assistant',
        content: `Error: ${err.message || 'Unable to process inquiry'}`,
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const suggestedQuestions = [
    "Which documents are missing from this application?",
    "Why was the Student-Faculty Ratio deficit flagged?",
    "Which corrective tasks should be completed first?",
    "What are the official AICTE norms for Engineering UG?",
    "What changed between APH 2023-24 and APH 2024-27?"
  ];

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-8rem)]">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Bot className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.copilot', 'AI Compliance Copilot')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            RAG conversational assistant linking answers to official AICTE Handbook clauses, rules, and application records.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Active Context:</label>
          <select
            value={selectedAppId}
            onChange={(e) => setSelectedAppId(Number(e.target.value))}
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

      {/* Chat Area Container */}
      <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden min-h-0">
        {/* Messages Scrollable View */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-10">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">How can I assist your compliance review?</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6 leading-relaxed">
                Ask questions regarding mandatory AICTE approval documents, ratio norms, cross-document inconsistencies, or remediation priority.
              </p>

              {/* Quick suggestion pills */}
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="text-left text-xs bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-300 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 px-3 py-2 rounded-xl transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.sender_role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender_role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-2 relative group shadow-sm ${
                    msg.sender_role === 'user'
                      ? 'bg-slate-900 dark:bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
                  }`}
                >
                  {/* Message Content */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* Citations Pill List */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700 flex flex-wrap gap-1.5 mt-2">
                      {msg.citations.map((c, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-[10px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono"
                        >
                          <strong>{c.rule}</strong> • {c.clause}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Fallback Notice */}
                  {msg.is_fallback && (
                    <div className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-1">
                      (Generated via SmartComply Deterministic Regulatory Fallback Engine)
                    </div>
                  )}

                  {/* Copy Button */}
                  {msg.sender_role === 'assistant' && (
                    <button
                      onClick={() => handleCopy(msg.content, msg.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>

                {msg.sender_role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold">
                    {user?.full_name ? user.full_name[0] : 'U'}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-2xl rounded-tl-none flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Scanning handbook clauses and application records...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Bar */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask about missing evidence, ratio deficits, or APH clauses..."
              className="flex-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 placeholder-slate-400 dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center text-xs font-semibold shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
