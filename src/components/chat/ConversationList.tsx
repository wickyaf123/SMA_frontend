import { cn } from '@/lib/utils';
import { Plus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

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
}

export const ConversationList = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  sidebarOpen = true,
}: ConversationListProps) => {
  return (
    <div className="flex flex-col h-full bg-[#000000] text-[#ececec]">
      {/* New Chat Button */}
      <div className="px-3 pt-3 pb-2">
        <Button
          onClick={onNewConversation}
          className={cn(
            "w-full gap-2 h-10 bg-transparent hover:bg-[#202020] text-[#ececec] border border-[#333333] transition-colors overflow-hidden",
            sidebarOpen ? "justify-start px-3" : "justify-center px-0"
          )}
          variant="outline"
        >
          <div className="flex items-center justify-center w-5 h-5 shrink-0 rounded-full bg-[#ececec] text-black">
            <Plus className="w-3.5 h-3.5" />
          </div>
          {sidebarOpen && <span className="font-medium text-[13px] whitespace-nowrap">New Chat</span>}
        </Button>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-[2px]">
          {conversations.length === 0 && sidebarOpen && (
            <p className="text-xs text-muted-foreground text-center py-4">No conversations yet</p>
          )}
          {conversations.map((convo) => (
            <div
              key={convo.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectConversation(convo.id)}
              onKeyDown={(e) => e.key === 'Enter' && onSelectConversation(convo.id)}
              className={cn(
                'group relative w-full flex items-center py-2.5 rounded-lg text-left transition-colors cursor-pointer',
                activeConversationId === convo.id
                  ? 'bg-[#202020] text-[#ececec]'
                  : 'text-[#9b9b9b] hover:bg-[#202020] hover:text-[#ececec]',
                sidebarOpen ? 'px-3' : 'justify-center px-0'
              )}
            >
              {!sidebarOpen ? (
                <MessageSquare className={cn("w-4 h-4 shrink-0", activeConversationId === convo.id && "text-white")} />
              ) : (
                <>
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="truncate text-[13px] leading-tight">
                      {convo.title || 'New Chat'}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "absolute right-1 flex items-center opacity-0 group-hover:opacity-100 transition-opacity bg-[#202020] rounded-r-lg",
                      activeConversationId === convo.id && "opacity-100"
                    )}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(convo.id);
                      }}
                      className="p-1.5 hover:text-white transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
