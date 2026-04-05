import { useState, useCallback, useRef } from 'react';
import { MessageList } from './MessageList';
import { ChatMessage } from './MessageBubble';
import { ToolStep } from './AgentSteps';
import type { ActiveWorkflow, ActiveJob } from '@/hooks/useChat';
import { Send, Square, Paperclip, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  onPauseJob?: (jobId: string) => void;
  onResumeJob?: (jobId: string) => void;
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
  onPauseJob,
  onResumeJob,
}: ChatViewProps) => {
  const [input, setInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({ title: 'Invalid file type', description: 'Only CSV files are supported.', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Maximum file size is 5MB.', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const data = await api.chat.uploadFile(conversationId!, file);
      if (data.success && data.data) {
        const { rowCount, columns } = data.data;
        onSendMessage(`SYSTEM_EVENT:file_uploaded:User uploaded a CSV file "${file.name}" with ${rowCount} rows. Columns: ${columns.join(', ')}. Use the uploaded data to help the user.`);
        toast({ title: 'File uploaded', description: `${file.name} uploaded successfully.` });
        setUploadedFileName(file.name);
      }
    } catch (error) {
      toast({ title: 'Upload failed', description: 'Could not upload the file. Please try again.', variant: 'destructive' });
      setUploadedFileName('');
    } finally {
      setIsUploading(false);
    }

    // Reset the input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [conversationId, onSendMessage, toast]);

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
        onPauseJob={onPauseJob}
        onResumeJob={onResumeJob}
      />

      <div className="bg-transparent px-4 pb-[env(safe-area-inset-bottom,16px)] pt-2">
        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col bg-muted rounded-3xl p-1.5 focus-within:bg-muted transition-colors border border-transparent focus-within:border-border/80">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Jerry anything..."
              className="min-h-[52px] max-h-[200px] resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 text-foreground placeholder:text-muted-foreground px-4 py-3.5"
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
                  disabled={isStreaming || isLoading || isUploading || !conversationId}
                  size="icon"
                  variant="ghost"
                  aria-label="Attach file"
                  className="shrink-0 h-8 w-8 rounded-full text-foreground/60 hover:text-foreground hover:bg-accent disabled:opacity-30 transition-colors"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </Button>
                {uploadedFileName && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-medium max-w-[140px]">
                    <span className="truncate">{uploadedFileName}</span>
                    <button
                      onClick={() => setUploadedFileName(null)}
                      aria-label="Remove file"
                      className="shrink-0 hover:text-primary/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  onClick={isStreaming ? onCancelStream : handleSend}
                  disabled={isStreaming ? false : (!input.trim() || isLoading)}
                  size="icon"
                  aria-label={isStreaming ? 'Stop generating' : 'Send message'}
                  className="shrink-0 h-8 w-8 rounded-full bg-foreground text-black hover:bg-white disabled:bg-foreground/20 disabled:text-foreground/40 transition-colors"
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
          <p className="text-[11px] text-muted-foreground/60 text-center mt-3 mb-1">
            Jerry can create contacts, manage campaigns, trigger jobs, search permits, and more.
          </p>
        </div>
      </div>
    </div>
  );
};
