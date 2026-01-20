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
      "nav-item w-full relative overflow-hidden",
      active && "active"
    )}
  >
    {/* Purple glow for active state */}
    {active && (
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
    )}
    <div className={cn(
      "relative flex items-center gap-3",
      active && "text-primary"
    )}>
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300",
        active ? "bg-primary/15 text-primary" : "bg-transparent text-sidebar-foreground"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <span className="font-medium">{label}</span>
    </div>
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
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-purple-glow">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground tracking-tight">TLA Outreach</h1>
            <p className="text-xs text-muted-foreground">Automation System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-hidden">
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

      {/* Settings at bottom */}
      <div className="p-4 border-t border-sidebar-border flex-shrink-0">
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
