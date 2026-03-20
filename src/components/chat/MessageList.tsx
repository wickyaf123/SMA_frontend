import { useEffect, useRef, useCallback } from 'react';
import { MessageBubble, ChatMessage } from './MessageBubble';
import { AgentSteps, ToolStep } from './AgentSteps';
import { WorkflowProgress } from './WorkflowProgress';
import { JobNotificationCard } from './JobNotificationCard';
import type { ActiveWorkflow, ActiveJob } from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, BarChart3, Zap, Sparkles, MapPin, Trash2, Calendar, Flame } from 'lucide-react';

interface MessageListProps {
  messages: ChatMessage[];
  streamingMessage?: string;
  isStreaming?: boolean;
  toolSteps?: ToolStep[];
  isThinking?: boolean;
  onSendMessage?: (content: string) => void;
  activeWorkflows?: ActiveWorkflow[];
  activeJobs?: ActiveJob[];
  isLoading?: boolean;
}

const quickActions = [
  { text: 'Search for permits in my area', icon: Search },
  { text: 'Show campaign analytics', icon: BarChart3 },
  { text: 'Show pipeline status and active jobs', icon: Zap },
];

const workflowPresets = [
  {
    text: "Run weekly prospecting",
    description: "New permits · enrich · surface net-new leads",
    icon: Sparkles,
    trigger: "Run the weekly prospecting workflow",
  },
  {
    text: "End of month review",
    description: "Reply rates · open rates · cost per warm lead",
    icon: Calendar,
    trigger: "Run the end of month performance review",
  },
  {
    text: "Bad data cleanup",
    description: "Missing emails · dupes · 90-day no-engagement",
    icon: Trash2,
    trigger: "Run the bad data cleanup workflow",
  },
  {
    text: "New market test run",
    description: "Sample 25 permits · check fill rates before committing",
    icon: MapPin,
    trigger: "Run a new market test run",
  },
  {
    text: "Warm lead fast-track",
    description: "Pause sequence · create opportunity · send Calendly SMS",
    icon: Flame,
    trigger: "Run the warm lead fast-track workflow",
  },
];

