import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';
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

export const MessageBubble = ({ message, isStreaming, onSendMessage }: MessageBubbleProps) => {
  const [interactedIds, setInteractedIds] = useState<Set<string>>(new Set());

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
    a: ({ children, href, ...props }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" {...props}>{children}</a>
    ),
  }), [interactedIds, handleConfirmAction, handleFormSubmit, handleButtonSelect]);

  if (message.role === 'tool_result') return null;

  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-4 w-full', isUser ? 'flex-row-reverse' : '')}>
      <div className={cn(
        'w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5',
        isUser
          ? 'bg-[#2f2f2f] text-[#ececec]'
          : 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.1)]'
      )}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>

      <div className={cn("flex flex-col gap-1.5 min-w-0", isUser ? "items-end max-w-[70%]" : "max-w-[85%]")}>
        {message.content && (
          <div className={cn(
            'text-[15px] leading-relaxed',
            isUser
              ? 'bg-[#2f2f2f] text-[#ececec] px-5 py-3 rounded-3xl rounded-tr-sm'
              : 'text-[#ececec] py-1'
          )}>
            {isUser ? (
              <span className="whitespace-pre-wrap break-words leading-relaxed">{message.content}</span>
            ) : (
              <div className="prose-chat">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            )}
            {isStreaming && (
              <span className="inline-block w-2 h-5 bg-primary/60 ml-0.5 animate-pulse rounded-sm align-middle" />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
