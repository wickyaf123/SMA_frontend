import { useState, useCallback, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatMessage } from './MessageBubble';
import { ToolStep } from './AgentSteps';
import type { ActiveWorkflow, ActiveJob } from '@/hooks/useChat';
import { Send, Square, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatViewProps {
  messages: ChatMessage[];
  streamingMessage?: string;
  isStreaming?: boolean;
  toolSteps?: ToolStep[];
  isThinking?: boolean;
  onSendMessage: (content: string) => void;
  onCancelStream?: () => void;
  isLoading?: boolean;
  activeWorkflows?: ActiveWorkflow[];
  activeJobs?: ActiveJob[];
  conversationId?: string;
}

export const ChatView = ({
  messages,
  streamingMessage,
  isStreaming,
  toolSteps,
  isThinking,
  onSendMessage,
  onCancelStream,
  isLoading,
  activeWorkflows,
  activeJobs,
  conversationId,
}: ChatViewProps) => {
  const [input, setInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/chat/conversations/${conversationId}/upload`,
        {
          method: 'POST',
          headers: {
            ...(import.meta.env.VITE_API_KEY
              ? { Authorization: `Bearer ${import.meta.env.VITE_API_KEY}` }
              : {}),
          },
          body: formData,
        }
      );

      const data = await response.json();
      if (data.success && data.data) {
        const { rowCount, columns } = data.data;
        onSendMessage(`SYSTEM_EVENT:file_uploaded:User uploaded a CSV file "${file.name}" with ${rowCount} rows. Columns: ${columns.join(', ')}. Use the uploaded data to help the user.`);
      }
    } catch (error) {
      console.error('File upload failed:', error);
    }

    // Reset the input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [conversationId, onSendMessage]);

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
    <div className="flex flex-col flex-1 min-h-0">
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

      <div className="bg-transparent px-4 pb-4 pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col bg-[#2f2f2f] rounded-3xl p-1.5 focus-within:bg-[#333333] transition-colors border border-transparent focus-within:border-[#444444]">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jerry anything..."
              className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-[#ececec] placeholder:text-[#ececec]/50 px-4 py-3.5"
              rows={1}
              disabled={isLoading}
            />
            <div className="flex justify-between items-center px-2 pb-1.5">
              <div className="flex items-center gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming || isLoading || !conversationId}
                  size="icon"
                  variant="ghost"
                  className="shrink-0 h-8 w-8 rounded-full text-[#ececec]/60 hover:text-[#ececec] hover:bg-[#404040] disabled:opacity-30 transition-colors"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={isStreaming ? onCancelStream : handleSend}
                  disabled={isStreaming ? false : (!input.trim() || isLoading)}
                  size="icon"
                  className="shrink-0 h-8 w-8 rounded-full bg-[#ececec] text-black hover:bg-white disabled:bg-[#ececec]/20 disabled:text-[#ececec]/40 transition-colors"
                >
                  {isStreaming ? (
                    <Square className="w-3.5 h-3.5" />
                  ) : (
                    <Send className="w-4 h-4 translate-x-[-1px] translate-y-[1px]" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-[#ececec]/40 text-center mt-3 mb-1">
            Jerry can create contacts, manage campaigns, trigger jobs, search permits, and more.
          </p>
        </div>
      </div>
    </div>
  );
};
