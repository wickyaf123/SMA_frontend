import { X, Settings, Activity, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { PipelineNodeData } from "./PipelineNode";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContactStats, useOutreachStats, useRecentActivity } from "@/hooks/useApi";

interface NodeDetailPanelProps {
  node: PipelineNodeData;
  onClose: () => void;
}

// Static descriptions for each node
const nodeDescriptions: Record<string, string> = {
  ingestion: "Ingests leads from Apollo API searches or bulk CSV imports. Normalizes data into canonical contact and company schemas.",
  validation: "Validates email addresses using NeverBounce and phone numbers using Twilio Lookup. Only validated contacts proceed.",
  outreach: "Executes multi-channel outreach via Email, SMS, and LinkedIn with scheduled follow-ups and randomized delays.",
  reply: "Detects replies across all channels via webhooks and polling. Automatically pauses all outreach for replied contacts.",
  crm: "Syncs contact lifecycle status with CRM and triggers Slack notifications for manual follow-up.",
};

export const NodeDetailPanel = ({ node, onClose }: NodeDetailPanelProps) => {
  const Icon = node.icon;
  
  // Fetch real data
  const { data: statsData, isLoading: statsLoading } = useContactStats();
  const { data: outreachData, isLoading: outreachLoading } = useOutreachStats();
  const { data: activityData, isLoading: activityLoading } = useRecentActivity(10);
  
  const stats = statsData?.data;
  const outreach = outreachData?.data;
  const activities = activityData?.data || [];
  
  const isLoading = statsLoading || outreachLoading || activityLoading;
  
  const description = nodeDescriptions[node.id] || nodeDescriptions.ingestion;

  // Calculate metrics based on node type
  const getMetrics = () => {
    if (isLoading) {
      return [
        { label: "Loading...", value: "..." },
      ];
    }

    switch (node.id) {
      case "ingestion":
        return [
          { 
            label: "Total Imported", 
            value: (stats?.total || 0).toLocaleString(),
            change: stats?.importedToday ? `+${stats.importedToday} today` : undefined
          },
          { label: "From Apollo", value: "N/A" }, // Would need import job data
          { label: "Bulk Imports", value: "N/A" }, // Would need import job data
          { label: "Duplicates Removed", value: "N/A" }, // Would need import job data
        ];
      
      case "validation":
        const total = stats?.total || 0;
        const validCount = stats?.byEmailValidation?.VALID || 0;
        const invalidCount = stats?.byEmailValidation?.INVALID || 0;
        const passRate = total > 0 ? ((validCount / total) * 100).toFixed(1) : "0";
        return [
          { 
            label: "Validated", 
            value: validCount.toLocaleString(),
            change: `${passRate}% pass rate`
          },
          { label: "Email Valid", value: validCount.toLocaleString() },
          { label: "Phone Valid", value: "N/A" }, // Would need phone validation stats
          { label: "Failed", value: invalidCount.toLocaleString() },
        ];
      
      case "outreach":
        return [
          { label: "In Sequence", value: (stats?.byStatus?.IN_SEQUENCE || 0).toLocaleString() },
          { label: "Emails Sent", value: (outreach?.email.sent || 0).toLocaleString() },
          { label: "SMS Sent", value: (outreach?.sms.sent || 0).toLocaleString() },
          { label: "LinkedIn Actions", value: (outreach?.linkedin.sent || 0).toLocaleString() },
        ];
      
      case "reply":
        const totalReplies = stats?.replied || 0;
        return [
          { 
            label: "Total Replies", 
            value: totalReplies.toLocaleString(),
            change: undefined // Would need daily reply tracking
          },
          { label: "Email Replies", value: (outreach?.email.replied || 0).toLocaleString() },
          { label: "SMS Replies", value: (outreach?.sms.replied || 0).toLocaleString() },
          { label: "LinkedIn Replies", value: (outreach?.linkedin.replied || 0).toLocaleString() },
        ];
      
      case "crm":
        return [
          { label: "Synced Contacts", value: (stats?.total || 0).toLocaleString() },
          { label: "Pending Sync", value: "0" }, // Would need GHL sync status
          { label: "Slack Alerts Sent", value: "N/A" }, // Would need notification tracking
          { label: "CRM Errors", value: "0" },
        ];
      
      default:
        return [
          { label: "No data", value: "—" },
        ];
    }
  };

  // Format activity logs from recent activity
  const formatActivityLogs = () => {
    if (activityLoading) {
      return [{ time: "Loading...", message: "Fetching recent activity...", type: "info" as const }];
    }

    if (!activities.length) {
      return [{ time: "—", message: "No recent activity", type: "info" as const }];
    }

    return activities.slice(0, 5).map((activity: any) => {
      const timeAgo = new Date(activity.createdAt).toLocaleTimeString();
      let type: "success" | "info" | "warning" | "error" = "info";
      
      if (activity.action.includes("error") || activity.action.includes("failed")) {
        type = "error";
      } else if (activity.action.includes("reply")) {
        type = "success";
      }

      return {
        time: timeAgo,
        message: activity.description || activity.action,
        type,
      };
    });
  };

  const metrics = getMetrics();
  const logs = formatActivityLogs();

  const getLogIcon = (type: string) => {
    switch (type) {
      case "success": return <CheckCircle className="w-4 h-4 text-success" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      default: return <Activity className="w-4 h-4 text-info" />;
    }
  };

  return (
    <div className="w-96 bg-card border-l border-border flex flex-col animate-fade-in">
      {/* Header */}
      <div className="p-6 border-b border-border bg-gradient-to-br from-card to-primary/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-node-${node.color} shadow-purple-glow`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-lg">{node.title}</h3>
              <p className="text-sm text-muted-foreground font-medium">{node.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-primary/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground hover:text-primary" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="metrics" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start px-4 py-2 bg-transparent border-b border-border rounded-none h-auto">
          <TabsTrigger value="metrics" className="data-[state=active]:bg-secondary">
            Metrics
          </TabsTrigger>
          <TabsTrigger value="activity" className="data-[state=active]:bg-secondary">
            Activity
          </TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-secondary">
            Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="flex-1 p-4 mt-0">
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-secondary/50 to-primary/5 border border-border rounded-xl hover:border-primary/30 transition-all">
                <p className="text-xs text-muted-foreground mb-1 font-medium">{metric.label}</p>
                <p className="text-xl font-bold text-foreground">{metric.value}</p>
                {metric.change && (
                  <p className="text-xs text-success mt-1 font-medium">{metric.change}</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 p-4 mt-0 overflow-auto">
          <div className="space-y-3">
            {logs.map((log, index) => (
              <div key={index} className="flex gap-3 p-3 bg-gradient-to-br from-secondary/30 to-primary/5 border border-border rounded-xl">
                {getLogIcon(log.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground font-medium">{log.message}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {log.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 p-4 mt-0">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Auto-retry on failure</span>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Rate limiting</span>
              </div>
              <span className="text-sm font-medium">100/hour</span>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="p-4 border-t border-border flex gap-2">
        <Button variant="outline" className="flex-1">Pause</Button>
        <Button className="flex-1">Configure</Button>
      </div>
    </div>
  );
};
