/**
 * React Query hooks for data fetching
 * Provides typed hooks for all API operations
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
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
} from '@/types/api';

// ==================== QUERY KEYS ====================

export const queryKeys = {
  health: ['health'] as const,
  
  contacts: {
    all: ['contacts'] as const,
    list: (filters?: ContactFilters) => ['contacts', 'list', filters] as const,
    detail: (id: string) => ['contacts', 'detail', id] as const,
    stats: ['contacts', 'stats'] as const,
  },
  
  companies: {
    all: ['companies'] as const,
    list: (params?: { page?: number; limit?: number; search?: string }) => ['companies', 'list', params] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
  },
  
  campaigns: {
    all: ['campaigns'] as const,
    list: (filters?: CampaignFilters) => ['campaigns', 'list', filters] as const,
    detail: (id: string) => ['campaigns', 'detail', id] as const,
    stats: (id: string) => ['campaigns', 'stats', id] as const,
    enrollments: (id: string, params?: { page?: number; limit?: number; status?: string }) => 
      ['campaigns', 'enrollments', id, params] as const,
    outreachStats: ['campaigns', 'outreach-stats'] as const,
    routingRules: ['campaigns', 'routing-rules'] as const,
  },
  
  // Routing filter options - separate namespace to prevent invalidation during campaign sync
  routingFilterOptions: ['routing-filter-options'] as const,
  
  settings: ['settings'] as const,
  
  shovels: {
    settings: ['shovels', 'settings'] as const,
  },

  homeowners: {
    all: ['homeowners'] as const,
    list: (filters?: any) => ['homeowners', 'list', filters] as const,
    detail: (id: string) => ['homeowners', 'detail', id] as const,
    stats: ['homeowners', 'stats'] as const,
    settings: ['homeowners', 'settings'] as const,
  },

  connections: {
    all: ['connections'] as const,
    list: (filters?: any) => ['connections', 'list', filters] as const,
    detail: (id: string) => ['connections', 'detail', id] as const,
    stats: ['connections', 'stats'] as const,
  },
  
  activity: {
    all: ['activity'] as const,
    list: (params?: { page?: number; limit?: number; action?: string }) => ['activity', 'list', params] as const,
  },
  
  webhooks: {
    logs: (params?: { page?: number; limit?: number; source?: string }) => ['webhooks', 'logs', params] as const,
  },
  
  templates: {
    all: ['templates'] as const,
    list: (params?: { channel?: TemplateChannel; isActive?: boolean }) => ['templates', 'list', params] as const,
    detail: (id: string) => ['templates', 'detail', id] as const,
    default: (channel: TemplateChannel) => ['templates', 'default', channel] as const,
  },
};

// ==================== HEALTH ====================

export function useHealth(options?: Omit<UseQueryOptions<HealthStatus>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: () => api.health.check(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
    ...options,
  });
}

// ==================== CONTACTS ====================

export function useContacts(filters?: ContactFilters, options?: Omit<UseQueryOptions<PaginatedResponse<Contact>>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.contacts.list(filters),
    queryFn: () => api.contacts.list(filters),
    ...options,
  });
}

export function useContact(id: string, options?: Omit<UseQueryOptions<{ data: Contact }>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id),
    queryFn: () => api.contacts.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useContactStats(options?: Omit<UseQueryOptions<{ data: ContactStats }>, 'queryKey' | 'queryFn'>) {
  return useQuery({
    queryKey: queryKeys.contacts.stats,
    queryFn: () => api.contacts.stats(),
    staleTime: 60000, // 1 minute
    ...options,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: CreateContactInput) => api.contacts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      toast({
        title: 'Contact created',
        description: 'Email & phone validation running in background. Status will update automatically.',
      });
      
      // Refetch contacts after a delay to show updated validation status
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      }, 5000);
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      }, 15000);
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to create contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactInput }) => 
      api.contacts.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(variables.id) });
      toast({
        title: 'Contact updated',
        description: 'The contact has been updated successfully.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to update contact',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.contacts.delete(id),
    onMutate: async (id: string) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.contacts.all });

      // Snapshot all contact list queries for rollback
      const previousQueries = queryClient.getQueriesData<PaginatedResponse<Contact>>({ queryKey: queryKeys.contacts.all });

      // Optimistically remove the contact from every cached list
      queryClient.setQueriesData<PaginatedResponse<Contact>>(
        { queryKey: queryKeys.contacts.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((c) => c.id !== id),
            pagination: old.pagination
              ? { ...old.pagination, total: Math.max(0, old.pagination.total - 1) }
              : old.pagination,
          };
        },
      );

      return { previousQueries };
    },
    onSuccess: () => {
      toast({
        title: 'Contact deleted',
        description: 'The contact has been removed.',
      });
    },
    onError: (error: ApiError, _id, context) => {
      // Rollback optimistic update
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast({
        title: 'Failed to delete contact',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
    },
  });
}

export function useImportApollo() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: ApolloImportInput) => api.contacts.importApollo(data),
    onSuccess: (response) => {
      toast({
        title: 'Import started',
        description: `Job ID: ${response.data.id}. Importing contacts from Apollo...`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to start import',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useImportStatus(jobId: string, options?: { enabled?: boolean; refetchInterval?: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useQuery({
    queryKey: ['import', 'status', jobId],
    queryFn: () => api.contacts.importStatus(jobId),
    enabled: !!jobId && options?.enabled !== false,
    refetchInterval: (data) => {
      // Stop polling when complete or failed
      if (data?.state?.data?.data.status === 'COMPLETED' || data?.state?.data?.data.status === 'FAILED') {
        // Invalidate contacts when done
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
        
        if (data?.state?.data?.data.status === 'COMPLETED') {
          toast({
            title: 'Import complete',
            description: `Successfully imported ${data?.state?.data?.data.successCount} contacts.`,
          });
        }
        return false;
      }
      return options?.refetchInterval ?? 2000; // Poll every 2 seconds
    },
  });
}

export function useSendSms() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ contactId, data }: { contactId: string; data: SendSMSInput }) =>
      api.contacts.sendSms(contactId, data),
    onSuccess: () => {
      toast({
        title: 'SMS sent',
        description: 'The message has been sent successfully.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to send SMS',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useContactReplies(contactId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['contacts', 'replies', contactId],
    queryFn: () => api.contacts.getReplies(contactId),
    enabled: !!contactId && options?.enabled !== false,
  });
}

export function useContactActivity(contactId: string, limit?: number, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['contacts', 'activity', contactId, limit],
    queryFn: () => api.contacts.getActivity(contactId, limit),
    enabled: !!contactId && options?.enabled !== false,
  });
}

export function useContactMessages(contactId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['contacts', 'messages', contactId],
    queryFn: () => api.contacts.getMessages(contactId),
    enabled: !!contactId && options?.enabled !== false,
    staleTime: 30000, // 30 seconds - messages can change frequently
  });
}

// ==================== COMPANIES ====================

export function useCompanies(params?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: queryKeys.companies.list(params),
    queryFn: () => api.companies.list(params),
  });
}

export function useCompany(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.companies.detail(id),
    queryFn: () => api.companies.get(id),
    enabled: !!id && options?.enabled !== false,
  });
}

// ==================== CAMPAIGNS ====================

export function useCampaigns(filters?: CampaignFilters) {
  return useQuery({
    queryKey: queryKeys.campaigns.list(filters),
    queryFn: () => api.campaigns.list(filters),
  });
}

export function useCampaign(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: () => api.campaigns.get(id),
    enabled: !!id && options?.enabled !== false,
  });
}

export function useCampaignStats(id: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.campaigns.stats(id),
    queryFn: () => api.campaigns.stats(id),
    enabled: !!id && options?.enabled !== false,
  });
}

export function useCampaignEnrollments(
  id: string, 
  params?: { page?: number; limit?: number; status?: string },
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.campaigns.enrollments(id, params),
    queryFn: () => api.campaigns.getEnrollments(id, params),
    enabled: !!id && options?.enabled !== false,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: CreateCampaignInput) => api.campaigns.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      toast({
        title: 'Campaign created',
        description: 'The campaign has been created successfully.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to create campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCampaignInput }) =>
      api.campaigns.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(variables.id) });
      toast({
        title: 'Campaign updated',
        description: 'The campaign has been updated successfully.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to update campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.campaigns.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.campaigns.all });

      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.campaigns.all });

      queryClient.setQueriesData<PaginatedResponse<Campaign>>(
        { queryKey: queryKeys.campaigns.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((c) => c.id !== id),
          };
        },
      );

      return { previousQueries };
    },
    onSuccess: () => {
      toast({
        title: 'Campaign deleted',
        description: 'The campaign has been removed.',
      });
    },
    onError: (error: ApiError, _id, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast({
        title: 'Failed to delete campaign',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
    },
  });
}

export function useEnrollContacts() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: EnrollContactsInput }) =>
      api.campaigns.enroll(campaignId, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(variables.campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.stats(variables.campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      toast({
        title: 'Contacts enrolled',
        description: `Successfully enrolled ${response.enrolled} contacts.`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to enroll contacts',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useStopEnrollment() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ campaignId, contactId }: { campaignId: string; contactId: string }) =>
      api.campaigns.stopEnrollment(campaignId, contactId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.detail(variables.campaignId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.enrollments(variables.campaignId) });
      toast({
        title: 'Enrollment stopped',
        description: 'The contact has been removed from the campaign.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to stop enrollment',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useOutreachStats() {
  return useQuery({
    queryKey: queryKeys.campaigns.outreachStats,
    queryFn: () => api.campaigns.outreachStats(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useSyncFromInstantly() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => api.campaigns.syncFromInstantly(),
    onSuccess: (response) => {
      // Don't auto-invalidate here - let the caller handle refetch
      // This prevents dropdowns from closing during sync
      const { created, updated } = response.data;
      toast({
        title: 'Campaigns synced from Instantly',
        description: `Created: ${created}, Updated: ${updated}`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to sync campaigns',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ==================== SETTINGS ====================

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.settings.get(),
    staleTime: 60000, // 1 minute
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: Partial<Settings>) => api.settings.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      toast({
        title: 'Settings updated',
        description: 'Your settings have been saved.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to update settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useToggleLinkedIn() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (enabled: boolean) => 
      enabled ? api.settings.enableLinkedIn() : api.settings.disableLinkedIn(),
    onSuccess: (_, enabled) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      toast({
        title: enabled ? 'LinkedIn enabled' : 'LinkedIn disabled',
        description: enabled 
          ? 'LinkedIn outreach is now active globally.'
          : 'LinkedIn outreach has been disabled globally.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to toggle LinkedIn',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ==================== SCRAPER SETTINGS ====================

export function useScraperSettings() {
  return useQuery({
    queryKey: ['settings', 'scrapers'],
    queryFn: () => api.settings.getScraperSettings(),
    staleTime: 60000, // 1 minute
  });
}

export function useShovelsSettings() {
  return useQuery({
    queryKey: queryKeys.shovels.settings,
    queryFn: () => api.settings.getShovelsSettings(),
    staleTime: 60000,
  });
}

export function useUpdateShovelsSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<ShovelsScraperSettings>) =>
      api.settings.updateShovelsSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shovels.settings });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      toast({ title: 'Shovels settings saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save Shovels settings', variant: 'destructive' });
    },
  });
}

// ==================== PERMIT ROUTING ====================

export function usePermitRoutingSettings() {
  return useQuery({
    queryKey: ['settings', 'permit-routing'],
    queryFn: () => api.settings.getPermitRoutingSettings(),
    staleTime: 60000,
  });
}

export function useUpdatePermitRoutingSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<PermitRoutingSettings>) =>
      api.settings.updatePermitRoutingSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'permit-routing'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      toast({ title: 'Permit routing settings saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save permit routing settings', variant: 'destructive' });
    },
  });
}

// ==================== PIPELINE CONTROL ====================

export function usePipelineControls() {
  return useQuery({
    queryKey: ['settings', 'pipeline'],
    queryFn: () => api.settings.getPipelineControls(),
    staleTime: 10000, // 10 seconds - refresh frequently for live status
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });
}

export function useUpdatePipelineControls() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: Partial<PipelineControlSettings>) => api.settings.updatePipelineControls(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: 'Pipeline controls updated',
        description: 'Pipeline settings have been saved.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to update pipeline controls',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useEmergencyStop() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (stoppedBy?: string) => api.settings.emergencyStop(stoppedBy),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: '⚠️ EMERGENCY STOP ACTIVATED',
        description: 'All outreach has been disabled immediately.',
        variant: 'destructive',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to activate emergency stop',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useResumePipeline() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => api.settings.resumePipeline(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast({
        title: '✅ Pipeline Resumed',
        description: 'All systems have been re-enabled.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to resume pipeline',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ==================== SCHEDULE CONFIGURATION ====================

export function useScheduleTemplates() {
  return useQuery({
    queryKey: ['settings', 'schedules', 'templates'],
    queryFn: () => api.settings.getScheduleTemplates(),
    staleTime: 300000, // 5 minutes - templates don't change often
  });
}

export function useScheduleSettings() {
  return useQuery({
    queryKey: ['settings', 'schedules'],
    queryFn: () => api.settings.getScheduleSettings(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refresh every minute
  });
}

export function useApplyScheduleTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (templateId: string) => api.settings.applyScheduleTemplate(templateId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'schedules'] });
      toast({
        title: 'Schedule template applied',
        description: `Now using "${response.data.templateName}" schedule.`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to apply template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateSchedules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: UpdateSchedulesInput) => api.settings.updateSchedules(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'schedules'] });
      toast({
        title: 'Schedules updated',
        description: 'Custom schedule has been saved.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to update schedules',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useSchedulerStatus() {
  return useQuery({
    queryKey: ['settings', 'schedules', 'status'],
    queryFn: () => api.settings.getSchedulerStatus(),
    staleTime: 10000, // 10 seconds
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useTriggerScheduledJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (jobName: 'shovels' | 'homeowner' | 'enrich' | 'merge' | 'validate' | 'enroll') =>
      api.settings.triggerJob(jobName),
    onSuccess: (_, jobName) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Job triggered',
        description: `${jobName} job has been started manually.`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to trigger job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useReloadScheduler() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => api.settings.reloadScheduler(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'schedules'] });
      toast({
        title: 'Scheduler reloaded',
        description: 'All schedules have been refreshed from settings.',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to reload scheduler',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ==================== ACTIVITY ====================

export function useActivity(params?: { page?: number; limit?: number; action?: string; contactId?: string; channel?: string; actorType?: string }) {
  return useQuery({
    queryKey: queryKeys.activity.list(params),
    queryFn: () => api.activity.list(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useRecentActivity(limit?: number) {
  return useQuery({
    queryKey: ['activity', 'recent', limit],
    queryFn: () => api.activity.recent(limit),
    staleTime: 15000, // 15 seconds for recent activity
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useActivityStats(days?: number) {
  return useQuery({
    queryKey: ['activity', 'stats', days],
    queryFn: () => api.activity.stats(days),
    staleTime: 60000, // 1 minute
  });
}

// ==================== WEBHOOKS ====================

export function useWebhookLogs(params?: { page?: number; limit?: number; source?: string; eventType?: string; processed?: boolean }) {
  return useQuery({
    queryKey: queryKeys.webhooks.logs(params),
    queryFn: () => api.webhooks.logs(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useRecentWebhookLogs(limit?: number) {
  return useQuery({
    queryKey: ['webhooks', 'logs', 'recent', limit],
    queryFn: () => api.webhooks.recentLogs(limit),
    staleTime: 15000, // 15 seconds
  });
}

export function useWebhookStats(days?: number) {
  return useQuery({
    queryKey: ['webhooks', 'stats', days],
    queryFn: () => api.webhooks.stats(days),
    staleTime: 60000, // 1 minute
  });
}

// ==================== JOBS ====================

export function useJobStatus() {
  return useQuery({
    queryKey: ['jobs', 'status'],
    queryFn: () => api.jobs.status(),
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Refresh every 15 seconds
  });
}

export function useJobHistory(params?: { type?: string; limit?: number }) {
  return useQuery({
    queryKey: ['jobs', 'history', params],
    queryFn: () => api.jobs.history(params),
    staleTime: 30000, // 30 seconds
  });
}

export function useJobStats(params?: { type?: string; days?: number }) {
  return useQuery({
    queryKey: ['jobs', 'stats', params],
    queryFn: () => api.jobs.stats(params),
    staleTime: 60000, // 1 minute
  });
}

export function useTriggerScrape() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data?: { query?: string; maxResults?: number; location?: string }) =>
      api.jobs.triggerScrape(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Scrape job started',
        description: `Job ID: ${response.data.jobId}`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to start scrape job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useTriggerEnrich() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data?: { batchSize?: number; onlyNew?: boolean }) =>
      api.jobs.triggerEnrich(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Enrich job started',
        description: `Job ID: ${response.data.jobId}`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to start enrich job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useTriggerMerge() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: () => api.jobs.triggerMerge(),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Merge job started',
        description: `Job ID: ${response.data.jobId}`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to start merge job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useTriggerValidate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data?: { batchSize?: number }) =>
      api.jobs.triggerValidate(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      toast({
        title: 'Validate job started',
        description: `Job ID: ${response.data.jobId}`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to start validate job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useTriggerEnroll() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data?: { batchSize?: number }) =>
      api.jobs.triggerEnroll(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      toast({
        title: 'Auto-enroll job started',
        description: `Job ID: ${response.data.jobId}`,
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to start auto-enroll job',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ==================== TEMPLATES ====================

export function useTemplates(params?: { channel?: TemplateChannel; isActive?: boolean }) {
  return useQuery({
    queryKey: queryKeys.templates.list(params),
    queryFn: () => api.templates.list(params),
    staleTime: 60000, // 1 minute
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: queryKeys.templates.detail(id),
    queryFn: () => api.templates.get(id),
    enabled: !!id,
  });
}

export function useDefaultTemplate(channel: TemplateChannel) {
  return useQuery({
    queryKey: queryKeys.templates.default(channel),
    queryFn: () => api.templates.getDefault(channel),
    staleTime: 60000,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: { name: string; channel: TemplateChannel; body: string; subject?: string; description?: string; variables?: string[]; tags?: string[] }) =>
      api.templates.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: 'Template created',
        description: 'Your SMS template has been saved',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to create template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<{ name: string; body: string; subject?: string; description?: string; isActive?: boolean; variables?: string[]; tags?: string[] }> }) =>
      api.templates.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: 'Template updated',
        description: 'Your changes have been saved',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to update template',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.templates.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.templates.all });

      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.templates.all });

      queryClient.setQueriesData<{ data: MessageTemplate[] }>(
        { queryKey: queryKeys.templates.all },
        (old) => {
          if (!old) return old;
          return { ...old, data: old.data.filter((t) => t.id !== id) };
        },
      );

      return { previousQueries };
    },
    onSuccess: () => {
      toast({
        title: 'Template deleted',
        description: 'The template has been removed',
      });
    },
    onError: (error: ApiError, _id, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast({
        title: 'Failed to delete template',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
    },
  });
}

export function useSetDefaultTemplate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: string) => api.templates.setDefault(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.templates.all });
      toast({
        title: 'Default template set',
        description: 'This template will be used by default',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to set default',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ==================== CAMPAIGN ROUTING RULES ====================

export function useRoutingRules(params?: { isActive?: boolean; campaignId?: string }) {
  return useQuery({
    queryKey: queryKeys.campaigns.routingRules,
    queryFn: () => api.campaigns.routingRules.list(params),
    staleTime: 60000, // 1 minute
  });
}

export function useRoutingFilterOptions() {
  return useQuery({
    queryKey: queryKeys.routingFilterOptions,
    queryFn: () => api.campaigns.routingRules.filterOptions(),
    staleTime: 0, // Force fresh fetch every time to ensure predefined values are loaded
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
  });
}

export function useExampleContacts(limit?: number) {
  return useQuery({
    queryKey: ['campaigns', 'routing-rules', 'example-contacts', limit],
    queryFn: () => api.campaigns.routingRules.getExampleContacts(limit),
    staleTime: 60000, // 1 minute
  });
}

export function useCreateRoutingRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: CreateRoutingRuleInput) =>
      api.campaigns.routingRules.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.routingRules });
      toast({
        title: 'Routing rule created',
        description: response.message || 'Your routing rule has been saved',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to create routing rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateRoutingRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRoutingRuleInput }) =>
      api.campaigns.routingRules.update(id, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.routingRules });
      toast({
        title: 'Routing rule updated',
        description: response.message || 'Your changes have been saved',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to update routing rule',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteRoutingRule() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.campaigns.routingRules.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.campaigns.routingRules });

      const previousData = queryClient.getQueryData(queryKeys.campaigns.routingRules);

      queryClient.setQueryData<{ data: CampaignRoutingRule[] }>(
        queryKeys.campaigns.routingRules,
        (old) => {
          if (!old) return old;
          return { ...old, data: old.data.filter((r) => r.id !== id) };
        },
      );

      return { previousData };
    },
    onSuccess: (response) => {
      toast({
        title: 'Routing rule deleted',
        description: response.message || 'The routing rule has been removed',
      });
    },
    onError: (error: ApiError, _id, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.campaigns.routingRules, context.previousData);
      }
      toast({
        title: 'Failed to delete routing rule',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.routingRules });
    },
  });
}

export function useReorderRoutingRules() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (ruleIds: string[]) =>
      api.campaigns.routingRules.reorder(ruleIds),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.routingRules });
      toast({
        title: 'Rules reordered',
        description: response.message || 'Routing rule priorities updated',
      });
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Failed to reorder rules',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useTestRouting() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (contactId: string) =>
      api.campaigns.routingRules.test(contactId),
    onSuccess: (response) => {
      const { campaign, matchedRule, fallbackUsed } = response.data;
      if (campaign) {
        toast({
          title: 'Routing test complete',
          description: matchedRule 
            ? `Would route to "${campaign.name}" via rule "${matchedRule.name}"`
            : `Would route to "${campaign.name}" (fallback)`,
        });
      } else {
        toast({
          title: 'No route found',
          description: 'Contact would not be enrolled (no matching rule)',
          variant: 'destructive',
        });
      }
    },
    onError: (error: ApiError) => {
      toast({
        title: 'Routing test failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// ==================== HOMEOWNERS ====================

export function useHomeowners(filters?: { search?: string; status?: string; city?: string; state?: string; page?: number; limit?: number; sort?: string; order?: string }) {
  return useQuery({
    queryKey: queryKeys.homeowners.list(filters),
    queryFn: () => api.homeowners.list(filters),
    staleTime: 30000,
  });
}

export function useHomeowner(id: string) {
  return useQuery({
    queryKey: queryKeys.homeowners.detail(id),
    queryFn: () => api.homeowners.get(id),
    enabled: !!id,
  });
}

export function useHomeownerStats() {
  return useQuery({
    queryKey: queryKeys.homeowners.stats,
    queryFn: () => api.homeowners.stats(),
    staleTime: 60000,
  });
}

export function useDeleteHomeowner() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => api.homeowners.delete(id),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.homeowners.all });

      const previousQueries = queryClient.getQueriesData({ queryKey: queryKeys.homeowners.all });

      queryClient.setQueriesData<PaginatedResponse<Homeowner>>(
        { queryKey: queryKeys.homeowners.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            data: old.data.filter((h) => h.id !== id),
            pagination: old.pagination
              ? { ...old.pagination, total: Math.max(0, old.pagination.total - 1) }
              : old.pagination,
          };
        },
      );

      return { previousQueries };
    },
    onSuccess: () => {
      toast({ title: 'Homeowner deleted' });
    },
    onError: (error: ApiError, _id, context) => {
      if (context?.previousQueries) {
        for (const [key, data] of context.previousQueries) {
          queryClient.setQueryData(key, data);
        }
      }
      toast({ title: 'Failed to delete homeowner', description: error.message, variant: 'destructive' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homeowners.all });
    },
  });
}

export function useTriggerRealieEnrich() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (batchSize?: number) => api.homeowners.triggerEnrich(batchSize),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homeowners.all });
      toast({ title: 'Property enrichment complete', description: `Enriched: ${response.data.enriched}, Not found: ${response.data.notFound}` });
    },
    onError: (error: ApiError) => {
      toast({ title: 'Property enrichment failed', description: error.message, variant: 'destructive' });
    },
  });
}

export function useHomeownerSettings() {
  return useQuery({
    queryKey: queryKeys.homeowners.settings,
    queryFn: () => api.settings.getHomeownerSettings(),
    staleTime: 60000,
  });
}

export function useUpdateHomeownerSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: Partial<HomeownerScraperSettings>) =>
      api.settings.updateHomeownerSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.homeowners.settings });
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
      toast({ title: 'Homeowner settings saved' });
    },
    onError: () => {
      toast({ title: 'Failed to save homeowner settings', variant: 'destructive' });
    },
  });
}

// ==================== CONNECTIONS ====================

export function useConnections(filters?: { search?: string; permitType?: string; city?: string; state?: string; page?: number; limit?: number; sort?: string; order?: string }) {
  return useQuery({
    queryKey: queryKeys.connections.list(filters),
    queryFn: () => api.connections.list(filters),
    staleTime: 30000,
  });
}

export function useConnectionStats() {
  return useQuery({
    queryKey: queryKeys.connections.stats,
    queryFn: () => api.connections.stats(),
    staleTime: 60000,
  });
}

export function useResolveConnections() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (batchSize?: number) => api.connections.resolve(batchSize),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connections.all });
      toast({ title: 'Connection resolution complete', description: `Connected: ${response.data.connected}, No contractor: ${response.data.noContractor}` });
    },
    onError: (error: ApiError) => {
      toast({ title: 'Connection resolution failed', description: error.message, variant: 'destructive' });
    },
  });
}

