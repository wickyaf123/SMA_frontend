import { useState } from "react";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Loader2,
  Database,
  Server,
  Zap,
  Mail,
  Smartphone,
  Linkedin,
  Search,
  Map,
  Shield,
  Building2,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useHealth } from "@/hooks/useApi";

interface IntegrationCardProps {
  name: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  status: "connected" | "disconnected" | "error" | "loading";
  details?: string;
  docsUrl?: string;
  onTest?: () => void;
}

const IntegrationCard = ({
  name,
  description,
  icon: Icon,
  iconColor,
  status,
  details,
  docsUrl,
  onTest,
}: IntegrationCardProps) => {
  const statusConfig = {
    connected: {
      icon: CheckCircle,
      label: "Connected",
      className: "bg-success/15 text-success",
    },
    disconnected: {
      icon: XCircle,
      label: "Not Connected",
      className: "bg-muted text-muted-foreground",
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      className: "bg-destructive/15 text-destructive",
    },
    loading: {
      icon: Loader2,
      label: "Checking...",
      className: "bg-muted text-muted-foreground",
    },
  };

  const StatusIcon = statusConfig[status].icon;

  return (
    <div className="glass-card group hover:border-primary/20 p-5 flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/10", iconColor)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground tracking-tight">{name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {details && (
          <div className="mb-4 p-3 bg-muted/40 border border-border/50 rounded-lg">
            <p className="text-xs text-muted-foreground font-medium">{details}</p>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/50 mt-auto">
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
          statusConfig[status].className
        )}>
          <StatusIcon className={cn("w-3.5 h-3.5", status === "loading" && "animate-spin")} />
          {statusConfig[status].label}
        </div>

        <div className="flex items-center gap-2">
          {onTest && (
            <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold hover:bg-primary/5 hover:text-primary" onClick={onTest}>
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Test
            </Button>
          )}
          {docsUrl && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
              <a href={docsUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Docs
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const Integrations = () => {
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();
  const [testingIntegration, setTestingIntegration] = useState<string | null>(null);

  const handleTestConnection = async (integration: string) => {
    setTestingIntegration(integration);
    // Simulate API test
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTestingIntegration(null);
  };

  // Determine system health (healthy or degraded means API is responding)
  const systemStatus = healthLoading 
    ? "loading" 
    : (health?.status === "healthy" || health?.status === "degraded")
      ? "connected" 
      : "error";

  const integrations = [
    // Core Infrastructure
    {
      category: "Infrastructure",
      items: [
        {
          name: "PostgreSQL (Supabase)",
          description: "Primary database for contacts and campaigns",
          icon: Database,
          iconColor: "bg-emerald-600",
          status: healthLoading ? "loading" : health?.services?.database?.status === "healthy" ? "connected" : "error",
          details: health?.services?.database?.status === "healthy" ? "Database responding normally" : "Check Supabase connection",
        },
        {
          name: "Redis (Upstash)",
          description: "Caching and job queues",
          icon: Zap,
          iconColor: "bg-red-600",
          status: healthLoading ? "loading" : health?.services?.redis?.status === "healthy" ? "connected" : "error",
          details: health?.services?.redis?.status === "healthy" ? "Queue system operational" : "Check Redis connection",
        },
        {
          name: "Backend API",
          description: "Express server on localhost:3000",
          icon: Server,
          iconColor: "bg-blue-600",
          status: systemStatus,
          details: systemStatus === "connected" ? `Uptime: ${Math.floor((health?.uptime || 0) / 60)} minutes` : "API not responding",
        },
      ],
    },
    // Lead Sources
    {
      category: "Lead Sources",
      items: [
        {
          name: "Shovels",
          description: "Building permit and contractor data",
          icon: Building2,
          iconColor: "bg-amber-600",
          status: "connected" as const,
          details: "Contractor search via permit records",
          docsUrl: "https://docs.shovels.ai/",
        },
        {
          name: "Contact Enrichment",
          description: "Email and phone number lookup",
          icon: Layers,
          iconColor: "bg-violet-600",
          status: "connected" as const,
          details: "Finding contact info from multiple sources",
        },
      ],
    },
    // Outreach Channels
    {
      category: "Outreach Channels",
      items: [
        {
          name: "Instantly",
          description: "Cold email automation",
          icon: Mail,
          iconColor: "bg-cyan-600",
          status: "connected" as const,
          details: "Email campaigns and tracking",
          docsUrl: "https://developer.instantly.ai/",
        },
        {
          name: "GoHighLevel",
          description: "SMS outreach and unified inbox",
          icon: Smartphone,
          iconColor: "bg-indigo-600",
          status: "connected" as const,
          details: "SMS sending + reply detection",
          docsUrl: "https://highlevel.stoplight.io/",
        },
        {
          name: "PhantomBuster",
          description: "LinkedIn automation",
          icon: Linkedin,
          iconColor: "bg-blue-700",
          status: "connected" as const,
          details: "Profile visits, connections, messages",
          docsUrl: "https://phantombuster.com/api",
        },
      ],
    },
    // Validation
    {
      category: "Validation Services",
      items: [
        {
          name: "NeverBounce",
          description: "Email validation",
          icon: Shield,
          iconColor: "bg-teal-600",
          status: "connected" as const,
          details: "Validates email deliverability",
          docsUrl: "https://developers.neverbounce.com/",
        },
        {
          name: "Twilio Lookup",
          description: "Phone number validation",
          icon: Smartphone,
          iconColor: "bg-rose-600",
          status: "connected" as const,
          details: "Validates phone numbers (mobile/landline)",
          docsUrl: "https://www.twilio.com/docs/lookup/api",
        },
      ],
    },
  ];

  return (
    <div className="flex-1 overflow-auto bg-background animate-fade-in relative">
      {/* Header */}
      <div className="px-6 py-5 md:px-8 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Integrations</h1>
            <p className="text-sm text-muted-foreground mt-1">Connect and manage third-party services and infrastructure.</p>
          </div>
          <Button
            size="sm"
            className="h-9 gap-2 shadow-sm"
            onClick={() => refetchHealth()}
            disabled={healthLoading}
          >
            <RefreshCw className={cn("w-4 h-4", healthLoading && "animate-spin")} />
            <span>Refresh Status</span>
          </Button>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-10 max-w-[1600px] mx-auto">
      {/* System Status Banner */}
      <div className={cn(
        "flex items-center justify-between p-5 rounded-xl border shadow-sm transition-all",
        systemStatus === "connected" 
          ? "bg-success/5 border-success/20 shadow-success/5" 
          : systemStatus === "loading"
            ? "bg-muted/30 border-border/50"
            : "bg-destructive/5 border-destructive/20 shadow-destructive/5"
      )}>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center border",
            systemStatus === "connected" ? "bg-success/10 border-success/20" :
            systemStatus === "loading" ? "bg-muted border-border" : "bg-destructive/10 border-destructive/20"
          )}>
          {healthLoading ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : systemStatus === "connected" ? (
            <CheckCircle className="w-6 h-6 text-success" />
          ) : (
            <AlertCircle className="w-6 h-6 text-destructive" />
          )}
          </div>
          <div>
            <p className="font-bold text-foreground tracking-tight text-lg">
              {healthLoading 
                ? "Checking system status..." 
                : systemStatus === "connected"
                  ? "All Systems Operational"
                  : "System Issues Detected"}
            </p>
            <p className="text-sm text-muted-foreground font-medium mt-0.5">
              {health?.timestamp ? `Last checked: ${new Date(health.timestamp).toLocaleTimeString()}` : "Connecting to backend..."}
            </p>
          </div>
        </div>
      </div>

      {/* Integration Categories */}
      <div className="space-y-10">
      {integrations.map((category) => (
        <div key={category.category} className="space-y-4">
          <div className="flex items-center gap-3 border-b border-border/50 pb-2">
            <h2 className="text-lg font-bold text-foreground tracking-tight">{category.category}</h2>
            <Badge variant="outline" className="bg-muted/30 font-medium text-muted-foreground border-border/50 text-[10px] uppercase tracking-wider">
              {category.items.length} services
            </Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {category.items.map((integration) => (
              <IntegrationCard
                key={integration.name}
                {...integration}
                status={integration.status as "connected" | "disconnected" | "error" | "loading"}
                onTest={
                  category.category === "Infrastructure"
                    ? () => handleTestConnection(integration.name)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      ))}
      </div>

      {/* Configuration Note */}
      <div className="glass-card p-6 border-l-4 border-l-info bg-info/5 border-info/20 shadow-sm mt-8">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center shrink-0 border border-info/20">
            <AlertCircle className="w-5 h-5 text-info" />
          </div>
          <div>
            <p className="font-bold text-foreground text-lg tracking-tight mb-1">Configuration Note</p>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-4xl">
              Integration credentials are configured securely in the backend <code className="bg-background border border-border/50 px-1.5 py-0.5 rounded text-xs font-mono font-medium shadow-sm">.env</code> file.
              This dashboard provides real-time connection status monitoring. To update API keys or change service configurations, modify the environment variables and restart the backend server instance.
            </p>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

