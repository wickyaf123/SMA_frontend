/**
 * Overview Dashboard
 * Merged view with stats, trends, and channel comparison
 */

import { 
  Users, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  TrendingUp,
  Mail,
  Smartphone,
  Linkedin,
  Clock,
  Zap,
  Loader2,
  AlertCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { StatsCard } from "./StatsCard";
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useContactStats, useHealth, useOutreachStats } from "@/hooks/useApi";

// Weekly trend data (placeholder - will be replaced with time-series API when available)
const weeklyTrendData = [
  { day: "Mon", emails: 245, sms: 89, linkedin: 34, replies: 28 },
  { day: "Tue", emails: 312, sms: 102, linkedin: 45, replies: 38 },
  { day: "Wed", emails: 289, sms: 95, linkedin: 41, replies: 31 },
  { day: "Thu", emails: 356, sms: 118, linkedin: 52, replies: 45 },
  { day: "Fri", emails: 298, sms: 98, linkedin: 48, replies: 35 },
  { day: "Sat", emails: 124, sms: 42, linkedin: 18, replies: 12 },
  { day: "Sun", emails: 98, sms: 32, linkedin: 12, replies: 8 },
];

// Monthly trend data (placeholder - will be replaced with time-series API when available)
const monthlyTrendData = [
  { week: "Week 1", emails: 1420, sms: 456, linkedin: 234, replies: 142 },
  { week: "Week 2", emails: 1680, sms: 512, linkedin: 278, replies: 168 },
  { week: "Week 3", emails: 1890, sms: 578, linkedin: 312, replies: 189 },
  { week: "Week 4", emails: 2150, sms: 634, linkedin: 356, replies: 215 },
];

// Reply rate trend over weeks (placeholder - will be replaced with time-series API when available)
const replyRateTrend = [
  { week: "W1", rate: 8.2 },
  { week: "W2", rate: 9.1 },
  { week: "W3", rate: 10.5 },
  { week: "W4", rate: 11.2 },
  { week: "W5", rate: 10.8 },
  { week: "W6", rate: 12.1 },
  { week: "W7", rate: 11.8 },
  { week: "W8", rate: 12.4 },
];

