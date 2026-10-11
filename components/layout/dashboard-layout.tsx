"use client";

import { SidebarProvider, useSidebar } from "./sidebar-context";
import { JurisdictionProvider } from "./jurisdiction-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white figma-shadow-app">
      <Header />
      <div className="flex min-h-0 flex-1 gap-6">
        <div
          className={cn(
            "hidden shrink-0 md:block",
            collapsed ? "w-[88px]" : "w-[304px]"
          )}
        >
          <div className="h-full px-3 pb-3 pt-2">
            <Sidebar />
          </div>
        </div>
        <main id="main-scroll" className="min-w-0 flex-1 overflow-y-auto px-4 pb-8 pt-2 md:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <JurisdictionProvider>
      <SidebarProvider>
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </SidebarProvider>
    </JurisdictionProvider>
  );
}
