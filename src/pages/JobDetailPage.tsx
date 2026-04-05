import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface JobDetail {
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

const statusColors: Record<string, string> = {
  PROCESSING: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  running: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  started: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  COMPLETED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  FAILED: 'bg-red-500/20 text-red-400 border-red-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'PROCESSING':
    case 'running':
    case 'started':
    case 'progress':
      return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
    case 'COMPLETED':
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'FAILED':
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-400" />;
    default:
      return <Clock className="w-5 h-5 text-muted-foreground" />;
  }
};

const JobDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchJob = async () => {
      try {
        setLoading(true);
        // Try to find the job in history
        const historyData = await api.jobs.history({ limit: 50 });
        const allJobs: JobDetail[] = historyData.data?.history || [];
        const found = allJobs.find(j => j.id === id);

        if (found) {
          setJob(found);
        } else {
          // Also check running jobs
          const statusData = await api.jobs.status();
          const running: JobDetail[] = statusData.data?.runningJobs || [];
          const runningFound = running.find(j => j.id === id);
          if (runningFound) {
            setJob(runningFound);
          } else {
            setError('Job not found');
          }
        }
      } catch (err) {
        console.error('Failed to fetch job details:', err);
        setError('Failed to load job details');
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [id]);

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="h-14 flex items-center px-4 gap-3 flex-shrink-0 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-sm font-semibold text-foreground">Job Details</h1>
        {id && (
          <span className="text-xs text-muted-foreground font-mono">{id.slice(0, 8)}...</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-12">
            <XCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Job ID: {id}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => navigate('/chat')}
            >
              Back to Chat
            </Button>
          </div>
        )}

        {job && !loading && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Status Card */}
            <div className="rounded-lg border border-border p-5 space-y-4">
              <div className="flex items-center gap-3">
                <StatusIcon status={job.status} />
                <div className="flex-1">
                  <h2 className="text-base font-semibold text-foreground">{job.type}</h2>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{job.id}</p>
                </div>
                <Badge
                  variant="outline"
                  className={statusColors[job.status] || ''}
                >
                  {job.status}
                </Badge>
              </div>
            </div>

            {/* Details Grid */}
            <div className="rounded-lg border border-border p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Created</p>
                  <p className="text-sm text-foreground mt-0.5">
                    {new Date(job.createdAt).toLocaleString()}
                  </p>
                </div>
                {job.startedAt && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Started</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {new Date(job.startedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {job.completedAt && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Completed</p>
                    <p className="text-sm text-foreground mt-0.5">
                      {new Date(job.completedAt).toLocaleString()}
                    </p>
                  </div>
                )}
                {job.totalRecords !== null && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Total Records</p>
                    <p className="text-sm text-foreground mt-0.5">{job.totalRecords}</p>
                  </div>
                )}
                {job.processedRecords !== null && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Processed</p>
                    <p className="text-sm text-foreground mt-0.5">{job.processedRecords}</p>
                  </div>
                )}
                {job.successCount !== null && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Successful</p>
                    <p className="text-sm text-emerald-500 mt-0.5">{job.successCount}</p>
                  </div>
                )}
                {job.errorCount !== null && job.errorCount > 0 && (
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Errors</p>
                    <p className="text-sm text-red-400 mt-0.5">{job.errorCount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            {job.metadata && Object.keys(job.metadata).length > 0 && (
              <div className="rounded-lg border border-border p-5">
                <h3 className="text-sm font-medium text-foreground mb-4">Metadata</h3>
                <pre className="text-xs text-muted-foreground bg-card rounded-md p-3 overflow-x-auto">
                  {JSON.stringify(job.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobDetailPage;
