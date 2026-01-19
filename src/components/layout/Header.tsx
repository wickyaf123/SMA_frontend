import { Bell, ChevronDown, Search, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  isWebSocketConnected?: boolean;
}

export const Header = ({ title, subtitle, isWebSocketConnected }: HeaderProps) => {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Left section */}
      <div>
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2 bg-secondary rounded-lg text-sm w-64 border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* WebSocket connection status */}
        {isWebSocketConnected !== undefined && (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isWebSocketConnected 
              ? 'bg-emerald-500/15 text-emerald-500' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {isWebSocketConnected ? (
              <>
                <Wifi className="w-3 h-3" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                <span>Offline</span>
              </>
            )}
          </div>
        )}

        {/* Status badge */}
        <div className="status-badge success">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse-soft" />
          System Active
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
        </Button>

        {/* User */}
        <button className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">JD</span>
          </div>
          <span className="text-sm font-medium">John Doe</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
};
