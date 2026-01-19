/**
 * TypeScript types matching the backend Prisma schema
 * Auto-generated from backend/prisma/schema.prisma
 */

// ==================== ENUMS ====================

export type ContactStatus =
  | 'NEW'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'INVALID'
  | 'IN_SEQUENCE'
  | 'REPLIED'
  | 'BOUNCED'
  | 'UNSUBSCRIBED'
  | 'COMPLETED'
  | 'PAUSED';

export type EmailValidationStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID'
  | 'CATCH_ALL'
  | 'UNKNOWN'
  | 'DISPOSABLE';

export type PhoneValidationStatus =
  | 'PENDING'
  | 'VALID_MOBILE'
  | 'VALID_LANDLINE'
  | 'INVALID'
  | 'UNKNOWN';

export type OutreachChannel = 'EMAIL' | 'SMS' | 'LINKEDIN';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export type EnrollmentStatus =
  | 'ENROLLED'
  | 'SENT'
  | 'OPENED'
  | 'CLICKED'
  | 'REPLIED'
  | 'BOUNCED'
  | 'STOPPED'
  | 'UNSUBSCRIBED';

export type ImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type ImportJobType = 'APOLLO' | 'CSV' | 'MANUAL';

// ==================== MODELS ====================

export interface Company {
  id: string;
  name: string;
  domain?: string | null;
  industry?: string | null;
  size?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  linkedinUrl?: string | null;
  website?: string | null;
  apolloId?: string | null;
  enrichmentData?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  phone?: string | null;
  phoneFormatted?: string | null;
  title?: string | null;
  linkedinUrl?: string | null;
  linkedinId?: string | null;
  timezone?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  
  companyId?: string | null;
  company?: Company | null;
  
  status: ContactStatus;
  emailValidationStatus: EmailValidationStatus;
  phoneValidationStatus: PhoneValidationStatus;
  emailValidatedAt?: string | null;
  phoneValidatedAt?: string | null;
  
  source?: string | null;
  sourceId?: string | null;
  apolloId?: string | null;
  
  dataSources: string[];
  dataQuality: number;
  hunterEnrichedAt?: string | null;
  hunterScore?: number | null;
  ghlContactId?: string | null;
  ghlConversationId?: string | null;
  
  hasReplied: boolean;
  repliedAt?: string | null;
  repliedChannel?: OutreachChannel | null;
  
  tags: string[];
  customFields?: Record<string, unknown> | null;
  enrichmentData?: Record<string, unknown> | null;
  
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string | null;
  
  // Included from expanded query
  campaignEnrollments?: CampaignEnrollment[];
  _count?: {
    replies: number;
  };
}

export interface Campaign {
  id: string;
  name: string;
  channel: OutreachChannel;
  
  instantlyCampaignId?: string | null;
  phantomBusterId?: string | null;
  googleSheetUrl?: string | null;
  
  status: CampaignStatus;
  description?: string | null;
  settings?: Record<string, unknown> | null;
  
  linkedinEnabled: boolean;
  
  createdAt: string;
  updatedAt: string;
  
  // Include counts when fetched with stats
  _count?: {
    enrollments: number;
  };
}

export interface CampaignEnrollment {
  id: string;
  campaignId: string;
  campaign?: Campaign;
  contactId: string;
  contact?: Contact;
  
  status: EnrollmentStatus;
  enrolledAt: string;
  stoppedAt?: string | null;
  stoppedReason?: string | null;
  
