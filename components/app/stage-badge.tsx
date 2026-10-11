import { cn } from "@/lib/utils";
import type { ContractStage } from "@/lib/design-tokens";

const stageStyles: Record<
  ContractStage,
  { bg: string; text: string }
> = {
  Analyzed: { bg: "bg-[#E5F0EB]", text: "text-[#006A3B]" },
  "Not analyzed": { bg: "bg-[#DDDDDD]", text: "text-[#4B4B4B]" },
  Failed: { bg: "bg-[#FFF0EE]", text: "text-[#F83446]" },
  Analyzing: { bg: "bg-[#FDF2DC]", text: "text-[#B97502]" },
};

interface StageBadgeProps {
  stage: ContractStage;
  className?: string;
}

export function StageBadge({ stage, className }: StageBadgeProps) {
  const styles = stageStyles[stage];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded px-1.5 py-1 text-xs font-medium leading-[1.3]",
        styles.bg,
        styles.text,
        className
      )}
    >
      {stage}
    </span>
  );
}