export const Overview = () => {
  const { data: statsData, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useContactStats();
  const { data: healthData, isLoading: healthLoading } = useHealth();
  const { data: outreachData, isLoading: outreachLoading, error: outreachError } = useOutreachStats();

  const stats = statsData?.data;
  const outreach = outreachData?.data;

  // Calculate stats
  const totalLeads = stats?.total || 0;
  const validatedCount = stats?.byEmailValidation?.VALID || 0;
  const inSequenceCount = stats?.byStatus?.IN_SEQUENCE || 0;
  const repliedCount = stats?.replied || 0;
  
  // Rates
  const validationRate = totalLeads > 0 ? ((validatedCount / totalLeads) * 100).toFixed(1) : "0";
  const replyRate = totalLeads > 0 ? ((repliedCount / totalLeads) * 100).toFixed(1) : "0";

  // Channel distribution from real data
  const channelDistribution = outreach ? [
    { name: "Email", value: outreach.email.sent, color: "hsl(270, 80%, 60%)" },
    { name: "SMS", value: outreach.sms.sent, color: "hsl(280, 75%, 65%)" },
    { name: "LinkedIn", value: outreach.linkedin.sent, color: "hsl(250, 80%, 60%)" },
  ] : [];

  // Channel metrics from real data
  const channelMetrics = outreach ? {
    email: { 
      sent: outreach.email.sent,
      delivered: outreach.email.delivered,
      opened: outreach.email.opened,
      replied: outreach.email.replied,
      openRate: outreach.email.openRate || 0,
      replyRate: outreach.email.replyRate || 0
    },
    sms: { 
      sent: outreach.sms.sent,
      delivered: outreach.sms.delivered,
      replied: outreach.sms.replied,
      deliveryRate: outreach.sms.deliveryRate || 0,
      replyRate: outreach.sms.replyRate || 0
    },
    linkedin: { 
      sent: outreach.linkedin.sent,
      accepted: outreach.linkedin.accepted || 0,
      replied: outreach.linkedin.replied,
      acceptRate: outreach.linkedin.acceptRate || 0,
      replyRate: outreach.linkedin.replyRate || 0
    },
  } : {
    email: { sent: 0, delivered: 0, opened: 0, replied: 0, openRate: 0, replyRate: 0 },
    sms: { sent: 0, delivered: 0, replied: 0, deliveryRate: 0, replyRate: 0 },
    linkedin: { sent: 0, accepted: 0, replied: 0, acceptRate: 0, replyRate: 0 },
  };

  // Loading state
  if (statsLoading || outreachLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (statsError || outreachError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium text-destructive mb-2">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mb-4">
            {statsError?.message || outreachError?.message}
          </p>
          <Button onClick={() => refetchStats()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Leads"
          value={totalLeads.toLocaleString()}
          change={stats?.importedToday ? `+${stats.importedToday} today` : "All time"}
          changeType="positive"
          icon={Users}
          iconColor="bg-node-ingestion/10 text-node-ingestion"
        />
        <StatsCard
          title="Validated"
          value={validatedCount.toLocaleString()}
          change={`${validationRate}% validation rate`}
          changeType="positive"
          icon={CheckCircle2}
          iconColor="bg-node-validation/10 text-node-validation"
        />
        <StatsCard
          title="In Sequence"
          value={inSequenceCount.toLocaleString()}
          change="Active outreach"
          changeType="neutral"
          icon={Send}
          iconColor="bg-node-outreach/10 text-node-outreach"
        />
        <StatsCard
          title="Replies"
          value={repliedCount.toLocaleString()}
          change={`${replyRate}% reply rate`}
          changeType="positive"
          icon={MessageSquare}
          iconColor="bg-node-reply/10 text-node-reply"
        />
      </div>

      {/* Trends Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Outreach Trends Chart */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-primary/5 opacity-50" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <h3 className="font-bold text-foreground text-xl">Outreach Trends</h3>
              <p className="text-sm text-muted-foreground mt-1">Messages sent by channel</p>
              <p className="text-xs text-muted-foreground/70 italic mt-1">* Sample data - time-series tracking coming soon</p>
            </div>
            <Tabs defaultValue="weekly" className="w-auto">
              <TabsList className="h-8">
                <TabsTrigger value="weekly" className="text-xs px-3 h-7">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3 h-7">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary" />
                <span className="text-muted-foreground">Email</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-accent rounded-full" />
                <span className="text-muted-foreground">SMS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 rounded-full" style={{ backgroundColor: 'hsl(250, 80%, 60%)' }} />
                <span className="text-muted-foreground">LinkedIn</span>
              </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 rounded-full" style={{ backgroundColor: 'hsl(45, 95%, 60%)' }} />
              <span className="text-muted-foreground">Replies</span>
            </div>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrendData}>
                <defs>
                  <linearGradient id="emailGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="smsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280, 75%, 65%)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="hsl(280, 75%, 65%)" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="linkedinGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(250, 80%, 60%)" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="hsl(250, 80%, 60%)" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.5}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0 0% 8%)', 
                    border: '1px solid hsl(270 80% 60% / 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="emails" 
                  stroke="hsl(270, 80%, 60%)" 
                  strokeWidth={3}
                  fill="url(#emailGradient)" 
                  name="Emails"
                  dot={{ fill: 'hsl(270, 80%, 60%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(270, 80%, 60%)', strokeWidth: 0 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sms" 
                  stroke="hsl(280, 75%, 65%)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#smsGradient)" 
                  name="SMS"
                />
                <Area 
                  type="monotone" 
                  dataKey="linkedin" 
                  stroke="hsl(250, 80%, 60%)" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#linkedinGradient)" 
                  name="LinkedIn"
                />
                <Area 
                  type="monotone" 
                  dataKey="replies" 
                  stroke="hsl(45, 95%, 60%)" 
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  fill="none" 
                  name="Replies"
                  dot={{ fill: 'hsl(45, 95%, 60%)', strokeWidth: 2, r: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution Pie */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-accent/5 opacity-50" />
          <div className="mb-4 relative z-10">
            <h3 className="font-bold text-foreground text-xl">Channel Distribution</h3>
            <p className="text-sm text-muted-foreground mt-1">Total messages by channel</p>
          </div>
          <div className="h-48 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                <Pie
                  data={channelDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {channelDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color}
                      stroke={entry.color}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0 0% 8%)', 
                    border: '1px solid hsl(270 80% 60% / 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
              </PieChart>
            </ResponsiveContainer>
                  </div>
          <div className="space-y-2 mt-2 relative z-10">
            {channelDistribution.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: channel.color, boxShadow: `0 0 10px ${channel.color}` }} />
                  <span className="text-muted-foreground font-medium">{channel.name}</span>
                </div>
                <span className="font-semibold text-foreground">{channel.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Channel Performance Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Performance */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-primary/40 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-primary/5 opacity-50" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-purple-glow">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Email</h3>
              <p className="text-xs text-muted-foreground">via Instantly.ai</p>
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Sent</span>
              <span className="font-bold">{channelMetrics.email.sent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Delivered</span>
              <span className="font-bold">{channelMetrics.email.delivered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Opened</span>
              <span className="font-bold">{channelMetrics.email.opened.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Replied</span>
              <span className="font-bold text-success">{channelMetrics.email.replied.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground font-medium">Open Rate</span>
                <span className="font-bold text-primary">{channelMetrics.email.openRate}%</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500" style={{ width: `${channelMetrics.email.openRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground font-medium">Reply Rate</span>
                <span className="font-bold text-success">{channelMetrics.email.replyRate}%</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${channelMetrics.email.replyRate * 5}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* SMS Performance */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-accent/40 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-accent/5 opacity-50" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-purple-glow">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">SMS</h3>
              <p className="text-xs text-muted-foreground">via GoHighLevel</p>
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Sent</span>
              <span className="font-bold">{channelMetrics.sms.sent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Delivered</span>
              <span className="font-bold">{channelMetrics.sms.delivered.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Replied</span>
              <span className="font-bold text-success">{channelMetrics.sms.replied.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground font-medium">Delivery Rate</span>
                <span className="font-bold text-accent">{channelMetrics.sms.deliveryRate}%</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-accent to-primary rounded-full transition-all duration-500" style={{ width: `${channelMetrics.sms.deliveryRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground font-medium">Reply Rate</span>
                <span className="font-bold text-success">{channelMetrics.sms.replyRate}%</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${channelMetrics.sms.replyRate * 5}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* LinkedIn Performance */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden group hover:border-info/40 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-info/5 opacity-50" />
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-info to-primary flex items-center justify-center shadow-purple-glow">
              <Linkedin className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">LinkedIn</h3>
              <p className="text-xs text-muted-foreground">via PhantomBuster</p>
            </div>
          </div>
          <div className="space-y-3 relative z-10">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Requests Sent</span>
              <span className="font-bold">{channelMetrics.linkedin.sent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Accepted</span>
              <span className="font-bold">{channelMetrics.linkedin.accepted.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-medium">Replied</span>
              <span className="font-bold text-success">{channelMetrics.linkedin.replied.toLocaleString()}</span>
            </div>
            <div className="pt-3 border-t border-border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground font-medium">Accept Rate</span>
                <span className="font-bold text-info">{channelMetrics.linkedin.acceptRate}%</span>
              </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-info to-primary rounded-full transition-all duration-500" style={{ width: `${channelMetrics.linkedin.acceptRate}%` }} />
                </div>
                </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground font-medium">Reply Rate</span>
                <span className="font-bold text-success">{channelMetrics.linkedin.replyRate}%</span>
                </div>
              <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full transition-all duration-500" style={{ width: `${channelMetrics.linkedin.replyRate * 5}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Reply Rate Trend + System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reply Rate Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-success/5 opacity-50" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div>
              <h3 className="font-bold text-foreground text-xl">Reply Rate Trend</h3>
              <p className="text-sm text-muted-foreground mt-1">Weekly reply rate percentage</p>
              <p className="text-xs text-muted-foreground/70 italic mt-1">* Sample data - time-series tracking coming soon</p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success/15 border border-success/30 text-success text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              <span>+4.2% overall</span>
            </div>
          </div>
          <div className="h-56 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={replyRateTrend}>
                <defs>
                  <linearGradient id="replyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(152, 65%, 55%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(152, 65%, 55%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.2} />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.5}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.5}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 15]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0 0% 8%)', 
                    border: '1px solid hsl(152 65% 55% / 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value: number) => [`${value}%`, 'Reply Rate']}
                />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(152, 65%, 55%)" 
                  strokeWidth={3}
                  fill="url(#replyGradient)"
                  dot={{ fill: 'hsl(152, 65%, 55%)', strokeWidth: 2, r: 5, stroke: 'hsl(0 0% 4%)', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: 'hsl(152, 65%, 55%)', stroke: 'hsl(0 0% 4%)', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-card border border-border rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card to-primary/5 opacity-50" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <h3 className="font-bold text-foreground text-xl">System Health</h3>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-purple-glow">
              <Zap className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-4 relative z-10">
            {[
              { label: "Email Open Rate", value: channelMetrics.email.openRate, color: "bg-primary" },
              { label: "SMS Delivery", value: channelMetrics.sms.deliveryRate, color: "bg-accent" },
              { label: "LinkedIn Accept", value: channelMetrics.linkedin.acceptRate, color: "bg-info" },
              { label: "Overall Reply Rate", value: outreach?.totals.overallReplyRate || 0, color: "bg-success" },
            ].map((metric) => (
              <div key={metric.label}>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground font-medium">{metric.label}</span>
                  <span className="font-bold text-foreground">{metric.value}%</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${metric.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* System Status */}
          <div className="mt-6 pt-4 border-t border-border relative z-10">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">System Status</span>
              {healthLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Checking...</span>
                </div>
              ) : (healthData?.status === "healthy" || healthData?.status === "degraded") ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-success/15 border border-success/30">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-lg shadow-success/50" />
                  <span className="text-sm font-semibold text-success">All Operational</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-warning/15 border border-warning/30">
                  <span className="w-2 h-2 rounded-full bg-warning shadow-lg shadow-warning/50" />
                  <span className="text-sm font-semibold text-warning">Issues Detected</span>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
