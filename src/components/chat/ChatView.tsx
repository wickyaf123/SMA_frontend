import { useState, useCallback } from 'react';
import { MessageList } from './MessageList';
import { ChatMessage } from './MessageBubble';
import { ToolStep } from './AgentSteps';
import type { ActiveWorkflow, ActiveJob } from '@/hooks/useChat';
import { Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatViewProps {
  messages: ChatMessage[];
  streamingMessage?: string;
  isStreaming?: boolean;
  toolSteps?: ToolStep[];
  isThinking?: boolean;
  onSendMessage: (content: string) => void;
  isLoading?: boolean;
  activeWorkflows?: ActiveWorkflow[];
  activeJobs?: ActiveJob[];
}

export const ChatView = ({
  messages,
  streamingMessage,
  isStreaming,
  toolSteps,
  isThinking,
  onSendMessage,
  isLoading,
  activeWorkflows,
  activeJobs,
}: ChatViewProps) => {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInput('');
  }, [input, isStreaming, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <MessageList
        messages={messages}
        streamingMessage={streamingMessage}
        isStreaming={isStreaming}
        toolSteps={toolSteps}
        isThinking={isThinking}
        onSendMessage={onSendMessage}
        activeWorkflows={activeWorkflows}
        activeJobs={activeJobs}
        isLoading={isLoading}
      />

      <div className="bg-transparent p-4 pb-6">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col bg-[#2f2f2f] rounded-2xl p-2 focus-within:ring-1 focus-within:ring-[#ececec]/20 transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jerry anything..."
              className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-[#ececec] placeholder:text-[#ececec]/40 p-3"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex justify-end p-1">
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isStreaming || isLoading}
                size="icon"
                className="shrink-0 h-8 w-8 rounded-full bg-white text-black hover:bg-[#ececec] disabled:bg-[#ececec]/10 disabled:text-[#ececec]/30 transition-colors"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-[#ececec]/40 text-center mt-3">
            Jerry can create contacts, manage campaigns, trigger jobs, search permits, and more.
          </p>
        </div>
      </div>
    </div>
  );
};
