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
  ChevronDown,
  ChevronRight,
  Home,
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

/**
 * Maps a backend `jobType` string to a UI label set. Different jobs render
 * different copy — a homeowner search returning 0 should NOT be labelled
 * "No permit contractors found."
 */
type JobLabelSet = {
  noun: string;          // "homeowner" | "contractor" | "job"
  pluralNoun: string;    // "homeowners" | "contractors" | "jobs"
  runningTitle: string;
  pausedTitle: string;
  emptyTitle: string;
  emptyDescription: (city: string) => string;
  successTitle: string;
  successDescription: (count: number, city: string) => string;
  emptyTips: string[];
};

const PERMIT_LABELS: JobLabelSet = {
  noun: 'contractor',
  pluralNoun: 'contractors',
  runningTitle: 'Permit Search In Progress',
  pausedTitle: 'Permit Search Paused',
  emptyTitle: 'No Permits Found',
  emptyDescription: (city) => `No permit contractors found${city ? ` in ${city}` : ''}`,
  successTitle: 'Permit Search Complete',
  successDescription: (count, city) =>
    `Found ${count.toLocaleString()} contractors${city ? ` in ${city}` : ''}`,
  emptyTips: [
    'Search a nearby or larger city',
    'Try a different permit type (HVAC, electrical, roofing, etc.)',
    'Widen the date range',
  ],
};

const HOMEOWNER_LABELS: JobLabelSet = {
  noun: 'homeowner',
  pluralNoun: 'homeowners',
  runningTitle: 'Homeowner Search In Progress',
  pausedTitle: 'Homeowner Search Paused',
  emptyTitle: 'No Matching Homeowners',
  emptyDescription: (city) =>
    `No homeowners matched the requested filters${city ? ` in ${city}` : ''} — even after widening to neighboring areas.`,
  successTitle: 'Homeowner Search Complete',
  successDescription: (count, city) =>
    `Found ${count.toLocaleString()} homeowners${city ? ` in ${city}` : ''}`,
  emptyTips: [
    'Try a different city or relax the property-value range',
    'Choose different permit signals (e.g. roofing, solar, ADU, storm)',
    'Widen the timeline (e.g. last 2-3 years)',
  ],
};

const ENRICH_LABELS: JobLabelSet = {
  noun: 'contact',
  pluralNoun: 'contacts',
  runningTitle: 'Enrichment In Progress',
  pausedTitle: 'Enrichment Paused',
  emptyTitle: 'Nothing to Enrich',
  emptyDescription: () => 'No contacts pending enrichment.',
  successTitle: 'Enrichment Complete',
  successDescription: (count) =>
    `Enriched ${count.toLocaleString()} contacts.`,
  emptyTips: ['Run a scrape first to add contacts to the queue'],
};

const VALIDATE_LABELS: JobLabelSet = {
  noun: 'contact',
  pluralNoun: 'contacts',
  runningTitle: 'Email/Phone Validation Running',
  pausedTitle: 'Validation Paused',
  emptyTitle: 'Nothing to Validate',
  emptyDescription: () => 'No contacts pending validation.',
  successTitle: 'Validation Complete',
  successDescription: (count) =>
    `Validated ${count.toLocaleString()} contacts.`,
  emptyTips: ['Run a scrape or import first'],
};

const MERGE_LABELS: JobLabelSet = {
  noun: 'duplicate',
  pluralNoun: 'duplicates',
  runningTitle: 'Deduping Contacts',
  pausedTitle: 'Dedupe Paused',
  emptyTitle: 'No Duplicates Found',
  emptyDescription: () => 'No duplicate contacts to merge.',
  successTitle: 'Dedupe Complete',
  successDescription: (count) =>
    `Merged ${count.toLocaleString()} duplicate records.`,
  emptyTips: [],
};

const AUTO_ENROLL_LABELS: JobLabelSet = {
  noun: 'contact',
  pluralNoun: 'contacts',
  runningTitle: 'Auto-Enrolling Contacts',
  pausedTitle: 'Auto-Enroll Paused',
  emptyTitle: 'Nothing to Enroll',
  emptyDescription: () => 'No validated contacts queued for enrollment.',
  successTitle: 'Auto-Enroll Complete',
  successDescription: (count) =>
    `Enrolled ${count.toLocaleString()} contacts into campaigns.`,
  emptyTips: ['Validate contacts first', 'Confirm campaigns are active'],
};

const CONNECTION_LABELS: JobLabelSet = {
  noun: 'connection',
  pluralNoun: 'connections',
  runningTitle: 'Resolving Connections',
  pausedTitle: 'Connection Resolve Paused',
  emptyTitle: 'No Connections Made',
  emptyDescription: () => 'No new contractor↔homeowner links found.',
  successTitle: 'Connection Resolve Complete',
  successDescription: (count) =>
    `Linked ${count.toLocaleString()} contractor↔homeowner pairs.`,
  emptyTips: ['Run a homeowner scrape first'],
};

