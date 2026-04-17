import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  const { conversationId: urlConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(urlConversationId);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('chats');
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const { toast } = useToast();

  // Sync URL param to local state when URL changes externally
  useEffect(() => {
    if (urlConversationId && urlConversationId !== activeConversationId) {
      setActiveConversationId(urlConversationId);
    }
  }, [urlConversationId]);

  // Helper: set conversation and update URL
  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`, { replace: true });
  }, [navigate]);

  // Helper: clear conversation and update URL
  const clearConversation = useCallback(() => {
    setActiveConversationId(undefined);
    navigate('/chat', { replace: true });
  }, [navigate]);

  const {
    messages,
    streamingMessage,
    isStreaming,
    toolSteps,
    isThinking,
    sendMessage,
    cancelStream,
    cancelWorkflow,
    isLoading,
    activeWorkflows,
    activeJobs,
    connectionStatus,
    pauseJob,
    resumeJob,
    hasRunningWork,
    messageQueue,
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
    if (isCreatingConversation) return;
    setIsCreatingConversation(true);
    try {
      const data = await api.chat.createConversation('New Chat');
      if (data.success && data.data) {
        const newConv = data.data;
        setConversations(prev =>
          prev.some(c => c.id === newConv.id) ? prev : [newConv, ...prev]
        );
        selectConversation(newConv.id);
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast({ title: 'Failed to create conversation', variant: 'destructive' });
    } finally {
      setIsCreatingConversation(false);
    }
  }, [isCreatingConversation, toast, selectConversation]);

  // Delete conversation
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await api.chat.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        clearConversation();
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({ title: 'Failed to delete conversation', variant: 'destructive' });
    }
  }, [activeConversationId, toast, clearConversation]);

  // Ref to queue a preset run after conversation creation
  const pendingPresetRef = useRef<string | null>(null);

  // Ref to queue a message after conversation creation
  const pendingMessageRef = useRef<string | null>(null);

  // When conversationId changes and there's a pending message or preset, execute it
  useEffect(() => {
    if (activeConversationId && pendingMessageRef.current) {
      const msg = pendingMessageRef.current;
      pendingMessageRef.current = null;
      // Small delay to let socket connect
      setTimeout(() => sendMessage(msg), 500);
    }
    if (activeConversationId && pendingPresetRef.current) {
      const presetId = pendingPresetRef.current;
      pendingPresetRef.current = null;
      setTimeout(async () => {
        try {
          const result = await api.chat.runWorkflowPreset(activeConversationId, presetId);
          if (result.success && result.data) {
            toast({ title: `Starting ${result.data.name}...` });
            sendMessage(`SYSTEM_EVENT:workflow_preset_started:${JSON.stringify({
              workflowId: result.data.workflowId,
              name: result.data.name,
              totalSteps: result.data.totalSteps,
            })}`);
          }
        } catch (err) {
          console.error('Failed to run workflow preset:', err);
          toast({ title: 'Failed to start workflow', variant: 'destructive' });
        }
      }, 500);
    }
  }, [activeConversationId, sendMessage, toast]);

  // Handle send - auto-create conversation if none active
  const handleSendMessage = useCallback(async (content: string) => {
    if (!activeConversationId) {
      if (isCreatingConversation) return;
      setIsCreatingConversation(true);
      try {
        const data = await api.chat.createConversation(content.substring(0, 50));
        if (data.success && data.data) {
          const newConv = data.data;
          setConversations(prev =>
            prev.some(c => c.id === newConv.id) ? prev : [newConv, ...prev]
          );
          pendingMessageRef.current = content;
          selectConversation(newConv.id);
          return;
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        toast({ title: 'Failed to start conversation', variant: 'destructive' });
        return;
      } finally {
        setIsCreatingConversation(false);
      }
    }
    sendMessage(content);
  }, [activeConversationId, isCreatingConversation, sendMessage, toast, selectConversation]);

  // Handle direct workflow preset execution (bypass Claude)
  const handleRunPreset = useCallback(async (presetId: string) => {
    if (!activeConversationId) {
      if (isCreatingConversation) return;
      setIsCreatingConversation(true);
      try {
        const data = await api.chat.createConversation('New Chat');
        if (data.success && data.data) {
          const newConv = data.data;
          setConversations(prev =>
            prev.some(c => c.id === newConv.id) ? prev : [newConv, ...prev]
          );
          pendingPresetRef.current = presetId;
          selectConversation(newConv.id);
          return;
        }
      } catch (error) {
        console.error('Failed to create conversation:', error);
        toast({ title: 'Failed to start workflow', variant: 'destructive' });
        return;
      } finally {
        setIsCreatingConversation(false);
      }
    }
    try {
      const result = await api.chat.runWorkflowPreset(activeConversationId, presetId);
      if (result.success && result.data) {
        toast({ title: `Starting ${result.data.name}...` });
        // Send a message so the chat shows activity and hides the empty state
        sendMessage(`SYSTEM_EVENT:workflow_preset_started:${JSON.stringify({
          workflowId: result.data.workflowId,
          name: result.data.name,
          totalSteps: result.data.totalSteps,
        })}`);
      }
    } catch (error) {
      console.error('Failed to run workflow preset:', error);
      toast({ title: 'Failed to start workflow', variant: 'destructive' });
    }
  }, [activeConversationId, isCreatingConversation, toast, selectConversation, sendMessage]);

  // Validate activeConversationId exists in the loaded list
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  useEffect(() => {
    if (conversations.length > 0) {
      setConversationsLoaded(true);
    }
  }, [conversations]);

  useEffect(() => {
    if (conversationsLoaded && activeConversationId && !isCreatingConversation) {
      const exists = conversations.some(c => c.id === activeConversationId);
      if (!exists) {
        // Conversation doesn't exist - could be deleted or invalid URL
        navigate('/chat', { replace: true });
        setActiveConversationId(undefined);
      }
    }
  }, [conversationsLoaded, conversations, activeConversationId, isCreatingConversation, navigate]);

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
          'h-screen bg-sidebar flex flex-col flex-shrink-0 border-r border-border',
          // Mobile: fixed overlay
          'fixed z-50 transition-transform duration-300 md:relative md:translate-x-0 md:z-auto',
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: fixed width with smooth transition
          'md:transition-all md:duration-300',
          sidebarOpen
            ? 'md:w-[300px] md:min-w-[300px] md:max-w-[300px]'
            : 'md:w-[68px] md:min-w-[68px] md:max-w-[68px] md:overflow-hidden',
          'w-[300px]',
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
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
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
                selectConversation(id);
                setMobileSidebarOpen(false);
              }}
              onNewConversation={() => {
                handleNewConversation();
                setMobileSidebarOpen(false);
              }}
              onDeleteConversation={handleDeleteConversation}
              sidebarOpen={sidebarOpen}
              isCreating={isCreatingConversation}
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
          onRunPreset={handleRunPreset}
          onCancelStream={cancelStream}
          onCancelWorkflow={cancelWorkflow}
          isLoading={isLoading}
          activeWorkflows={activeWorkflows}
          activeJobs={activeJobs}
          conversationId={activeConversationId}
          onPauseJob={pauseJob}
          onResumeJob={resumeJob}
          hasRunningWork={hasRunningWork}
          messageQueue={messageQueue}
        />
      </div>
    </div>
  );
};
