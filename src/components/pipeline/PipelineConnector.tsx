import { cn } from "@/lib/utils";

interface PipelineConnectorProps {
  height?: number;
  animated?: boolean;
}

export const PipelineConnector = ({ height = 40, animated = false }: PipelineConnectorProps) => {
  return (
    <div 
      className="relative flex flex-col items-center"
      style={{ height }}
    >
      {/* Top dot */}
      <div className="connector-dot z-10" />
      
      {/* Vertical line */}
      <div 
        className={cn(
          "w-0.5 flex-1 bg-node-connector",
          animated && "bg-gradient-to-b from-primary via-primary/50 to-node-connector animate-pulse"
        )}
      />
      
      {/* Bottom dot */}
      <div className="connector-dot z-10" />
    </div>
  );
};
