import { cn } from '@/lib/utils';
import {
  Search, Database, BarChart3, Users, Mail,
  Settings, Activity, Home, GitBranch, CheckCircle2, Loader2,
  ChevronDown, ChevronRight,
  UserPlus, UserCog, UserMinus, Download, MessageSquare, MessageCircle,
  StopCircle, RefreshCw, FileText, FilePlus, FileEdit, FileX,
  Play, AlertOctagon, PlayCircle, Clock, Sparkles, Link, HeartPulse,
  Linkedin, Workflow, XCircle,
} from 'lucide-react';
import { useState } from 'react';

export interface ToolStep {
  id: string;
  tool: string;
  input: any;
  result?: any;
  status: 'running' | 'done' | 'error';
  startedAt: number;
  completedAt?: number;
}

interface AgentStepsProps {
  steps: ToolStep[];
  isThinking?: boolean;
}

const toolMeta: Record<string, { label: string; icon: typeof Search; color: string }> = {
  search_permits:       { label: 'Searching permits',       icon: Search,     color: 'text-blue-400' },
  get_permit_searches:  { label: 'Fetching permit searches', icon: Database,   color: 'text-blue-400' },
  list_contacts:        { label: 'Looking up contacts',     icon: Users,      color: 'text-emerald-400' },
  get_contact:          { label: 'Getting contact details', icon: Users,      color: 'text-emerald-400' },
  list_campaigns:       { label: 'Listing campaigns',       icon: Mail,       color: 'text-orange-400' },
  get_campaign_analytics: { label: 'Fetching analytics',    icon: BarChart3,  color: 'text-purple-400' },
  list_homeowners:      { label: 'Looking up homeowners',   icon: Home,       color: 'text-cyan-400' },
  get_metrics:          { label: 'Fetching metrics',        icon: BarChart3,  color: 'text-purple-400' },
  get_activity_log:     { label: 'Checking activity log',   icon: Activity,   color: 'text-amber-400' },
  get_settings:         { label: 'Reading settings',        icon: Settings,   color: 'text-gray-400' },
  update_settings:      { label: 'Updating settings',       icon: Settings,   color: 'text-gray-400' },
  get_pipeline_status:  { label: 'Checking pipeline',       icon: GitBranch,  color: 'text-indigo-400' },
  get_contact_stats:    { label: 'Getting contact stats',   icon: BarChart3,  color: 'text-purple-400' },

  // Contact tools
  create_contact:        { label: 'Creating contact',        icon: UserPlus,      color: 'text-green-500' },
  update_contact:        { label: 'Updating contact',        icon: UserCog,       color: 'text-blue-500' },
  delete_contact:        { label: 'Deleting contact',        icon: UserMinus,     color: 'text-red-500' },
  export_contacts:       { label: 'Exporting contacts',      icon: Download,      color: 'text-purple-500' },
  get_contact_replies:   { label: 'Loading replies',         icon: MessageSquare, color: 'text-blue-500' },
  get_contact_activity:  { label: 'Loading activity',        icon: Activity,      color: 'text-blue-500' },
  send_sms:              { label: 'Sending SMS',             icon: MessageCircle, color: 'text-green-500' },

  // Campaign tools
  enroll_contacts:          { label: 'Enrolling contacts',      icon: UserPlus,    color: 'text-green-500' },
  stop_enrollment:          { label: 'Stopping enrollment',     icon: StopCircle,  color: 'text-red-500' },
  get_campaign_enrollments: { label: 'Loading enrollments',     icon: Users,       color: 'text-blue-500' },
  sync_campaigns:           { label: 'Syncing campaigns',       icon: RefreshCw,   color: 'text-blue-500' },

  // Template tools
  list_templates:    { label: 'Loading templates',     icon: FileText,  color: 'text-blue-500' },
  create_template:   { label: 'Creating template',     icon: FilePlus,  color: 'text-green-500' },
  update_template:   { label: 'Updating template',     icon: FileEdit,  color: 'text-blue-500' },
  delete_template:   { label: 'Deleting template',     icon: FileX,     color: 'text-red-500' },

  // Routing tools
  list_routing_rules:    { label: 'Loading routing rules',    icon: GitBranch, color: 'text-blue-500' },
  create_routing_rule:   { label: 'Creating routing rule',    icon: GitBranch, color: 'text-green-500' },
  update_routing_rule:   { label: 'Updating routing rule',    icon: GitBranch, color: 'text-blue-500' },
  delete_routing_rule:   { label: 'Deleting routing rule',    icon: GitBranch, color: 'text-red-500' },

  // Job/Pipeline tools
  trigger_job:       { label: 'Triggering job',        icon: Play,          color: 'text-green-500' },
  emergency_stop:    { label: 'Emergency stop',        icon: AlertOctagon,  color: 'text-red-500' },
  resume_pipeline:   { label: 'Resuming pipeline',     icon: PlayCircle,    color: 'text-green-500' },
  get_job_history:   { label: 'Loading job history',   icon: Clock,         color: 'text-blue-500' },

  // Homeowner/Connection tools
  delete_homeowner:    { label: 'Deleting homeowner',     icon: UserMinus, color: 'text-red-500' },
  enrich_homeowners:   { label: 'Enriching homeowners',   icon: Sparkles,  color: 'text-purple-500' },
  list_connections:    { label: 'Loading connections',    icon: Link,      color: 'text-blue-500' },
  resolve_connections: { label: 'Resolving connections',  icon: Link,      color: 'text-green-500' },

  // System tools
  check_system_health: { label: 'Checking system health', icon: HeartPulse, color: 'text-green-500' },
  toggle_linkedin:     { label: 'Toggling LinkedIn',      icon: Linkedin,   color: 'text-blue-500' },

  // Workflow tools
  create_workflow:     { label: 'Creating workflow',    icon: Workflow, color: 'text-purple-500' },
  get_workflow_status: { label: 'Checking workflow',    icon: Workflow, color: 'text-blue-500' },
  cancel_workflow:     { label: 'Cancelling workflow',  icon: XCircle,  color: 'text-red-500' },
};

