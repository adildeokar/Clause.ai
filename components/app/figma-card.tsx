import { cn } from "@/lib/utils";

interface FigmaCardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddingMap = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function FigmaCard({
  children,
  className,
  padding = "md",
}: FigmaCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[#E8E8E8] bg-white figma-shadow-card",
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
