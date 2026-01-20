import { cn } from "@/lib/utils";
import { LucideIcon, MoreHorizontal } from "lucide-react";

export interface PipelineNodeData {
  id: string;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  status: "active" | "pending" | "completed" | "error";
  stats?: {
    label: string;
    value: string | number;
  };
  color: "ingestion" | "validation" | "outreach" | "reply" | "crm";
}

interface PipelineNodeProps {
  node: PipelineNodeData;
  isSelected?: boolean;
  onClick?: () => void;
}

const colorMap = {
  ingestion: "bg-node-ingestion",
  validation: "bg-node-validation",
  outreach: "bg-node-outreach",
  reply: "bg-node-reply",
  crm: "bg-node-crm",
};

const statusStyles = {
  active: "border-primary shadow-node-hover",
  pending: "border-border opacity-70",
  completed: "border-success/50",
  error: "border-destructive/50",
};

export const PipelineNode = ({ node, isSelected, onClick }: PipelineNodeProps) => {
  const Icon = node.icon;
  
  return (
    <div
      onClick={onClick}
      className={cn(
        "pipeline-node w-72 cursor-pointer group animate-fade-in",
        statusStyles[node.status],
        isSelected && "active"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg transition-all duration-300 group-hover:scale-110",
          colorMap[node.color]
        )}>
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-foreground truncate">{node.title}</h3>
            <button className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-primary/10 rounded-lg">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground hover:text-primary" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-1 font-medium">{node.subtitle}</p>
          
          {node.stats && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">{node.stats.label}</span>
              <span className="text-sm font-bold text-foreground">{node.stats.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute -right-1 -top-1">
        {node.status === "active" && (
          <span className="flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary shadow-lg shadow-primary/50"></span>
          </span>
        )}
        {node.status === "completed" && (
          <span className="h-4 w-4 rounded-full bg-success block shadow-lg shadow-success/50" />
        )}
        {node.status === "error" && (
          <span className="h-4 w-4 rounded-full bg-destructive block shadow-lg shadow-destructive/50" />
        )}
      </div>
    </div>
  );
};
