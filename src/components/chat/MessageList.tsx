import { useEffect, useRef, useCallback } from 'react';
import { MessageBubble, ChatMessage } from './MessageBubble';
import { AgentSteps, ToolStep } from './AgentSteps';
import { WorkflowProgress } from './WorkflowProgress';
import { JobNotificationCard } from './JobNotificationCard';
import type { ActiveWorkflow, ActiveJob } from '@/hooks/useChat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, Search, UserPlus, BarChart3, Zap, Mail, HeartPulse } from 'lucide-react';

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

const suggestions = [
  { text: 'Create a new contact for a lead', icon: UserPlus },
  { text: 'Enroll contacts into a campaign', icon: Mail },
  { text: 'Check system health', icon: HeartPulse },
  { text: 'Show pipeline status and active jobs', icon: Zap },
  { text: 'Search for solar permits in my area', icon: Search },
  { text: 'Show campaign analytics', icon: BarChart3 },
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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  return (
    <ScrollArea className="flex-1 px-4">
      <div className="max-w-3xl mx-auto py-6 space-y-5">
        {/* Empty state */}
        {filteredMessages.length === 0 && !isStreaming && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              <Bot className="w-7 h-7 text-black" />
            </div>
            <h2 className="text-2xl font-medium mb-3 text-[#ececec]">Hey, I'm Jerry</h2>
            <p className="text-[#ececec]/60 max-w-md mb-10 text-[15px]">
              Your AI assistant for PermitScraper.ai. Ask me about permits, contacts, campaigns, or anything in your pipeline.
            </p>
            <div className="grid grid-cols-2 gap-3 max-w-2xl w-full">
              {suggestions.map(({ text, icon: Icon }) => (
                <button
                  key={text}
                  onClick={() => onSendMessage?.(text)}
                  className="flex items-center gap-3 px-4 py-3.5 text-sm text-left bg-[#2f2f2f] hover:bg-[#383838] rounded-xl text-[#ececec]/80 hover:text-[#ececec] transition-colors border border-transparent hover:border-[#404040] group"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#212121] group-hover:bg-[#2f2f2f] transition-colors">
                    <Icon className="w-4 h-4 shrink-0 text-[#ececec]/60 group-hover:text-[#ececec] transition-colors" />
                  </div>
                  <span className="line-clamp-2 leading-relaxed">{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {filteredMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSendMessage={onSendMessage}
          />
        ))}

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

        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
};
