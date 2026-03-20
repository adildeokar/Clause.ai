"use client";

import { useState } from "react";
import type { JurisdictionCode } from "@/config/jurisdictions";

import { SidebarProvider, useSidebar } from "./sidebar-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>("US");
  const { collapsed } = useSidebar();

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ${collapsed ? "ml-[64px]" : "ml-[240px]"}`}
    >
      <Header
        jurisdiction={jurisdiction}
        onJurisdictionChange={setJurisdiction}
      />
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <DashboardLayoutInner>{children}</DashboardLayoutInner>
      </div>
    </SidebarProvider>
  );
}
