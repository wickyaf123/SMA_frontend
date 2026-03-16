import { useState } from "react";
import { 
  Download, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  Database,
  Mail,
  Smartphone,
  Linkedin,
  Loader2
} from "lucide-react";
import { PipelineNode, PipelineNodeData } from "./PipelineNode";
import { PipelineConnector } from "./PipelineConnector";
import { NodeDetailPanel } from "./NodeDetailPanel";
import { TestPipelineButton } from "./TestPipelineButton";
import { useContactStats, useCampaigns } from "@/hooks/useApi";

export const PipelineCanvas = () => {
  const [selectedNode, setSelectedNode] = useState<PipelineNodeData | null>(null);
  
  // Fetch real data
  const { data: statsData, isLoading: statsLoading } = useContactStats();
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns({ status: "ACTIVE" });
  
  const stats = statsData?.data;
  const activeCampaigns = campaignsData?.data?.length || 0;
  
  const isLoading = statsLoading || campaignsLoading;

  // Build pipeline nodes with real data
const pipelineNodes: PipelineNodeData[] = [
  {
    id: "ingestion",
    title: "Lead Ingestion",
    subtitle: "Shovels Permits & Bulk Import",
    icon: Download,
    status: "completed",
      stats: { 
        label: "Leads imported", 
        value: isLoading ? "..." : (stats?.total || 0).toLocaleString() 
      },
    color: "ingestion",
  },
  {
    id: "validation",
    title: "Validation",
    subtitle: "Email & Phone verification",
    icon: CheckCircle2,
    status: "active",
      stats: { 
        label: "Validated", 
        value: isLoading ? "..." : (stats?.byEmailValidation?.VALID || 0).toLocaleString() 
      },
    color: "validation",
  },
  {
    id: "outreach",
    title: "Outreach Sequences",
    subtitle: "Multi-channel campaigns",
    icon: Send,
    status: "active",
      stats: { 
        label: "Active campaigns", 
        value: isLoading ? "..." : activeCampaigns.toString() 
      },
    color: "outreach",
  },
  {
    id: "reply",
    title: "Reply Detection",
    subtitle: "Auto-pause on response",
    icon: MessageSquare,
    status: "active",
      stats: { 
        label: "Replies captured", 
        value: isLoading ? "..." : (stats?.replied || 0).toLocaleString() 
      },
    color: "reply",
  },
  {
    id: "crm",
    title: "CRM Sync",
      subtitle: "GoHighLevel Integration",
    icon: Database,
    status: "pending",
      stats: { 
        label: "Synced contacts", 
        value: isLoading ? "..." : (stats?.total || 0).toLocaleString() 
      },
    color: "crm",
  },
];

const outreachChannels = [
    { id: "email", title: "Email", subtitle: "Instantly", icon: Mail, status: "active" as const, color: "outreach" as const },
    { id: "sms", title: "SMS", subtitle: "GoHighLevel", icon: Smartphone, status: "active" as const, color: "outreach" as const },
  { id: "linkedin", title: "LinkedIn", subtitle: "PhantomBuster", icon: Linkedin, status: "active" as const, color: "outreach" as const },
];

  const handleNodeClick = (node: PipelineNodeData) => {
    setSelectedNode(selectedNode?.id === node.id ? null : node);
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background">
      {/* Header with Test Button */}
      <div className="px-6 py-5 border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Pipeline Automation</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Visualize and test the complete workflow from lead import to campaign enrollment.
            </p>
          </div>
          <TestPipelineButton />
        </div>
      </div>

    <div className="flex flex-1 overflow-hidden relative">
      {/* Pipeline Canvas */}
      <div className="flex-1 canvas-grid overflow-auto p-4 sm:p-8">
        <div className="min-h-full flex flex-col items-center py-8">
          {/* Stage Label */}
          <div className="mb-6">
            <span className="px-4 py-1.5 bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest rounded-full shadow-sm">
              Automation Flow
            </span>
          </div>

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-muted/50 text-muted-foreground border border-border">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Syncing live data...</span>
            </div>
          )}

          {/* Pipeline Nodes */}
          <div className="space-y-0 relative z-10">
            {pipelineNodes.map((node, index) => (
              <div key={node.id} className="flex flex-col items-center">
                {index > 0 && (
                  <PipelineConnector 
                    height={48} 
                    animated={node.status === "active"} 
                  />
                )}
                
                {/* Special handling for outreach - show channels */}
                {node.id === "outreach" ? (
                  <div className="flex flex-col items-center">
                    <PipelineNode
                      node={node}
                      isSelected={selectedNode?.id === node.id}
                      onClick={() => handleNodeClick(node)}
                    />
                    
                    {/* Channel branches */}
                    <div className="mt-6 flex items-start gap-4">
                      {outreachChannels.map((channel, channelIndex) => (
                        <div key={channel.id} className="flex flex-col items-center">
                          {/* Connector from main node */}
                          <div className="h-8 flex items-center">
                            <div className={`w-${channelIndex === 1 ? '0' : '20'} h-0.5 bg-node-connector`} />
                            <div className="w-0.5 h-full bg-node-connector" />
                          </div>
                          <div className="connector-dot mb-2" />
                          
                          {/* Channel node */}
                          <div
                            onClick={() => handleNodeClick({ ...channel, stats: undefined })}
                            className={`pipeline-node w-40 cursor-pointer ${
                              selectedNode?.id === channel.id ? "active" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-node-outreach flex items-center justify-center">
                                <channel.icon className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">{channel.title}</p>
                                <p className="text-xs text-muted-foreground">{channel.subtitle}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Merge connectors back */}
                    <div className="mt-4 flex items-end gap-4">
                      {outreachChannels.map((_, channelIndex) => (
                        <div key={channelIndex} className="flex flex-col items-center">
                          <div className="connector-dot" />
                          <div className="w-0.5 h-6 bg-node-connector" />
                        </div>
                      ))}
                    </div>
                    <div className="w-[280px] h-0.5 bg-node-connector" />
                    <div className="connector-dot" />
                  </div>
                ) : (
                  <PipelineNode
                    node={node}
                    isSelected={selectedNode?.id === node.id}
                    onClick={() => handleNodeClick(node)}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Status summary */}
          <div className="mt-12 p-6 glass-card w-full max-w-md relative z-10 border-t-4 border-t-primary">
            <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              Pipeline Overview
            </h4>
            <div className="grid grid-cols-2 gap-4 gap-y-6 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Total Contacts</p>
                <p className="text-xl font-bold text-foreground tracking-tight">{isLoading ? "..." : (stats?.total || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Validated</p>
                <p className="text-xl font-bold text-success tracking-tight">{isLoading ? "..." : (stats?.byEmailValidation?.VALID || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">In Sequence</p>
                <p className="text-xl font-bold text-primary tracking-tight">{isLoading ? "..." : (stats?.byStatus?.IN_SEQUENCE || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Replied</p>
                <p className="text-xl font-bold text-node-reply tracking-tight">{isLoading ? "..." : (stats?.replied || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <NodeDetailPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
        />
      )}
      </div>
    </div>
  );
};
