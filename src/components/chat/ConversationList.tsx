import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Trash2, MessageSquare, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{ content: string; role: string; createdAt: string }>;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId?: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  sidebarOpen?: boolean;
  isCreating?: boolean;
}

export const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  sidebarOpen = true,
  isCreating = false,
}: ConversationListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await api.chat.searchConversations(searchQuery);
        if (data.success) {
          setSearchResults(data.data);
        }
      } catch (error) {
        toast({ title: 'Search failed', variant: 'destructive' });
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  return (
    <div className="flex flex-col h-full bg-black text-foreground">
      {/* New Chat Button */}
      <div className="px-3 pt-3 pb-2">
        <Button
          onClick={onNewConversation}
          disabled={isCreating}
          className={cn(
            "w-full gap-2 h-10 bg-transparent hover:bg-accent text-foreground border border-border transition-colors overflow-hidden",
            sidebarOpen ? "justify-start px-3" : "justify-center px-0"
          )}
          variant="outline"
        >
          <div className="flex items-center justify-center w-5 h-5 shrink-0 rounded-full bg-foreground text-black">
            <Plus className="w-3.5 h-3.5" />
          </div>
          {sidebarOpen && <span className="font-medium text-[13px] whitespace-nowrap">New Chat</span>}
        </Button>
      </div>

      {/* Search Input */}
      {sidebarOpen && (
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-8 pl-8 pr-8 text-xs bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-[2px]">
          {searchResults !== null ? (
            // Search results mode
            <>
              {searchResults.length === 0 && sidebarOpen && (
                <p className="text-xs text-muted-foreground text-center py-4">No results found</p>
              )}
              {sidebarOpen && searchResults.map((result) => (
                <div
                  key={result.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectConversation(result.id);
                    setSearchQuery('');
                    setSearchResults(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectConversation(result.id)}
                  className="group relative w-full flex flex-col py-2.5 px-3 rounded-lg text-left transition-colors cursor-pointer text-muted-foreground hover:bg-accent hover:text-foreground"
                >
                  <p className="truncate text-[13px] leading-tight text-foreground">
                    {result.title || 'New Chat'}
                  </p>
                  {result.matchingMessage && (
                    <p className="truncate text-[11px] leading-tight mt-1 text-muted-foreground">
                      {result.matchingMessage.content}
                    </p>
                  )}
                </div>
              ))}
            </>
          ) : (
            // Normal conversation list
            <>
              {conversations.length === 0 && sidebarOpen && (
                <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
              )}
              {sidebarOpen && conversations.map((convo) => (
                <div
                  key={convo.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectConversation(convo.id)}
                  onKeyDown={(e) => e.key === 'Enter' && onSelectConversation(convo.id)}
                  className={cn(
                    'group relative w-full flex items-center py-2.5 rounded-lg text-left transition-colors cursor-pointer px-3',
                    activeConversationId === convo.id
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="truncate text-[13px] leading-tight">
                      {convo.title || 'New Chat'}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "absolute right-0 top-0 bottom-0 w-12 flex items-center justify-end pr-2 rounded-r-lg opacity-0 group-hover:opacity-100 transition-opacity",
                      activeConversationId === convo.id ? "bg-gradient-to-l from-accent via-accent to-transparent opacity-100" : "bg-gradient-to-l from-accent via-accent to-transparent"
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(convo.id);
                      }}
                      className="p-1.5 text-muted-foreground hover:text-red-500 transition-colors"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