function getToolMeta(toolName: string) {
  return toolMeta[toolName] || { label: toolName.replace(/_/g, ' '), icon: Database, color: 'text-muted-foreground' };
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatInput(input: any): string {
  if (!input || typeof input !== 'object') return '';
  const parts: string[] = [];
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null && value !== '') {
      parts.push(`${key}: ${value}`);
    }
  }
  return parts.join(' · ');
}

const StepItem = ({ step }: { step: ToolStep }) => {
  const [expanded, setExpanded] = useState(false);
  const meta = getToolMeta(step.tool);
  const Icon = meta.icon;
  const duration = step.completedAt ? step.completedAt - step.startedAt : null;
  const inputSummary = formatInput(step.input);

  return (
    <div className="group">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full text-left py-1.5 px-2 rounded-md hover:bg-muted transition-colors"
      >
        {step.status === 'running' ? (
          <Loader2 className={cn('w-4 h-4 animate-spin shrink-0', meta.color)} />
        ) : step.status === 'error' ? (
          <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
            <span className="text-red-500 text-[10px] font-bold">!</span>
          </div>
        ) : (
          <CheckCircle2 className="w-4 h-4 text-foreground/40 shrink-0" />
        )}

        <Icon className={cn('w-3.5 h-3.5 shrink-0', step.status === 'done' ? 'text-foreground/40' : meta.color)} />

        <span className={cn(
          'text-[13px] font-medium flex-1 truncate',
          step.status === 'running' ? 'text-foreground' : 'text-foreground/60'
        )}>
          {meta.label}
        </span>

        {duration !== null && (
          <span className="text-[11px] text-foreground/40 tabular-nums shrink-0">
            {formatDuration(duration)}
          </span>
        )}

        {step.input && Object.keys(step.input).length > 0 && (
          expanded
            ? <ChevronDown className="w-3.5 h-3.5 text-foreground/40 shrink-0" />
            : <ChevronRight className="w-3.5 h-3.5 text-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </button>

      {expanded && inputSummary && (
        <div className="ml-9 mt-0.5 mb-1 px-3 py-2 bg-muted rounded-md border border-border">
          <p className="text-[12px] text-foreground/70 font-mono leading-relaxed break-all">
            {inputSummary}
          </p>
        </div>
      )}
    </div>
  );
};

export const AgentSteps = ({ steps, isThinking }: AgentStepsProps) => {
  if (steps.length === 0 && !isThinking) return null;

  return (
    <div className="flex gap-4 max-w-[85%] mr-auto w-full">
      <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.1)] mt-0.5">
        <Loader2 className="w-4 h-4 text-black animate-spin" />
      </div>

      <div className="flex-1 min-w-0 bg-transparent py-1">
        {isThinking && steps.length === 0 && (
          <div className="flex items-center gap-2 py-0.5">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-sm text-foreground/60 ml-2">Jerry is thinking...</span>
          </div>
        )}

        {steps.length > 0 && (
          <div className="space-y-0.5">
            {steps.map((step) => (
              <StepItem key={step.id} step={step} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
