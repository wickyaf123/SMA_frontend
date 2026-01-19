/**
 * API Client for Backend Communication
 * Handles all HTTP requests to the Express backend
 */

import type {
  Contact,
  ContactFilters,
  ContactStats,
  CreateContactInput,
  UpdateContactInput,
  Company,
  Campaign,
  CampaignFilters,
  CampaignStats,
  CreateCampaignInput,
  UpdateCampaignInput,
  CampaignEnrollment,
  EnrollContactsInput,
  ImportJob,
  ApolloImportInput,
  SendSMSInput,
  Settings,
  ActivityLog,
  WebhookLog,
  HealthStatus,
  PaginatedResponse,
  JobStatus,
  JobStats,
  MessageTemplate,
  TemplateChannel,
  ApifyScraperSettings,
  ApolloScraperSettings,
  PipelineControlSettings,
  ContactReply,
  ContactActivity,
  ContactMessages,
  OutreachStats,
  ScheduleTemplate,
  ScheduleSettings,
  UpdateSchedulesInput,
  CampaignRoutingRule,
  CreateRoutingRuleInput,
  UpdateRoutingRuleInput,
  RoutingFilterOptions,
  RoutingTestResult,
} from '@/types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: unknown
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | string[] | undefined>;
  body?: unknown;
}

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | string[] | undefined>): string {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          // Handle array params (e.g., status[]=NEW&status[]=VALIDATED)
          value.forEach((v) => url.searchParams.append(key, String(v)));
        } else {
          url.searchParams.append(key, String(value));
        }
      }
    });
  }
  
  return url.toString();
}

/**
 * Main API request function
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { params, body, ...fetchOptions } = options;
  
  const url = buildUrl(endpoint, params);
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };
  
  // Add API key as Bearer token for authentication
  const apiKey = import.meta.env.VITE_API_KEY;
  if (apiKey) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${apiKey}`;
  }
  
  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  // Handle non-JSON responses (like CSV export)
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('text/csv')) {
    return response.text() as unknown as T;
  }
  
  // Parse JSON response
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  
  if (!response.ok) {
    throw new ApiError(response.status, response.statusText, data);
  }
  
  return data as T;
}

/**
 * API methods matching backend routes
 */
