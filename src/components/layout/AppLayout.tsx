import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";

export const AppLayout = () => {
  return (
    <div className="flex h-screen bg-background overflow-hidden selection:bg-primary/20 selection:text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <main className="flex-1 flex flex-col overflow-hidden relative bg-muted/10">
          <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom" style={{ maskImage: "linear-gradient(to bottom, transparent, black)" }}></div>
          <div className="absolute top-0 w-full h-40 bg-gradient-to-b from-background/80 to-transparent pointer-events-none z-10" />
          <div className="relative w-full h-full z-10 flex flex-col flex-1">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPalette />
    </div>
  );
};
