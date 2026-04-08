import { Loader2 } from 'lucide-react';

interface SearchProgressIndicatorProps {
  message: string;
  phase?: string;
}

export const SearchProgressIndicator = ({ message, phase }: SearchProgressIndicatorProps) => {
  return (
    <div className="flex gap-3 max-w-[90%] mr-auto">
      <div className="w-8 shrink-0" />
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-muted/50 border border-border/30 animate-in fade-in slide-in-from-bottom-1 duration-300">
        <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
};
