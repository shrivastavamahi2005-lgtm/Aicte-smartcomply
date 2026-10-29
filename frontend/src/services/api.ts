const envApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = envApiUrl
  ? (envApiUrl.endsWith('/api/v1') ? envApiUrl : `${envApiUrl.replace(/\/+$/, '')}/api/v1`)
  : '/api/v1';

export function getAuthToken(): string | null {
  return localStorage.getItem('smartcomply_token');
}

export function setAuthToken(token: string) {
  localStorage.setItem('smartcomply_token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('smartcomply_token');
  localStorage.removeItem('smartcomply_user');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Session expired. Please log in again.');
  }

  if (!response.ok) {
    let errorDetail = 'An error occurred';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = response.statusText;
    }
    throw new Error(errorDetail);
  }

  // Handle blob or text responses (like CSV)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return (await response.text()) as unknown as T;
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: str }) =>
    request<{ access_token: string; token_type: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => request<any>('/auth/me'),

  // Applications
  getApplications: (params?: { stage?: string; app_type?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/applications${q ? `?${q}` : ''}`);
  },
  getApplication: (id: number) => request<any>(`/applications/${id}`),
  createApplication: (data: any) =>
    request<any>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  transitionStage: (id: number, data: { target_stage: string; remarks?: string }) =>
    request<any>(`/applications/${id}/transition`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getApplicationRisk: (id: number) => request<any>(`/applications/${id}/risk`),

  // Documents
  getApplicationDocuments: (appId: number) => request<any[]>(`/documents/application/${appId}`),
  uploadDocument: (formData: FormData) =>
    request<any>('/documents/upload', {
      method: 'POST',
      body: formData,
    }),
  correctField: (fieldId: number, data: { field_value: string; reason?: string }) =>
    request<any>(`/documents/fields/${fieldId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Compliance
  getRules: (verifiedOnly?: boolean) => {
    const q = verifiedOnly !== undefined ? `?verified_only=${verifiedOnly}` : '';
    return request<any[]>(`/compliance/rules${q}`);
  },
  validateApplication: (appId: number) =>
    request<any>(`/compliance/applications/${appId}/validate`, {
      method: 'POST',
    }),
  getApplicationFindings: (appId: number, status?: string) => {
    const q = status ? `?status_filter=${status}` : '';
    return request<any[]>(`/compliance/applications/${appId}/findings${q}`);
  },
  updateFindingStatus: (id: number, data: { status: string; resolution_notes: string }) =>
    request<any>(`/compliance/findings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getActionPlan: (appId: number) => request<any>(`/compliance/applications/${appId}/action-plan`),

  // Graph
  getApplicationGraph: (appId: number) => request<any>(`/graph/applications/${appId}`),

  // Workflow & Tasks
  getTasks: (params?: { application_id?: number; status_filter?: string; department?: string }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/workflow/tasks${q ? `?${q}` : ''}`);
  },
  createTask: (data: any) =>
    request<any>('/workflow/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateTask: (id: number, data: any) =>
    request<any>(`/workflow/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  addTaskComment: (id: number, comment_text: string) =>
    request<any>(`/workflow/tasks/${id}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text }),
    }),
  generateCorrectiveTasks: (appId: number) =>
    request<any[]>(`/workflow/applications/${appId}/generate-tasks`, {
      method: 'POST',
    }),

  // Alerts
  getAlerts: (unreadOnly?: boolean) => {
    const q = unreadOnly ? '?unread_only=true' : '';
    return request<any[]>(`/alerts${q}`);
  },
  markAlertRead: (id: number) =>
    request<any>(`/alerts/${id}/read`, {
      method: 'PUT',
    }),
  acknowledgeAlert: (id: number) =>
    request<any>(`/alerts/${id}/acknowledge`, {
      method: 'PUT',
    }),

  // Radar
  getSources: () => request<any[]>('/radar/sources'),
  compareVersions: (sourceId: number, oldTag: string, newTag: string) =>
    request<any>('/radar/compare', {
      method: 'POST',
      body: JSON.stringify({
        source_id: sourceId,
        old_version_tag: oldTag,
        new_version_tag: newTag,
      }),
    }),
  getChangeEvents: () => request<any[]>('/radar/events'),
  verifyChangeEvent: (id: number, action: string, notes: string) =>
    request<any>(`/radar/events/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ action, notes }),
    }),

  // Copilot
  queryCopilot: (data: { message: string; application_id?: number; conversation_id?: number }) =>
    request<any>('/copilot/query', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getConversationHistory: (convId: number) => request<any[]>(`/copilot/history/${convId}`),

  // Reports
  getDashboardMetrics: () => request<any>('/reports/dashboard-metrics'),
  exportApplicationsCsv: () => request<string>('/reports/export-csv'),
  getAuditTrail: (params?: { actor?: string; action?: string; limit?: number }) => {
    const q = new URLSearchParams(params as any).toString();
    return request<any[]>(`/reports/audit-trail${q ? `?${q}` : ''}`);
  },
  getInstitutions: () => request<any[]>('/reports/institutions'),
};
