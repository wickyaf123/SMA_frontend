import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GitBranch,
  Send,
  Settings,
  Plug2,
  Zap,
  ChevronRight,
  LifeBuoy,
  Bot,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  to: string;
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

const NavItem = ({ to, icon: Icon, label, active }: NavItemProps) => (
  <Link
    to={to}
    className={cn(
      "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
      active 
        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
        : "text-muted-foreground hover:bg-white/5 hover:text-foreground dark:hover:bg-white/5"
    )}
  >
    <Icon className={cn("w-4 h-4 shrink-0 transition-colors", active ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
    <span className="flex-1 truncate">{label}</span>
    {active && (
      <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-foreground/80 animate-pulse" />
    )}
  </Link>
);

export const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname === "/" ? "/classic/overview" : location.pathname;

  const mainNav = [
    { id: "/classic/overview", icon: LayoutDashboard, label: "Overview" },
    { id: "/classic/pipeline", icon: GitBranch, label: "Pipeline" },
    { id: "/classic/leads", icon: Users, label: "Leads Database" },
    { id: "/classic/campaigns", icon: Send, label: "Campaigns" },
    { id: "/classic/integrations", icon: Plug2, label: "Integrations" },
    { id: "/classic/history", icon: History, label: "History" },
  ];

  return (
    <aside className="w-64 h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col flex-shrink-0 transition-all duration-300">
      {/* Brand & Workspace Switcher */}
      <div className="h-16 px-5 flex items-center border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3 w-full hover:bg-accent/50 p-1.5 rounded-lg cursor-pointer transition-colors">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-sm text-foreground truncate">PermitScraper</h2>
            <p className="text-[10px] text-muted-foreground font-medium truncate uppercase tracking-wider">Workspace</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto py-5 custom-scrollbar">
        <div className="px-4 space-y-1">
          <p className="px-2 text-[11px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-3">Menu</p>
          <nav className="space-y-1">
            {mainNav.map((item) => (
              <NavItem
                key={item.id}
                to={item.id}
                icon={item.icon}
                label={item.label}
                active={currentPath.startsWith(item.id)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0 bg-sidebar-background/50 space-y-1">
        <NavItem
          to="/chat"
          icon={Bot}
          label="Switch to Jerry"
          active={false}
        />
        <NavItem
          to="/support"
          icon={LifeBuoy}
          label="Help & Support"
          active={currentPath === "/support"}
        />
        <NavItem
          to="/classic/settings"
          icon={Settings}
          label="Settings"
          active={currentPath.startsWith("/classic/settings")}
        />
        
        {/* User Profile Mini */}
        <div className="mt-4 pt-4 border-t border-sidebar-border flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center border border-border shrink-0">
            <span className="text-xs font-medium text-foreground">JL</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">James L.</p>
            <p className="text-xs text-muted-foreground truncate">james@acmecorp.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
