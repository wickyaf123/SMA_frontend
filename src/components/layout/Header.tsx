import { Bell, Search, WifiOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface HeaderProps {
  title: string;
  subtitle?: string;
  isWebSocketConnected?: boolean;
}

export const Header = ({ title, subtitle, isWebSocketConnected }: HeaderProps) => {
  return (
    <header className="h-16 bg-background/80 backdrop-blur-md border-b border-border px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
      {/* Left section - Context/Title */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-0.5">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden sm:block">
                <BreadcrumbLink href="#" className="text-xs text-muted-foreground/70 hover:text-foreground transition-colors">PermitScraper.ai</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden sm:block" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm font-semibold text-foreground tracking-tight">{title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground font-medium">{subtitle}</p>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Search / Command Menu Trigger */}
        <button className="hidden md:flex relative items-center w-64 h-9 px-3 bg-muted/40 hover:bg-muted/60 border border-border/50 rounded-full text-sm text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/20">
          <Search className="w-4 h-4 mr-2 opacity-70" />
          <span className="flex-1 text-left text-xs">Search or type a command...</span>
          <kbd className="inline-flex h-5 items-center gap-1 rounded bg-background/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground shadow-sm">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          {isWebSocketConnected !== undefined && (
            <div className="hidden sm:flex items-center">
              {isWebSocketConnected ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 border border-destructive/20">
                  <WifiOff className="w-3 h-3 text-destructive" />
                  <span className="text-[10px] font-semibold text-destructive uppercase tracking-wider">Offline</span>
                </div>
              )}
            </div>
          )}

          {/* AI Assistant Button */}
          <Button variant="outline" size="sm" className="hidden lg:flex h-9 rounded-full gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary transition-all">
            <Sparkles className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">AI Assistant</span>
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-full hover:bg-muted/80 transition-colors">
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
            <span className="absolute top-2 right-2.5 w-1.5 h-1.5 rounded-full bg-primary ring-2 ring-background animate-pulse" />
          </Button>

          {/* Separator */}
          <div className="h-5 w-px bg-border mx-1 hidden sm:block"></div>

          {/* User */}
          <Avatar className="w-8 h-8 rounded-full ring-2 ring-border/50 cursor-pointer hover:ring-primary/50 transition-all">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-xs font-bold">JL</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};
