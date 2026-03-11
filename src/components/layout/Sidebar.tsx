import { 
  LayoutDashboard, 
  Users, 
  GitBranch, 
  Send, 
  Settings,
  Zap,
  Plug2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon: Icon, label, active, onClick }: NavItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200",
      active 
        ? "bg-primary/10 text-primary" 
        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
    )}
  >
    <Icon className={cn("w-4 h-4", active ? "text-primary" : "text-muted-foreground")} />
    <span>{label}</span>
  </button>
);

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const navItems = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "pipeline", icon: GitBranch, label: "Pipeline" },
    { id: "leads", icon: Users, label: "Leads" },
    { id: "campaigns", icon: Send, label: "Outreach" },
    { id: "integrations", icon: Plug2, label: "Integrations" },
  ];

  return (
    <aside className="w-64 h-screen bg-background border-r border-border flex flex-col flex-shrink-0">
      {/* Logo */}
      <div className="h-14 px-6 flex items-center border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">Outreach<span className="text-primary">Pro</span></span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <div className="px-3 mb-2">
          <p className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Platform</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeSection === item.id}
                onClick={() => onSectionChange(item.id)}
              />
            ))}
          </nav>
        </div>
      </div>

      {/* Settings at bottom */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <NavItem
          icon={Settings}
          label="Settings"
          active={activeSection === "settings"}
          onClick={() => onSectionChange("settings")}
        />
      </div>
    </aside>
  );
};
