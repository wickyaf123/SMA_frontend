import { cn } from '@/lib/utils';
import { Bot, User, ThumbsUp, ThumbsDown, Download } from 'lucide-react';
import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ConfirmationCard } from './ConfirmationCard';
import { InlineForm } from './InlineForm';
import { QuickReplyButtons } from './QuickReplyButtons';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'tool_result';
  content: string;
  toolCalls?: Array<{ id: string; name: string; input: any }>;
  toolResults?: Array<{ tool_use_id: string; content: string }>;
  createdAt: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onSendMessage?: (message: string) => void;
}

function tryParseJson(raw: string): any | null {
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

/**
 * While streaming, strip any trailing unclosed code fence so we don't flash
 * raw JSON to the user. Returns [visibleContent, hasHiddenBlock].
 */
function stripTrailingOpenCodeFence(content: string): [string, boolean] {
  const lastOpen = content.lastIndexOf('```');
  if (lastOpen === -1) return [content, false];
  const afterOpen = content.slice(lastOpen + 3);
  const hasClosure = afterOpen.includes('```');
  if (!hasClosure) {
    return [content.slice(0, lastOpen).trimEnd(), true];
  }
  return [content, false];
}

export const MessageBubble = ({ message, isStreaming, onSendMessage }: MessageBubbleProps) => {
  const [interactedIds, setInteractedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showFeedbackComment, setShowFeedbackComment] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleFeedback = async (rating: 'up' | 'down') => {
    try {
      if (rating === 'down' && !showFeedbackComment) {
        setShowFeedbackComment(true);
        setFeedback(rating);
        return;
      }

      await fetch(`${API_BASE_URL}/api/v1/chat/messages/${message.id}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(import.meta.env.VITE_API_KEY
            ? { Authorization: `Bearer ${import.meta.env.VITE_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({ rating, comment: feedbackComment || undefined }),
      });
      setFeedback(rating);
      setShowFeedbackComment(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const markInteracted = useCallback((id: string) => {
    setInteractedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleConfirmAction = useCallback((id: string, value: string) => {
    markInteracted(id);
    onSendMessage?.(`CONFIRM:${id}:${value}`);
  }, [markInteracted, onSendMessage]);

  const handleFormSubmit = useCallback((id: string, data: Record<string, any>) => {
    markInteracted(id);
    onSendMessage?.(`FORM:${id}:${JSON.stringify(data)}`);
  }, [markInteracted, onSendMessage]);

  const handleButtonSelect = useCallback((id: string, value: string) => {
    markInteracted(id);
    onSendMessage?.(`BUTTON:${id}:${value}`);
  }, [markInteracted, onSendMessage]);

  const markdownComponents: Components = useMemo(() => ({
    table: ({ children, ...props }) => (
      <div className="my-3 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm" {...props}>{children}</table>
      </div>
    ),
    thead: ({ children, ...props }) => (
      <thead className="bg-muted/60 border-b border-border/60" {...props}>{children}</thead>
    ),
    th: ({ children, ...props }) => (
      <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider" {...props}>{children}</th>
    ),
    td: ({ children, ...props }) => (
      <td className="px-3 py-2 border-t border-border/30 text-foreground" {...props}>{children}</td>
    ),
    tr: ({ children, ...props }) => (
      <tr className="hover:bg-muted/30 transition-colors" {...props}>{children}</tr>
    ),
    h1: ({ children, ...props }) => (
      <h1 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props}>{children}</h1>
    ),
    h2: ({ children, ...props }) => (
      <h2 className="text-base font-bold mt-3 mb-1.5 text-foreground flex items-center gap-2" {...props}>{children}</h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="text-sm font-semibold mt-2.5 mb-1 text-foreground" {...props}>{children}</h3>
    ),
    p: ({ children, ...props }) => (
      <p className="mb-2 last:mb-0 leading-relaxed" {...props}>{children}</p>
    ),
    ul: ({ children, ...props }) => (
      <ul className="mb-2 ml-1 space-y-1" {...props}>{children}</ul>
    ),
    ol: ({ children, ...props }) => (
      <ol className="mb-2 ml-1 space-y-1 list-decimal list-inside" {...props}>{children}</ol>
    ),
    li: ({ children, ...props }) => (
      <li className="text-foreground flex items-start gap-2" {...props}>
        <span className="text-primary mt-1.5 text-[6px]">●</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    strong: ({ children, ...props }) => (
      <strong className="font-semibold text-foreground" {...props}>{children}</strong>
    ),
    em: ({ children, ...props }) => (
      <em className="text-muted-foreground italic" {...props}>{children}</em>
    ),
    code: ({ children, className, ...props }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="px-1.5 py-0.5 rounded-md bg-muted/80 text-primary text-[13px] font-mono" {...props}>{children}</code>
        );
      }

      // Hide interactive blocks while still streaming — only show once complete
      const isJerryBlock = className?.includes('language-jerry:');
      if (isJerryBlock && isStreaming) return null;

      // Detect jerry:* interactive language tags
      if (className?.includes('language-jerry:confirm')) {
        const raw = String(children).replace(/\n$/, '');
        const parsed = tryParseJson(raw);
        if (parsed && parsed.id) {
          return (
            <ConfirmationCard
              id={parsed.id}
              title={parsed.title || 'Confirm'}
              description={parsed.description || ''}
              actions={parsed.actions || []}
              onAction={handleConfirmAction}
              disabled={interactedIds.has(parsed.id)}
            />
          );
        }
      }

      if (className?.includes('language-jerry:form')) {
        const raw = String(children).replace(/\n$/, '');
        const parsed = tryParseJson(raw);
        if (parsed && parsed.id) {
          return (
            <InlineForm
              id={parsed.id}
              title={parsed.title || 'Form'}
              fields={parsed.fields || []}
              submitLabel={parsed.submitLabel || 'Submit'}
              onSubmit={handleFormSubmit}
              disabled={interactedIds.has(parsed.id)}
            />
          );
        }
      }

      if (className?.includes('language-jerry:buttons')) {
        const raw = String(children).replace(/\n$/, '');
        const parsed = tryParseJson(raw);
        if (parsed && parsed.id) {
          return (
            <QuickReplyButtons
              id={parsed.id}
              label={parsed.label || ''}
              options={parsed.options || []}
              onSelect={handleButtonSelect}
              disabled={interactedIds.has(parsed.id)}
            />
          );
        }
      }

      // Fallback: detect interactive JSON even without jerry:* language tags
      if (isStreaming) {
        return (
          <code className={cn("block overflow-x-auto rounded-lg bg-[#0d1117] text-gray-300 p-3 text-[13px] font-mono my-2", className)} {...props}>
            {children}
          </code>
        );
      }
      const fallbackRaw = String(children).replace(/\n$/, '');
      const fallbackParsed = tryParseJson(fallbackRaw);
      if (fallbackParsed && fallbackParsed.id) {
        if (Array.isArray(fallbackParsed.options) && fallbackParsed.options.length > 0) {
          return (
            <QuickReplyButtons
              id={fallbackParsed.id}
              label={fallbackParsed.label || ''}
              options={fallbackParsed.options}
              onSelect={handleButtonSelect}
              disabled={interactedIds.has(fallbackParsed.id)}
            />
          );
        }
        if (Array.isArray(fallbackParsed.actions) && fallbackParsed.actions.length > 0) {
          return (
            <ConfirmationCard
              id={fallbackParsed.id}
              title={fallbackParsed.title || 'Confirm'}
              description={fallbackParsed.description || ''}
              actions={fallbackParsed.actions}
              onAction={handleConfirmAction}
              disabled={interactedIds.has(fallbackParsed.id)}
            />
          );
        }
        if (Array.isArray(fallbackParsed.fields) && fallbackParsed.fields.length > 0) {
          return (
            <InlineForm
              id={fallbackParsed.id}
              title={fallbackParsed.title || 'Form'}
              fields={fallbackParsed.fields}
              submitLabel={fallbackParsed.submitLabel || 'Submit'}
              onSubmit={handleFormSubmit}
              disabled={interactedIds.has(fallbackParsed.id)}
            />
          );
        }
      }

      // Default code block rendering
      return (
        <code className={cn("block overflow-x-auto rounded-lg bg-[#0d1117] text-gray-300 p-3 text-[13px] font-mono my-2", className)} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => (
      <pre className="my-2 overflow-x-auto rounded-lg bg-[#0d1117] p-3" {...props}>{children}</pre>
    ),
    blockquote: ({ children, ...props }) => (
      <blockquote className="border-l-2 border-primary/50 pl-3 my-2 text-muted-foreground italic" {...props}>{children}</blockquote>
    ),
    hr: (props) => (
      <hr className="my-3 border-border/50" {...props} />
    ),
    a: ({ children, href, ...props }) => {
      // Render download links as buttons
      if (href?.includes('/api/v1/chat/exports/')) {
        return (
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}${href}`}
            download
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            {...props}
          >
            <Download className="w-3.5 h-3.5" />
            {children || 'Download CSV'}
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" {...props}>{children}</a>
      );
    },
  }), [isStreaming, interactedIds, handleConfirmAction, handleFormSubmit, handleButtonSelect]);

  if (message.role === 'tool_result') return null;

  const isUser = message.role === 'user';

  const [displayContent, hasHiddenBlock] = isStreaming && !isUser
    ? stripTrailingOpenCodeFence(message.content)
    : [message.content, false];

  return (
    <div className={cn('group flex gap-4 w-full', isUser ? 'flex-row-reverse' : '')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={cn("flex flex-col gap-1.5 min-w-0", isUser ? "items-end max-w-[70%]" : "max-w-[85%]")}>
        {displayContent && (
          <div className={cn(
            'text-[15px] leading-relaxed',
            isUser
              ? 'bg-[#2f2f2f] text-[#ececec] px-5 py-2.5 rounded-3xl'
              : 'text-[#ececec] py-1'
          )}>
            {isUser ? (
              <span className="whitespace-pre-wrap break-words leading-relaxed">{displayContent}</span>
            ) : (
              <div className="prose-chat">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {displayContent}
                </ReactMarkdown>
              </div>
            )}
            {isStreaming && hasHiddenBlock && (
              <div className="flex items-center gap-2 mt-2 text-[13px] text-muted-foreground">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
                <span>Preparing options…</span>
              </div>
            )}
            {isStreaming && !hasHiddenBlock && (
              <span className="inline-block w-2 h-5 bg-primary/60 ml-0.5 animate-pulse rounded-sm align-middle" />
            )}
          </div>
        )}
        {!isUser && !isStreaming && message.content && (
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleFeedback('up')}
              className={cn(
                'p-1 rounded hover:bg-[#2f2f2f] transition-colors',
                feedback === 'up' ? 'text-green-400' : 'text-[#666666] hover:text-[#ececec]'
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              className={cn(
                'p-1 rounded hover:bg-[#2f2f2f] transition-colors',
                feedback === 'down' ? 'text-red-400' : 'text-[#666666] hover:text-[#ececec]'
              )}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            {showFeedbackComment && (
              <div className="flex items-center gap-1 ml-2">
                <input
                  type="text"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="What went wrong?"
                  className="h-6 px-2 text-xs bg-[#1a1a1a] border border-[#333333] rounded text-[#ececec] placeholder:text-[#666666] focus:outline-none focus:border-[#555555] w-40"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleFeedback('down');
                    if (e.key === 'Escape') setShowFeedbackComment(false);
                  }}
                />
                <button
                  onClick={() => handleFeedback('down')}
                  className="text-xs text-primary hover:underline"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
