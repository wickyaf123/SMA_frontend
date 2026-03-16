/**
 * Outreach Dashboard
 * Simplified view for single-use automation system
 * Shows the 3 fixed outreach channels with stats and controls
 */

import { useState } from "react";
import {
  Mail,
  Smartphone,
  Linkedin,
  Users,
  Send,
  MessageSquare,
  Eye,
  MousePointer,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  ExternalLink,
  RefreshCw,
  Loader2,
  Settings,
  TrendingUp,
  Clock,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSettings, useToggleLinkedIn, useContactStats, useOutreachStats, useRecentActivity } from "@/hooks/useApi";
import { formatDistanceToNow } from "date-fns";

interface ChannelConfig {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  service: string;
  serviceUrl?: string;
  configKey: string;
}

const channels: ChannelConfig[] = [
  {
    id: "email",
    name: "Email Outreach",
    description: "Automated email sequences via Instantly.ai",
    icon: Mail,
    color: "text-node-outreach",
    bgColor: "bg-node-outreach",
    service: "Instantly.ai",
    serviceUrl: "https://app.instantly.ai/app/campaigns",
    configKey: "INSTANTLY_CAMPAIGN_ID",
  },
  {
    id: "sms",
    name: "SMS Outreach",
    description: "Text message automation via GoHighLevel",
    icon: Smartphone,
    color: "text-node-validation",
    bgColor: "bg-node-validation",
    service: "GoHighLevel",
    serviceUrl: "https://app.gohighlevel.com",
    configKey: "GHL_LOCATION_ID",
  },
  {
    id: "linkedin",
    name: "LinkedIn Outreach",
    description: "Connection requests via PhantomBuster",
    icon: Linkedin,
    color: "text-node-ingestion",
    bgColor: "bg-node-ingestion",
    service: "PhantomBuster",
    serviceUrl: "https://phantombuster.com/phantoms",
    configKey: "PHANTOMBUSTER_AGENT_ID",
  },
];

interface CampaignsProps {
  onNavigateToSettings?: () => void;
}

