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
    className={cn("nav-item w-full", active && "active")}
  >
    <Icon className="w-5 h-5" />
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
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col flex-shrink-0 overflow-hidden">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">SMA Pipeline</h1>
            <p className="text-xs text-muted-foreground">Automation System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-hidden">
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
