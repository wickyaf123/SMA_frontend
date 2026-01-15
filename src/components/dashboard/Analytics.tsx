import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { TrendingUp, TrendingDown, Mail, MessageSquare, Linkedin, Smartphone } from "lucide-react";
import { StatsCard } from "./StatsCard";

const performanceData = [
  { date: "Jan 1", emailsSent: 120, opens: 54, replies: 12, sms: 45, linkedin: 23 },
  { date: "Jan 8", emailsSent: 180, opens: 82, replies: 18, sms: 62, linkedin: 34 },
  { date: "Jan 15", emailsSent: 220, opens: 98, replies: 24, sms: 78, linkedin: 41 },
  { date: "Jan 22", emailsSent: 280, opens: 134, replies: 32, sms: 95, linkedin: 52 },
  { date: "Jan 29", emailsSent: 340, opens: 158, replies: 38, sms: 112, linkedin: 58 },
  { date: "Feb 5", emailsSent: 420, opens: 189, replies: 45, sms: 134, linkedin: 67 },
  { date: "Feb 12", emailsSent: 480, opens: 216, replies: 52, sms: 156, linkedin: 78 },
  { date: "Feb 19", emailsSent: 520, opens: 244, replies: 58, sms: 178, linkedin: 84 },
];

const channelData = [
  { name: "Email", value: 4521, color: "hsl(190, 70%, 45%)" },
  { name: "SMS", value: 1234, color: "hsl(280, 65%, 55%)" },
  { name: "LinkedIn", value: 856, color: "hsl(210, 85%, 55%)" },
];

const weeklyData = [
  { day: "Mon", sent: 245, opened: 112, replied: 28 },
  { day: "Tue", sent: 312, opened: 145, replied: 34 },
  { day: "Wed", sent: 289, opened: 134, replied: 31 },
  { day: "Thu", sent: 356, opened: 168, replied: 42 },
  { day: "Fri", sent: 298, opened: 142, replied: 35 },
  { day: "Sat", sent: 124, opened: 56, replied: 12 },
  { day: "Sun", sent: 98, opened: 42, replied: 8 },
];

const replyRateData = [
  { week: "Week 1", rate: 8.2 },
  { week: "Week 2", rate: 9.1 },
  { week: "Week 3", rate: 10.5 },
  { week: "Week 4", rate: 11.2 },
  { week: "Week 5", rate: 10.8 },
  { week: "Week 6", rate: 12.1 },
  { week: "Week 7", rate: 11.8 },
  { week: "Week 8", rate: 12.4 },
];

