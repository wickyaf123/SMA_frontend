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
  ShovelsScraperSettings,
  HomeownerScraperSettings,
  PermitRoutingSettings,
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
  ExampleContact,
  Homeowner,
  HomeownerStats,
  Connection,
  ConnectionStats,
  ConnectionResolveResult,
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
 * Main API request function with single retry on network failures
 */
async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const doRequest = async () => {
    const { params, body, ...fetchOptions } = options;

    const url = buildUrl(endpoint, params);

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

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
  };

  try {
    return await doRequest();
  } catch (error) {
    // Retry once on network errors (not HTTP errors)
    if (error instanceof TypeError || (error instanceof Error && !('status' in error))) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return doRequest();
    }
    throw error;
  }
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
      const response = await request<{ success: boolean; data: Contact[]; meta?: { pagination?: PaginatedResponse<Contact>['pagination'] } }>('/api/v1/contacts', { params: filters as Record<string, string | number | boolean | string[] | undefined> });
      return {
        data: response.data,
        pagination: response.meta?.pagination || { page: 1, limit: 10, total: response.data.length, totalPages: 1 },
      };
    },

    get: (id: string) =>
      request<{ data: Contact }>(`/api/v1/contacts/${id}`),

    create: (data: CreateContactInput) =>
      request<{ data: Contact }>('/api/v1/contacts', { method: 'POST', body: data }),

    update: (id: string, data: UpdateContactInput) =>
      request<{ data: Contact }>(`/api/v1/contacts/${id}`, { method: 'PATCH', body: data }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/contacts/${id}`, { method: 'DELETE' }),

    stats: () =>
      request<{ data: ContactStats }>('/api/v1/contacts/stats'),

    export: (filters?: ContactFilters) =>
      request<string>('/api/v1/contacts/export', { params: filters as Record<string, string | number | boolean | string[] | undefined> }),

    // Import operations
    importApollo: (data: ApolloImportInput) =>
      request<{ data: ImportJob }>('/api/v1/contacts/import/apollo', { method: 'POST', body: data }),

    importCsv: (formData: FormData) =>
      fetch(`${API_BASE_URL}/api/v1/contacts/import/csv`, {
        method: 'POST',
        body: formData,
      }).then(res => res.json()),

    importStatus: (jobId: string) =>
      request<{ data: ImportJob }>(`/api/v1/contacts/import/${jobId}/status`),

    // SMS operations
    sendSms: (contactId: string, data: SendSMSInput) =>
      request<{ success: boolean; messageId?: string }>(`/api/v1/contacts/${contactId}/sms`, { method: 'POST', body: data }),

    previewSms: (contactId: string, data: { message: string }) =>
      request<{ preview: string; characterCount: number; segments: number }>(`/api/v1/contacts/${contactId}/sms/preview`, { method: 'POST', body: data }),

    // Reply and activity
    getReplies: (contactId: string) =>
      request<{ data: ContactReply[] }>(`/api/v1/contacts/${contactId}/replies`),

    getActivity: (contactId: string, limit?: number) =>
      request<{ data: ContactActivity[] }>(`/api/v1/contacts/${contactId}/activity`, { params: { limit } }),

    // GHL messages (live fetch)
    getMessages: (contactId: string) =>
      request<{ data: ContactMessages }>(`/api/v1/contacts/${contactId}/messages`),
  },
  
  // ==================== COMPANIES ====================
  companies: {
    list: (params?: { page?: number; limit?: number; search?: string }) =>
      request<PaginatedResponse<Company>>('/api/v1/companies', { params }),

    get: (id: string) =>
      request<{ data: Company }>(`/api/v1/companies/${id}`),

    create: (data: Partial<Company>) =>
      request<{ data: Company }>('/api/v1/companies', { method: 'POST', body: data }),

    update: (id: string, data: Partial<Company>) =>
      request<{ data: Company }>(`/api/v1/companies/${id}`, { method: 'PATCH', body: data }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/companies/${id}`, { method: 'DELETE' }),
  },
  
  // ==================== CAMPAIGNS ====================
  campaigns: {
    list: (filters?: CampaignFilters) =>
      request<PaginatedResponse<Campaign>>('/api/v1/campaigns', { params: filters as Record<string, string | number | boolean | string[] | undefined> }),

    get: (id: string) =>
      request<{ data: Campaign }>(`/api/v1/campaigns/${id}`),

    create: (data: CreateCampaignInput) =>
      request<{ data: Campaign }>('/api/v1/campaigns', { method: 'POST', body: data }),

    update: (id: string, data: UpdateCampaignInput) =>
      request<{ data: Campaign }>(`/api/v1/campaigns/${id}`, { method: 'PATCH', body: data }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/campaigns/${id}`, { method: 'DELETE' }),

    stats: (id: string) =>
      request<{ data: CampaignStats }>(`/api/v1/campaigns/${id}/stats`),

    // Enrollment operations
    enroll: (campaignId: string, data: EnrollContactsInput) =>
      request<{ success: boolean; enrolled: number }>(`/api/v1/campaigns/${campaignId}/enroll`, { method: 'POST', body: data }),

    stopEnrollment: (campaignId: string, contactId: string) =>
      request<{ success: boolean }>(`/api/v1/campaigns/${campaignId}/stop/${contactId}`, { method: 'POST' }),

    getEnrollments: (campaignId: string, params?: { page?: number; limit?: number; status?: string }) =>
      request<PaginatedResponse<CampaignEnrollment>>(`/api/v1/campaigns/${campaignId}/enrollments`, { params }),

    // Aggregated outreach stats by channel
    outreachStats: () =>
      request<{ data: OutreachStats }>('/api/v1/campaigns/outreach-stats'),

    // Sync campaigns from Instantly
    syncFromInstantly: () =>
      request<{ success: boolean; data: { created: number; updated: number; campaigns: Campaign[] }; message: string }>(
        '/api/v1/campaigns/sync/instantly',
        { method: 'POST' }
      ),

    // ==================== ROUTING RULES ====================
    routingRules: {
      list: (params?: { isActive?: boolean; campaignId?: string }) =>
        request<{ success: boolean; data: CampaignRoutingRule[]; count: number }>('/api/v1/campaigns/routing-rules', { params }),

      get: (id: string) =>
        request<{ success: boolean; data: CampaignRoutingRule }>(`/api/v1/campaigns/routing-rules/${id}`),

      create: (data: CreateRoutingRuleInput) =>
        request<{ success: boolean; data: CampaignRoutingRule; message: string }>('/api/v1/campaigns/routing-rules', { method: 'POST', body: data }),

      update: (id: string, data: UpdateRoutingRuleInput) =>
        request<{ success: boolean; data: CampaignRoutingRule; message: string }>(`/api/v1/campaigns/routing-rules/${id}`, { method: 'PUT', body: data }),

      delete: (id: string) =>
        request<{ success: boolean; message: string }>(`/api/v1/campaigns/routing-rules/${id}`, { method: 'DELETE' }),

      reorder: (ruleIds: string[]) =>
        request<{ success: boolean; data: CampaignRoutingRule[]; message: string }>('/api/v1/campaigns/routing-rules/reorder', { method: 'POST', body: { ruleIds } }),

      test: (contactId: string) =>
        request<{ success: boolean; data: RoutingTestResult; message: string }>('/api/v1/campaigns/routing-rules/test', { method: 'POST', body: { contactId } }),

      filterOptions: () =>
        request<{ success: boolean; data: RoutingFilterOptions }>('/api/v1/campaigns/routing-rules/filter-options'),

      getExampleContacts: (limit?: number) =>
        request<{ success: boolean; data: ExampleContact[] }>(`/api/v1/campaigns/routing-rules/example-contacts${limit ? `?limit=${limit}` : ''}`),
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
      request<{ data: { shovels: ShovelsScraperSettings } }>('/api/v1/settings/scrapers'),
    
    getShovelsSettings: () =>
      request<{ data: ShovelsScraperSettings }>('/api/v1/settings/scrapers/shovels'),
    
    updateShovelsSettings: (data: Partial<ShovelsScraperSettings>) =>
      request<{ data: ShovelsScraperSettings }>('/api/v1/settings/scrapers/shovels', { method: 'PATCH', body: data }),
    
    getHomeownerSettings: () =>
      request<{ data: HomeownerScraperSettings }>('/api/v1/settings/scrapers/homeowner'),
    
    updateHomeownerSettings: (data: Partial<HomeownerScraperSettings>) =>
      request<{ data: HomeownerScraperSettings }>('/api/v1/settings/scrapers/homeowner', { method: 'PATCH', body: data }),
    
    // Permit routing
    getPermitRoutingSettings: () =>
      request<{ data: PermitRoutingSettings }>('/api/v1/settings/permit-routing'),
    
    updatePermitRoutingSettings: (data: Partial<PermitRoutingSettings>) =>
      request<{ data: PermitRoutingSettings }>('/api/v1/settings/permit-routing', { method: 'PATCH', body: data }),
    
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
    
    triggerJob: (jobName: 'shovels' | 'homeowner' | 'enrich' | 'merge' | 'validate' | 'enroll') =>
      request<{ data: { jobName: string; result: unknown } }>(`/api/v1/settings/schedules/trigger/${jobName}`, { method: 'POST' }),
    
    reloadScheduler: () =>
      request<{ data: { isRunning: boolean; jobs: Array<{ name: string; schedule: string; humanReadable: string }> } }>('/api/v1/settings/schedules/reload', { method: 'POST' }),
  },
  
  // ==================== HOMEOWNERS ====================
  homeowners: {
    list: async (filters?: { search?: string; status?: string; city?: string; state?: string; geoId?: string; realieEnriched?: string; page?: number; limit?: number; sort?: string; order?: string }): Promise<PaginatedResponse<Homeowner>> => {
      const response = await request<{ success: boolean; data: Homeowner[]; meta?: { pagination?: PaginatedResponse<Homeowner>['pagination'] } }>('/api/v1/homeowners', { params: filters as any });
      return {
        data: response.data,
        pagination: response.meta?.pagination || { page: 1, limit: 25, total: response.data.length, totalPages: 1 },
      };
    },

    get: (id: string) =>
      request<{ data: Homeowner }>(`/api/v1/homeowners/${id}`),

    stats: () =>
      request<{ data: HomeownerStats }>('/api/v1/homeowners/stats'),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/homeowners/${id}`, { method: 'DELETE' }),

    export: () =>
      request<string>('/api/v1/homeowners/export'),

    triggerEnrich: (batchSize?: number) =>
      request<{ data: { total: number; enriched: number; notFound: number; errors: number } }>('/api/v1/homeowners/enrich', { method: 'POST', body: { batchSize } }),
  },

  // ==================== CONNECTIONS ====================
  connections: {
    list: async (filters?: { search?: string; permitType?: string; city?: string; state?: string; page?: number; limit?: number; sort?: string; order?: string }): Promise<PaginatedResponse<Connection>> => {
      const response = await request<{ success: boolean; data: Connection[]; meta?: { pagination?: PaginatedResponse<Connection>['pagination'] } }>('/api/v1/connections', { params: filters as any });
      return {
        data: response.data,
        pagination: response.meta?.pagination || { page: 1, limit: 25, total: response.data.length, totalPages: 1 },
      };
    },

    get: (id: string) =>
      request<{ data: Connection }>(`/api/v1/connections/${id}`),

    stats: () =>
      request<{ data: ConnectionStats }>('/api/v1/connections/stats'),

    resolve: (batchSize?: number) =>
      request<{ data: ConnectionResolveResult }>('/api/v1/connections/resolve', { method: 'POST', body: { batchSize } }),

    getByContact: (contactId: string) =>
      request<{ data: Connection[] }>(`/api/v1/connections/contact/${contactId}`),

    getByHomeowner: (homeownerId: string) =>
      request<{ data: Connection[] }>(`/api/v1/connections/homeowner/${homeownerId}`),
  },

  // ==================== GHL (GoHighLevel) ====================
  ghl: {
    status: () =>
      request<{ connected: boolean; phoneNumber?: string; locationId?: string }>('/api/v1/ghl/status'),

    sendSms: (contactId: string, message: string) =>
      request<{ success: boolean; messageId?: string }>('/api/v1/ghl/sms', { method: 'POST', body: { contactId, message } }),
  },
  
  // ==================== ACTIVITY ====================
  activity: {
    list: (params?: { page?: number; limit?: number; action?: string; contactId?: string; channel?: string; actorType?: string }) =>
      request<PaginatedResponse<ActivityLog>>('/api/v1/activity', { params }),

    recent: (limit?: number) =>
      request<{ data: ActivityLog[] }>('/api/v1/activity/recent', { params: { limit } }),

    stats: (days?: number) =>
      request<{ data: { byAction: Record<string, number>; byChannel: Record<string, number> } }>('/api/v1/activity/stats', { params: { days } }),
  },
  
  // ==================== WEBHOOKS ====================
  webhooks: {
    logs: (params?: { page?: number; limit?: number; source?: string; eventType?: string; processed?: boolean }) =>
      request<PaginatedResponse<WebhookLog>>('/api/v1/webhooks/logs', { params }),

    recentLogs: (limit?: number) =>
      request<{ data: WebhookLog[] }>('/api/v1/webhooks/logs/recent', { params: { limit } }),

    stats: (days?: number) =>
      request<{ data: { bySource: Record<string, number>; processed: number; pending: number; errors: number } }>('/api/v1/webhooks/logs/stats', { params: { days } }),
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
      request<PaginatedResponse<MessageTemplate>>('/api/v1/templates', { params }),

    get: (id: string) =>
      request<MessageTemplate>(`/api/v1/templates/${id}`),

    create: (data: { name: string; channel: TemplateChannel; body: string; subject?: string; description?: string; variables?: string[]; tags?: string[] }) =>
      request<MessageTemplate>('/api/v1/templates', { method: 'POST', body: data }),

    update: (id: string, data: Partial<{ name: string; body: string; subject?: string; description?: string; isActive?: boolean; variables?: string[]; tags?: string[] }>) =>
      request<MessageTemplate>(`/api/v1/templates/${id}`, { method: 'PATCH', body: data }),

    delete: (id: string) =>
      request<{ success: boolean }>(`/api/v1/templates/${id}`, { method: 'DELETE' }),

    preview: (id: string, sampleData?: Record<string, string>) =>
      request<{ body: string; subject?: string }>(`/api/v1/templates/${id}/preview`, { method: 'POST', body: { sampleData } }),

    setDefault: (id: string) =>
      request<MessageTemplate>(`/api/v1/templates/${id}/set-default`, { method: 'POST' }),

    getDefault: (channel: TemplateChannel) =>
      request<MessageTemplate | null>(`/api/v1/templates/default/${channel}`),
  },

  // ==================== CHAT ====================
  chat: {
    listConversations: () =>
      request<{ success: boolean; data: any[] }>('/api/v1/chat/conversations'),

    createConversation: (title: string) =>
      request<{ success: boolean; data: any }>('/api/v1/chat/conversations', { method: 'POST', body: { title } }),

    getConversation: (id: string) =>
      request<{ success: boolean; data: any }>(`/api/v1/chat/conversations/${id}`),

    deleteConversation: (id: string) =>
      request<{ success: boolean }>(`/api/v1/chat/conversations/${id}`, { method: 'DELETE' }),

    searchConversations: (query: string) =>
      request<{ success: boolean; data: any[] }>('/api/v1/chat/conversations/search', { params: { q: query } }),

    sendMessage: (conversationId: string, content: string) =>
      request<{ success: boolean }>(`/api/v1/chat/conversations/${conversationId}/messages`, { method: 'POST', body: { content } }),

    sendFeedback: (messageId: string, rating: 'up' | 'down', comment?: string) =>
      request<{ success: boolean }>(`/api/v1/chat/messages/${messageId}/feedback`, { method: 'POST', body: { rating, comment } }),

    uploadFile: async (conversationId: string, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversations/${conversationId}/upload`, {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
  },
};

export default api;

