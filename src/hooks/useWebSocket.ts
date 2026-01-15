/**
 * WebSocket Hook for Real-Time Updates
 * Provides real-time dashboard updates via Socket.io
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './useApi';

// WebSocket event types (must match backend)
export enum WSEventType {
  // Job events
  JOB_STARTED = 'job:started',
  JOB_PROGRESS = 'job:progress',
  JOB_COMPLETED = 'job:completed',
  JOB_FAILED = 'job:failed',

  // Contact events
  CONTACT_CREATED = 'contact:created',
  CONTACT_UPDATED = 'contact:updated',
  CONTACT_VALIDATED = 'contact:validated',
  CONTACT_ENRICHED = 'contact:enriched',
  CONTACT_ENROLLED = 'contact:enrolled',

  // Reply events
  REPLY_RECEIVED = 'reply:received',

  // Campaign events
  CAMPAIGN_UPDATED = 'campaign:updated',
  CAMPAIGN_ENROLLMENT = 'campaign:enrollment',

  // Pipeline events
  PIPELINE_STATUS = 'pipeline:status',

  // Queue events
  QUEUE_STATUS = 'queue:status',

  // Metrics events
  METRICS_UPDATE = 'metrics:update',

  // System events
  SYSTEM_ALERT = 'system:alert',
}

export interface WebSocketState {
  isConnected: boolean;
  lastEvent: any | null;
  error: string | null;
}

export interface JobEvent {
  jobId: string;
  jobType: string;
  status: 'started' | 'progress' | 'completed' | 'failed';
  progress?: {
    current: number;
    total: number;
    percentage: number;
  };
  result?: any;
  error?: string;
  duration?: number;
  timestamp: string;
}

export interface ReplyEvent {
  replyId: string;
  contactId: string;
  contactName?: string;
  contactEmail?: string;
  channel: 'EMAIL' | 'SMS' | 'LINKEDIN';
  content?: string;
  stoppedCampaigns?: number;
  timestamp: string;
}

export interface SystemAlertEvent {
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  action?: string;
  timestamp: string;
}

export interface QueueStatusEvent {
  queues: Array<{
    name: string;
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
    paused: boolean;
  }>;
  timestamp: string;
}

// Get WebSocket URL from environment or default
const getWSUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return apiUrl.replace(/^http/, 'ws');
};

/**
 * Main WebSocket hook
 * Provides connection management and event handling
 */
export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastEvent: null,
    error: null,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const wsUrl = getWSUrl();
    console.log('[WebSocket] Connecting to:', wsUrl);

    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log('[WebSocket] Connected');
      setState(prev => ({ ...prev, isConnected: true, error: null }));
      
      // Optionally authenticate with API key
      const apiKey = import.meta.env.VITE_API_KEY;
      if (apiKey) {
        socket.emit('authenticate', { apiKey });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('connect_error', (error) => {
      console.error('[WebSocket] Connection error:', error.message);
      setState(prev => ({ ...prev, error: error.message }));
    });

    socketRef.current = socket;
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setState(prev => ({ ...prev, isConnected: false }));
    }
  }, []);

  // Subscribe to events
  const subscribe = useCallback((event: WSEventType | string, handler: (data: any) => void) => {
    if (!socketRef.current) return () => {};

    socketRef.current.on(event, handler);
    return () => {
      socketRef.current?.off(event, handler);
    };
  }, []);

  // Initialize connection
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    ...state,
    socket: socketRef.current,
    connect,
    disconnect,
    subscribe,
  };
}

/**
 * Hook for job status updates
 */
export function useJobEvents(options?: {
  onJobStarted?: (event: JobEvent) => void;
  onJobProgress?: (event: JobEvent) => void;
  onJobCompleted?: (event: JobEvent) => void;
  onJobFailed?: (event: JobEvent) => void;
}) {
  const { subscribe, isConnected } = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    if (options?.onJobStarted) {
      unsubscribers.push(subscribe(WSEventType.JOB_STARTED, options.onJobStarted));
    }

    if (options?.onJobProgress) {
      unsubscribers.push(subscribe(WSEventType.JOB_PROGRESS, options.onJobProgress));
    }

    if (options?.onJobCompleted) {
      unsubscribers.push(subscribe(WSEventType.JOB_COMPLETED, (event: JobEvent) => {
        options.onJobCompleted?.(event);
        toast({
          title: 'Job Completed',
          description: `${event.jobType} completed successfully`,
        });
      }));
    }

    if (options?.onJobFailed) {
      unsubscribers.push(subscribe(WSEventType.JOB_FAILED, (event: JobEvent) => {
        options.onJobFailed?.(event);
        toast({
          title: 'Job Failed',
          description: event.error || `${event.jobType} failed`,
          variant: 'destructive',
        });
      }));
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe, options, toast]);
}

