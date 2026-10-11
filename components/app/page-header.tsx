import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div>
        <h1 className="text-[32px] font-medium leading-tight tracking-[-0.08px] text-black">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-base text-[#868686]">{description}</p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex h-8 shrink-0 items-center gap-2 rounded bg-[#006A3B] px-3 text-sm font-medium text-white shadow-[0px_2px_2px_rgba(51,136,98,0.08)] hover:bg-[#005a32]"
        >
          {action.label}
          <ArrowUpRight className="h-5 w-5" />
        </Link>
      )}
    </div>
  );
}
