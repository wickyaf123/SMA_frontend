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
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          colorMap[node.color]
        )}>
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-foreground truncate">{node.title}</h3>
            <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{node.subtitle}</p>
          
          {node.stats && (
            <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{node.stats.label}</span>
              <span className="text-sm font-semibold text-foreground">{node.stats.value}</span>
            </div>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute -right-1 -top-1">
        {node.status === "active" && (
          <span className="flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
        )}
        {node.status === "completed" && (
          <span className="h-3 w-3 rounded-full bg-success block" />
        )}
        {node.status === "error" && (
          <span className="h-3 w-3 rounded-full bg-destructive block" />
        )}
      </div>
    </div>
  );
};