export const Campaigns = ({ onNavigateToSettings }: CampaignsProps = {}) => {
  const { data: settingsData, isLoading: isLoadingSettings } = useSettings();
  const { data: contactStats } = useContactStats();
  const { data: outreachData, isLoading: isLoadingOutreach, refetch: refetchOutreach } = useOutreachStats();
  const { data: recentActivityData, isLoading: isLoadingActivity } = useRecentActivity(5);
  const toggleLinkedIn = useToggleLinkedIn();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const settings = settingsData?.data;
  const linkedInEnabled = settings?.linkedinGloballyEnabled ?? true;
  const outreachStats = outreachData?.data;
  const recentActivities = recentActivityData?.data || [];

  // Use real stats or default to zeros
  const channelStats = {
    email: outreachStats?.email || { enrolled: 0, sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, delivered: 0, failed: 0, pending: 0, accepted: 0, openRate: 0, replyRate: 0 },
    sms: outreachStats?.sms || { enrolled: 0, sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, delivered: 0, failed: 0, pending: 0, accepted: 0, deliveryRate: 0, replyRate: 0 },
    linkedin: outreachStats?.linkedin || { enrolled: 0, sent: 0, opened: 0, clicked: 0, replied: 0, bounced: 0, delivered: 0, failed: 0, pending: 0, accepted: 0, acceptRate: 0, replyRate: 0 },
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchOutreach();
    setIsRefreshing(false);
  };

  const handleLinkedInToggle = (enabled: boolean) => {
    toggleLinkedIn.mutate(enabled);
  };

  const totalInSequence = outreachStats?.totals?.inSequence || contactStats?.data?.byStatus?.IN_SEQUENCE || 0;
  const totalReplied = outreachStats?.totals?.totalReplies || contactStats?.data?.replied || 0;
  const totalMessagesSent = outreachStats?.totals?.messagesSent || 0;
  const overallReplyRate = outreachStats?.totals?.overallReplyRate || 0;

  return (
    <div className="flex-1 overflow-auto bg-background animate-fade-in relative">
      {/* Header */}
      <div className="px-6 py-5 md:px-8 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Outreach Channels</h1>
            <p className="text-sm text-muted-foreground mt-1">Multi-channel automation status and performance tracking.</p>
          </div>
          <Button
            size="sm"
            className="h-9 gap-2 shadow-sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span>Refresh Stats</span>
          </Button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="glass-card flex items-center gap-4 p-6 group">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 transition-transform group-hover:scale-105 shrink-0">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">In Sequences</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {totalInSequence.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4 p-6 group">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 transition-transform group-hover:scale-105 shrink-0">
            <Send className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Messages Sent</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {totalMessagesSent.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4 p-6 group">
          <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center border border-success/20 transition-transform group-hover:scale-105 shrink-0">
            <MessageSquare className="w-6 h-6 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Replies</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {totalReplied.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4 p-6 group">
          <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20 transition-transform group-hover:scale-105 shrink-0">
            <TrendingUp className="w-6 h-6 text-warning" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Reply Rate</p>
            <p className="text-3xl font-bold text-foreground tracking-tight">
              {overallReplyRate.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Email Channel */}
        <div className="glass-card p-0 overflow-hidden flex flex-col group hover:border-primary/30">
          <div className="p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent relative">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shadow-sm">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg tracking-tight">Email</h3>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    via Instantly.ai
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-semibold uppercase tracking-wider text-[10px]">
                Active
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-5 flex-1 flex flex-col">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <Users className="w-3.5 h-3.5" />
                  Enrolled
                </div>
                <p className="text-2xl font-bold tracking-tight">{channelStats.email.enrolled.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <Send className="w-3.5 h-3.5" />
                  Sent
                </div>
                <p className="text-2xl font-bold tracking-tight">{channelStats.email.sent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <Eye className="w-3.5 h-3.5" />
                  Opened
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight">{channelStats.email.opened.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-primary">{(channelStats.email.openRate || 0).toFixed(1)}%</p>
                </div>
              </div>
              <div className="p-3 bg-success/5 rounded-xl border border-success/10">
                <div className="flex items-center gap-2 text-success/80 text-[11px] uppercase tracking-wider font-bold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Replied
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight text-success">{channelStats.email.replied.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-success">{(channelStats.email.replyRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="flex items-center justify-between text-sm px-4 py-2.5 bg-destructive/5 border border-destructive/10 rounded-lg mt-auto">
              <span className="text-muted-foreground font-medium">Bounced</span>
              <span className="text-destructive font-bold">{channelStats.email.bounced}</span>
            </div>

            {/* Actions */}
            <Button
              variant="outline"
              className="w-full h-10 border-primary/20 hover:bg-primary/5 hover:text-primary transition-colors mt-2"
              onClick={() => window.open("https://app.instantly.ai/app/campaigns", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open Instantly
            </Button>
          </div>
        </div>

        {/* SMS Channel */}
        <div className="glass-card p-0 overflow-hidden flex flex-col group hover:border-accent/30">
          <div className="p-5 border-b border-border/50 bg-gradient-to-r from-accent/5 to-transparent relative">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shadow-sm">
                  <Smartphone className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg tracking-tight">SMS</h3>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    via GoHighLevel
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-semibold uppercase tracking-wider text-[10px]">
                Active
              </Badge>
            </div>
          </div>
          <div className="p-5 space-y-5 flex-1 flex flex-col">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <Users className="w-3.5 h-3.5" />
                  Enrolled
                </div>
                <p className="text-2xl font-bold tracking-tight">{channelStats.sms.enrolled.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <Send className="w-3.5 h-3.5" />
                  Sent
                </div>
                <p className="text-2xl font-bold tracking-tight">{channelStats.sms.sent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Delivered
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight">{channelStats.sms.delivered.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-accent">{(channelStats.sms.deliveryRate || 0).toFixed(1)}%</p>
                </div>
              </div>
              <div className="p-3 bg-success/5 rounded-xl border border-success/10">
                <div className="flex items-center gap-2 text-success/80 text-[11px] uppercase tracking-wider font-bold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Replied
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight text-success">{channelStats.sms.replied.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-success">{(channelStats.sms.replyRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="flex items-center justify-between text-sm px-4 py-2.5 bg-destructive/5 border border-destructive/10 rounded-lg mt-auto">
              <span className="text-muted-foreground font-medium">Failed</span>
              <span className="text-destructive font-bold">{channelStats.sms.failed}</span>
            </div>

            {/* Actions */}
            <Button
              variant="outline"
              className="w-full h-10 border-accent/20 hover:bg-accent/5 hover:text-accent transition-colors mt-2"
              onClick={() => window.open("https://app.gohighlevel.com", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open GoHighLevel
            </Button>
          </div>
        </div>

        {/* LinkedIn Channel */}
        <div className="glass-card p-0 overflow-hidden flex flex-col group hover:border-info/30">
          <div className="p-5 border-b border-border/50 bg-gradient-to-r from-info/5 to-transparent relative">
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center shadow-sm">
                  <Linkedin className="w-5 h-5 text-info" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg tracking-tight">LinkedIn</h3>
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                    via PhantomBuster
                  </p>
                </div>
              </div>
              {isLoadingSettings ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : linkedInEnabled ? (
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 font-semibold uppercase tracking-wider text-[10px]">
                  Active
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20 font-semibold uppercase tracking-wider text-[10px]">
                  Paused
                </Badge>
              )}
            </div>
          </div>
          <div className="p-5 space-y-5 flex-1 flex flex-col">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <Users className="w-3.5 h-3.5" />
                  Enrolled
                </div>
                <p className="text-2xl font-bold tracking-tight">{channelStats.linkedin.enrolled.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <Send className="w-3.5 h-3.5" />
                  Sent
                </div>
                <p className="text-2xl font-bold tracking-tight">{channelStats.linkedin.sent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-xl border border-border/50">
                <div className="flex items-center gap-2 text-muted-foreground text-[11px] uppercase tracking-wider font-bold mb-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Accepted
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight">{channelStats.linkedin.accepted.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-info">{(channelStats.linkedin.acceptRate || 0).toFixed(1)}%</p>
                </div>
              </div>
              <div className="p-3 bg-success/5 rounded-xl border border-success/10">
                <div className="flex items-center gap-2 text-success/80 text-[11px] uppercase tracking-wider font-bold mb-2">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Replied
                </div>
                <div className="flex items-end justify-between">
                  <p className="text-2xl font-bold tracking-tight text-success">{channelStats.linkedin.replied.toLocaleString()}</p>
                  <p className="text-sm font-semibold text-success">{(channelStats.linkedin.replyRate || 0).toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="flex flex-col gap-3 mt-auto">
              <div className="flex items-center justify-between text-sm px-4 py-2.5 bg-warning/5 border border-warning/10 rounded-lg">
                <span className="text-muted-foreground font-medium">Pending Requests</span>
                <span className="text-warning font-bold">{channelStats.linkedin.pending}</span>
              </div>

              {/* LinkedIn Toggle */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border border-border/50 rounded-lg">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-background border border-border flex items-center justify-center">
                    <Zap className={cn("w-3.5 h-3.5", linkedInEnabled ? "text-primary" : "text-muted-foreground")} />
                  </div>
                  <span className="text-sm font-semibold">Auto-Enrollment</span>
                </div>
                <Switch
                  checked={linkedInEnabled}
                  onCheckedChange={handleLinkedInToggle}
                  disabled={toggleLinkedIn.isPending}
                />
              </div>
            </div>

            {/* Actions */}
            <Button
              variant="outline"
              className="w-full h-10 border-info/20 hover:bg-info/5 hover:text-info transition-colors mt-2"
              onClick={() => window.open("https://phantombuster.com/phantoms", "_blank")}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open PhantomBuster
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 pb-8">
        {/* Auto-Enrollment Info */}
        <div className="glass-card flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 border border-primary/20">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-foreground text-lg tracking-tight">System Status</h3>
          </div>
          <div className="space-y-4 flex-1">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Validated contacts are automatically enrolled into outreach sequences based on your configured limits. 
              The system runs daily to process new leads through the pipeline safely.
            </p>
            <div className="p-4 bg-muted/40 rounded-xl border border-border/50 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Auto-enroll Engine</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="font-bold text-success">Active</span>
                </div>
              </div>
              <div className="h-px w-full bg-border/50" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground font-medium">Next Scheduled Run</span>
                <span className="font-bold text-foreground">9:00 AM</span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-6"
            onClick={onNavigateToSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure Limits
          </Button>
        </div>

        {/* Recent Activity Preview */}
        <div className="glass-card lg:col-span-2 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h3 className="font-bold text-foreground text-lg tracking-tight">Recent Activity</h3>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs font-semibold"
              onClick={onNavigateToSettings}
            >
              View Full Logs
            </Button>
          </div>
          
          <div className="flex-1">
          {isLoadingActivity ? (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-muted-foreground border-2 border-dashed border-border/50 rounded-xl">
              <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No recent activity detected</p>
              <p className="text-xs mt-1">Activities will appear here once campaigns are running.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((activity: any, index: number) => {
                // Determine channel from activity type or metadata
                const channel = activity.channel || 
                  (activity.type?.includes('email') ? 'email' : 
                   activity.type?.includes('sms') ? 'sms' : 
                   activity.type?.includes('linkedin') ? 'linkedin' : 'email');
                
                return (
                  <div
                    key={activity.id || index}
                    className="flex items-center gap-4 p-3.5 bg-background border border-border/50 rounded-xl hover:bg-muted/40 transition-colors group"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110",
                      channel === "email" ? "bg-primary/10 border-primary/20" :
                      channel === "sms" ? "bg-accent/10 border-accent/20" : "bg-info/10 border-info/20"
                    )}>
                      {channel === "email" ? (
                        <Mail className={cn("w-5 h-5", "text-primary")} />
                      ) : channel === "sms" ? (
                        <Smartphone className={cn("w-5 h-5", "text-accent")} />
                      ) : (
                        <Linkedin className={cn("w-5 h-5", "text-info")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {activity.description || activity.message || 'Activity logged'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                        {activity.type?.replace(/_/g, ' ') || 'System event'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md">
                        {formatDistanceToNow(new Date(activity.timestamp || activity.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};



