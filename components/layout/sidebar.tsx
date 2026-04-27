"use client";

import {
  LayoutDashboard,
  FileText,
  Search,
  PenTool,
  BookTemplate,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/contracts", label: "Contracts", icon: FileText },
  { href: "/analysis", label: "Analysis", icon: Search },
  { href: "/drafting", label: "AI Drafting", icon: PenTool },
  { href: "/templates", label: "Templates", icon: BookTemplate },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-border bg-background/90 backdrop-blur-xl transition-all duration-300 ease-in-out dark:bg-muted/50",
          collapsed ? "w-[64px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-border px-3">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-2 overflow-hidden transition-opacity hover:opacity-90",
              collapsed && "w-full justify-center"
            )}
          >
            <Shield className="h-6 w-6 shrink-0 text-primary" />
            {!collapsed && (
              <span className="truncate bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-lg font-semibold text-transparent">
                Clause AI
              </span>
            )}
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className={cn(collapsed && "ml-2")}>
                  {label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* Collapse toggle & Sign out */}
        <div className="flex flex-col gap-1 border-t border-border p-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-9 w-9 shrink-0 text-muted-foreground hover:bg-accent hover:text-foreground",
                  collapsed ? "mx-auto" : "self-start"
                )}
                onClick={toggle}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-muted-foreground hover:bg-accent/70 hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
                onClick={() => signOut()}
              >
                <LogOut className="h-5 w-5 shrink-0" />
                {!collapsed && <span>Sign out</span>}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">Sign out</TooltipContent>
          </Tooltip>
        </div>
      </aside>
  );
}
