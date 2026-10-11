"use client";

import { Globe } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JURISDICTIONS, JURISDICTION_CODES, type JurisdictionCode } from "@/config/jurisdictions";
import { cn } from "@/lib/utils";

interface JurisdictionSelectProps {
  value: JurisdictionCode;
  onChange: (code: JurisdictionCode) => void;
  disabled?: boolean;
  /** Show only the code in the trigger (for tight spaces like the header). */
  compact?: boolean;
  className?: string;
}

export function JurisdictionSelect({
  value,
  onChange,
  disabled,
  compact,
  className,
}: JurisdictionSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as JurisdictionCode)} disabled={disabled}>
      <SelectTrigger className={cn("gap-2", className)} aria-label="Jurisdiction">
        <Globe className="h-4 w-4 shrink-0 text-[#868686]" />
        {compact ? <span className="flex-1 text-left">{value}</span> : <SelectValue />}
      </SelectTrigger>
      <SelectContent>
        {JURISDICTION_CODES.map((code) => (
          <SelectItem key={code} value={code}>
            {JURISDICTIONS[code].name}
            <span className="ml-1.5 text-xs text-[#868686]">{code}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
