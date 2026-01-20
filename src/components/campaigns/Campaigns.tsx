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
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Outreach Channels</h2>
          <p className="text-muted-foreground">
            Multi-channel automation status and performance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Stats
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-primary/5 opacity-50" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-tight">
                {totalInSequence.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground font-medium">In Active Sequences</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/40 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-primary/5 opacity-50" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-tight">
                {totalMessagesSent.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Total Messages Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-success/40 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-success/5 opacity-50" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-tight">
                {totalReplied.toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground font-medium">Total Replies</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-warning/40 transition-all relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-warning/5 opacity-50" />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-3xl font-bold text-foreground tracking-tight">
                {overallReplyRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground font-medium">Overall Reply Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Channel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className={cn("p-4 border-b border-border", "bg-node-outreach/5")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", "bg-node-outreach")}>
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">Email</h3>
                  <p className="text-sm text-muted-foreground">Instantly.ai</p>
                </div>
              </div>
              <Badge className="bg-success/15 text-success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Enrolled
                </div>
                <p className="text-xl font-semibold">{channelStats.email.enrolled.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Send className="w-3 h-3" />
                  Sent
                </div>
                <p className="text-xl font-semibold">{channelStats.email.sent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Eye className="w-3 h-3" />
                  Opened
                </div>
                <p className="text-xl font-semibold">{channelStats.email.opened.toLocaleString()}</p>
                <p className="text-xs text-success">{(channelStats.email.openRate || 0).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <MessageSquare className="w-3 h-3" />
                  Replied
                </div>
                <p className="text-xl font-semibold">{channelStats.email.replied.toLocaleString()}</p>
                <p className="text-xs text-success">{(channelStats.email.replyRate || 0).toFixed(1)}%</p>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Bounced</span>
              <span className="text-destructive font-medium">{channelStats.email.bounced}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open("https://app.instantly.ai/app/campaigns", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Instantly
              </Button>
            </div>
          </div>
        </div>

        {/* SMS Channel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className={cn("p-4 border-b border-border", "bg-node-validation/5")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", "bg-node-validation")}>
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">SMS</h3>
                  <p className="text-sm text-muted-foreground">GoHighLevel</p>
                </div>
              </div>
              <Badge className="bg-success/15 text-success">
                <CheckCircle className="w-3 h-3 mr-1" />
                Active
              </Badge>
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Enrolled
                </div>
                <p className="text-xl font-semibold">{channelStats.sms.enrolled.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Send className="w-3 h-3" />
                  Sent
                </div>
                <p className="text-xl font-semibold">{channelStats.sms.sent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <CheckCircle className="w-3 h-3" />
                  Delivered
                </div>
                <p className="text-xl font-semibold">{channelStats.sms.delivered.toLocaleString()}</p>
                <p className="text-xs text-success">{(channelStats.sms.deliveryRate || 0).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <MessageSquare className="w-3 h-3" />
                  Replied
                </div>
                <p className="text-xl font-semibold">{channelStats.sms.replied.toLocaleString()}</p>
                <p className="text-xs text-success">{(channelStats.sms.replyRate || 0).toFixed(1)}%</p>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Failed</span>
              <span className="text-destructive font-medium">{channelStats.sms.failed}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open("https://app.gohighlevel.com", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open GoHighLevel
              </Button>
            </div>
          </div>
        </div>

        {/* LinkedIn Channel */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className={cn("p-4 border-b border-border", "bg-node-ingestion/5")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", "bg-node-ingestion")}>
                  <Linkedin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground text-lg">LinkedIn</h3>
                  <p className="text-sm text-muted-foreground">PhantomBuster</p>
                </div>
              </div>
              {isLoadingSettings ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : linkedInEnabled ? (
                <Badge className="bg-success/15 text-success">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge className="bg-warning/15 text-warning">
                  <Pause className="w-3 h-3 mr-1" />
                  Paused
                </Badge>
              )}
            </div>
          </div>
          <div className="p-4 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Users className="w-3 h-3" />
                  Enrolled
                </div>
                <p className="text-xl font-semibold">{channelStats.linkedin.enrolled.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <Send className="w-3 h-3" />
                  Requests Sent
                </div>
                <p className="text-xl font-semibold">{channelStats.linkedin.sent.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <CheckCircle className="w-3 h-3" />
                  Accepted
                </div>
                <p className="text-xl font-semibold">{channelStats.linkedin.accepted.toLocaleString()}</p>
                <p className="text-xs text-success">{(channelStats.linkedin.acceptRate || 0).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <MessageSquare className="w-3 h-3" />
                  Replied
                </div>
                <p className="text-xl font-semibold">{channelStats.linkedin.replied.toLocaleString()}</p>
                <p className="text-xs text-success">{(channelStats.linkedin.replyRate || 0).toFixed(1)}%</p>
              </div>
            </div>
            
            {/* Additional Stats */}
            <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
              <span className="text-muted-foreground">Pending</span>
              <span className="text-warning font-medium">{channelStats.linkedin.pending}</span>
            </div>

            {/* LinkedIn Toggle */}
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                <span className="text-sm font-medium">Auto-Enrollment</span>
              </div>
              <Switch
                checked={linkedInEnabled}
                onCheckedChange={handleLinkedInToggle}
                disabled={toggleLinkedIn.isPending}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open("https://phantombuster.com/phantoms", "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open PhantomBuster
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Enrollment Info */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Automatic Enrollment</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Validated contacts are automatically enrolled into outreach sequences. 
              The system runs daily to process new leads through the pipeline.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-muted-foreground">Auto-enroll job: Active</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Runs daily at 9:00 AM</span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={onNavigateToSettings}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Recent Activity Preview */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Recent Outreach Activity</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary"
            onClick={onNavigateToSettings}
          >
            View All Activity
          </Button>
        </div>
        
        {isLoadingActivity ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : recentActivities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
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
                  className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    channel === "email" ? "bg-node-outreach/15" :
                    channel === "sms" ? "bg-node-validation/15" : "bg-node-ingestion/15"
                  )}>
                    {channel === "email" ? (
                      <Mail className={cn("w-4 h-4", "text-node-outreach")} />
                    ) : channel === "sms" ? (
                      <Smartphone className={cn("w-4 h-4", "text-node-validation")} />
                    ) : (
                      <Linkedin className={cn("w-4 h-4", "text-node-ingestion")} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">
                      {activity.description || activity.message || 'Activity logged'}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatDistanceToNow(new Date(activity.timestamp || activity.createdAt), { addSuffix: true })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