export const MessageList = ({
  messages,
  streamingMessage,
  isStreaming,
  toolSteps = [],
  isThinking,
  onSendMessage,
  activeWorkflows = [],
  activeJobs = [],
  isLoading,
}: MessageListProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const userHasScrolledUp = useRef(false);
  const prevMessageCount = useRef(0);
  const prevUserMessageCount = useRef(0);

  // Track scroll position to detect when user scrolls up
  useEffect(() => {
    const root = scrollAreaRef.current;
    if (!root) return;
    const viewport = root.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      userHasScrolledUp.current = distanceFromBottom > 100;
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll only when user hasn't scrolled up, or when a new user message is sent
  useEffect(() => {
    const currentUserMsgCount = messages.filter(m => m.role === 'user').length;
    const newUserMessage = currentUserMsgCount > prevUserMessageCount.current;
    prevUserMessageCount.current = currentUserMsgCount;

    if (newUserMessage) {
      userHasScrolledUp.current = false;
    }

    if (!userHasScrolledUp.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    prevMessageCount.current = messages.length;
  }, [messages, streamingMessage, toolSteps, activeWorkflows, activeJobs]);

  const handleCancelWorkflow = useCallback((workflowId: string) => {
    onSendMessage?.(`CANCEL_WORKFLOW:${workflowId}`);
  }, [onSendMessage]);

  const filteredMessages = messages.filter(m => {
    if (m.role === 'tool_result') return false;
    // Hide protocol messages (BUTTON:, CONFIRM:, FORM:, SYSTEM_EVENT:) from display
    if (m.role === 'user' && /^(BUTTON|CONFIRM|FORM|SYSTEM_EVENT|CANCEL_WORKFLOW):/.test(m.content)) return false;
    return true;
  });

  // THE-14: Collapse consecutive "no results" assistant messages
  const isNoResultsMessage = (content: string) =>
    /0 results found|no contractors matched|completed with 0 results/i.test(content);

  const collapsedIds = new Set<string>();
  for (let i = 1; i < filteredMessages.length; i++) {
    const curr = filteredMessages[i];
    if (curr.role !== 'assistant' || !isNoResultsMessage(curr.content)) continue;
    // Look backwards for the previous assistant message
    for (let j = i - 1; j >= 0; j--) {
      if (filteredMessages[j].role === 'assistant') {
        if (isNoResultsMessage(filteredMessages[j].content)) {
          collapsedIds.add(filteredMessages[j].id);
        }
        break;
      }
    }
  }

  return (
    <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
      <div className="max-w-3xl mx-auto py-6 space-y-5 min-h-full flex flex-col">
        {/* Empty state */}
        {filteredMessages.length === 0 && !isStreaming && !isLoading && (
          <div className="flex-1 flex flex-col items-center justify-center text-center pb-12">
            <h2 className="text-3xl font-medium mb-8 text-foreground">What can I help with?</h2>

            {/* Workflow presets */}
            <div className="w-full max-w-2xl mb-6">
              <p className="text-xs font-medium text-foreground/40 uppercase tracking-widest mb-3 text-left">Workflow Presets</p>
              <div className="grid grid-cols-1 gap-2">
                {workflowPresets.map(({ text, description, icon: Icon, trigger }) => (
                  <button
                    key={text}
                    onClick={() => onSendMessage?.(trigger)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-left bg-muted hover:bg-accent rounded-xl text-foreground/80 hover:text-foreground transition-colors border border-transparent hover:border-border group"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-card group-hover:bg-muted transition-colors shrink-0">
                      <Icon className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition-colors" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-foreground/90 group-hover:text-foreground leading-tight">{text}</div>
                      <div className="text-xs text-foreground/40 mt-0.5 leading-tight">{description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="w-full max-w-2xl">
              <p className="text-xs font-medium text-foreground/40 uppercase tracking-widest mb-3 text-left">Quick Actions</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {quickActions.map(({ text, icon: Icon }) => (
                  <button
                    key={text}
                    onClick={() => onSendMessage?.(text)}
                    className="flex items-center gap-2.5 px-3 py-3 text-sm text-left bg-muted hover:bg-accent rounded-xl text-foreground/80 hover:text-foreground transition-colors border border-transparent hover:border-border group"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-card group-hover:bg-muted transition-colors shrink-0">
                      <Icon className="w-3.5 h-3.5 text-foreground/60 group-hover:text-foreground transition-colors" />
                    </div>
                    <span className="line-clamp-2 leading-relaxed text-xs">{text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex flex-col space-y-5 flex-1">
          {filteredMessages.map((message) => {
            if (collapsedIds.has(message.id)) {
              // Extract city from the no-results message
              const cityMatch = message.content.match(/in\s+([A-Za-z\s]+?)(?:\s+completed|\s*\.|,)/);
              const city = cityMatch?.[1]?.trim() || 'previous area';
              return (
                <div key={message.id} className="text-xs text-muted-foreground/60 py-1 pl-12">
                  Previous search: no results for {city}
                </div>
              );
            }
            return (
              <MessageBubble
                key={message.id}
                message={message}
                onSendMessage={onSendMessage}
              />
            );
          })}

          {/* Agent steps — shown while tools are running */}
          {isStreaming && (toolSteps.length > 0 || (isThinking && !streamingMessage)) && (
            <AgentSteps steps={toolSteps} isThinking={isThinking && !streamingMessage && toolSteps.length === 0} />
          )}

          {/* Active workflow progress cards */}
          {activeWorkflows.length > 0 && activeWorkflows.map((workflow) => (
            <div key={workflow.workflowId} className="flex gap-3 max-w-[90%] mr-auto">
              <div className="w-8 shrink-0" />
              <WorkflowProgress
                workflowId={workflow.workflowId}
                name={workflow.name}
                status={workflow.status}
                steps={workflow.steps}
                totalSteps={workflow.totalSteps}
                completedSteps={workflow.completedSteps}
                startedAt={workflow.startedAt}
                onCancel={handleCancelWorkflow}
              />
            </div>
          ))}

          {/* Active job notification cards */}
          {activeJobs.length > 0 && activeJobs.map((job) => (
            <JobNotificationCard key={job.jobId} job={job} />
          ))}

          {/* Streaming message */}
          {isStreaming && streamingMessage && (
            <MessageBubble
              message={{
                id: 'streaming',
                conversationId: '',
                role: 'assistant',
                content: streamingMessage,
                createdAt: new Date().toISOString(),
              }}
              isStreaming={true}
              onSendMessage={onSendMessage}
            />
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      </div>
    </ScrollArea>
  );
};
