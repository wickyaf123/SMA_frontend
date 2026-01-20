import { Bell, ChevronDown, Search, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  subtitle?: string;
  isWebSocketConnected?: boolean;
}

export const Header = ({ title, subtitle, isWebSocketConnected }: HeaderProps) => {
  return (
    <header className="h-20 bg-card border-b border-border px-6 flex items-center justify-between backdrop-blur-sm">
      {/* Left section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-4 py-2.5 bg-secondary/50 rounded-xl text-sm w-64 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-200 backdrop-blur-sm"
          />
        </div>

        {/* WebSocket connection status */}
        {isWebSocketConnected !== undefined && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
            isWebSocketConnected 
              ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30' 
              : 'bg-muted text-muted-foreground border-border'
          }`}>
            {isWebSocketConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-soft shadow-lg shadow-emerald-500/50" />
                <Wifi className="w-3.5 h-3.5" />
                <span>System Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>
        )}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 transition-colors rounded-xl">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive shadow-lg shadow-destructive/50" />
        </Button>

        {/* User */}
        <button className="flex items-center gap-2.5 pl-4 border-l border-border hover:bg-secondary/50 rounded-r-xl pr-3 py-2 transition-all group">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
            <span className="text-sm font-semibold text-white">JL</span>
          </div>
          <span className="text-sm font-medium">James Louis</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </header>
  );
};