export const Analytics = () => {
  return (
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        <StatsCard
          title="Email Open Rate"
          value="42.3%"
          change="+3.2% vs last month"
          changeType="positive"
          icon={Mail}
          iconColor="bg-node-outreach/10 text-node-outreach"
        />
        <StatsCard
          title="Reply Rate"
          value="12.4%"
          change="+1.8% vs last month"
          changeType="positive"
          icon={MessageSquare}
          iconColor="bg-node-reply/10 text-node-reply"
        />
        <StatsCard
          title="LinkedIn Response"
          value="18.7%"
          change="+2.1% vs last month"
          changeType="positive"
          icon={Linkedin}
          iconColor="bg-node-ingestion/10 text-node-ingestion"
        />
        <StatsCard
          title="SMS Delivery"
          value="98.2%"
          change="-0.3% vs last month"
          changeType="negative"
          icon={Smartphone}
          iconColor="bg-node-validation/10 text-node-validation"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-3 gap-6">
        {/* Outreach Performance Over Time */}
        <div className="col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Outreach Performance</h3>
              <p className="text-sm text-muted-foreground">Emails sent, opened, and replied over time</p>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-node-outreach" />
                <span className="text-muted-foreground">Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-node-validation" />
                <span className="text-muted-foreground">Opened</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-node-reply" />
                <span className="text-muted-foreground">Replied</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(190, 70%, 45%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(190, 70%, 45%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(280, 65%, 55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(280, 65%, 55%)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)', 
                    border: '1px solid hsl(210, 20%, 90%)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="emailsSent" 
                  stroke="hsl(190, 70%, 45%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorSent)" 
                  name="Emails Sent"
                />
                <Area 
                  type="monotone" 
                  dataKey="opens" 
                  stroke="hsl(280, 65%, 55%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorOpens)" 
                  name="Opens"
                />
                <Area 
                  type="monotone" 
                  dataKey="replies" 
                  stroke="hsl(38, 95%, 55%)" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorReplies)" 
                  name="Replies"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Distribution */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">Channel Distribution</h3>
            <p className="text-sm text-muted-foreground">Outreach by channel type</p>
          </div>
          <div className="h-52 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {channelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)', 
                    border: '1px solid hsl(210, 20%, 90%)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-4">
            {channelData.map((channel) => (
              <div key={channel.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                  <span className="text-muted-foreground">{channel.name}</span>
                </div>
                <span className="font-medium text-foreground">{channel.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Weekly Activity</h3>
              <p className="text-sm text-muted-foreground">Daily breakdown of outreach</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)', 
                    border: '1px solid hsl(210, 20%, 90%)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="sent" fill="hsl(190, 70%, 45%)" radius={[4, 4, 0, 0]} name="Sent" />
                <Bar dataKey="opened" fill="hsl(280, 65%, 55%)" radius={[4, 4, 0, 0]} name="Opened" />
                <Bar dataKey="replied" fill="hsl(38, 95%, 55%)" radius={[4, 4, 0, 0]} name="Replied" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Reply Rate Trend */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Reply Rate Trend</h3>
              <p className="text-sm text-muted-foreground">Weekly reply rate percentage</p>
            </div>
            <div className="flex items-center gap-1 text-success text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>+4.2%</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={replyRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 90%)" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  stroke="hsl(220, 10%, 50%)" 
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 15]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(0, 0%, 100%)', 
                    border: '1px solid hsl(210, 20%, 90%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${value}%`, 'Reply Rate']}
                />
                <Line 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(152, 65%, 45%)" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(152, 65%, 45%)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(152, 65%, 45%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Performing Sequences */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-foreground">Top Performing Sequences</h3>
            <p className="text-sm text-muted-foreground">Ranked by reply rate</p>
          </div>
          <button className="text-sm text-primary hover:underline">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="pb-3 text-sm font-medium text-muted-foreground">Sequence Name</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Contacts</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Sent</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Open Rate</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Reply Rate</th>
                <th className="pb-3 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "Enterprise Cold Outreach", contacts: 450, sent: 1234, openRate: 48.2, replyRate: 15.3, status: "active" },
                { name: "SMB Follow-up Sequence", contacts: 320, sent: 892, openRate: 45.1, replyRate: 13.8, status: "active" },
                { name: "Re-engagement Campaign", contacts: 280, sent: 756, openRate: 42.6, replyRate: 12.1, status: "active" },
                { name: "New Lead Nurture", contacts: 520, sent: 1456, openRate: 39.8, replyRate: 10.4, status: "paused" },
                { name: "Post-Demo Follow-up", contacts: 180, sent: 423, openRate: 52.1, replyRate: 18.7, status: "active" },
              ].map((seq, index) => (
                <tr key={index} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium text-foreground">{seq.name}</td>
                  <td className="py-3 text-muted-foreground">{seq.contacts}</td>
                  <td className="py-3 text-muted-foreground">{seq.sent.toLocaleString()}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-node-outreach rounded-full" 
                          style={{ width: `${seq.openRate}%` }}
                        />
                      </div>
                      <span className="text-sm text-foreground">{seq.openRate}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-node-reply rounded-full" 
                          style={{ width: `${seq.replyRate * 5}%` }}
                        />
                      </div>
                      <span className="text-sm text-foreground">{seq.replyRate}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`status-badge ${seq.status === 'active' ? 'success' : 'pending'}`}>
                      {seq.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-success" />}
                      {seq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
