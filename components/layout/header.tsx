"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut, Menu, Settings } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { JurisdictionSelect } from "@/components/app/jurisdiction-select";
import { useWorkingJurisdiction } from "./jurisdiction-context";
import { Sidebar } from "./sidebar";

export function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { jurisdiction, setJurisdiction } = useWorkingJurisdiction();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Close the mobile drawer after navigating.
  useEffect(() => setMobileNavOpen(false), [pathname]);

  const displayName = session?.user?.name || session?.user?.email || "Account";
  const initials =
    displayName
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <header className="figma-shadow-header flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#E8E8E8] bg-white px-4 md:h-20 md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[#282828] hover:bg-[#F4F7F6] md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/dashboard" className="truncate text-xl font-medium text-black">
          Clause.Ai
        </Link>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <JurisdictionSelect
          value={jurisdiction}
          onChange={setJurisdiction}
          compact
          className="h-9 w-[92px] border-[#DDDDDD] bg-white text-sm text-[#282828]"
        />

        <div className="hidden h-9 w-px bg-[#DDDDDD] sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-11 items-center gap-2 rounded-lg bg-[#F4F7F6] px-2 sm:px-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#006A3B] text-sm text-white sm:h-9 sm:w-9 sm:text-base">
                {initials}
              </span>
              <span className="hidden max-w-[160px] truncate text-base text-black sm:inline">
                {displayName}
              </span>
              <ChevronDown className="hidden h-5 w-5 text-black sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-2">
              <p className="truncate text-sm font-medium">{displayName}</p>
              <p className="truncate text-xs text-muted-foreground">{session?.user?.email ?? ""}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex cursor-pointer items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-[#F83446] focus:text-[#F83446]"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent>
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar mobile />
        </SheetContent>
      </Sheet>
    </header>
  );
}
