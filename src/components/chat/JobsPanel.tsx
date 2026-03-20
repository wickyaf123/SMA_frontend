import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, CheckCircle2, XCircle, Clock, RefreshCw,
  Zap, Database, UserCheck, Mail, GitMerge, ShieldCheck,
  Search as SearchIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import type { ActiveWorkflow, ActiveJob } from '@/hooks/useChat';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface BackendJob {
  id: string;
  type: string;
  status: string;
  totalRecords: number | null;
  processedRecords: number | null;
  successCount: number | null;
  errorCount: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  metadata: Record<string, unknown> | null;
}

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
  const [backendJobs, setBackendJobs] = useState<BackendJob[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobsError, setJobsError] = useState(false);
  const { toast } = useToast();

  const fetchJobs = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const [statusData, historyData] = await Promise.all([
        api.jobs.status(),
        api.jobs.history({ limit: 20 }),
      ]);

      const running: BackendJob[] = statusData.data?.runningJobs || [];
      const history: BackendJob[] = historyData.data?.history || [];

      // Merge: running first, then recent history (deduplicated)
      const runningIds = new Set(running.map(j => j.id));
      const merged = [...running, ...history.filter(j => !runningIds.has(j.id))];
      setBackendJobs(merged);
      setJobsError(false);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
      toast({ title: 'Failed to load jobs', variant: 'destructive' });
      setJobsError(true);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [fetchJobs]);

  if (!sidebarOpen) {
    return (
      <div className="flex flex-col items-center py-4 gap-3">
        {activeWorkflows.filter(w => w.status === 'running').map(wf => (
          <div key={wf.workflowId} className="relative" title={wf.name}>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
        ))}
        {backendJobs.filter(j => j.status === 'PROCESSING').map(j => (
          <div key={j.id} className="relative" title={getJobLabel(j.type, j.metadata)}>
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
        ))}
      </div>
    );
  }

  const runningWorkflows = activeWorkflows.filter(w => w.status === 'running' || w.status === 'pending');
  const completedWorkflows = activeWorkflows.filter(w => w.status === 'completed' || w.status === 'failed' || w.status === 'cancelled');

  return (
    <div className="flex flex-col h-full bg-black text-foreground">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jobs & Workflows</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground hover:bg-accent"
          onClick={fetchJobs}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-3 h-3", isRefreshing && "animate-spin")} />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-3 pb-3 space-y-1">
          {/* Active Workflows from chat */}
          {runningWorkflows.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-2 pb-1">
                Active Workflows
              </div>
              {runningWorkflows.map(wf => (
                <div
                  key={wf.workflowId}
                  className="p-2.5 rounded-lg bg-black/95 border border-border space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />
                    <span className="text-[12px] font-medium truncate flex-1">{wf.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-card rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${wf.totalSteps > 0 ? (wf.completedSteps / wf.totalSteps) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
                      {wf.completedSteps}/{wf.totalSteps}
                    </span>
                  </div>
                  {wf.steps.length > 0 && (
                    <div className="space-y-1 ml-0.5">
                      {wf.steps.map(step => (
                        <div key={step.order} className="flex items-center gap-1.5">
                          <StatusIcon status={step.status} />
                          <span className={cn(
                            "text-[11px] truncate",
                            step.status === 'running' ? 'text-foreground' : 'text-muted-foreground',
                            step.status === 'completed' && 'text-emerald-400/70',
                          )}>
                            {step.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}

          {/* Backend Jobs */}
          {backendJobs.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                Recent Jobs
              </div>
              {backendJobs.map(job => (
                <div
                  key={job.id}
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-black/95 transition-colors"
                >
                  <div className="w-6 h-6 rounded-md bg-card flex items-center justify-center shrink-0 text-muted-foreground">
                    {getJobIcon(job.type, job.metadata)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium truncate">
                      {getJobLabel(job.type, job.metadata)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <StatusIcon status={job.status} />
                      <span className="text-[10px] text-muted-foreground">
                        {job.startedAt
                          ? formatDistanceToNow(new Date(job.startedAt), { addSuffix: true })
                          : formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    {job.status === 'COMPLETED' && job.successCount !== null && (
                      <p className="text-[10px] text-emerald-400/60 mt-0.5">
                        {job.successCount} processed
                        {job.errorCount ? `, ${job.errorCount} errors` : ''}
                      </p>
                    )}
                    {job.status === 'PROCESSING' && job.processedRecords !== null && job.totalRecords !== null && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <div className="flex-1 h-1 bg-card rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all"
                            style={{ width: `${job.totalRecords > 0 ? (job.processedRecords / job.totalRecords) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {job.processedRecords}/{job.totalRecords}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Socket-tracked jobs (permit searches, etc.) */}
          {activeJobs.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                Chat Jobs
              </div>
              {activeJobs.map(job => (
                <div
                  key={job.jobId}
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-black/95 transition-colors"
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

          {/* Completed workflows */}
          {completedWorkflows.length > 0 && (
            <>
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider pt-3 pb-1">
                Completed Workflows
              </div>
              {completedWorkflows.map(wf => (
                <div
                  key={wf.workflowId}
                  className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg hover:bg-black/95 transition-colors"
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

          {/* Empty state */}
          {backendJobs.length === 0 && activeWorkflows.length === 0 && activeJobs.length === 0 && (
            <div className="text-center py-8">
              <Zap className="w-5 h-5 text-border mx-auto mb-2" />
              {jobsError ? (
                <>
                  <p className="text-xs text-red-400">Failed to load jobs</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">Check your connection and try again</p>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">No recent jobs</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-0.5">Jobs and workflows will appear here</p>
                </>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
