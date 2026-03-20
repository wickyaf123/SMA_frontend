import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '@/components/chat/MessageBubble';
import type { ToolStep } from '@/components/chat/AgentSteps';
import type { WorkflowStep } from '@/components/chat/WorkflowProgress';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UseChatOptions {
  conversationId?: string;
}

export interface ActiveJob {
  jobId: string;
  jobType: string;
  status: 'started' | 'completed' | 'failed';
  result?: {
    sheetUrl?: string;
    total?: number;
    enriched?: number;
    incomplete?: number;
    permitType?: string;
    city?: string;
    contacts?: Array<{
      name: string;
      company: string;
      email: string;
      phone: string;
      permitType: string;
      city: string;
    }>;
  };
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface ActiveWorkflow {
  workflowId: string;
  name: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  totalSteps: number;
  completedSteps: number;
  steps: WorkflowStep[];
  startedAt?: string;
}

interface UseChatReturn {
  messages: ChatMessage[];
  streamingMessage: string;
  isStreaming: boolean;
  toolSteps: ToolStep[];
  isThinking: boolean;
  sendMessage: (content: string) => Promise<void>;
  cancelStream: () => void;
  isLoading: boolean;
  activeWorkflows: ActiveWorkflow[];
  activeJobs: ActiveJob[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
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
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
  const socketRef = useRef<Socket | null>(null);
  const conversationIdRef = useRef(conversationId);
  const sendMessageRef = useRef<(content: string) => void>(() => {});
  const completedJobIds = useRef<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const socket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('chat:join', conversationId);
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
      if (data.conversationId === conversationId) {
        setIsThinking(false);
        setStreamingMessage(prev => prev + data.token);
      }
    });

    socket.on('chat:tool_use', (data: { conversationId: string; tool: string; input: any }) => {
      if (data.conversationId === conversationId) {
        setIsThinking(false);
        const newStep: ToolStep = {
          id: `${data.tool}-${Date.now()}`,
          tool: data.tool,
          input: data.input,
          status: 'running',
          startedAt: Date.now(),
        };
        setToolSteps(prev => [...prev, newStep]);
      }
    });

    socket.on('chat:tool_result', (data: { conversationId: string; tool: string; result: any }) => {
      if (data.conversationId === conversationId) {
        setToolSteps(prev => prev.map(step =>
          step.tool === data.tool && step.status === 'running'
            ? { ...step, status: 'done' as const, result: data.result, completedAt: Date.now() }
            : step
        ));
      }
    });

    socket.on('chat:done', async (data: { conversationId: string }) => {
      if (data.conversationId === conversationId) {
        // Capture the streamed content as a temporary assistant message
        // so it stays visible while we reload from server
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
        // Reload replaces temp messages with real server data
        await loadMessages(conversationId);
      }
    });

    socket.on('chat:error', (data: { conversationId: string; error: string }) => {
      if (data.conversationId === conversationId) {
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
      if (data.conversationId === conversationId) {
        const newWorkflow: ActiveWorkflow = {
          workflowId: data.workflowId,
          name: data.name,
          status: 'running',
          totalSteps: data.totalSteps,
          completedSteps: 0,
          steps: data.steps || [],
          startedAt: data.startedAt || new Date().toISOString(),
        };
        setActiveWorkflows(prev => [...prev, newWorkflow]);
      }
    });

    socket.on('workflow:step_started', (data: {
      conversationId: string;
      workflowId: string;
      stepOrder: number;
    }) => {
      if (data.conversationId === conversationId) {
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
      if (data.conversationId === conversationId) {
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
      if (data.conversationId === conversationId) {
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
      if (data.conversationId === conversationId) {
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
      if (data.conversationId === conversationId) {
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
    }) => {
      if (data.conversationId === conversationId) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? { ...wf, status: 'completed' as const }
            : wf
        ));
      }
    });

    socket.on('workflow:failed', (data: {
      conversationId: string;
      workflowId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? { ...wf, status: 'failed' as const }
            : wf
        ));
      }
    });

