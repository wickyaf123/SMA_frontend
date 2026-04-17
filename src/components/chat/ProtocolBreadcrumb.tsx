import { CheckCircle2, XCircle, MousePointerClick, FormInput, Ban } from 'lucide-react';
import type { ChatMessage } from './MessageBubble';

function humanize(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseBreadcrumb(content: string): { label: string; value: string; Icon: typeof CheckCircle2 } {
  if (content.startsWith('BUTTON:')) {
    const rest = content.slice('BUTTON:'.length);
    const firstColon = rest.indexOf(':');
    const raw = firstColon === -1 ? rest : rest.slice(firstColon + 1);
    return { label: 'You selected', value: humanize(raw), Icon: MousePointerClick };
  }
  if (content.startsWith('CONFIRM:')) {
    const rest = content.slice('CONFIRM:'.length);
    const firstColon = rest.indexOf(':');
    const action = firstColon === -1 ? rest : rest.slice(firstColon + 1);
    const isConfirm = /^(confirm|yes|proceed|ok)$/i.test(action.trim());
    return isConfirm
      ? { label: 'You confirmed', value: '', Icon: CheckCircle2 }
      : { label: 'You declined', value: humanize(action), Icon: XCircle };
  }
  if (content.startsWith('FORM:')) {
    const rest = content.slice('FORM:'.length);
    const firstColon = rest.indexOf(':');
    const jsonPart = firstColon === -1 ? rest : rest.slice(firstColon + 1);
    let summary = '';
    try {
      const data = JSON.parse(jsonPart);
      if (data && typeof data === 'object') {
        summary = Object.entries(data)
          .filter(([, v]) => v !== null && v !== undefined && v !== '')
          .slice(0, 4)
          .map(([k, v]) => `${humanize(k)}: ${Array.isArray(v) ? v.join(', ') : v}`)
          .join(' · ');
      } else {
        summary = String(data);
      }
    } catch {
      summary = jsonPart;
    }
    return { label: 'You submitted', value: summary, Icon: FormInput };
  }
  if (content.startsWith('CANCEL_WORKFLOW:')) {
    return { label: 'You cancelled the workflow', value: '', Icon: Ban };
  }
  return { label: 'You responded', value: content, Icon: MousePointerClick };
}

export const ProtocolBreadcrumb = ({ message }: { message: ChatMessage }) => {
  const { label, value, Icon } = parseBreadcrumb(message.content);
  return (
    <div className="flex items-center gap-2 pl-12 py-0.5 text-[11px] text-muted-foreground/70">
      <Icon className="w-3 h-3 shrink-0 opacity-60" />
      <span className="italic">{label}</span>
      {value && (
        <span className="text-foreground/70 font-medium truncate max-w-[60%]" title={value}>
          {value}
        </span>
      )}
    </div>
  );
};
