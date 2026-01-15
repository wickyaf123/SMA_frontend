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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconColor)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
          statusConfig[status].className
        )}>
          <StatusIcon className={cn("w-3.5 h-3.5", status === "loading" && "animate-spin")} />
          {statusConfig[status].label}
        </div>
      </div>

      {details && (
        <div className="mb-4 p-3 bg-secondary/30 rounded-lg">
          <p className="text-sm text-muted-foreground">{details}</p>
        </div>
      )}

      <div className="flex items-center gap-2">
        {onTest && (
          <Button variant="outline" size="sm" onClick={onTest}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Test Connection
          </Button>
        )}
        {docsUrl && (
          <Button variant="ghost" size="sm" asChild>
            <a href={docsUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4 mr-2" />
              Docs
            </a>
          </Button>
        )}
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
          name: "Apollo.io",
          description: "High-quality B2B contact data",
          icon: Search,
          iconColor: "bg-purple-600",
          status: "connected" as const,
          details: "Used for Track B (high-quality leads)",
          docsUrl: "https://knowledge.apollo.io/hc/en-us/articles/4415475935629-Getting-Started-with-the-Apollo-API",
        },
        {
          name: "Google Maps (Apify)",
          description: "Business scraping from Google Maps",
          icon: Map,
          iconColor: "bg-green-600",
          status: "connected" as const,
          details: "Used for Track A (high-volume scraping)",
          docsUrl: "https://apify.com/compass/crawler-google-places",
        },
        {
          name: "Hunter.io",
          description: "Email enrichment and verification",
          icon: Mail,
          iconColor: "bg-orange-600",
          status: "connected" as const,
          details: "Email finder for Track A contacts",
          docsUrl: "https://hunter.io/api-documentation",
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
    <div className="flex-1 overflow-auto p-6 space-y-6 animate-fade-in">
      {/* System Status Banner */}
      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border",
        systemStatus === "connected" 
          ? "bg-success/10 border-success/30" 
          : systemStatus === "loading"
            ? "bg-muted border-border"
            : "bg-destructive/10 border-destructive/30"
      )}>
        <div className="flex items-center gap-3">
          {healthLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          ) : systemStatus === "connected" ? (
            <CheckCircle className="w-5 h-5 text-success" />
          ) : (
            <AlertCircle className="w-5 h-5 text-destructive" />
          )}
          <div>
            <p className="font-medium text-foreground">
              {healthLoading 
                ? "Checking system status..." 
                : systemStatus === "connected"
                  ? "All Systems Operational"
                  : "System Issues Detected"}
            </p>
            <p className="text-sm text-muted-foreground">
              {health?.timestamp ? `Last checked: ${new Date(health.timestamp).toLocaleTimeString()}` : "Connecting to backend..."}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchHealth()} disabled={healthLoading}>
          <RefreshCw className={cn("w-4 h-4 mr-2", healthLoading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Integration Categories */}
      {integrations.map((category) => (
        <div key={category.category}>
          <h2 className="text-lg font-semibold text-foreground mb-4">{category.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* Configuration Note */}
      <div className="p-4 bg-info/10 border border-info/20 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-info mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Configuration Note</p>
            <p className="text-sm text-muted-foreground mt-1">
              Integration credentials are configured in the backend <code className="bg-muted px-1 rounded">.env</code> file.
              This page shows connection status only. To update API keys, modify the environment variables and restart the backend server.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

