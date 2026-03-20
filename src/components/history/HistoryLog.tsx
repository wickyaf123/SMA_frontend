import { useState } from "react";
import { useActivity } from "@/hooks/useApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  ChevronLeft,
  ChevronRight,
  Mail,
  MessageSquare,
  UserPlus,
  Zap,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACTION_TYPES = [
  { value: "", label: "All Actions" },
  { value: "contact_created", label: "Contact Created" },
  { value: "contact_updated", label: "Contact Updated" },
  { value: "enrolled", label: "Enrolled" },
  { value: "reply_received", label: "Reply Received" },
  { value: "reply_classified", label: "Reply Classified" },
  { value: "sms_sent", label: "SMS Sent" },
  { value: "email_sent", label: "Email Sent" },
  { value: "email_not_found", label: "Email Not Found" },
  { value: "validation_complete", label: "Validation Complete" },
  { value: "enrichment_complete", label: "Enrichment Complete" },
];

const CHANNEL_FILTERS = [
  { value: "", label: "All Channels" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS", label: "SMS" },
  { value: "LINKEDIN", label: "LinkedIn" },
];

function getActionIcon(action: string) {
  if (action.includes("email") || action.includes("EMAIL")) return Mail;
  if (action.includes("sms") || action.includes("SMS")) return MessageSquare;
  if (action.includes("created") || action.includes("signup")) return UserPlus;
  if (action.includes("enrolled")) return Zap;
  if (action.includes("reply")) return RefreshCw;
  if (action.includes("classified") || action.includes("tag")) return Tag;
  if (action.includes("error") || action.includes("fail")) return XCircle;
  if (action.includes("complete") || action.includes("success")) return CheckCircle;
  return AlertCircle;
}

function getActionColor(action: string): string {
  if (action.includes("created")) return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  if (action.includes("enrolled")) return "bg-purple-500/20 text-purple-400 border-purple-500/30";
  if (action.includes("reply")) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (action.includes("classified")) return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
  if (action.includes("email_not_found") || action.includes("error") || action.includes("fail")) return "bg-red-500/20 text-red-400 border-red-500/30";
  if (action.includes("complete") || action.includes("success")) return "bg-green-500/20 text-green-400 border-green-500/30";
  if (action.includes("sms")) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const HistoryLog = () => {
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [channelFilter, setChannelFilter] = useState("");
  const limit = 30;

  const { data, isLoading, refetch } = useActivity({
    page,
    limit,
    action: actionFilter || undefined,
    channel: channelFilter || undefined,
  });

  const logs = data?.data?.data || data?.data || [];
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Activity History</h1>
              <p className="text-sm text-muted-foreground">Track all lead actions, campaign events, and system activity</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={actionFilter} onValueChange={v => { setActionFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(a => (
                    <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={channelFilter} onValueChange={v => { setChannelFilter(v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by channel" />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_FILTERS.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {pagination?.total != null ? `${pagination.total} events` : "Activity Log"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                Loading activity...
              </div>
            ) : Array.isArray(logs) && logs.length > 0 ? (
              <ScrollArea className="max-h-[600px]">
                <div className="divide-y divide-border">
                  {logs.map((log: any) => {
                    const Icon = getActionIcon(log.action);
                    const colorClass = getActionColor(log.action);
                    return (
                      <div key={log.id} className="flex gap-4 p-4 hover:bg-muted/30 transition-colors">
                        {/* Timeline dot */}
                        <div className="flex flex-col items-center pt-0.5">
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", colorClass)}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 border", colorClass)}>
                              {log.action?.replace(/_/g, " ")}
                            </Badge>
                            {log.channel && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {log.channel}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                              {formatTimestamp(log.createdAt)}
                            </span>
                          </div>
                          {log.description && (
                            <p className="text-sm text-foreground/80 mt-1 line-clamp-2">{log.description}</p>
                          )}
                          {log.contactId && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Contact: {log.contactId.substring(0, 8)}...
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm">No activity found</p>
                <p className="text-xs mt-1">Activity will appear here as events occur</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
