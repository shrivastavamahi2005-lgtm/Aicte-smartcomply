import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { TaskRecord, Application } from '../types';
import { useTranslation } from 'react-i18next';
import {
  ListTodo, Plus, CheckCircle2, Clock, AlertTriangle, MessageSquare,
  RefreshCw, Filter, User, Send, X
} from 'lucide-react';

export const WorkflowTasksPage: React.FC = () => {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected task modal
  const [selectedTask, setSelectedTask] = useState<TaskRecord | null>(null);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  // New task modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taskAppId, setTaskAppId] = useState<number | ''>('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskDept, setTaskDept] = useState('Academic Affairs');
  const [taskPriority, setTaskPriority] = useState('High');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [statusFilter, departmentFilter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const [tList, apps] = await Promise.all([
        api.getTasks({
          status_filter: statusFilter || undefined,
          department: departmentFilter || undefined,
        }),
        api.getApplications()
      ]);
      setTasks(tList);
      setApplications(apps);
      if (apps.length > 0 && taskAppId === '') {
        setTaskAppId(apps[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: number, newStatus: string) => {
    try {
      const updated = await api.updateTask(taskId, { status: newStatus });
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      if (selectedTask?.id === taskId) {
        setSelectedTask(updated);
      }
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;
    setCommenting(true);
    try {
      const updated = await api.addTaskComment(selectedTask.id, newComment.trim());
      setSelectedTask(updated);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setNewComment('');
    } catch (err) {
      alert('Failed to post comment');
    } finally {
      setCommenting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskAppId) return;
    setCreating(true);
    try {
      const created = await api.createTask({
        application_id: Number(taskAppId),
        title: taskTitle,
        description: taskDesc,
        department: taskDept,
        priority: taskPriority,
      });
      setTasks((prev) => [created, ...prev]);
      setShowCreateModal(false);
      setTaskTitle('');
      setTaskDesc('');
    } catch (err) {
      alert('Failed to create task');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <ListTodo className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
            {t('nav.tasks', 'Workflow & Department Remediation Tasks')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Assign corrective action items, collaborate via audit comments, and track regulatory SLA resolution.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          <span>New Remediation Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-3 items-center justify-between shadow-sm">
        <div className="flex items-center space-x-2">
          <Filter className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Submitted for Review">Submitted for Review</option>
            <option value="Completed">Completed</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">All Departments</option>
            <option value="Administration">Central Administration</option>
            <option value="Academic Affairs">Academic Affairs</option>
            <option value="Estate & Facilities">Estate & Facilities</option>
            <option value="Student Welfare">Student Welfare</option>
          </select>
        </div>

        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {tasks.length} task(s) on board
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading task matrix...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            No corrective tasks found for the selected filters.
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => setSelectedTask(task)}
              className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    task.priority === 'Critical'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}>
                    {task.priority}
                  </span>
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">{task.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">[{task.application_number}]</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{task.description}</p>
                <div className="flex items-center space-x-3 text-[10px] text-slate-400 dark:text-slate-500 pt-1">
                  <span>Dept: <strong className="text-slate-600 dark:text-slate-300">{task.department}</strong></span>
                  <span>Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Immediate'}</span>
                  <span>Comments: {task.comments.length}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2 sm:self-center">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${
                  task.status === 'Completed'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}>
                  {task.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Task Inspection & Comment Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                  TASK #{selectedTask.id} • {selectedTask.application_number}
                </span>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{selectedTask.title}</h2>
              </div>
              <button onClick={() => setSelectedTask(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
              {selectedTask.description}
            </div>

            {/* Quick Status Transition */}
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-medium">Update Status:</span>
              <div className="flex space-x-1.5 flex-wrap gap-y-1">
                {['Open', 'In Progress', 'Submitted for Review', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedTask.id, st)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-medium transition ${
                      selectedTask.status === st
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Collaboration Comments Feed */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-2">
                Audit Discussion & Evidence Notes ({selectedTask.comments.length})
              </span>
              <div className="space-y-2 max-h-40 overflow-y-auto mb-3">
                {selectedTask.comments.length === 0 ? (
                  <div className="text-[11px] text-slate-400 italic">No notes recorded yet.</div>
                ) : (
                  selectedTask.comments.map((c) => (
                    <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 mb-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{c.user_name || 'Staff'}</span>
                        <span>{new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200">{c.comment_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <form onSubmit={handleAddComment} className="flex space-x-2">
                <input
                  type="text"
                  required
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add compliance note or evidence reference..."
                  className="flex-1 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  disabled={commenting}
                  className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center text-xs font-semibold disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Task */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Create Department Remediation Task</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Application</label>
                <select
                  required
                  value={taskAppId}
                  onChange={(e) => setTaskAppId(Number(e.target.value))}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.application_number} ({app.institution_name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="e.g. Schedule Structural Stability Site Inspection"
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Responsible Department</label>
                <select
                  value={taskDept}
                  onChange={(e) => setTaskDept(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Academic Affairs">Academic Affairs</option>
                  <option value="Estate & Facilities">Estate & Facilities</option>
                  <option value="Central Administration">Central Administration</option>
                  <option value="Student Welfare">Student Welfare</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                <select
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value)}
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Critical">Critical (SLA 3-5 days)</option>
                  <option value="High">High (SLA 7 days)</option>
                  <option value="Medium">Medium (SLA 14 days)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Detailed Instructions</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Action instructions and required closure documents..."
                  className="w-full text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-blue-600"
                />
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
                  {creating ? 'Assigning...' : 'Create & Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
