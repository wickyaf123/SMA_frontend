import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2, Loader2, XCircle, Minus, Circle,
  X, Clock,
} from 'lucide-react';

export interface WorkflowStep {
  order: number;
  name: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  progressTotal?: number;
  error?: string;
}

export interface WorkflowStepSummary {
  order: number;
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  error?: string | null;
  reason?: string | null;
}

export interface WorkflowProgressProps {
  workflowId: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  steps: WorkflowStep[];
  totalSteps: number;
  completedSteps: number;
  startedAt?: string;
  onCancel: (workflowId: string) => void;
  /** Terminal per-step summary — present once workflow is done. */
  stepSummary?: WorkflowStepSummary[];
  /** Top-level error message when status === 'failed'. */
  error?: string | null;
}

const statusBadgeConfig: Record<
  WorkflowProgressProps['status'],
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }
> = {
  pending:   { label: 'Pending',   variant: 'secondary' },
  running:   { label: 'Running',   variant: 'default', className: 'bg-blue-500 hover:bg-blue-500/80' },
  paused:    { label: 'Paused',    variant: 'outline', className: 'text-amber-500 border-amber-500/50' },
  completed: { label: 'Completed', variant: 'default', className: 'bg-emerald-500 hover:bg-emerald-500/80' },
  failed:    { label: 'Failed',    variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary', className: 'text-muted-foreground' },
};

function formatElapsed(startedAt: string): string {
  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const seconds = Math.floor((now - start) / 1000);

  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hrs}h ${remainMins}m`;
}

const StepIcon = ({ status }: { status: WorkflowStep['status'] }) => {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-400 shrink-0 animate-spin" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
    case 'skipped':
      return <Minus className="w-4 h-4 text-muted-foreground/50 shrink-0" />;
    case 'pending':
    default:
      return <Circle className="w-4 h-4 text-muted-foreground/30 shrink-0" />;
  }
};

const StepRow = ({ step }: { step: WorkflowStep }) => {
  const progressPercent =
    step.progressTotal && step.progress !== undefined
      ? Math.round((step.progress / step.progressTotal) * 100)
      : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2.5">
        <StepIcon status={step.status} />
        <span className={cn(
          'text-xs font-medium flex-1 truncate',
          step.status === 'running' ? 'text-foreground' : 'text-muted-foreground',
          step.status === 'skipped' && 'line-through opacity-60',
        )}>
          {step.name}
        </span>
        <span className="text-[10px] text-muted-foreground/60 shrink-0">
          {step.action}
        </span>
      </div>

      {step.status === 'running' && progressPercent !== null && (
        <div className="ml-[26px] flex items-center gap-2">
          <Progress value={progressPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {step.progress}/{step.progressTotal}
          </span>
        </div>
      )}

      {step.status === 'failed' && step.error && (
        <div className="ml-[26px] px-2 py-1 bg-destructive/10 rounded text-[11px] text-destructive leading-relaxed">
          {step.error}
        </div>
      )}
    </div>
  );
};

export const WorkflowProgress = ({
  workflowId,
  name,
  status,
  steps,
  totalSteps,
  completedSteps,
  startedAt,
  onCancel,
  stepSummary,
  error,
}: WorkflowProgressProps) => {
  const [elapsed, setElapsed] = useState('');
  const isActive = status === 'running' || status === 'paused';
  const badgeConfig = statusBadgeConfig[status];

  useEffect(() => {
    if (!startedAt) return;

    setElapsed(formatElapsed(startedAt));

    if (!isActive) return;

    const interval = setInterval(() => {
      setElapsed(formatElapsed(startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt, isActive]);

  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);

  const overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <Card className="max-w-xl border-border/50 overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-semibold truncate">{name}</CardTitle>
          <Badge variant={badgeConfig.variant} className={cn('text-[10px] shrink-0', badgeConfig.className)}>
            {badgeConfig.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <Progress value={overallPercent} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">
            {completedSteps}/{totalSteps}
          </span>
        </div>

        {startedAt && elapsed && (
          <div className="flex items-center gap-1 mt-1">
            <Clock className="w-3 h-3 text-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground/60 tabular-nums">{elapsed}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <div className="space-y-2">
          {sortedSteps.map((step) => (
            <StepRow key={step.order} step={step} />
          ))}
        </div>
      </CardContent>

      {(() => {
        // Compute step outcomes from stepSummary (authoritative when present)
        // or fall back to the live `steps` array (used mid-flight).
        const summary = stepSummary && stepSummary.length > 0
          ? stepSummary
          : sortedSteps.map((s) => ({
              order: s.order,
              name: s.name ?? `Step ${s.order}`,
              status: s.status === 'completed' || s.status === 'failed' || s.status === 'skipped'
                ? (s.status as 'completed' | 'failed' | 'skipped')
                : undefined,
              error: s.error ?? null,
              reason: null,
            })).filter((s) => s.status !== undefined) as WorkflowStepSummary[];

        const failedCount = summary.filter((s) => s.status === 'failed').length;
        const skippedCount = summary.filter((s) => s.status === 'skipped').length;
        const completedCount = summary.filter((s) => s.status === 'completed').length;
        const hasNonSuccess = failedCount > 0 || skippedCount > 0;

        if (status === 'failed') {
          return (
            <div className="mx-4 mb-3 px-3 py-2 bg-destructive/10 rounded-md border border-destructive/20 space-y-1.5">
              <p className="text-xs text-destructive font-medium flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                Workflow failed ({completedCount} completed, {failedCount} failed, {skippedCount} skipped)
              </p>
              {error && (
                <p className="text-[11px] text-destructive/80">{error}</p>
              )}
              {summary
                .filter((s) => s.status !== 'completed')
                .map((s) => (
                  <p key={s.order} className="text-[11px] text-destructive/80">
                    Step {s.order} ({s.name}) — {s.status}{s.reason ? `: ${s.reason}` : ''}{s.error ? `: ${s.error}` : ''}
                  </p>
                ))}
            </div>
          );
        }

        if (status === 'completed' && hasNonSuccess) {
          return (
            <div className="mx-4 mb-3 px-3 py-2 bg-amber-500/10 rounded-md border border-amber-500/30 space-y-1.5">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completed with partial success — {completedCount} succeeded, {failedCount} failed, {skippedCount} skipped
              </p>
              {summary
                .filter((s) => s.status !== 'completed')
                .map((s) => (
                  <p key={s.order} className="text-[11px] text-amber-700 dark:text-amber-300/80">
                    Step {s.order} ({s.name}) — {s.status}{s.reason ? `: ${s.reason}` : ''}{s.error ? `: ${s.error}` : ''}
                  </p>
                ))}
            </div>
          );
        }

        if (status === 'completed') {
          return (
            <div className="mx-4 mb-3 px-3 py-2 bg-emerald-500/10 rounded-md border border-emerald-500/20">
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Workflow completed successfully
              </p>
            </div>
          );
        }

        return null;
      })()}

      {isActive && (
        <CardFooter className="p-4 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCancel(workflowId)}
            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-3 h-3 mr-1" />
            Cancel
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