/**
 * Hook for reply notifications - HIGH PRIORITY
 * Shows toast notification when a reply is received
 */
export function useReplyNotifications(options?: {
  onReply?: (event: ReplyEvent) => void;
  showToast?: boolean;
}) {
  const { subscribe, isConnected } = useWebSocket();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(WSEventType.REPLY_RECEIVED, (event: ReplyEvent) => {
      console.log('[WebSocket] Reply received:', event);

      // Call custom handler
      options?.onReply?.(event);

      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });

      // Show toast notification (default: true)
      if (options?.showToast !== false) {
        toast({
          title: '🎉 New Reply Received!',
          description: `${event.contactName || event.contactEmail || 'Contact'} replied via ${event.channel}`,
          duration: 10000, // Show for 10 seconds
        });
      }
    });

    return unsubscribe;
  }, [isConnected, subscribe, options, toast, queryClient]);
}

/**
 * Hook for system alerts
 */
export function useSystemAlerts(options?: {
  onAlert?: (event: SystemAlertEvent) => void;
}) {
  const { subscribe, isConnected } = useWebSocket();
  const { toast } = useToast();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(WSEventType.SYSTEM_ALERT, (event: SystemAlertEvent) => {
      options?.onAlert?.(event);

      const variant = event.level === 'error' || event.level === 'critical' 
        ? 'destructive' 
        : 'default';

      toast({
        title: event.title,
        description: event.message,
        variant,
        duration: event.level === 'critical' ? 0 : 5000, // Critical stays until dismissed
      });
    });

    return unsubscribe;
  }, [isConnected, subscribe, options, toast]);
}

/**
 * Hook for queue status updates
 */
export function useQueueStatus(options?: {
  onStatusUpdate?: (event: QueueStatusEvent) => void;
}) {
  const { subscribe, isConnected } = useWebSocket();
  const [queueStatus, setQueueStatus] = useState<QueueStatusEvent['queues']>([]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(WSEventType.QUEUE_STATUS, (event: QueueStatusEvent) => {
      setQueueStatus(event.queues);
      options?.onStatusUpdate?.(event);
    });

    return unsubscribe;
  }, [isConnected, subscribe, options]);

  return queueStatus;
}

/**
 * Hook for real-time contact updates
 */
export function useContactUpdates(options?: {
  onCreated?: (data: any) => void;
  onUpdated?: (data: any) => void;
  onValidated?: (data: any) => void;
  onEnriched?: (data: any) => void;
  onEnrolled?: (data: any) => void;
}) {
  const { subscribe, isConnected } = useWebSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribers: (() => void)[] = [];

    // Common handler to invalidate queries
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.stats });
    };

    if (options?.onCreated) {
      unsubscribers.push(subscribe(WSEventType.CONTACT_CREATED, (data) => {
        options.onCreated?.(data);
        handleUpdate();
      }));
    }

    if (options?.onUpdated) {
      unsubscribers.push(subscribe(WSEventType.CONTACT_UPDATED, (data) => {
        options.onUpdated?.(data);
        handleUpdate();
      }));
    }

    if (options?.onValidated) {
      unsubscribers.push(subscribe(WSEventType.CONTACT_VALIDATED, (data) => {
        options.onValidated?.(data);
        handleUpdate();
      }));
    }

    if (options?.onEnriched) {
      unsubscribers.push(subscribe(WSEventType.CONTACT_ENRICHED, (data) => {
        options.onEnriched?.(data);
        handleUpdate();
      }));
    }

    if (options?.onEnrolled) {
      unsubscribers.push(subscribe(WSEventType.CONTACT_ENROLLED, (data) => {
        options.onEnrolled?.(data);
        handleUpdate();
      }));
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [isConnected, subscribe, options, queryClient]);
}

/**
 * Combined hook for dashboard real-time updates
 * Use this in your main dashboard component
 */
export function useDashboardRealtime() {
  const { isConnected, error } = useWebSocket();
  const queryClient = useQueryClient();

  // Auto-refresh data on key events
  useReplyNotifications({
    onReply: () => {
      // Replies already invalidate queries in the hook
    },
  });

  useSystemAlerts();

  useJobEvents({
    onJobCompleted: (event) => {
      // Refresh relevant data based on job type
      if (event.jobType.includes('scraper') || event.jobType.includes('lead')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      }
      if (event.jobType.includes('campaign') || event.jobType.includes('enroll')) {
        queryClient.invalidateQueries({ queryKey: queryKeys.campaigns.all });
      }
    },
  });

  const queueStatus = useQueueStatus();

  return {
    isConnected,
    error,
    queueStatus,
  };
}

export default useWebSocket;



