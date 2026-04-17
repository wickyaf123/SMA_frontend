import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, CheckCircle2, XCircle, Clock,
  Zap, Database, UserCheck, Mail, GitMerge, ShieldCheck,
  Search as SearchIcon, ExternalLink,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ActiveWorkflow, ActiveJob } from '@/hooks/useChat';

interface JobsPanelProps {
  activeWorkflows: ActiveWorkflow[];
  activeJobs: ActiveJob[];
  sidebarOpen?: boolean;
}

const jobTypeIcons: Record<string, React.ReactNode> = {
  SHOVELS_SCRAPE: <SearchIcon className="w-3.5 h-3.5" />,
  HOMEOWNER_SCRAPE: <SearchIcon className="w-3.5 h-3.5" />,
  ENRICH: <Database className="w-3.5 h-3.5" />,
  MERGE: <GitMerge className="w-3.5 h-3.5" />,
  VALIDATE: <ShieldCheck className="w-3.5 h-3.5" />,
  AUTO_ENROLL: <Mail className="w-3.5 h-3.5" />,
  CONNECTION_RESOLVE: <UserCheck className="w-3.5 h-3.5" />,
};

const jobTypeLabels: Record<string, string> = {
  SHOVELS_SCRAPE: 'Permit Scrape',
  HOMEOWNER_SCRAPE: 'Homeowner Scrape',
  ENRICH: 'Enrich Contacts',
  MERGE: 'Merge Duplicates',
  VALIDATE: 'Validate Emails',
  AUTO_ENROLL: 'Auto Enroll',
  CONNECTION_RESOLVE: 'Resolve Connections',
};

function getJobLabel(type: string, metadata?: Record<string, unknown> | null): string {
  const metaType = metadata?.jobType as string | undefined;
  return jobTypeLabels[metaType || ''] || jobTypeLabels[type] || type;
}

function getJobIcon(type: string, metadata?: Record<string, unknown> | null): React.ReactNode {
  const metaType = metadata?.jobType as string | undefined;
  return jobTypeIcons[metaType || ''] || jobTypeIcons[type] || <Zap className="w-3.5 h-3.5" />;
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'PROCESSING':
    case 'running':
    case 'started':
      return <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    case 'COMPLETED':
    case 'completed':
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    case 'FAILED':
    case 'failed':
      return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    default:
      return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
  }
};

const statusColors: Record<string, string> = {
  PROCESSING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  started: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export const JobsPanel = ({ activeWorkflows, activeJobs, sidebarOpen = true }: JobsPanelProps) => {
  const navigate = useNavigate();

  const runningWorkflows = activeWorkflows.filter(w => w.status === 'running' || w.status === 'pending');
  const completedWorkflows = activeWorkflows.filter(w => w.status === 'completed' || w.status === 'failed' || w.status === 'cancelled');
  const runningJobs = activeJobs.filter(j => j.status === 'started' || j.status === 'progress' || j.status === 'paused');
  const completedJobs = activeJobs.filter(j => j.status === 'completed' || j.status === 'failed' || j.status === 'cancelled');
  const runningCount = runningWorkflows.length + runningJobs.length;

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 gap-3">
        {runningCount > 0 && (
          <div className="relative" title={`${runningCount} running`}>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-sidebar text-foreground">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jobs & Workflows</span>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-3 space-y-1">
          {runningCount > 0 && (
            <div className="flex items-center gap-2 px-2.5 py-2 mt-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
              <span className="text-[11px] text-muted-foreground">
                {runningCount} {runningCount === 1 ? 'task' : 'tasks'} running in chat
              </span>
            </div>
          )}

          {completedJobs.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                Recent Jobs
              </div>
              {completedJobs.map(job => (
                <div
                  key={job.jobId}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/jobs/${job.jobId}`)}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.jobId}`)}
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-md bg-card flex items-center justify-center shrink-0 text-muted-foreground">
                    <SearchIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{job.jobType || 'Job'}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusIcon status={job.status} />
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {completedWorkflows.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                Completed Workflows
              </div>
              {completedWorkflows.map(wf => (
                <div
                  key={wf.workflowId}
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <StatusIcon status={wf.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">{wf.name}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-[9px] h-4 px-1.5 mt-0.5", statusColors[wf.status] || '')}
                    >
                      {wf.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </>
          )}

          {runningCount === 0 && completedJobs.length === 0 && completedWorkflows.length === 0 && (
            <div className="text-center py-8">
              <Zap className="w-5 h-5 text-border mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No recent jobs</p>
              <p className="text-[10px] text-muted-foreground/50 mt-0.5">Jobs and workflows will appear here</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* View all jobs link */}
      <div className="px-3 py-2 border-t border-border">
        <button
          onClick={() => navigate('/classic/history')}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
        >
          <ExternalLink className="w-3 h-3" />
          View all jobs
        </button>
      </div>
    </div>
  );
};
