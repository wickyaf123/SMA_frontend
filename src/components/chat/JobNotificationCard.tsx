import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  SearchX,
  Users,
  Search,
  Download,
  Sparkles,
  Clock,
  Pause,
  Play,
} from 'lucide-react';
import type { ActiveJob } from '@/hooks/useChat';

interface JobNotificationCardProps {
  job: ActiveJob;
  onPause?: (jobId: string) => void;
  onResume?: (jobId: string) => void;
}

function useElapsedTime(startedAt: string, isRunning: boolean) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
      return;
    }

    const tick = () => setElapsed(Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt, isRunning]);

  if (elapsed < 60) return `${elapsed}s`;
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  return `${mins}m ${secs}s`;
}

const PHASE_CONFIG = {
  searching: { label: 'Searching permits', icon: Search, color: 'text-blue-400' },
  importing: { label: 'Importing contacts', icon: Download, color: 'text-violet-400' },
  enriching: { label: 'Enriching emails', icon: Sparkles, color: 'text-amber-400' },
  building_sheet: { label: 'Building report', icon: CheckCircle2, color: 'text-emerald-400' },
} as const;

const PHASE_ORDER: Array<keyof typeof PHASE_CONFIG> = ['searching', 'importing', 'enriching', 'building_sheet'];

export const JobNotificationCard = ({ job, onPause, onResume }: JobNotificationCardProps) => {
  const navigate = useNavigate();
  const { status, result, error, progress } = job;

  const isPaused = status === 'paused';
  const isRunning = status === 'started' || status === 'progress' || isPaused;
  const elapsedStr = useElapsedTime(job.startedAt, isRunning && !isPaused);

  const permitType = progress?.permitType || result?.permitType || 'permit';
  const city = progress?.city || result?.city || '';

  const currentPhase = progress?.phase || 'searching';
  const phaseInfo = PHASE_CONFIG[currentPhase];
  const PhaseIcon = phaseInfo?.icon || Search;

  const currentPhaseIdx = PHASE_ORDER.indexOf(currentPhase);
  const progressPct =
    progress?.totalContractors && progress.contractorIndex
      ? Math.round((progress.contractorIndex / progress.totalContractors) * 100)
      : null;

  return (
    <div className="flex gap-3 max-w-[90%] mr-auto">
      <div className="w-8 shrink-0" />
      <Card className="max-w-lg border-border/50 overflow-hidden w-full">
        <CardContent className="p-4">
          {/* ========== RUNNING STATE ========== */}
          {isRunning && (
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center gap-3">
                {isPaused ? (
                  <Pause className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <Loader2 className="w-5 h-5 text-blue-400 animate-spin shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {isPaused ? 'Permit Search Paused' : 'Permit Search In Progress'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {permitType} permits{city ? ` in ${city}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {elapsedStr}
                  </span>
                  {isPaused ? (
                    <Badge variant="default" className="bg-amber-500 hover:bg-amber-500/80 text-[10px]">
                      Paused
                    </Badge>
                  ) : (
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/80 text-[10px]">
                      Running
                    </Badge>
                  )}
                </div>
              </div>

              {/* Phase stepper */}
              <div className="flex items-center gap-1">
                {PHASE_ORDER.map((phase, i) => {
                  const isActive = i === currentPhaseIdx;
                  const isDone = i < currentPhaseIdx;
                  return (
                    <div
                      key={phase}
                      className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                        isDone
                          ? 'bg-emerald-500'
                          : isActive
                            ? 'bg-blue-500 animate-pulse'
                            : 'bg-muted/60'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Current phase detail */}
              <div className="bg-muted/40 rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <PhaseIcon className={`w-3.5 h-3.5 ${phaseInfo?.color || 'text-blue-400'}`} />
                  <span className="text-xs font-medium">{phaseInfo?.label || 'Processing'}</span>
                  {progress?.totalContractors && currentPhase === 'importing' && (
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      {progress.contractorIndex || 0} / {progress.totalContractors} contractors
                    </span>
                  )}
                </div>

                {/* Progress bar for importing phase */}
                {progressPct !== null && currentPhase === 'importing' && (
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-violet-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}

                {progress?.message && (
                  <p className="text-[11px] text-muted-foreground">{progress.message}</p>
                )}
              </div>

              {/* Live stats */}
              {(progress?.imported ?? 0) > 0 && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-muted/30 rounded-lg px-2 py-1.5">
                    <p className="text-sm font-semibold text-emerald-500">{progress?.imported ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Imported</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg px-2 py-1.5">
                    <p className="text-sm font-semibold text-amber-500">{progress?.duplicates ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Duplicates</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg px-2 py-1.5">
                    <p className="text-sm font-semibold text-zinc-400">{progress?.filtered ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">Filtered</p>
                  </div>
                </div>
              )}

              {/* Pause / Resume controls */}
              <div className="flex items-center gap-2">
                {isPaused ? (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Resume job"
                    className="h-7 text-xs gap-1.5 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-400"
                    onClick={() => onResume?.(job.jobId)}
                  >
                    <Play className="w-3 h-3" />
                    Resume
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Pause job"
                    className="h-7 text-xs gap-1.5 border-amber-500/30 text-amber-500 hover:bg-amber-500/10 hover:text-amber-400"
                    onClick={() => onPause?.(job.jobId)}
                  >
                    <Pause className="w-3 h-3" />
                    Pause
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ========== COMPLETED: NO RESULTS ========== */}
          {status === 'completed' && (result?.total ?? 0) === 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <SearchX className="w-5 h-5 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">No Permits Found</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    No {permitType} contractors found{city ? ` in ${city}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {elapsedStr}
                  </span>
                  <Badge variant="default" className="bg-amber-500 hover:bg-amber-500/80 text-[10px]">
                    No Results
                  </Badge>
                </div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1.5">
                  Try adjusting your search:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Search a nearby or larger city</li>
                  <li>• Try a different permit type (HVAC, electrical, roofing, etc.)</li>
                  <li>• Widen the date range</li>
                </ul>
              </div>
            </div>
          )}

          {/* ========== COMPLETED: WITH RESULTS ========== */}
          {status === 'completed' && (result?.total ?? 0) > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Permit Search Complete</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Found {result?.total?.toLocaleString() ?? 0} {permitType} contractors
                    {city ? ` in ${city}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {elapsedStr}
                  </span>
                  <Badge
                    variant="default"
                    className="bg-emerald-500 hover:bg-emerald-500/80 text-[10px]"
                  >
                    Done
                  </Badge>
                </div>
              </div>

              {result && (
                <div className="space-y-3">
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5">
                      <p className="text-sm font-semibold">{result.total?.toLocaleString() ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5">
                      <p className="text-sm font-semibold text-emerald-600">
                        {result.enriched?.toLocaleString() ?? 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Enriched</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg px-2 py-1.5">
                      <p className="text-sm font-semibold text-amber-600">
                        {result.incomplete?.toLocaleString() ?? 0}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Incomplete</p>
                    </div>
                  </div>

                  {/* Contacts table */}
                  {result.contacts && result.contacts.length > 0 && (
                    <div className="border border-border/50 rounded-lg overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/50 border-b border-border/50">
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">
                              Name
                            </th>
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">
                              Company
                            </th>
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">
                              Email
                            </th>
                            <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">
                              Phone
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.contacts.map((contact, i) => (
                            <tr
                              key={i}
                              className="border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/50 transition-colors"
                              onClick={() => {
                                const params = new URLSearchParams();
                                if (contact.name) params.set('search', contact.name);
                                if (contact.id) params.set('contactId', contact.id);
                                navigate(`/classic/leads?${params.toString()}`);
                              }}
                            >
                              <td className="px-2.5 py-1.5 font-medium truncate max-w-[120px]">
                                {contact.name}
                              </td>
                              <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[100px]">
                                {contact.company}
                              </td>
                              <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[140px]">
                                {contact.email || '—'}
                              </td>
                              <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[100px]">
                                {contact.phone || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {(result.total ?? 0) > result.contacts.length && (
                        <div className="px-2.5 py-1.5 bg-muted/30 text-[10px] text-muted-foreground text-center">
                          Showing {result.contacts.length} of {result.total?.toLocaleString()} results
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    {result.sheetUrl && (
                      <a
                        href={result.sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open Google Sheet"
                        className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Google Sheet
                      </a>
                    )}
                    <button
                      onClick={() => navigate('/classic/leads')}
                      aria-label="View all in Leads"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <Users className="w-3 h-3" />
                      View all in Leads
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== FAILED ========== */}
          {status === 'failed' && (
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Permit Search Failed</p>
                <p className="text-xs text-destructive/80 mt-0.5">
                  {error || 'An unexpected error occurred'}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {elapsedStr}
                </span>
                <Badge variant="destructive" className="text-[10px]">
                  Failed
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