export const api = {
  // ==================== HEALTH ====================
  health: {
    check: async () => {
      const response = await request<{ data: HealthStatus }>('/api/v1/health');
      return response.data;
    },
    detailed: async () => {
      const response = await request<{ data: HealthStatus }>('/api/v1/health/extended');
      return response.data;
    },
  },
  
  // ==================== CONTACTS ====================
  contacts: {
    list: async (filters?: ContactFilters): Promise<PaginatedResponse<Contact>> => {
      const response = await request<{ success: boolean; data: Contact[]; meta?: { pagination?: PaginatedResponse<Contact>['pagination'] } }>('/contacts', { params: filters as Record<string, string | number | boolean | string[] | undefined> });
      return {
        data: response.data,
        pagination: response.meta?.pagination || { page: 1, limit: 10, total: response.data.length, totalPages: 1 },
      };
    },
    
    get: (id: string) =>
      request<{ data: Contact }>(`/contacts/${id}`),
    
    create: (data: CreateContactInput) =>
      request<{ data: Contact }>('/contacts', { method: 'POST', body: data }),
    
    update: (id: string, data: UpdateContactInput) =>
      request<{ data: Contact }>(`/contacts/${id}`, { method: 'PATCH', body: data }),
    
    delete: (id: string) =>
      request<{ success: boolean }>(`/contacts/${id}`, { method: 'DELETE' }),
    
    stats: () =>
      request<{ data: ContactStats }>('/contacts/stats'),
    
    export: (filters?: ContactFilters) =>
      request<string>('/contacts/export', { params: filters as Record<string, string | number | boolean | string[] | undefined> }),
    
    // Import operations
    importApollo: (data: ApolloImportInput) =>
      request<{ data: ImportJob }>('/contacts/import/apollo', { method: 'POST', body: data }),
    
    importCsv: (formData: FormData) =>
      fetch(`${API_BASE_URL}/contacts/import/csv`, {
        method: 'POST',
        body: formData,
        headers: import.meta.env.VITE_API_KEY ? { 'Authorization': `Bearer ${import.meta.env.VITE_API_KEY}` } : {},
      }).then(res => res.json()),
    
    importStatus: (jobId: string) =>
      request<{ data: ImportJob }>(`/contacts/import/${jobId}/status`),
    
    // SMS operations
    sendSms: (contactId: string, data: SendSMSInput) =>
      request<{ success: boolean; messageId?: string }>(`/contacts/${contactId}/sms`, { method: 'POST', body: data }),
    
    previewSms: (contactId: string, data: { message: string }) =>
      request<{ preview: string; characterCount: number; segments: number }>(`/contacts/${contactId}/sms/preview`, { method: 'POST', body: data }),
    
    // Reply and activity
    getReplies: (contactId: string) =>
      request<{ data: ContactReply[] }>(`/contacts/${contactId}/replies`),
    
    getActivity: (contactId: string, limit?: number) =>
      request<{ data: ContactActivity[] }>(`/contacts/${contactId}/activity`, { params: { limit } }),
    
    // GHL messages (live fetch)
    getMessages: (contactId: string) =>
      request<{ data: ContactMessages }>(`/contacts/${contactId}/messages`),
  },
  
  // ==================== COMPANIES ====================
  companies: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      request<PaginatedResponse<Company>>('/companies', { params }),
    
    get: (id: string) =>
      request<{ data: Company }>(`/companies/${id}`),
    
    create: (data: Partial<Company>) =>
      request<{ data: Company }>('/companies', { method: 'POST', body: data }),
    
    update: (id: string, data: Partial<Company>) =>
      request<{ data: Company }>(`/companies/${id}`, { method: 'PATCH', body: data }),
    
    delete: (id: string) =>
      request<{ success: boolean }>(`/companies/${id}`, { method: 'DELETE' }),
  },
  
  // ==================== CAMPAIGNS ====================
  campaigns: {
    list: (filters?: CampaignFilters) =>
      request<PaginatedResponse<Campaign>>('/campaigns', { params: filters as Record<string, string | number | boolean | string[] | undefined> }),
    
    get: (id: string) =>
      request<{ data: Campaign }>(`/campaigns/${id}`),
    
    create: (data: CreateCampaignInput) =>
      request<{ data: Campaign }>('/campaigns', { method: 'POST', body: data }),
    
    update: (id: string, data: UpdateCampaignInput) =>
      request<{ data: Campaign }>(`/campaigns/${id}`, { method: 'PATCH', body: data }),
    
    delete: (id: string) =>
      request<{ success: boolean }>(`/campaigns/${id}`, { method: 'DELETE' }),
    
    stats: (id: string) =>
      request<{ data: CampaignStats }>(`/campaigns/${id}/stats`),
    
    // Enrollment operations
    enroll: (campaignId: string, data: EnrollContactsInput) =>
      request<{ success: boolean; enrolled: number }>(`/campaigns/${campaignId}/enroll`, { method: 'POST', body: data }),
    
    stopEnrollment: (campaignId: string, contactId: string) =>
      request<{ success: boolean }>(`/campaigns/${campaignId}/stop/${contactId}`, { method: 'POST' }),
    
    getEnrollments: (campaignId: string, params?: { page?: number; limit?: number; status?: string }) =>
      request<PaginatedResponse<CampaignEnrollment>>(`/campaigns/${campaignId}/enrollments`, { params }),
    
    // Aggregated outreach stats by channel
    outreachStats: () =>
      request<{ data: OutreachStats }>('/campaigns/outreach-stats'),
    
    // Sync campaigns from Instantly
    syncFromInstantly: () =>
      request<{ success: boolean; data: { created: number; updated: number; campaigns: Campaign[] }; message: string }>(
        '/campaigns/sync/instantly', 
        { method: 'POST' }
      ),
    
    // ==================== ROUTING RULES ====================
    routingRules: {
      list: (params?: { isActive?: boolean; campaignId?: string }) =>
        request<{ success: boolean; data: CampaignRoutingRule[]; count: number }>('/campaigns/routing-rules', { params }),
      
      get: (id: string) =>
        request<{ success: boolean; data: CampaignRoutingRule }>(`/campaigns/routing-rules/${id}`),
      
      create: (data: CreateRoutingRuleInput) =>
        request<{ success: boolean; data: CampaignRoutingRule; message: string }>('/campaigns/routing-rules', { method: 'POST', body: data }),
      
      update: (id: string, data: UpdateRoutingRuleInput) =>
        request<{ success: boolean; data: CampaignRoutingRule; message: string }>(`/campaigns/routing-rules/${id}`, { method: 'PUT', body: data }),
      
      delete: (id: string) =>
        request<{ success: boolean; message: string }>(`/campaigns/routing-rules/${id}`, { method: 'DELETE' }),
      
      reorder: (ruleIds: string[]) =>
        request<{ success: boolean; data: CampaignRoutingRule[]; message: string }>('/campaigns/routing-rules/reorder', { method: 'POST', body: { ruleIds } }),
      
      test: (contactId: string) =>
        request<{ success: boolean; data: RoutingTestResult; message: string }>('/campaigns/routing-rules/test', { method: 'POST', body: { contactId } }),
      
      filterOptions: () =>
        request<{ success: boolean; data: RoutingFilterOptions }>('/campaigns/routing-rules/filter-options'),
    },
  },
  
  // ==================== SETTINGS ====================
  settings: {
    get: () =>
      request<{ data: Settings }>('/api/v1/settings'),
    
    update: (data: Partial<Settings>) =>
      request<{ data: Settings }>('/api/v1/settings', { method: 'PATCH', body: data }),
    
    enableLinkedIn: () =>
      request<{ success: boolean }>('/api/v1/settings/linkedin/enable', { method: 'POST' }),
    
    disableLinkedIn: () =>
      request<{ success: boolean }>('/api/v1/settings/linkedin/disable', { method: 'POST' }),
    
    checkLinkedInForCampaign: (campaignId: string) =>
      request<{ enabled: boolean; globalEnabled: boolean; campaignEnabled: boolean }>(`/api/v1/settings/linkedin/check/${campaignId}`),
    
    // Scraper settings
    getScraperSettings: () =>
      request<{ data: { apify: ApifyScraperSettings; apollo: ApolloScraperSettings } }>('/api/v1/settings/scrapers'),
    
    getApifySettings: () =>
      request<{ data: ApifyScraperSettings }>('/api/v1/settings/scrapers/apify'),
    
    updateApifySettings: (data: Partial<ApifyScraperSettings>) =>
      request<{ data: ApifyScraperSettings }>('/api/v1/settings/scrapers/apify', { method: 'PATCH', body: data }),
    
    getApolloSettings: () =>
      request<{ data: ApolloScraperSettings }>('/api/v1/settings/scrapers/apollo'),
    
    updateApolloSettings: (data: Partial<ApolloScraperSettings>) =>
      request<{ data: ApolloScraperSettings }>('/api/v1/settings/scrapers/apollo', { method: 'PATCH', body: data }),
    
    // Pipeline controls
    getPipelineControls: () =>
      request<{ data: PipelineControlSettings }>('/api/v1/settings/pipeline'),
    
    updatePipelineControls: (data: Partial<PipelineControlSettings>) =>
      request<{ data: PipelineControlSettings }>('/api/v1/settings/pipeline', { method: 'PATCH', body: data }),
    
    emergencyStop: (stoppedBy?: string) =>
      request<{ data: PipelineControlSettings }>('/api/v1/settings/pipeline/emergency-stop', { method: 'POST', body: { stoppedBy } }),
    
    resumePipeline: () =>
      request<{ data: PipelineControlSettings }>('/api/v1/settings/pipeline/resume', { method: 'POST' }),
    
    // Schedule configuration
    getScheduleTemplates: () =>
      request<{ data: { templates: ScheduleTemplate[] } }>('/api/v1/settings/schedules/templates'),
    
    getScheduleSettings: () =>
      request<{ data: ScheduleSettings }>('/api/v1/settings/schedules'),
    
    applyScheduleTemplate: (templateId: string) =>
      request<{ data: ScheduleSettings }>('/api/v1/settings/schedules/apply-template', { method: 'POST', body: { templateId } }),
    
    updateSchedules: (data: UpdateSchedulesInput) =>
      request<{ data: ScheduleSettings }>('/api/v1/settings/schedules', { method: 'PATCH', body: data }),
    
    getSchedulerStatus: () =>
      request<{ data: { isRunning: boolean; jobs: Array<{ name: string; schedule: string; humanReadable: string }> } }>('/api/v1/settings/schedules/status'),
    
    triggerJob: (jobName: 'scrape' | 'apollo' | 'enrich' | 'merge' | 'validate' | 'enroll') =>
      request<{ data: { jobName: string; result: unknown } }>(`/api/v1/settings/schedules/trigger/${jobName}`, { method: 'POST' }),
    
    reloadScheduler: () =>
      request<{ data: { isRunning: boolean; jobs: Array<{ name: string; schedule: string; humanReadable: string }> } }>('/api/v1/settings/schedules/reload', { method: 'POST' }),
  },
  
  // ==================== GHL (GoHighLevel) ====================
  ghl: {
    status: () =>
      request<{ connected: boolean; phoneNumber?: string; locationId?: string }>('/ghl/status'),
    
    sendSms: (contactId: string, message: string) =>
      request<{ success: boolean; messageId?: string }>('/ghl/sms', { method: 'POST', body: { contactId, message } }),
  },
  
  // ==================== ACTIVITY ====================
  activity: {
    list: (params?: { page?: number; limit?: number; action?: string; contactId?: string; channel?: string; actorType?: string }) =>
      request<PaginatedResponse<ActivityLog>>('/activity', { params }),
    
    recent: (limit?: number) =>
      request<{ data: ActivityLog[] }>('/activity/recent', { params: { limit } }),
    
    stats: (days?: number) =>
      request<{ data: { byAction: Record<string, number>; byChannel: Record<string, number> } }>('/activity/stats', { params: { days } }),
  },
  
  // ==================== WEBHOOKS ====================
  webhooks: {
    logs: (params?: { page?: number; limit?: number; source?: string; eventType?: string; processed?: boolean }) =>
      request<PaginatedResponse<WebhookLog>>('/webhooks/logs', { params }),
    
    recentLogs: (limit?: number) =>
      request<{ data: WebhookLog[] }>('/webhooks/logs/recent', { params: { limit } }),
    
    stats: (days?: number) =>
      request<{ data: { bySource: Record<string, number>; processed: number; pending: number; errors: number } }>('/webhooks/logs/stats', { params: { days } }),
  },
  
  // ==================== JOBS ====================
  jobs: {
    status: () =>
      request<{ data: { runningJobs: JobStatus[]; schedulerActive: boolean; scheduledJobsCount: number } }>('/api/v1/jobs/status'),
    
    history: (params?: { type?: string; limit?: number }) =>
      request<{ data: { history: JobStatus[]; total: number } }>('/api/v1/jobs/history', { params }),
    
    stats: (params?: { type?: string; days?: number }) =>
      request<{ data: JobStats }>('/api/v1/jobs/stats', { params }),
    
    // Manual trigger endpoints
    triggerScrape: (data?: { query?: string; maxResults?: number; location?: string }) =>
      request<{ data: { jobId: string; result: unknown } }>('/api/v1/jobs/scrape/trigger', { method: 'POST', body: data }),
    
    triggerEnrich: (data?: { batchSize?: number; onlyNew?: boolean }) =>
      request<{ data: { jobId: string; result: unknown } }>('/api/v1/jobs/enrich/trigger', { method: 'POST', body: data }),
    
    triggerMerge: () =>
      request<{ data: { jobId: string; result: unknown } }>('/api/v1/jobs/merge/trigger', { method: 'POST' }),
    
    triggerValidate: (data?: { batchSize?: number }) =>
      request<{ data: { jobId: string; result: unknown } }>('/api/v1/jobs/validate/trigger', { method: 'POST', body: data }),
    
    triggerEnroll: (data?: { batchSize?: number }) =>
      request<{ data: { jobId: string; result: unknown } }>('/api/v1/jobs/enroll/trigger', { method: 'POST', body: data }),
  },
  
  // ==================== TEMPLATES ====================
  templates: {
    list: (params?: { channel?: TemplateChannel; isActive?: boolean; isDefault?: boolean; tags?: string; limit?: number; offset?: number }) =>
      request<PaginatedResponse<MessageTemplate>>('/templates', { params }),
    
    get: (id: string) =>
      request<MessageTemplate>(`/templates/${id}`),
    
    create: (data: { name: string; channel: TemplateChannel; body: string; subject?: string; description?: string; variables?: string[]; tags?: string[] }) =>
      request<MessageTemplate>('/templates', { method: 'POST', body: data }),
    
    update: (id: string, data: Partial<{ name: string; body: string; subject?: string; description?: string; isActive?: boolean; variables?: string[]; tags?: string[] }>) =>
      request<MessageTemplate>(`/templates/${id}`, { method: 'PATCH', body: data }),
    
    delete: (id: string) =>
      request<{ success: boolean }>(`/templates/${id}`, { method: 'DELETE' }),
    
    preview: (id: string, sampleData?: Record<string, string>) =>
      request<{ body: string; subject?: string }>(`/templates/${id}/preview`, { method: 'POST', body: { sampleData } }),
    
    setDefault: (id: string) =>
      request<MessageTemplate>(`/templates/${id}/set-default`, { method: 'POST' }),
    
    getDefault: (channel: TemplateChannel) =>
      request<MessageTemplate | null>(`/templates/default/${channel}`),
  },
};

export default api;

