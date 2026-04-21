import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '@/components/chat/MessageBubble';
import type { ToolStep } from '@/components/chat/AgentSteps';
import type { WorkflowStep } from '@/components/chat/WorkflowProgress';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { getAccessToken } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseChatOptions {
  conversationId?: string;
}

export interface JobProgressData {
  phase: 'searching' | 'importing' | 'enriching' | 'building_sheet';
  imported: number;
  duplicates: number;
  filtered: number;
  totalContractors?: number;
  contractorIndex?: number;
  message?: string;
  permitType?: string;
  city?: string;
}

export interface ActiveJob {
  jobId: string;
  jobType: string;
  status: 'started' | 'progress' | 'completed' | 'failed' | 'paused' | 'cancelled';
  progress?: JobProgressData;
  result?: {
    sheetUrl?: string;
    total?: number;
    enriched?: number;
    incomplete?: number;
    permitType?: string;
    city?: string;
    permitOnlyCount?: number;
    contacts?: Array<{
      id?: string;
      name: string;
      company: string;
      email: string;
      phone: string;
      permitType: string;
      city: string;
    }>;
    /** Homeowner search lead sample (first ~10). Sent by `homeowner:search` jobs. */
    homeowners?: Array<{
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
    }>;
    widening?: {
      appliedTier?: string;
      wasWidened?: boolean;
      reason?: string;
    };
  };
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowStepSummary {
  order: number;
  name: string;
  status: 'completed' | 'failed' | 'skipped';
  error?: string | null;
  reason?: string | null;
}

export interface ActiveWorkflow {
  workflowId: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  totalSteps: number;
  completedSteps: number;
  steps: WorkflowStep[];
  startedAt?: string;
  completedAt?: string;
  /** Per-step outcome summary — only present on terminal events (completed/failed). */
  stepSummary?: WorkflowStepSummary[];
  /** Final error message when status === 'failed'. */
  error?: string | null;
}

interface UseChatReturn {
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  toolSteps: ToolStep[];
  isThinking: boolean;
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  cancelJob: (jobId: string) => void;
  cancelWorkflow: (workflowId: string) => void;
  isLoading: boolean;
  activeWorkflows: ActiveWorkflow[];
  activeJobs: ActiveJob[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  pauseJob: (jobId: string) => void;
  resumeJob: (jobId: string) => void;
  hasRunningWork: boolean;
  messageQueue: string[];
}

export function useChat({ conversationId }: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolSteps, setToolSteps] = useState<ToolStep[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeWorkflows, setActiveWorkflows] = useState<ActiveWorkflow[]>([]);
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([]);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const conversationIdRef = useRef(conversationId);
  const isStreamingRef = useRef(false);
  const sendMessageRef = useRef<(content: string) => void>(() => {});
  const completedJobIds = useRef<Set<string>>(new Set());
  const pendingTimeoutsRef = useRef<NodeJS.Timeout[]>([]);
  // Per-conversation snapshot cache so switching back to a previously-loaded
  // chat restores instantly instead of blanking to "" and refetching. Refs
  // that mirror current state feed this cache without triggering re-renders.
  const conversationCacheRef = useRef<Map<string, {
    messages: ChatMessage[];
    activeWorkflows: ActiveWorkflow[];
    activeJobs: ActiveJob[];
    toolSteps: ToolStep[];
  }>>(new Map());
  const messagesRef = useRef<ChatMessage[]>([]);
  const activeWorkflowsRef = useRef<ActiveWorkflow[]>([]);
  const activeJobsRef = useRef<ActiveJob[]>([]);
  const toolStepsRef = useRef<ToolStep[]>([]);
  // True once the server has ack'd chat:join for the current conversation.
  // Used to gate workflow/job triggers so their starting events don't race
  // the room subscription.
  const joinAckedRef = useRef<boolean>(false);
  const { toast } = useToast();

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  // Mirror current state into refs so the conversation-switch effect can
  // snapshot them without making the effect depend on state (which would
  // cause it to re-run on every message/job update).
  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeWorkflowsRef.current = activeWorkflows; }, [activeWorkflows]);
  useEffect(() => { activeJobsRef.current = activeJobs; }, [activeJobs]);
  useEffect(() => { toolStepsRef.current = toolSteps; }, [toolSteps]);

  // Bounded "seen job id" tracker — prevents the completedJobIds Set from
  // growing without bound over long single-chat sessions. 200 is more than
  // enough to dedupe socket replays within a session; older entries evicted
  // FIFO via Set insertion order.
  const COMPLETED_JOB_CAP = 200;
  const rememberCompletedJob = (jobId: string) => {
    const set = completedJobIds.current;
    set.add(jobId);
    while (set.size > COMPLETED_JOB_CAP) {
      const oldest = set.values().next().value;
      if (oldest === undefined) break;
      set.delete(oldest);
    }
  };

  // Connect socket on mount (regardless of conversationId) so the
  // connection pill shows "Jerry Online" immediately.
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      auth: { token: getAccessToken() ?? undefined },
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
      // Join room if we already have a conversation. Use emitWithAck so
      // any in-flight jobs/workflows from the previous backend instance
      // get replayed to this socket, and we don't race POST /messages vs
      // room subscription after a reconnect.
      const convId = conversationIdRef.current;
      if (convId) {
        joinAckedRef.current = false;
        socket
          .emitWithAck('chat:join', convId)
          .then(() => {
            if (conversationIdRef.current === convId) joinAckedRef.current = true;
          })
          .catch(() => {
            if (conversationIdRef.current === convId) joinAckedRef.current = true;
          });
      }
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('reconnect_attempt', () => {
      setConnectionStatus('reconnecting');
    });

    socket.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    socket.on('chat:token', (data: { conversationId: string; token: string }) => {
      if (data.conversationId === conversationIdRef.current) {
        setIsThinking(false);
        setStreamingMessage(prev => prev + data.token);
      }
    });

    socket.on('chat:tool_use', (data: { conversationId: string; tool: string; input: any; toolCallId?: string }) => {
      if (data.conversationId === conversationIdRef.current) {
        setIsThinking(false);
        const newStep: ToolStep = {
          id: data.toolCallId || `${data.tool}-${Date.now()}`,
          tool: data.tool,
          input: data.input,
          status: 'running',
          startedAt: Date.now(),
        };
        setToolSteps(prev => [...prev, newStep]);
      }
    });

    socket.on('chat:tool_result', (data: { conversationId: string; tool: string; result: any; toolCallId?: string }) => {
      if (data.conversationId === conversationIdRef.current) {
        setToolSteps(prev => prev.map(step => {
          // Match by toolCallId when available, fall back to name-based matching
          const isMatch = data.toolCallId
            ? step.id === data.toolCallId
            : step.tool === data.tool && step.status === 'running';
          return isMatch
            ? { ...step, status: 'done' as const, result: data.result, completedAt: Date.now() }
            : step;
        }));
      }
    });

    socket.on('chat:done', async (data: { conversationId: string }) => {
      if (data.conversationId === conversationIdRef.current) {
        // Promote streamed content to a temp assistant message so it stays
        // visible while we silently merge from server.
        setStreamingMessage(prev => {
          if (prev) {
            setMessages(msgs => [
              ...msgs,
              {
                id: `temp-assistant-${Date.now()}`,
                conversationId: data.conversationId,
                role: 'assistant' as const,
                content: prev,
                createdAt: new Date().toISOString(),
              },
            ]);
          }
          return '';
        });
        setIsStreaming(false);
        setIsThinking(false);
        setToolSteps([]);
        // Silent merge: only replace if server data is newer & complete
        try {
          const convId = conversationIdRef.current;
          if (convId) {
            const resp = await api.chat.getConversation(convId);
            if (resp.success && resp.data?.messages) {
              const serverMsgs: ChatMessage[] = resp.data.messages;
              // Only replace if server has at least as many messages (includes the assistant reply)
              setMessages(prev => serverMsgs.length >= prev.length ? serverMsgs : prev);
            }
          }
        } catch {
          // Silent fail — temp message stays visible (graceful degradation)
        }
      }
    });

    socket.on('chat:error', (data: { conversationId: string; error: string }) => {
      if (data.conversationId === conversationIdRef.current) {
        setIsStreaming(false);
        setIsThinking(false);
        setToolSteps([]);
        setStreamingMessage('');
        toast({
          title: 'Jerry encountered an error',
          description: data.error || 'Something went wrong. Please try again.',
          variant: 'destructive',
        });
      }
    });

    // Workflow event listeners
    socket.on('workflow:started', (data: {
      conversationId: string;
      workflowId: string;
      name: string;
      totalSteps: number;
      steps: WorkflowStep[];
      startedAt?: string;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        const newWorkflow: ActiveWorkflow = {
          workflowId: data.workflowId,
          name: data.name,
          status: 'running',
          totalSteps: data.totalSteps,
          completedSteps: 0,
          steps: data.steps || [],
          startedAt: data.startedAt || new Date().toISOString(),
        };
        setActiveWorkflows(prev => {
          if (prev.some(w => w.workflowId === data.workflowId)) return prev;
          return [...prev, newWorkflow];
        });
      }
    });

    socket.on('workflow:step_started', (data: {
      conversationId: string;
      workflowId: string;
      stepOrder: number;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? {
                ...wf,
                steps: wf.steps.map(step =>
                  step.order === data.stepOrder ? { ...step, status: 'running' as const } : step
                ),
              }
            : wf
        ));
      }
    });

    socket.on('workflow:step_progress', (data: {
      conversationId: string;
      workflowId: string;
      stepOrder: number;
      progress: number;
      progressTotal: number;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? {
                ...wf,
                steps: wf.steps.map(step =>
                  step.order === data.stepOrder
                    ? { ...step, progress: data.progress, progressTotal: data.progressTotal }
                    : step
                ),
              }
            : wf
        ));
      }
    });

    socket.on('workflow:step_completed', (data: {
      conversationId: string;
      workflowId: string;
      stepOrder: number;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? {
                ...wf,
                completedSteps: wf.completedSteps + 1,
                steps: wf.steps.map(step =>
                  step.order === data.stepOrder ? { ...step, status: 'completed' as const } : step
                ),
              }
            : wf
        ));
      }
    });

    socket.on('workflow:step_failed', (data: {
      conversationId: string;
      workflowId: string;
      stepOrder: number;
      error?: string;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? {
                ...wf,
                steps: wf.steps.map(step =>
                  step.order === data.stepOrder
                    ? { ...step, status: 'failed' as const, error: data.error }
                    : step
                ),
              }
            : wf
        ));
      }
    });

    socket.on('workflow:step_skipped', (data: {
      conversationId: string;
      workflowId: string;
      stepOrder: number;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? {
                ...wf,
                steps: wf.steps.map(step =>
                  step.order === data.stepOrder ? { ...step, status: 'skipped' as const } : step
                ),
              }
            : wf
        ));
      }
    });

    socket.on('workflow:completed', (data: {
      conversationId: string;
      workflowId: string;
      result?: any;
      completedSteps?: number;
      totalSteps?: number;
      stepSummary?: WorkflowStepSummary[];
      isReplay?: boolean;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        // Find workflow name before updating status (use setter to read current state)
        let workflowName = 'Workflow';
        setActiveWorkflows(prev => {
          const found = prev.find(wf => wf.workflowId === data.workflowId);
          if (found) workflowName = found.name;
          return prev.map(wf =>
            wf.workflowId === data.workflowId
              ? {
                  ...wf,
                  status: 'completed' as const,
                  completedAt: new Date().toISOString(),
                  stepSummary: data.stepSummary ?? (data.result as any)?.stepSummary ?? wf.stepSummary,
                  completedSteps: data.completedSteps ?? wf.completedSteps,
                }
              : wf
          );
        });

        // Don't re-trigger Jerry summarization for replays (page reload /
        // chat rejoin) — the original completion already summarized.
        if (data.isReplay) return;

        // Feed the stepSummary into Jerry's prompt so he explicitly calls
        // out partial-success ("3 of 4 steps completed, 1 skipped") rather
        // than saying "completed" for a workflow that had failures.
        const summary = data.stepSummary ?? (data.result as any)?.stepSummary;
        const failedOrSkipped = summary?.filter((s: WorkflowStepSummary) => s.status !== 'completed') ?? [];
        const stepBlurb = failedOrSkipped.length > 0
          ? ` NOTE: ${failedOrSkipped.length} of ${summary?.length ?? '?'} steps did NOT complete successfully (${failedOrSkipped.map((s: WorkflowStepSummary) => `${s.name}: ${s.status}${s.reason ? ' — ' + s.reason : ''}`).join('; ')}). You MUST explicitly call out these partial failures — do not present this as a clean success.`
          : '';

        const resultSummary = data.result
          ? JSON.stringify(data.result).substring(0, 2000)
          : 'completed successfully';
        const summaryMsg = `SYSTEM_EVENT:workflow_completed:The workflow "${workflowName}" has completed. Results: ${resultSummary}.${stepBlurb} Please summarize the key findings for the user.`;
        const capturedConvId = data.conversationId;
        const capturedSend = sendMessageRef.current;
        const timeoutId = setTimeout(() => {
          if (conversationIdRef.current === capturedConvId) {
            capturedSend(summaryMsg);
          }
        }, 1000);
        pendingTimeoutsRef.current.push(timeoutId);
      }
    });

    socket.on('workflow:failed', (data: {
      conversationId: string;
      workflowId: string;
      error?: string;
      completedSteps?: number;
      totalSteps?: number;
      stepSummary?: WorkflowStepSummary[];
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? {
                ...wf,
                status: 'failed' as const,
                completedAt: new Date().toISOString(),
                stepSummary: data.stepSummary ?? wf.stepSummary,
                error: data.error ?? wf.error ?? null,
                completedSteps: data.completedSteps ?? wf.completedSteps,
              }
            : wf
        ));
      }
    });

    socket.on('workflow:cancelled', (data: {
      conversationId: string;
      workflowId: string;
    }) => {
      if (data.conversationId === conversationIdRef.current) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? { ...wf, status: 'cancelled' as const, completedAt: new Date().toISOString() }
            : wf
        ));
      }
    });

    // Accept an incoming job event iff it belongs to the current conversation.
    // Previously any event without a conversationId was passed through, which
    // let replayed old-job completions from Chat A leak into Chat B after a
    // socket reconnect. Now we only accept unscoped events for jobs we're
    // already tracking (i.e. we started them before the current scope).
    const acceptJobEvent = (convId: string | undefined, jobId: string): boolean => {
      if (convId) return convId === conversationIdRef.current;
      return activeJobsRef.current.some((j) => j.jobId === jobId);
    };

    // Job event listeners (permit search notifications)
    socket.on('job:started', (data: {
      jobId: string;
      jobType: string;
      status: string;
      conversationId?: string;
      result?: any;
    }) => {
      if (!acceptJobEvent(data.conversationId, data.jobId)) return;
      setActiveJobs(prev => {
        // Deduplicate: if we already have this job, update it
        if (prev.some(j => j.jobId === data.jobId)) return prev;
        return [...prev, {
          jobId: data.jobId,
          jobType: data.jobType,
          status: 'started' as const,
          result: data.result,
          startedAt: new Date().toISOString(),
        }];
      });
    });

    socket.on('job:progress', (data: {
      jobId: string;
      jobType: string;
      status: string;
      conversationId?: string;
      result?: JobProgressData;
    }) => {
      if (!acceptJobEvent(data.conversationId, data.jobId)) return;
      setActiveJobs(prev => prev.map(job =>
        job.jobId === data.jobId
          ? {
              ...job,
              status: job.status === 'paused' ? 'paused' as const : 'progress' as const,
              progress: data.result,
            }
          : job
      ));
    });

    socket.on('job:completed', (data: {
      jobId: string;
      jobType: string;
      status: string;
      isReplay?: boolean;
      conversationId?: string;
      result?: any;
    }) => {
      if (!acceptJobEvent(data.conversationId, data.jobId)) return;
      setActiveJobs(prev => {
        const exists = prev.some(j => j.jobId === data.jobId);
        if (!exists) {
          return [...prev, {
            jobId: data.jobId,
            jobType: data.jobType,
            status: 'completed' as const,
            result: data.result,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }];
        }
        return prev.map(job =>
          job.jobId === data.jobId
            ? { ...job, status: 'completed' as const, result: data.result, completedAt: new Date().toISOString() }
            : job
        );
      });

      // Don't auto-notify Jerry for replayed events (page refresh / reconnect)
      if (data.isReplay) {
        rememberCompletedJob(data.jobId);
        return;
      }

      if (completedJobIds.current.has(data.jobId)) return;
      rememberCompletedJob(data.jobId);

      // Toast notification for all completed jobs
      const jobLabel = data.jobType || 'Job';
      toast({
        title: 'Job completed',
        description: jobLabel,
      });

      // Browser notification when tab is not focused
      if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Job completed', { body: jobLabel, icon: '/favicon.ico' });
        } catch {
          // Silently ignore notification errors (e.g. in unsupported contexts)
        }
      }

      if (data.jobType?.includes('permit') && data.result) {
        const r = data.result;
        // Serialize the full diagnostics envelope (tiers tried, widening
        // reason, rawCount vs imported, etc.) so Jerry can give a specific
        // "here's why 0 results" answer instead of a generic suggestion.
        const diagBlob = r.diagnostics ? ` Diagnostics: ${JSON.stringify(r.diagnostics).substring(0, 1500)}.` : '';
        const wideningBlob = r.widening ? ` Widening: ${JSON.stringify(r.widening).substring(0, 500)}.` : '';
        const ds = r.diagnostics?.dataSource;
        const sourceBlob = ds === 'shovels_live'
          ? ' Data came from a live Shovels API scrape.'
          : ds === 'db_fallback'
            ? ' Data came from our local database fallback (Shovels returned no fresh matches).'
            : '';
        const resultSummary = r.total === 0
          ? `SYSTEM_EVENT:job_completed:The permit search for ${r.permitType || 'permits'} in ${r.city || 'the specified area'} returned 0 results.${diagBlob}${wideningBlob} DO NOT treat this as a failure. Briefly explain WHY (cite the diagnostics), then OFFER to re-run with specific widened filters — propose 2-3 concrete options (e.g. "Want me to widen to the last 3 years?", "Should I try adjacent cities in the same county?", "Switch from ${r.permitType || 'this'} to a broader trade?"). End with a question so the user can reply yes/no to any option. Do not suggest giving up.`
          : `SYSTEM_EVENT:job_completed:The permit search completed. Found ${r.total} contractors (${r.enriched || 0} enriched, ${r.incomplete || 0} incomplete) for ${r.permitType || 'permits'} in ${r.city || 'the area'}.${sourceBlob}${r.sheetUrl ? ` Google Sheet: ${r.sheetUrl}` : ''} Please summarize the results, explicitly state the data source (live Shovels scrape vs local DB) so the user knows what they're looking at, and suggest next steps.`;
        const capturedConvId = data.conversationId || conversationId;
        const capturedSend = sendMessageRef.current;
        const timeoutId = setTimeout(() => {
          if (conversationIdRef.current === capturedConvId) {
            capturedSend(resultSummary);
          }
        }, 1000);
        pendingTimeoutsRef.current.push(timeoutId);
      }

      // Homeowner search completion
      if (data.jobType === 'homeowner:search' && data.result) {
        const r = data.result;
        const diagBlob = r.diagnostics ? ` Diagnostics: ${JSON.stringify(r.diagnostics).substring(0, 1500)}.` : '';
        const wideningBlob = r.widening ? ` Widening: ${JSON.stringify(r.widening).substring(0, 500)}.` : '';
        const ds = r.diagnostics?.dataSource;
        const sourceBlob = ds === 'shovels_live'
          ? ' Data came from a live Shovels API scrape.'
          : ds === 'db_fallback'
            ? ' Data came from our local database fallback (Shovels returned no fresh matches — this is the last-resort tier).'
            : '';
        const resultSummary = r.total === 0
          ? `SYSTEM_EVENT:job_completed:The homeowner search for ${r.trade || ''} trade in ${r.city || 'the area'} returned 0 results.${diagBlob}${wideningBlob} DO NOT treat this as a failure. Briefly explain WHY (cite diagnostics), then OFFER to re-run with widened filters — propose 2-3 concrete options (widen the year window, try adjacent ZIPs/city, drop tag filter, or try a different trade signal). End with a question so the user can pick. Do not suggest giving up.`
          : `SYSTEM_EVENT:job_completed:The homeowner search completed. Found ${r.total} homeowners (${r.withEmail || 0} with email, ${r.withPhone || 0} with phone) for ${r.trade || ''} trade in ${r.city || 'the area'}.${sourceBlob}${r.crossTradeSignals ? ` Cross-trade signals: ${JSON.stringify(r.crossTradeSignals)}` : ''} Please summarize results, explicitly state the data source (live Shovels scrape vs local DB) so the user knows what they're looking at, and suggest next steps.`;
        const capturedConvId = data.conversationId || conversationId;
        const capturedSend = sendMessageRef.current;
        const timeoutId = setTimeout(() => {
          if (conversationIdRef.current === capturedConvId) {
            capturedSend(resultSummary);
          }
        }, 1000);
        pendingTimeoutsRef.current.push(timeoutId);
      }
    });

    socket.on('job:failed', (data: {
      jobId: string;
      jobType: string;
      status: string;
      error?: string;
      conversationId?: string;
      result?: any;
    }) => {
      if (!acceptJobEvent(data.conversationId, data.jobId)) return;
      const isCancelled = data.status === 'cancelled';
      const jobStatus = isCancelled ? 'cancelled' as const : 'failed' as const;
      setActiveJobs(prev => {
        const exists = prev.some(j => j.jobId === data.jobId);
        if (!exists) {
          return [...prev, {
            jobId: data.jobId,
            jobType: data.jobType,
            status: jobStatus,
            error: data.error,
            result: data.result,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }];
        }
        return prev.map(job =>
          job.jobId === data.jobId
            ? { ...job, status: jobStatus, error: data.error, result: data.result ?? job.result, completedAt: new Date().toISOString() }
            : job
        );
      });

      // Notify LLM about permit search failures
      if (data.jobType?.includes('permit') && !isCancelled) {
        const failMsg = `SYSTEM_EVENT:job_failed:The permit search failed. Error: ${data.error || 'Unknown error'}. Please inform the user about the specific issue and what they can do about it.`;
        const capturedConvId = data.conversationId || conversationId;
        const capturedSend = sendMessageRef.current;
        const timeoutId = setTimeout(() => {
          if (conversationIdRef.current === capturedConvId) {
            capturedSend(failMsg);
          }
        }, 1000);
        pendingTimeoutsRef.current.push(timeoutId);
      }

      // Notify LLM about homeowner search failures
      if (data.jobType === 'homeowner:search' && !isCancelled) {
        const failMsg = `SYSTEM_EVENT:job_failed:The homeowner search failed. Error: ${data.error || 'Unknown error'}. Please inform the user and suggest trying again.`;
        const capturedConvId = data.conversationId || conversationId;
        const capturedSend = sendMessageRef.current;
        const timeoutId = setTimeout(() => {
          if (conversationIdRef.current === capturedConvId) {
            capturedSend(failMsg);
          }
        }, 1000);
        pendingTimeoutsRef.current.push(timeoutId);
      }
    });

    socket.on('job:paused', (data: { jobId: string }) => {
      setActiveJobs(prev => prev.map(job =>
        job.jobId === data.jobId
          ? { ...job, status: 'paused' as const }
          : job
      ));
    });

    socket.on('job:resumed', (data: { jobId: string }) => {
      setActiveJobs(prev => prev.map(job =>
        job.jobId === data.jobId
          ? { ...job, status: 'progress' as const }
          : job
      ));
    });

    socketRef.current = socket;

    return () => {
      pendingTimeoutsRef.current.forEach(clearTimeout);
      pendingTimeoutsRef.current = [];
      if (conversationIdRef.current) {
        socket.emit('chat:leave', conversationIdRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    };
  }, []); // Mount once — no conversationId dependency

  // Join/leave rooms when conversationId changes. Uses emitWithAck so we know
  // when the server has actually joined the room AND finished replaying any
  // in-flight jobs/workflows. Without the ack, a workflow POST fired
  // immediately after mount can race the server-side room subscription and
  // the workflow:started event lands in an empty room.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    if (conversationId) {
      joinAckedRef.current = false;
      socket
        .emitWithAck('chat:join', conversationId)
        .then((result: unknown) => {
          if (conversationIdRef.current !== conversationId) return;
          joinAckedRef.current = true;
          if (typeof result === 'object' && result !== null && 'replayed' in result) {
            const replayed = (result as { replayed: number }).replayed;
            if (replayed > 0) {
              // eslint-disable-next-line no-console
              console.debug(`[useChat] chat:join ack — replayed ${replayed} event(s)`);
            }
          }
        })
        .catch((err) => {
          // Server might be running an older build without ack support —
          // fall back to treating join as successful.
          if (conversationIdRef.current !== conversationId) return;
          joinAckedRef.current = true;
          // eslint-disable-next-line no-console
          console.warn('[useChat] chat:join ack failed, assuming joined', err);
        });
    }

    return () => {
      if (conversationId && socket?.connected) {
        socket.emit('chat:leave', conversationId);
      }
      // Cancel any pending SYSTEM_EVENT timeouts scheduled for the chat
      // being left. Without this, a 1s delayed SYSTEM_EVENT scheduled in
      // the old chat can still fire after the user switched — the outer
      // conversationIdRef check catches it, but canceling here makes the
      // intent explicit and frees timers immediately.
      pendingTimeoutsRef.current.forEach(clearTimeout);
      pendingTimeoutsRef.current = [];
      joinAckedRef.current = false;
    };
  }, [conversationId]);

  useEffect(() => {
    // The cleanup function runs with the *previous* conversationId captured
    // via closure — that's the right place to snapshot the outgoing chat.
    return () => {
      if (conversationId) {
        conversationCacheRef.current.set(conversationId, {
          messages: messagesRef.current,
          activeWorkflows: activeWorkflowsRef.current,
          activeJobs: activeJobsRef.current,
          toolSteps: toolStepsRef.current,
        });
      }
    };
  }, [conversationId]);

  useEffect(() => {
    // Restore from cache if we've seen this conversation before; otherwise
    // clear. Either way, reset transient per-conversation flags so they
    // don't leak across chats — isStreaming in particular, because the
    // wizard starter options are gated on `!isStreaming` in MessageList.
    const cached = conversationId ? conversationCacheRef.current.get(conversationId) : undefined;
    if (cached) {
      setMessages(cached.messages);
      setActiveWorkflows(cached.activeWorkflows);
      setActiveJobs(cached.activeJobs);
      setToolSteps(cached.toolSteps);
    } else {
      setMessages([]);
      setActiveWorkflows([]);
      setActiveJobs([]);
      setToolSteps([]);
    }
    setStreamingMessage('');
    setIsThinking(false);
    setIsStreaming(false);
    completedJobIds.current = new Set();

    // Background-refresh from server so the cache doesn't go stale.
    if (conversationId) {
      loadMessages(conversationId);
      loadActivity(conversationId);
    }
  }, [conversationId]);

  const loadMessages = async (convId: string, force = false) => {
    try {
      setIsLoading(true);
      const data = await api.chat.getConversation(convId);
      // Bail if the user switched chats while we were waiting — otherwise
      // we'd overwrite the new chat's empty state with the old chat's history.
      if (conversationIdRef.current !== convId) return;
      if (data.success && data.data?.messages) {
        if (!force && isStreamingRef.current) {
          return;
        }
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({ title: 'Failed to load messages', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Hydrate JobsPanel + WorkflowProgress with historical activity for the
   * conversation. WebSocket events only cover the current session, so without
   * this the user sees an empty Jobs panel after navigating away and back.
   */
  const loadActivity = async (convId: string) => {
    try {
      const data = await api.chat.getConversationActivity(convId);
      // Bail if the user switched chats while we were waiting — otherwise
      // we'd append the old chat's jobs/workflows onto the new chat's panel.
      if (conversationIdRef.current !== convId) {
        console.info('[useChat] loadActivity stale, discarding', {
          requested: convId,
          current: conversationIdRef.current,
        });
        return;
      }
      if (!data.success || !data.data) {
        console.warn('[useChat] loadActivity: malformed response', data);
        return;
      }
      const { workflows = [], permitSearches = [], importJobs = [] } = data.data;
      console.info('[useChat] hydrated activity', {
        convId,
        workflows: workflows.length,
        permitSearches: permitSearches.length,
        importJobs: importJobs.length,
      });

      // Workflows → ActiveWorkflow
      if (workflows.length > 0) {
        const mappedWfs: ActiveWorkflow[] = workflows.map((w: any) => ({
          workflowId: w.id,
          name: w.name,
          status: (w.status || 'completed').toLowerCase() as ActiveWorkflow['status'],
          totalSteps: w.totalSteps || (w.steps?.length ?? 0),
          completedSteps: w.completedSteps ?? 0,
          steps: (w.steps || []).map((s: any) => ({
            order: s.order,
            name: s.name,
            action: s.action,
            status: (s.status || 'pending').toLowerCase(),
            progress: s.progress,
            progressTotal: s.progressTotal,
            error: s.error,
          })),
          startedAt: w.startedAt || w.createdAt,
          completedAt: w.completedAt || undefined,
        }));
        setActiveWorkflows((prev) => {
          // De-dupe with anything streamed in via socket already.
          const seen = new Set(prev.map((w) => w.workflowId));
          return [...prev, ...mappedWfs.filter((w) => !seen.has(w.workflowId))];
        });
      }

      // Permit searches + Import jobs → ActiveJob
      const jobs: ActiveJob[] = [];
      for (const ps of permitSearches) {
        jobs.push({
          jobId: ps.id,
          jobType: 'permit:search',
          status: (ps.status || 'completed').toLowerCase() as ActiveJob['status'],
          startedAt: ps.startedAt || ps.createdAt,
          completedAt: ps.completedAt || undefined,
          result: {
            total: ps.totalFound ?? 0,
            permitType: ps.permitType,
            city: ps.city,
          },
        });
      }
      for (const ij of importJobs) {
        const meta = (ij.metadata || {}) as any;
        const rawType = String(meta.jobType || ij.type || 'JOB');
        // Frontend label resolver (`getLabels`) is case-insensitive and matches
        // substrings — pass the raw type through unchanged.
        const jobType = rawType.toLowerCase().includes('homeowner')
          ? 'homeowner:search'
          : rawType;
        const wideningInMeta = meta.widening || undefined;
        jobs.push({
          jobId: ij.id,
          jobType,
          status: (ij.status || 'completed').toLowerCase() as ActiveJob['status'],
          startedAt: ij.startedAt || ij.createdAt,
          completedAt: ij.completedAt || undefined,
          result: {
            total: ij.totalRecords ?? 0,
            city: meta.city,
            ...(wideningInMeta && { widening: wideningInMeta }),
          },
        });
      }

      if (jobs.length > 0) {
        setActiveJobs((prev) => {
          const seen = new Set(prev.map((j) => j.jobId));
          return [...prev, ...jobs.filter((j) => !seen.has(j.jobId))];
        });
      }
    } catch (error) {
      // Best-effort hydration — don't toast on failure, but make the failure
      // visible in DevTools so we can diagnose missing-card reports.
      console.warn('[useChat] loadActivity failed', { convId, error });
    }
  };

  const cancelStream = useCallback(() => {
    const convId = conversationIdRef.current;
    if (!convId || !socketRef.current) return;
    socketRef.current.emit('chat:cancel', convId);
    isStreamingRef.current = false;
    setIsStreaming(false);
    setIsThinking(false);
    setStreamingMessage('');
    setToolSteps([]);
  }, []);

  const pauseJobFn = useCallback((jobId: string) => {
    const convId = conversationIdRef.current;
    if (!convId || !socketRef.current) return;
    socketRef.current.emit('job:pause', { jobId, conversationId: convId });
  }, []);

  const resumeJobFn = useCallback((jobId: string) => {
    const convId = conversationIdRef.current;
    if (!convId || !socketRef.current) return;
    socketRef.current.emit('job:resume', { jobId, conversationId: convId });
  }, []);

  const cancelJobFn = useCallback((jobId: string) => {
    const convId = conversationIdRef.current;
    if (!convId || !socketRef.current) return;
    socketRef.current.emit('job:cancel', { jobId, conversationId: convId });
    setActiveJobs(prev => prev.map(job =>
      job.jobId === jobId
        ? { ...job, status: 'cancelled' as const, completedAt: new Date().toISOString() }
        : job
    ));
  }, []);

  const cancelWorkflowFn = useCallback((workflowId: string) => {
    const convId = conversationIdRef.current;
    if (!convId || !socketRef.current) return;
    socketRef.current.emit('workflow:cancel', { workflowId, conversationId: convId });
    // Optimistic: immediately mark as cancelled so UI updates instantly
    setActiveWorkflows(prev => prev.map(wf =>
      wf.workflowId === workflowId
        ? {
            ...wf,
            status: 'cancelled' as const,
            completedAt: new Date().toISOString(),
            steps: wf.steps.map(step =>
              step.status === 'running' || step.status === 'pending'
                ? { ...step, status: 'skipped' as const }
                : step
            ),
          }
        : wf
    ));
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const convId = conversationIdRef.current;
    if (!convId || !content) return;

    const tempUserMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    isStreamingRef.current = true;
    setMessages(prev => [...prev, tempUserMessage]);
    setStreamingMessage('');
    setToolSteps([]);
    setIsStreaming(true);
    setIsThinking(true);

    try {
      await api.chat.sendMessage(convId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
      isStreamingRef.current = false;
      setIsStreaming(false);
      setIsThinking(false);
      setStreamingMessage('');
      setToolSteps([]);
      toast({
        title: 'Failed to send message',
        description: 'Could not reach Jerry. Please try again.',
        variant: 'destructive',
      });
    }
  }, []);

  // Keep ref in sync for use in socket handlers
  sendMessageRef.current = sendMessage;

  // Compute whether there's active work running
  const hasRunningWork =
    activeWorkflows.some(wf => wf.status === 'running' || wf.status === 'pending') ||
    activeJobs.some(job => job.status === 'started' || job.status === 'progress');

  // Wrapper that queues messages when work is running (skip SYSTEM_EVENT messages — those always send immediately)
  const sendMessageOrQueue = useCallback(async (content: string) => {
    if (content.startsWith('SYSTEM_EVENT:')) {
      return sendMessage(content);
    }
    if (hasRunningWork || isStreamingRef.current) {
      setMessageQueue(prev => [...prev, content]);
      return;
    }
    return sendMessage(content);
  }, [hasRunningWork, sendMessage]);

  // Flush message queue when work completes. `sendMessage` is async and can
  // throw on transient network errors — re-queue on failure so the user's
  // message isn't silently dropped. The toast inside sendMessage still fires
  // to surface the error; we just don't lose the text.
  useEffect(() => {
    if (!hasRunningWork && !isStreamingRef.current && messageQueue.length > 0) {
      const [next, ...rest] = messageQueue;
      setMessageQueue(rest);
      (async () => {
        try {
          await sendMessage(next);
        } catch (err) {
          console.warn('[useChat] queued message send failed — re-queuing', err);
          setMessageQueue((prev) => [next, ...prev]);
        }
      })();
    }
  }, [hasRunningWork, isStreaming, messageQueue, sendMessage]);

  return {
    messages,
    streamingMessage,
    isStreaming,
    toolSteps,
    isThinking,
    sendMessage: sendMessageOrQueue,
    cancelStream,
    cancelJob: cancelJobFn,
    cancelWorkflow: cancelWorkflowFn,
    isLoading,
    activeWorkflows,
    activeJobs,
    connectionStatus,
    pauseJob: pauseJobFn,
    resumeJob: resumeJobFn,
    hasRunningWork,
    messageQueue,
  };
}
