"use client";

import { useState } from "react";
import type { JurisdictionCode } from "@/config/jurisdictions";

import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>("US");
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen flex-col bg-white figma-shadow-app">
      <Header
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
      />
      <div className="flex flex-1 gap-6 overflow-hidden p-0 pl-0">
        <div
          className={cn(
            "hidden shrink-0 pl-0 md:block",
            collapsed ? "w-[88px]" : "w-[304px]"
          )}
        >
          <div className="sticky top-20 h-[calc(100vh-5rem)] px-3 pb-3">
            <Sidebar />
          </div>
        </div>
        <main className="min-w-0 flex-1 overflow-y-auto px-6 pb-8 pr-6 pt-2">
          {children}
        </main>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </SidebarProvider>
  );
}
