import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ConversationList } from '../chat/ConversationList';
import { JobsPanel } from '../chat/JobsPanel';
import { ChatView } from '../chat/ChatView';
import { useChat } from '@/hooks/useChat';
import { Bot, LayoutDashboard, PanelLeftClose, PanelLeft, Menu, MessageSquare, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chats');
  const { toast } = useToast();

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
    connectionStatus,
    pauseJob,
    resumeJob,
  } = useChat({ conversationId: activeConversationId });

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const data = await api.chat.listConversations();
      if (data.success) {
        setConversations(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast({ title: 'Failed to load conversations', variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Create new conversation
  const handleNewConversation = useCallback(async () => {
    try {
      const data = await api.chat.createConversation('New Chat');
      if (data.success && data.data) {
        setConversations(prev => [data.data, ...prev]);
        setActiveConversationId(data.data.id);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({ title: 'Failed to create conversation', variant: 'destructive' });
    }
  }, [toast]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await api.chat.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({ title: 'Failed to delete conversation', variant: 'destructive' });
    }
  }, [activeConversationId, toast]);

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
        const data = await api.chat.createConversation(content.substring(0, 50));
        if (data.success && data.data) {
          setConversations(prev => [data.data, ...prev]);
          pendingMessageRef.current = content;
          setActiveConversationId(data.data.id);
          return;
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        toast({ title: 'Failed to start conversation', variant: 'destructive' });
        return;
      }
    }
    sendMessage(content);
  }, [activeConversationId, sendMessage, toast]);

  // Refresh conversations after streaming completes
  useEffect(() => {
    if (!isStreaming && activeConversationId) {
      loadConversations();
    }
  }, [isStreaming, activeConversationId, loadConversations]);

  const runningCount = activeWorkflows.filter(w => w.status === 'running').length;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'h-screen bg-black flex flex-col flex-shrink-0 border-r border-border',
          // Mobile: fixed overlay
          'fixed z-50 transition-transform duration-300 md:relative md:translate-x-0 md:z-auto',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: existing behavior with width transition
          'md:transition-all md:duration-300',
          sidebarOpen ? 'md:w-[260px]' : 'md:w-[68px] md:overflow-hidden',
          'w-[280px] md:w-auto',
        )}
      >
        {/* Brand */}
        <div className="h-14 px-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-7 h-7 shrink-0 rounded-md bg-white flex items-center justify-center">
              <Bot className="w-4 h-4 text-black" />
            </div>
            {sidebarOpen && <h2 className="font-medium text-sm text-foreground whitespace-nowrap">Jerry</h2>}
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
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/95'
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
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-black/95'
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
                sidebarTab === 'chats' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
              title="Chats"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSidebarTab('jobs')}
              className={cn(
                'w-10 h-8 rounded-lg flex items-center justify-center transition-colors relative',
                sidebarTab === 'jobs' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
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
        <div className="flex-1 overflow-hidden border-b border-border">
          {sidebarTab === 'chats' ? (
            <ConversationList
              conversations={conversations}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => {
                setActiveConversationId(id);
                setMobileSidebarOpen(false);
              }}
              onNewConversation={() => {
                handleNewConversation();
                setMobileSidebarOpen(false);
              }}
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

        {/* Bottom actions */}
        <div className="p-3 space-y-1">
          <Link to="/classic/overview">
            <Button variant="ghost" size="sm" className={cn(
              "w-full gap-2 h-10 bg-transparent hover:bg-accent text-foreground transition-colors",
              sidebarOpen ? "justify-start px-3" : "justify-center px-0"
            )}>
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span className="font-medium text-[13px] whitespace-nowrap">Classic Dashboard</span>}
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 bg-background h-screen">
        {/* Top bar */}
        <div className="h-14 flex items-center px-4 gap-2 flex-shrink-0 border-b border-border">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:bg-muted hover:text-white"
            onClick={() => {
              // Mobile: toggle overlay sidebar
              if (window.innerWidth < 768) {
                setMobileSidebarOpen(!mobileSidebarOpen);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
          >
            {/* Mobile: always show hamburger menu icon */}
            <Menu className="w-4 h-4 md:hidden" />
            {/* Desktop: show panel collapse/expand icon */}
            {sidebarOpen
              ? <PanelLeftClose className="w-4 h-4 hidden md:block" />
              : <PanelLeft className="w-4 h-4 hidden md:block" />
            }
          </Button>
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-xs text-foreground/70 font-medium">
            <div className={cn(
              'w-2 h-2 rounded-full',
              connectionStatus === 'connected' && 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]',
              connectionStatus === 'reconnecting' && 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse',
              connectionStatus === 'disconnected' && 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]',
            )} />
            {connectionStatus === 'connected' && 'Jerry Online'}
            {connectionStatus === 'reconnecting' && 'Reconnecting...'}
            {connectionStatus === 'disconnected' && (activeConversationId ? 'Jerry Offline' : 'Jerry')}
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
          onPauseJob={pauseJob}
          onResumeJob={resumeJob}
        />
      </div>
    </div>
  );
};
