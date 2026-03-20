"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { User, Settings, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { JurisdictionCode } from "@/config/jurisdictions";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/contracts": "Contracts",
  "/analysis": "Analysis",
  "/drafting": "AI Drafting",
  "/templates": "Templates",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

const JURISDICTIONS: { value: JurisdictionCode; label: string }[] = [
  { value: "US", label: "US" },
  { value: "IN", label: "IN" },
  { value: "UK", label: "UK" },
];

function getPageTitle(pathname: string): string {
  // Exact match
  if (PAGE_TITLES[pathname]) {
    return PAGE_TITLES[pathname];
  }
  // Prefix match for nested routes
  const segment = pathname.split("/")[1];
  const basePath = segment ? `/${segment}` : pathname;
  return PAGE_TITLES[basePath] ?? "Clause AI";
}

interface HeaderProps {
  jurisdiction?: JurisdictionCode;
  onJurisdictionChange?: (jurisdiction: JurisdictionCode) => void;
}

export function Header({
  jurisdiction = "US",
  onJurisdictionChange,
}: HeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6 backdrop-blur-xl">
      <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>

      <div className="flex items-center gap-4">
        <Select
          value={jurisdiction}
          onValueChange={(value) =>
            onJurisdictionChange?.(value as JurisdictionCode)
          }
        >
          <SelectTrigger className="h-9 w-[100px] border-white/[0.08] bg-white/[0.02]">
            <SelectValue placeholder="Jurisdiction" />
          </SelectTrigger>
          <SelectContent>
            {JURISDICTIONS.map(({ value, label }) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full p-0 hover:bg-white/[0.06]"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={session?.user?.image ?? undefined}
                  alt={session?.user?.name ?? "User"}
                />
                <AvatarFallback className="bg-blue-500/20 text-blue-400">
                  {session?.user?.name
                    ?.split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2) ?? "U"}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 border-white/[0.08] bg-popover"
          >
            <div className="px-2 py-2">
              <p className="text-sm font-medium text-foreground">
                {session?.user?.name ?? "User"}
              </p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.email ?? ""}
              </p>
            </div>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/[0.06]"
              asChild
            >
              <a href="/dashboard/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer focus:bg-white/[0.06]"
              asChild
            >
              <a href="/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              className="cursor-pointer text-red-400 focus:bg-red-500/10 focus:text-red-400"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