    socket.on('workflow:cancelled', (data: {
      conversationId: string;
      workflowId: string;
    }) => {
      if (data.conversationId === conversationId) {
        setActiveWorkflows(prev => prev.map(wf =>
          wf.workflowId === data.workflowId
            ? { ...wf, status: 'cancelled' as const }
            : wf
        ));
      }
    });

    // Job event listeners (permit search notifications)
    socket.on('job:started', (data: {
      jobId: string;
      jobType: string;
      status: string;
      result?: any;
    }) => {
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

    socket.on('job:completed', (data: {
      jobId: string;
      jobType: string;
      status: string;
      result?: any;
    }) => {
      setActiveJobs(prev => {
        const exists = prev.some(j => j.jobId === data.jobId);
        if (!exists) {
          // Job started before this conversation was open — add it as completed
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

      // Auto-notify Jerry about permit search results so the conversation continues
      if (completedJobIds.current.has(data.jobId)) return;
      completedJobIds.current.add(data.jobId);
      if (data.jobType?.includes('permit') && data.result) {
        const r = data.result;
        const resultSummary = r.total === 0
          ? `SYSTEM_EVENT:job_completed:The permit search for ${r.permitType || 'permits'} in ${r.city || 'the specified area'} completed with 0 results found. No contractors matched. Please suggest alternatives to the user.`
          : `SYSTEM_EVENT:job_completed:The permit search completed. Found ${r.total} contractors (${r.enriched || 0} enriched, ${r.incomplete || 0} incomplete) for ${r.permitType || 'permits'} in ${r.city || 'the area'}.${r.sheetUrl ? ` Google Sheet: ${r.sheetUrl}` : ''} Please summarize the results and suggest next steps.`;
        // Use a small delay to avoid race with the streaming state reset
        setTimeout(() => {
          sendMessageRef.current(resultSummary);
        }, 1000);
      }
    });

    socket.on('job:failed', (data: {
      jobId: string;
      jobType: string;
      status: string;
      error?: string;
    }) => {
      setActiveJobs(prev => {
        const exists = prev.some(j => j.jobId === data.jobId);
        if (!exists) {
          return [...prev, {
            jobId: data.jobId,
            jobType: data.jobType,
            status: 'failed' as const,
            error: data.error,
            startedAt: new Date().toISOString(),
            completedAt: new Date().toISOString(),
          }];
        }
        return prev.map(job =>
          job.jobId === data.jobId
            ? { ...job, status: 'failed' as const, error: data.error, completedAt: new Date().toISOString() }
            : job
        );
      });
    });

    socketRef.current = socket;

    return () => {
      socket.emit('chat:leave', conversationId);
      socket.disconnect();
      socketRef.current = null;
      setConnectionStatus('disconnected');
    };
  }, [conversationId]);

  useEffect(() => {
    if (conversationId) {
      loadMessages(conversationId);
    } else {
      setMessages([]);
      setActiveWorkflows([]);
      setActiveJobs([]);
    }
  }, [conversationId]);

  const loadMessages = async (convId: string) => {
    try {
      setIsLoading(true);
      const data = await api.chat.getConversation(convId);
      if (data.success && data.data?.messages) {
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      toast({ title: 'Failed to load messages', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const cancelStream = useCallback(() => {
    const convId = conversationIdRef.current;
    if (!convId || !socketRef.current) return;
    socketRef.current.emit('chat:cancel', convId);
    setIsStreaming(false);
    setIsThinking(false);
    setStreamingMessage('');
    setToolSteps([]);
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
    setMessages(prev => [...prev, tempUserMessage]);
    setStreamingMessage('');
    setToolSteps([]);
    setIsStreaming(true);
    setIsThinking(true);

    try {
      await api.chat.sendMessage(convId, content);
    } catch (error) {
      console.error('Failed to send message:', error);
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

  return {
    messages,
    streamingMessage,
    isStreaming,
    toolSteps,
    isThinking,
    sendMessage,
    cancelStream,
    isLoading,
    activeWorkflows,
    activeJobs,
    connectionStatus,
  };
}
