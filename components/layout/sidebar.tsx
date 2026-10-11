"use client";

import {
  LayoutDashboard,
  Files,
  Users,
  BookOpenText,
  Settings,
  ChevronLeft,
  PenTool,
  Search,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Repository", icon: Files },
  { href: "/settings", label: "Manage Team", icon: Users },
  { href: "/templates", label: "Rule Book", icon: BookOpenText },
] as const;

const toolsNav = [
  { href: "/drafting", label: "AI Drafting", icon: PenTool },
  { href: "/analysis", label: "Analysis", icon: Search },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

function isActive(pathname: string, href: string, match?: string) {
  const base = match ?? href;
  if (base === "/dashboard") return pathname === "/dashboard";
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col justify-between rounded-xl bg-[#F4F7F6] p-2.5 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      <nav className="flex flex-col gap-1.5">
        {primaryNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg p-2 text-base transition-colors",
                active
                  ? "bg-[#006A3B] font-medium text-white"
                  : "text-black hover:bg-[#E5F0EB]",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-6 w-6 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <p className="mb-1 mt-4 px-2 text-xs font-medium uppercase tracking-wide text-[#868686]">
            Intelligence
          </p>
        )}
        {toolsNav.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-lg p-2 text-sm transition-colors",
                active
                  ? "bg-[#006A3B] font-medium text-white"
                  : "text-[#4B4B4B] hover:bg-[#E5F0EB]",
                collapsed && "justify-center px-2"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={toggle}
          className={cn(
            "flex items-center gap-2.5 rounded-lg p-2 text-base text-black transition-colors hover:bg-[#E5F0EB]",
            collapsed && "justify-center"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Close sidebar"}
        >
          <ChevronLeft
            className={cn(
              "h-6 w-6 shrink-0 transition-transform",
              collapsed && "rotate-180"
            )}
          />
          {!collapsed && <span>Close Sidebar</span>}
        </button>
        <Link
          href="/settings"
          title={collapsed ? "Settings" : undefined}
          className={cn(
            "flex items-center gap-2.5 rounded-lg p-2 text-base text-black transition-colors hover:bg-[#E5F0EB]",
            pathname.startsWith("/settings") && "bg-[#E5F0EB] font-medium",
            collapsed && "justify-center"
          )}
        >
          <Settings className="h-6 w-6 shrink-0" strokeWidth={1.75} />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
