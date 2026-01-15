import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PipelineCanvas } from "@/components/pipeline/PipelineCanvas";
import { Overview } from "@/components/dashboard/Overview";
import { Leads } from "@/components/leads/Leads";
import { Campaigns } from "@/components/campaigns/Campaigns";
import { Integrations } from "@/components/integrations/Integrations";
import { Settings } from "@/components/settings/Settings";

const sectionConfig: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Dashboard with trends and channel performance" },
  pipeline: { title: "Automation Pipeline", subtitle: "End-to-end outbound automation flow" },
  leads: { title: "Leads", subtitle: "Manage your contact database" },
  campaigns: { title: "Outreach", subtitle: "Multi-channel automation status" },
  integrations: { title: "Integrations", subtitle: "External service connections" },
  settings: { title: "Settings", subtitle: "System configuration" },
};

const Index = () => {
  const [activeSection, setActiveSection] = useState("pipeline");
  const currentSection = sectionConfig[activeSection];

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <Overview />;
      case "pipeline":
        return <PipelineCanvas />;
      case "leads":
        return <Leads />;
      case "campaigns":
        return <Campaigns onNavigateToSettings={() => setActiveSection("settings")} />;
      case "integrations":
        return <Integrations />;
      case "settings":
        return <Settings />;
      default:
        return (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">{currentSection.title}</p>
              <p className="text-sm">This section is coming soon</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header 
          title={currentSection.title} 
          subtitle={currentSection.subtitle} 
        />
        <main className="flex-1 flex overflow-hidden">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Index;