function getLabels(jobType?: string): JobLabelSet {
  const t = (jobType || '').toLowerCase();
  if (t.includes('homeowner')) return HOMEOWNER_LABELS;
  if (t.includes('enrich')) return ENRICH_LABELS;
  if (t.includes('validate')) return VALIDATE_LABELS;
  if (t.includes('merge') || t.includes('dedup')) return MERGE_LABELS;
  if (t.includes('enroll')) return AUTO_ENROLL_LABELS;
  if (t.includes('connection')) return CONNECTION_LABELS;
  return PERMIT_LABELS;
}

/**
 * Display-friendly city label.
 * "los_angeles_ca" → "Los Angeles, CA"
 * "Scottsdale, AZ" / "Phoenix" → returned unchanged
 * "" / null → ""
 */
function humanizeCity(raw?: string | null): string {
  if (!raw) return '';
  const s = String(raw).trim();
  if (s.includes(',')) return s; // already formatted "City, ST"
  if (!/[_-]/.test(s)) {
    // Single-word (e.g. "Phoenix") — title-case it
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
  const parts = s.split(/[_-]/).filter(Boolean);
  let stateAbbr = '';
  if (parts.length > 1 && parts[parts.length - 1].length === 2) {
    stateAbbr = parts.pop()!.toUpperCase();
  }
  const city = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
  return stateAbbr ? `${city}, ${stateAbbr}` : city;
}

export const JobNotificationCard = ({ job, onPause, onResume }: JobNotificationCardProps) => {
  const navigate = useNavigate();
  const { status, result, error, progress } = job;

  const isPaused = status === 'paused';
  const isRunning = status === 'started' || status === 'progress' || isPaused;
  const elapsedStr = useElapsedTime(job.startedAt, isRunning && !isPaused);

  const labels = getLabels(job.jobType);
  const permitType = progress?.permitType || result?.permitType || 'permit';
  const city = humanizeCity(progress?.city || result?.city || '');

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
                    {isPaused ? labels.pausedTitle : labels.runningTitle}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {labels.noun === 'homeowner'
                      ? `Looking for homeowners${city ? ` in ${city}` : ''}`
                      : `${permitType} permits${city ? ` in ${city}` : ''}`}
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
          {status === 'completed' && (result?.total ?? 0) === 0 && (() => {
            const diag = (result as any)?.diagnostics as
              | { reason?: string; rawCount?: number; filtered?: number; duplicates?: number; appliedTier?: string | null }
              | undefined;
            const widening = (result as any)?.widening as
              | { wasWidened?: boolean; reason?: string; appliedTier?: string }
              | undefined;
            const reason = diag?.reason || widening?.reason;
            const rawCount = diag?.rawCount;
            const filtered = diag?.filtered;
            const duplicates = diag?.duplicates;
            const showFunnel =
              rawCount !== undefined && rawCount > 0 &&
              ((typeof filtered === 'number' && filtered > 0) || (typeof duplicates === 'number' && duplicates > 0));

            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <SearchX className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{labels.emptyTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {labels.emptyDescription(city)}
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

                {/* "Why" block — leads with the specific reason + funnel numbers */}
                {(reason || showFunnel) && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 space-y-1.5">
                    <p className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                      Why this happened
                    </p>
                    {reason && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{reason}</p>
                    )}
                    {showFunnel && (
                      <p className="text-[11px] text-muted-foreground">
                        Funnel: {rawCount} raw from Shovels
                        {typeof duplicates === 'number' && duplicates > 0 ? ` · ${duplicates} duplicate` : ''}
                        {typeof filtered === 'number' && filtered > 0 ? ` · ${filtered} rejected by relevance scorer (usually utilities or cross-industry false positives)` : ''}
                        {' · 0 imported'}
                      </p>
                    )}
                  </div>
                )}

                {/* CTA to adjust filters and re-run */}
                <div className="bg-muted/40 border border-border/60 rounded-lg px-3 py-2.5">
                  <p className="text-xs font-medium text-foreground mb-1.5">
                    Want to try again with different filters?
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {labels.emptyTips.map((tip) => (
                      <li key={tip}>• {tip}</li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-muted-foreground/80 mt-2 italic">
                    Ask Jerry below to re-run with your adjusted filters, or click the wizard button for a fresh search.
                  </p>
                </div>
              </div>
            );
          })()}

          {/* ========== COMPLETED: WITH RESULTS ========== */}
          {status === 'completed' && (result?.total ?? 0) > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{labels.successTitle}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {labels.successDescription(result?.total ?? 0, city)}
                  </p>
                  {(() => {
                    // Data-source pill — distinguishes a fresh Shovels scrape
                    // from a DB fallback or enrichment-only result. Answers
                    // the "did we scrape or just read the DB?" question.
                    const ds = ((result as any)?.diagnostics?.dataSource) as
                      | 'shovels_live' | 'db_fallback' | 'none' | undefined;
                    if (!ds || ds === 'none') return null;
                    const label = ds === 'shovels_live'
                      ? 'Source: live scrape from Shovels API'
                      : 'Source: local database (Shovels had no fresh matches)';
                    return (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
                        {label}
                      </p>
                    );
                  })()}
                  {(() => {
                    const widening = (result as any)?.widening as
                      | { wasWidened?: boolean; reason?: string; appliedTier?: string }
                      | undefined;
                    if (!widening?.wasWidened || !widening.reason) return null;
                    return (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                        Filters widened (Tier {widening.appliedTier}): {widening.reason}
                      </p>
                    );
                  })()}
                  {(() => {
                    // When the relevance filter rejected most of what Shovels
                    // returned, show "Found X of Y — Z filtered out" so the
                    // user can see WHY they got a small number. Without this,
                    // a search that finds 1 of 8 looks identical to a search
                    // that finds 1 of 1 — very different situations.
                    const diag = (result as any)?.diagnostics as
                      | { rawCount?: number; filtered?: number; imported?: number }
                      | undefined;
                    const total = result?.total ?? 0;
                    const raw = diag?.rawCount ?? 0;
                    const filtered = diag?.filtered ?? 0;
                    if (filtered <= 0 || raw <= total) return null;
                    return (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        Found {total} of {raw} — {filtered} filtered out by relevance scorer (likely cross-industry false positives)
                      </p>
                    );
                  })()}
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

                  {/* Homeowner leads table (homeowner:search jobs) */}
                  {result.homeowners && result.homeowners.length > 0 && (
                    <HomeownerLeadsTable
                      homeowners={result.homeowners}
                      total={result.total ?? 0}
                      permitOnlyCount={result.permitOnlyCount ?? 0}
                      onOpenInLeads={() => navigate('/classic/leads?source=homeowner')}
                    />
                  )}

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
                      onClick={() => navigate('/classic/leads?source=shovels')}
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
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Permit Search Failed</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {permitType} permits{city ? ` in ${city}` : ''}
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
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2.5">
                <p className="text-xs text-destructive dark:text-red-400">
                  {error || 'An unexpected error occurred. Check the logs or contact Stark.'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface HomeownerLeadRow {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  permitType?: string | null;
  permitDate?: string | null;
  propertyValue?: number | null;
  isPermitOnlyLead?: boolean;
}

function HomeownerLeadsTable({
  homeowners,
  total,
  permitOnlyCount,
  onOpenInLeads,
}: {
  homeowners: HomeownerLeadRow[];
  total: number;
  permitOnlyCount: number;
  onOpenInLeads: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const truncatedCount = total - homeowners.length;

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-muted/40 hover:bg-muted/60 text-xs font-medium transition-colors"
        aria-expanded={expanded}
        aria-controls="homeowner-leads-table"
      >
        <div className="flex items-center gap-2">
          {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          <Home className="w-3.5 h-3.5 text-muted-foreground" />
          <span>View leads ({Math.min(homeowners.length, total)} of {total.toLocaleString()})</span>
        </div>
        {permitOnlyCount > 0 && (
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            {permitOnlyCount} need enrichment (no email/phone yet)
          </span>
        )}
      </button>

      {expanded && (
        <div id="homeowner-leads-table" className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border/50">
                <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Name</th>
                <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Address</th>
                <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Permit</th>
                <th className="text-right px-2.5 py-1.5 font-medium text-muted-foreground">Value</th>
                <th className="text-left px-2.5 py-1.5 font-medium text-muted-foreground">Contact</th>
              </tr>
            </thead>
            <tbody>
              {homeowners.map((h, i) => {
                const fullAddr = [h.street, h.city, h.state, h.zipCode].filter(Boolean).join(', ');
                const contact = h.email || h.phone || (h.isPermitOnlyLead ? 'needs enrichment' : '—');
                return (
                  <tr
                    key={(h.id || '') + i}
                    className="border-b border-border/30 last:border-0 hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-2.5 py-1.5 font-medium truncate max-w-[140px]">
                      {h.name || '—'}
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[200px]" title={fullAddr}>
                      {fullAddr || '—'}
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[140px]" title={h.permitType || ''}>
                      {h.permitType || '—'}
                      {h.permitDate ? <span className="block text-[9px] opacity-60">{h.permitDate}</span> : null}
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground text-right tabular-nums">
                      {h.propertyValue != null ? `$${Math.round(h.propertyValue).toLocaleString()}` : '—'}
                    </td>
                    <td className="px-2.5 py-1.5 text-muted-foreground truncate max-w-[160px]" title={contact}>
                      {h.isPermitOnlyLead ? (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">needs enrichment</span>
                      ) : (
                        contact
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {truncatedCount > 0 && (
            <div className="px-3 py-2 bg-muted/20 text-[10px] text-muted-foreground flex items-center justify-between">
              <span>Showing {homeowners.length} of {total.toLocaleString()} leads</span>
              <button
                type="button"
                onClick={onOpenInLeads}
                className="text-primary hover:underline"
              >
                View all in Leads →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
