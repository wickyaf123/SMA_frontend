import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConversationList } from '../chat/ConversationList';
import { ChatView } from '../chat/ChatView';
import { useChat } from '@/hooks/useChat';
import { Bot, LayoutDashboard, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  ...(import.meta.env.VITE_API_KEY
    ? { Authorization: `Bearer ${import.meta.env.VITE_API_KEY}` }
    : {}),
});

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{ content: string; role: string; createdAt: string }>;
}

export const ChatLayout = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const {
    messages,
    streamingMessage,
    isStreaming,
    toolSteps,
    isThinking,
    sendMessage,
    isLoading,
    activeWorkflows,
    activeJobs,
  } = useChat({ conversationId: activeConversationId });

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversations`, {
        headers: getHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create new conversation
  const handleNewConversation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversations`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ title: 'New Chat' }),
      });
      const data = await response.json();
      if (data.success && data.data) {
        setConversations(prev => [data.data, ...prev]);
        setActiveConversationId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  }, []);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/chat/conversations/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  }, [activeConversationId]);

  // Ref to queue a message after conversation creation
  const pendingMessageRef = useRef<string | null>(null);

  // When conversationId changes and there's a pending message, send it
  useEffect(() => {
    if (activeConversationId && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      // Small delay to let socket connect
      setTimeout(() => sendMessage(msg), 500);
    }
  }, [activeConversationId, sendMessage]);

  // Handle send - auto-create conversation if none active
  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeConversationId) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/chat/conversations`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ title: content.substring(0, 50) }),
        });
        const data = await response.json();
        if (data.success && data.data) {
          setConversations(prev => [data.data, ...prev]);
          pendingMessageRef.current = content;
          setActiveConversationId(data.data.id);
          return;
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }
    sendMessage(content);
  }, [activeConversationId, sendMessage]);

  // Refresh conversations after streaming completes
  useEffect(() => {
    if (!isStreaming && activeConversationId) {
      loadConversations();
    }
  }, [isStreaming, activeConversationId, loadConversations]);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen bg-[#000000] flex flex-col flex-shrink-0 transition-all duration-300',
          sidebarOpen ? 'w-[260px]' : 'w-[68px] overflow-hidden'
        )}
      >
        {/* Brand */}
        <div className="h-14 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 shrink-0 rounded-md bg-white flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </div>
            {sidebarOpen && <h2 className="font-medium text-sm text-[#ececec] whitespace-nowrap">Jerry</h2>}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId}
            onSelectConversation={setActiveConversationId}
            onNewConversation={handleNewConversation}
            onDeleteConversation={handleDeleteConversation}
            sidebarOpen={sidebarOpen}
          />
        </div>

        {/* Classic mode toggle */}
        <div className="p-3">
          <Link to="/classic/overview">
            <Button variant="ghost" size="sm" className={cn(
              "w-full gap-2 h-10 bg-transparent hover:bg-[#202020] text-[#ececec] transition-colors",
              sidebarOpen ? "justify-start px-3" : "justify-center px-0"
            )}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="font-medium text-[13px] whitespace-nowrap">Classic Dashboard</span>}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#212121] h-screen">
        {/* Top bar */}
        <div className="h-14 flex items-center px-4 gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#ececec] hover:bg-[#2f2f2f] hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-xs text-[#ececec]/70 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            Jerry Online
          </div>
        </div>

        {/* Chat content */}
        <ChatView
          messages={messages}
          streamingMessage={streamingMessage}
          isStreaming={isStreaming}
          toolSteps={toolSteps}
          isThinking={isThinking}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          activeWorkflows={activeWorkflows}
          activeJobs={activeJobs}
        />
      </div>
    </div>
  );
};