  externalId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export interface ImportJob {
  id: string;
  type: ImportJobType;
  status: ImportJobStatus;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  duplicateCount: number;
  invalidCount: number;
  errorCount: number;
  errors?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  contactId?: string | null;
  contact?: Contact | null;
  action: string;
  channel?: OutreachChannel | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  actorType: string;
  actorId?: string | null;
  createdAt: string;
}

export interface WebhookLog {
  id: string;
  source: string;
  eventType: string;
  payload: Record<string, unknown>;
  processed: boolean;
  processedAt?: string | null;
  errorMessage?: string | null;
  createdAt: string;
}

export interface Settings {
  id: string;
  linkedinGloballyEnabled: boolean;
  defaultEmailCampaignId?: string | null;
  defaultSmsCampaignId?: string | null;
  // Apify (Google Maps) Scraper Settings
  apifyQuery?: string | null;
  apifyLocation?: string | null;
  apifyMaxResults?: number;
  apifyMinRating?: number | null;
  apifyRequirePhone?: boolean;
  apifyRequireWebsite?: boolean;
  apifySkipClosed?: boolean;
  // Apollo Scraper Settings
  apolloIndustry?: string | null;
  apolloPersonTitles?: string[];
  apolloLocations?: string[];
  apolloExcludeLocations?: string[];
  apolloEmployeesMin?: number | null;
  apolloEmployeesMax?: number | null;
  apolloRevenueMin?: number | null;
  apolloRevenueMax?: number | null;
  apolloEnrichLimit?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApifyScraperSettings {
  query: string;
  location: string;
  maxResults: number;
  minRating: number;
  requirePhone: boolean;
  requireWebsite: boolean;
  skipClosed: boolean;
}

export interface ApolloScraperSettings {
  industry: string;
  personTitles: string[];
  locations: string[];
  excludeLocations: string[];
  employeesMin: number | null;
  employeesMax: number | null;
  revenueMin: number | null;
  revenueMax: number | null;
  enrichLimit: number;
}

export interface PipelineControlSettings {
  pipelineEnabled: boolean;
  emailOutreachEnabled: boolean;
  smsOutreachEnabled: boolean;
  linkedinGloballyEnabled: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  schedulerEnabled: boolean;
  scrapeJobEnabled: boolean;
  apolloJobEnabled: boolean;
  enrichJobEnabled: boolean;
  mergeJobEnabled: boolean;
  validateJobEnabled: boolean;
  enrollJobEnabled: boolean;
  lastEmergencyStopAt: string | null;
  lastEmergencyStopBy: string | null;
}

export interface ScheduleTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  targetLeads: number;
  schedules: {
    scrapeJobCron: string;
    apolloJobCron: string;
    enrichJobCron: string;
    mergeJobCron: string;
    validateJobCron: string;
    enrollJobCron: string;
  };
  estimatedCosts: {
    apollo: string;
    apify: string;
  };
}

export interface ScheduleSettings {
  scheduleTemplate: string;
  scrapeJobCron: string;
  apolloJobCron: string;
  enrichJobCron: string;
  mergeJobCron: string;
  validateJobCron: string;
  enrollJobCron: string;
  templateName: string | null;
  templateDescription: string | null;
  templateIcon: string | null;
  targetLeads: number | null;
  estimatedCosts: { apollo: string; apify: string } | null;
  scheduleDescriptions: {
    scrape: string;
    apollo: string;
    enrich: string;
    merge: string;
    validate: string;
    enroll: string;
  };
  schedulerStatus?: {
    isRunning: boolean;
    jobs: Array<{ name: string; schedule: string; humanReadable: string }>;
  };
}

export interface UpdateSchedulesInput {
  scrapeJobCron?: string;
  apolloJobCron?: string;
  enrichJobCron?: string;
  mergeJobCron?: string;
  validateJobCron?: string;
  enrollJobCron?: string;
}

export interface ContactReply {
  id: string;
  channel: OutreachChannel;
  content: string | null;
  subject: string | null;
  fromAddress: string | null;
  receivedAt: string;
  messageId: string | null;
  threadId: string | null;
}

export interface ContactActivity {
  id: string;
  action: string;
  channel: OutreachChannel | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  actorType: string;
  createdAt: string;
}

export interface GHLMessage {
  id: string;
  type: string;
  direction: 'inbound' | 'outbound';
  body: string | null;
  subject: string | null;
  status: string;
  dateAdded: string;
  from: string | null;
  to: string | null;
  attachments: string[];
}

export interface ContactMessages {
  synced: boolean;
  ghlContactId: string | null;
  ghlConversationId?: string | null;
  messages: GHLMessage[];
  note?: string;
  error?: string;
}

export interface ChannelStats {
  enrolled: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  delivered: number;
  failed: number;
  pending: number;
  accepted: number;
  openRate?: number;
  replyRate?: number;
  deliveryRate?: number;
  acceptRate?: number;
}

export interface OutreachStats {
  email: ChannelStats;
  sms: ChannelStats;
  linkedin: ChannelStats;
  totals: {
    inSequence: number;
    messagesSent: number;
    totalReplies: number;
    overallReplyRate: number;
  };
}

export type TemplateChannel = 'SMS' | 'EMAIL';

export interface MessageTemplate {
  id: string;
  name: string;
  channel: TemplateChannel;
  subject?: string | null;
  body: string;
  description?: string | null;
  isDefault: boolean;
  isActive: boolean;
  usageCount: number;
  lastUsedAt?: string | null;
  variables: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JobStatus {
  id: string;
  type: ImportJobType;
  status: ImportJobStatus;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  duplicateCount?: number;
  invalidCount?: number;
  errors?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface JobStats {
  total: number;
  completed: number;
  failed: number;
  pending: number;
  totalRecords: number;
  avgDurationMs: number;
}

// ==================== API RESPONSES ====================

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ContactStats {
  total: number;
  byStatus: Record<ContactStatus, number>;
  byEmailValidation: Record<EmailValidationStatus, number>;
  byPhoneValidation: Record<PhoneValidationStatus, number>;
  bySource: Record<string, number>;
  withPhone: number;
  withLinkedIn: number;
  replied: number;
  validatedToday: number;
  importedToday: number;
}

export interface CampaignStats {
  total: number;
  enrolled: number;
  sent: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  stopped: number;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  services: {
    database: { status: 'healthy' | 'unhealthy' };
    redis: { status: 'healthy' | 'unhealthy' };
  };
  version?: string;
  uptime?: number;
  environment?: string;
}

// ==================== API INPUTS ====================

export interface ContactFilters {
  search?: string;
  status?: ContactStatus[];
  emailValidationStatus?: EmailValidationStatus[];
  phoneValidationStatus?: PhoneValidationStatus[];
  tags?: string[];
  companyId?: string;
  hasReplied?: boolean;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CreateContactInput {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  title?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  companyId?: string | null;
  tags?: string[];
  customFields?: Record<string, unknown>;
}

export interface UpdateContactInput extends Partial<CreateContactInput> {
  status?: ContactStatus;
}

export interface CampaignFilters {
  status?: CampaignStatus;
  channel?: OutreachChannel;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface CreateCampaignInput {
  name: string;
  channel: OutreachChannel;
  description?: string;
  instantlyCampaignId?: string;
  googleSheetUrl?: string;
  linkedinEnabled?: boolean;
}

export interface UpdateCampaignInput extends Partial<CreateCampaignInput> {
  status?: CampaignStatus;
}

export interface EnrollContactsInput {
  contactIds: string[];
  options?: {
    skipIfInWorkspace?: boolean;
    skipIfInCampaign?: boolean;
    customVariables?: Record<string, string>;
  };
}

export interface ApolloImportInput {
  personTitles?: string[];
  personLocations?: string[];
  organizationLocations?: string[];
  excludeLocations?: string[];
  industry?: 'HVAC' | 'SOLAR' | 'ROOFING';
  organizationKeywords?: string;
  employeesMin?: number;
  employeesMax?: number;
  revenueMin?: number;
  revenueMax?: number;
  technologies?: string[];
  employeeGrowth?: number;
  page?: number;
  perPage?: number;
  enrichLimit?: number;
}

export interface SendSMSInput {
  message: string;
  scheduleAt?: string;
}

// ==================== UI HELPERS ====================

export const contactStatusLabels: Record<ContactStatus, string> = {
  NEW: 'New',
  VALIDATING: 'Validating',
  VALIDATED: 'Validated',
  INVALID: 'Invalid',
  IN_SEQUENCE: 'In Sequence',
  REPLIED: 'Replied',
  BOUNCED: 'Bounced',
  UNSUBSCRIBED: 'Unsubscribed',
  COMPLETED: 'Completed',
  PAUSED: 'Paused',
};

export const contactStatusColors: Record<ContactStatus, string> = {
  NEW: 'bg-info/15 text-info',
  VALIDATING: 'bg-warning/15 text-warning',
  VALIDATED: 'bg-success/15 text-success',
  INVALID: 'bg-destructive/15 text-destructive',
  IN_SEQUENCE: 'bg-primary/15 text-primary',
  REPLIED: 'bg-node-reply/15 text-node-reply',
  BOUNCED: 'bg-destructive/15 text-destructive',
  UNSUBSCRIBED: 'bg-muted text-muted-foreground',
  COMPLETED: 'bg-success/15 text-success',
  PAUSED: 'bg-muted text-muted-foreground',
};

export const campaignStatusLabels: Record<CampaignStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

export const campaignStatusColors: Record<CampaignStatus, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  ACTIVE: 'bg-success/15 text-success',
  PAUSED: 'bg-warning/15 text-warning',
  COMPLETED: 'bg-info/15 text-info',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

export const channelLabels: Record<OutreachChannel, string> = {
  EMAIL: 'Email',
  SMS: 'SMS',
  LINKEDIN: 'LinkedIn',
};

export const channelColors: Record<OutreachChannel, string> = {
  EMAIL: 'bg-node-outreach',
  SMS: 'bg-node-validation',
  LINKEDIN: 'bg-node-ingestion',
};

export const sourceLabels: Record<string, string> = {
  apollo: 'Apollo',
  import: 'Import',
  manual: 'Manual',
  google_maps: 'Google Maps',
  hunter: 'Hunter.io',
  csv: 'CSV Import',
  scraper: 'Scraper',
};

// ==================== CAMPAIGN ROUTING ====================

export type RoutingMatchMode = 'ALL' | 'ANY';

export type RoutingFallbackBehavior = 'default_campaign' | 'skip';

export interface CampaignRoutingRule {
  id: string;
  name: string;
  description?: string | null;
  priority: number;
  isActive: boolean;
  matchMode: RoutingMatchMode;
  sourceFilter: string[];
  industryFilter: string[];
  stateFilter: string[];
  countryFilter: string[];
  tagsFilter: string[];
  employeesMinFilter?: number | null;
  employeesMaxFilter?: number | null;
  campaignId: string;
  campaign?: Campaign;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoutingRuleInput {
  name: string;
  description?: string;
  priority?: number;
  isActive?: boolean;
  matchMode?: RoutingMatchMode;
  sourceFilter?: string[];
  industryFilter?: string[];
  stateFilter?: string[];
  countryFilter?: string[];
  tagsFilter?: string[];
  employeesMinFilter?: number | null;
  employeesMaxFilter?: number | null;
  campaignId: string;
}

export interface UpdateRoutingRuleInput {
  name?: string;
  description?: string | null;
  priority?: number;
  isActive?: boolean;
  matchMode?: RoutingMatchMode;
  sourceFilter?: string[];
  industryFilter?: string[];
  stateFilter?: string[];
  countryFilter?: string[];
  tagsFilter?: string[];
  employeesMinFilter?: number | null;
  employeesMaxFilter?: number | null;
  campaignId?: string;
}

export interface RoutingFilterOptions {
  sources: string[];
  industries: string[];
  states: string[];
  countries: string[];
  tags: string[];
}

export interface RoutingTestResult {
  campaign: Campaign | null;
  matchedRule: CampaignRoutingRule | null;
  fallbackUsed: boolean;
}

