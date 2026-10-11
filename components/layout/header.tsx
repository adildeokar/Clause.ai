"use client";

import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Bell, ChevronDown, LogOut, Settings, User } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { JurisdictionCode } from "@/config/jurisdictions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
const JURISDICTIONS: { value: JurisdictionCode; label: string }[] = [
  { value: "US", label: "US" },
  { value: "IN", label: "IN" },
  { value: "UK", label: "UK" },
];

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
  const showJurisdiction =
    pathname.startsWith("/contracts") ||
    pathname.startsWith("/analysis") ||
    pathname.startsWith("/drafting");

  const displayName = session?.user?.name ?? "Admin";
  const initials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <header className="figma-shadow-header flex h-20 shrink-0 items-center justify-between border-b border-[#E8E8E8] bg-white px-8 py-4">
      <p className="text-xl text-black">Cycada&apos;s Records</p>

      <div className="flex items-center gap-4">
        {showJurisdiction && onJurisdictionChange && (
          <Select
            value={jurisdiction}
            onValueChange={(value) =>
              onJurisdictionChange(value as JurisdictionCode)
            }
          >
            <SelectTrigger className="h-9 w-[100px] border-[#DDDDDD] bg-white text-sm text-[#282828]">
              <SelectValue placeholder="Region" />
            </SelectTrigger>
            <SelectContent>
              {JURISDICTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-[0px_0px_4px_0px_rgba(94,94,94,0.31)]"
          aria-label="Notifications"
        >
          <Bell className="h-6 w-6 text-[#006A3B]" />
        </button>

        <div className="h-9 w-px bg-[#DDDDDD]" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-12 items-center gap-2 rounded-lg bg-[#F4F7F6] px-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#006A3B] text-xl text-white">
                {initials}
              </span>
              <span className="text-base text-black">{displayName}</span>
              <ChevronDown className="h-5 w-5 text-black" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="text-sm font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                {session?.user?.email ?? ""}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex cursor-pointer items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/settings" className="flex cursor-pointer items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-[#F83446] focus:text-[#F83446]"
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
