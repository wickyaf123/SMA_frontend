import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor?: string;
}

export const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType = "neutral",
  icon: Icon,
  iconColor = "bg-primary/10 text-primary"
}: StatsCardProps) => {
  return (
    <div className="glass-card flex flex-col relative overflow-hidden group hover:border-primary/20 hover:shadow-primary/5 transition-all duration-300">
      {/* Decorative gradient blob */}
      <div className={cn(
        "absolute -right-8 -top-8 w-24 h-24 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40",
        iconColor.split(' ')[1] // Extract just the text color class for the background blob
      )} />
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium flex items-center gap-1.5">
            {title}
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
          </div>
          
          {change && (
            <div className={cn(
              "mt-3 inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md",
              changeType === "positive" && "bg-success/10 text-success",
              changeType === "negative" && "bg-destructive/10 text-destructive",
              changeType === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {changeType === "positive" ? "↑" : changeType === "negative" ? "↓" : "•"} {change}
            </div>
          )}
        </div>
        
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-white/5",
          iconColor
        )}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
