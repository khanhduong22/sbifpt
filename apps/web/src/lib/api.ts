import {
  MarginSummaryResponse,
  ODCReconcileResponse,
  AutoReconcileResult,
  CryptographicProofPack,
  LogEffortRequest,
} from '@sbifpt/shared';

const BASE_URL = '';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    let errorDetail = '';
    try {
      const errJson = await response.json();
      errorDetail = errJson.message || errJson.error || JSON.stringify(errJson);
    } catch {
      errorDetail = await response.text();
    }
    throw new Error(`API error (${response.status}): ${errorDetail || response.statusText}`);
  }

  return response.json();
}

export interface EmployeeWithAssignedProjects {
  id: string;
  name: string;
  email: string;
  role: string;
  billingRatePerHour: number;
  costRatePerHour: number;
  marginPerHour: number;
  odcCardId?: string | null;
  avatarUrl?: string | null;
  department?: string | null;
  assignedProjects: {
    projectId: string;
    code: string;
    name: string;
    roleInProject: string;
    allocatedPercentage: number;
  }[];
}

export interface EmployeesResponse {
  employees: EmployeeWithAssignedProjects[];
  count: number;
}

export interface UserTodayTimesheetResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    billingRatePerHour: number;
    costRatePerHour: number;
    odcCardId: string;
    department: string;
    avatarUrl: string;
  };
  date: string;
  allocatedProjects: {
    projectId: string;
    projectCode: string;
    projectName: string;
    clientName: string;
    roleInProject: string;
    allocatedPercentage: number;
  }[];
  todayEntries: {
    id: string;
    userId: string;
    projectId: string;
    date: string;
    hours: number;
    taskDescription: string;
    taskType: string;
    isBillable: boolean;
    status: string;
    project?: {
      code: string;
      name: string;
    };
  }[];
  totalLoggedHoursToday: number;
  physicalHoursToday: number;
  todaySwipes: {
    id: string;
    userId: string;
    odcCardId: string;
    swipeDate: string;
    swipeIn: string;
    swipeOut: string | null;
    totalPhysicalHours: number;
    roomCode: string;
  }[];
}

export interface LogEffortResponse {
  success: boolean;
  message: string;
  auditBlockSequence: number;
  blockHash: string;
  entries: any[];
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string; service: string; version: string }>('/health'),

  // Executive Margin & Billability
  getMarginSummary: () => fetchJson<MarginSummaryResponse>('/api/projects/margin-summary'),

  // ODC Reconcile
  getOdcReconciliation: (params?: { status?: string; userId?: string; date?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') searchParams.set('status', params.status);
    if (params?.userId) searchParams.set('userId', params.userId);
    if (params?.date) searchParams.set('date', params.date);
    const qs = searchParams.toString();
    return fetchJson<ODCReconcileResponse>(`/api/odc/reconcile${qs ? `?${qs}` : ''}`);
  },

  // 1-Click Auto Reconcile
  runAutoReconcile: () =>
    fetchJson<AutoReconcileResult>('/api/odc/reconcile/auto', {
      method: 'POST',
    }),

  // Developer Today Telemetry & Allocation
  getTodayTimesheet: (userId?: string) => {
    const qs = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    return fetchJson<UserTodayTimesheetResponse>(`/api/timesheet/today${qs}`);
  },

  // Submit Effort Allocation
  logEffort: (data: LogEffortRequest) =>
    fetchJson<LogEffortResponse>('/api/timesheet/log', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Audit Proof Pack (J-SOX 404 & FISC)
  getAuditProofPack: () => fetchJson<CryptographicProofPack>('/api/audit/proof-pack'),

  // Employees Roster
  getEmployees: () => fetchJson<EmployeesResponse>('/api/employees'),
};
