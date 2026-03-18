import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConversationList } from '../chat/ConversationList';
import { JobsPanel } from '../chat/JobsPanel';
import { ChatView } from '../chat/ChatView';
import { useChat } from '@/hooks/useChat';
import { Bot, LayoutDashboard, PanelLeftClose, PanelLeft, MessageSquare, Zap } from 'lucide-react';
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

type SidebarTab = 'chats' | 'jobs';

export const ChatLayout = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chats');

  const {
    messages,
    streamingMessage,
    isStreaming,
    toolSteps,
    isThinking,
    sendMessage,
    cancelStream,
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

  const runningCount = activeWorkflows.filter(w => w.status === 'running').length;

  return (
    <div className="flex h-screen bg-[#212121]">
      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen bg-[#000000] flex flex-col flex-shrink-0 transition-all duration-300 border-r border-[#202020]',
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

        {/* Tab switcher */}
        {sidebarOpen ? (
          <div className="px-3 pb-2 flex gap-1">
            <button
              onClick={() => setSidebarTab('chats')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors',
                sidebarTab === 'chats'
                  ? 'bg-[#202020] text-[#ececec]'
                  : 'text-[#666666] hover:text-[#9b9b9b] hover:bg-[#0a0a0a]'
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chats
            </button>
            <button
              onClick={() => setSidebarTab('jobs')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors relative',
                sidebarTab === 'jobs'
                  ? 'bg-[#202020] text-[#ececec]'
                  : 'text-[#666666] hover:text-[#9b9b9b] hover:bg-[#0a0a0a]'
              )}
            >
              <Zap className="w-3.5 h-3.5" />
              Jobs
              {runningCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold animate-pulse">
                  {runningCount}
                </span>
              )}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 pb-2">
            <button
              onClick={() => setSidebarTab('chats')}
              className={cn(
                'w-10 h-8 rounded-lg flex items-center justify-center transition-colors',
                sidebarTab === 'chats' ? 'bg-[#202020] text-[#ececec]' : 'text-[#666666] hover:text-[#9b9b9b]'
              )}
              title="Chats"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarTab('jobs')}
              className={cn(
                'w-10 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                sidebarTab === 'jobs' ? 'bg-[#202020] text-[#ececec]' : 'text-[#666666] hover:text-[#9b9b9b]'
              )}
              title="Jobs"
            >
              <Zap className="w-4 h-4" />
              {runningCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 text-white text-[8px] flex items-center justify-center font-bold animate-pulse">
                  {runningCount}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Tab content */}
        <div className="flex-1 overflow-hidden border-b border-[#202020]">
          {sidebarTab === 'chats' ? (
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={setActiveConversationId}
              onNewConversation={handleNewConversation}
              onDeleteConversation={handleDeleteConversation}
              sidebarOpen={sidebarOpen}
            />
          ) : (
            <JobsPanel
              activeWorkflows={activeWorkflows}
              activeJobs={activeJobs}
              sidebarOpen={sidebarOpen}
            />
          )}
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
        <div className="h-14 flex items-center px-4 gap-2 flex-shrink-0 border-b border-[#2a2a2a]">
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
          onCancelStream={cancelStream}
          isLoading={isLoading}
          activeWorkflows={activeWorkflows}
          activeJobs={activeJobs}
          conversationId={activeConversationId}
        />
      </div>
    </div>
  );
};
