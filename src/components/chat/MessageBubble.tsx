import { cn } from '@/lib/utils';
import { User, ThumbsUp, ThumbsDown, Download, Copy, Check } from 'lucide-react';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { ConfirmationCard } from './ConfirmationCard';
import { InlineForm } from './InlineForm';
import { QuickReplyButtons } from './QuickReplyButtons';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

/**
 * Format a date string into a relative time label (e.g. "just now", "2m ago", "1h ago").
 */
function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);

  if (diffSec < 5) return 'just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;

  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * CopyButton: small icon button that copies text to clipboard with "Copied!" feedback.
 */
function CopyButton({ text, className, label = 'Copy' }: { text: string; className?: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently fail on clipboard error
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      className={cn(
        'inline-flex items-center gap-1 px-1.5 py-1 rounded text-[11px] font-medium transition-colors',
        copied
          ? 'text-emerald-500'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        className,
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

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
  onStartWizard?: (type: 'contractor' | 'homeowner') => void;
  /** When true, the message should display its timestamp (used for time clustering). */
  showTimestamp?: boolean;
}

function tryParseJson(raw: string): any | null {
  try {
    return JSON.parse(raw.trim());
  } catch {
    return null;
  }
}

/**
 * Catch jerry:confirm / jerry:form / jerry:buttons blocks that the LLM emitted
 * without wrapping in triple-backtick code fences. Wraps them so ReactMarkdown
 * can hand them to the custom `code` component for interactive rendering.
 */
function ensureJerryBlocksFenced(content: string): string {
  return content.replace(
    /(?:^|\n)\s*jerry:(confirm|form|buttons)\s*\n(\s*\{[\s\S]*?\n\s*\})/gm,
    '\n```jerry:$1\n$2\n```',
  );
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

export const MessageBubble = ({ message, isStreaming, onSendMessage, onStartWizard, showTimestamp = true }: MessageBubbleProps) => {
  const [interactedIds, setInteractedIds] = useState<Set<string>>(new Set());
  const [feedback, setFeedback] = useState<'up' | 'down' | null>(null);
  const [showFeedbackComment, setShowFeedbackComment] = useState(false);
  const [feedbackComment, setFeedbackComment] = useState('');
  const { toast } = useToast();

  const handleFeedback = async (rating: 'up' | 'down') => {
    try {
      if (rating === 'down' && !showFeedbackComment) {
        setShowFeedbackComment(true);
        setFeedback(rating);
        return;
      }

      await api.chat.sendFeedback(message.id, rating, feedbackComment || undefined);
      setFeedback(rating);
      setShowFeedbackComment(false);
      toast({
        title: 'Feedback sent',
        description: rating === 'up' ? 'Thanks for the positive feedback!' : 'Thanks for the feedback. We\'ll work on improving.',
      });
    } catch (error) {
      toast({ title: 'Feedback failed', description: 'Could not submit feedback.', variant: 'destructive' });
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
              multiSelect={parsed.multiSelect}
            />
          );
        }
      }

      // Fallback: detect interactive JSON even without jerry:* language tags
      if (isStreaming) {
        return (
          <code className={cn("block overflow-x-auto rounded-lg bg-muted text-foreground p-3 text-[13px] font-mono my-2", className)} {...props}>
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
              multiSelect={fallbackParsed.multiSelect}
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

      // Default code block rendering (copy button is on the parent <pre> element)
      return (
        <code className={cn("block overflow-x-auto rounded-lg bg-muted text-foreground p-3 text-[13px] font-mono my-2", className)} {...props}>
          {children}
        </code>
      );
    },
    pre: ({ children, ...props }) => {
      // Extract text content from the code child for copy
      const extractText = (node: any): string => {
        if (typeof node === 'string') return node;
        if (Array.isArray(node)) return node.map(extractText).join('');
        if (node?.props?.children) return extractText(node.props.children);
        return '';
      };
      const codeText = extractText(children).replace(/\n$/, '');
      return (
        <div className="relative group/code my-2">
          <div className="absolute right-2 top-2 z-10 opacity-0 group-hover/code:opacity-100 transition-opacity">
            <CopyButton text={codeText} label="Copy code" />
          </div>
          <pre className="overflow-x-auto rounded-lg bg-muted p-3" {...props}>{children}</pre>
        </div>
      );
    },
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

  const sanitizedContent = isUser ? message.content : ensureJerryBlocksFenced(message.content);

  // Detect [OPEN_WIZARD:contractor] or [OPEN_WIZARD:homeowner] signals in assistant messages
  const wizardSignalMatch = !isUser ? sanitizedContent.match(/\[OPEN_WIZARD:(contractor|homeowner)\]/) : null;
  const contentWithoutWizardSignal = wizardSignalMatch
    ? sanitizedContent.replace(/\[OPEN_WIZARD:(contractor|homeowner)\]/g, '').trim()
    : sanitizedContent;
  const wizardTriggeredRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (wizardSignalMatch && onStartWizard && !isStreaming) {
      const key = `${message.id}-${wizardSignalMatch[1]}`;
      if (!wizardTriggeredRef.current.has(key)) {
        wizardTriggeredRef.current.add(key);
        onStartWizard(wizardSignalMatch[1] as 'contractor' | 'homeowner');
      }
    }
  }, [wizardSignalMatch, onStartWizard, isStreaming, message.id]);

  const [displayContent, hasHiddenBlock] = isStreaming && !isUser
    ? stripTrailingOpenCodeFence(contentWithoutWizardSignal)
    : [contentWithoutWizardSignal, false];

  return (
    <div className={cn('group flex gap-4 w-full', isUser ? 'flex-row-reverse' : '')}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 bg-black shadow-[0_0_10px_rgba(255,255,255,0.1)]">
          <span className="text-white font-bold text-sm leading-none">J</span>
        </div>
      )}

      <div className={cn("flex flex-col gap-1.5 min-w-0", isUser ? "items-end max-w-[70%]" : "max-w-[85%]")}>
        {displayContent && (
          <div className={cn(
            'text-[15px] leading-relaxed',
            isUser
              ? 'bg-muted text-foreground px-5 py-2.5 rounded-3xl'
              : 'text-foreground py-1'
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
          <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 touch-device:opacity-100 transition-opacity">
            <CopyButton text={message.content} label="Copy message" />
            <button
              onClick={() => handleFeedback('up')}
              aria-label="Helpful"
              aria-pressed={feedback === 'up'}
              className={cn(
                'p-1 rounded hover:bg-muted transition-colors',
                feedback === 'up' ? 'text-green-400' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFeedback('down')}
              aria-label="Not helpful"
              aria-pressed={feedback === 'down'}
              className={cn(
                'p-1 rounded hover:bg-muted transition-colors',
                feedback === 'down' ? 'text-red-400' : 'text-muted-foreground hover:text-foreground'
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
                  className="h-6 px-2 text-xs bg-card border border-border rounded text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border w-40"
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

        {/* Timestamp */}
        {showTimestamp && !isStreaming && message.createdAt && (
          <span className={cn(
            'text-[11px] text-muted-foreground/60 select-none mt-0.5',
            isUser ? 'text-right' : 'text-left',
          )}>
            {formatRelativeTime(message.createdAt)}
          </span>
        )}
      </div>
    </div>
  );
};
