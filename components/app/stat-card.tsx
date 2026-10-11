import { cn } from "@/lib/utils";

type StatVariant = "active" | "alert" | "pending" | "total";

const variants: Record<
  StatVariant,
  {
    container: string;
    value: string;
    label: string;
  }
> = {
  active: {
    container: "bg-[#E5F0EB] border-[#66A689]",
    value: "text-[#006A3B]",
    label: "text-[#66A689]",
  },
  alert: {
    container: "bg-[#FFF0EE] border-[#FC7F79]",
    value: "text-[#BB032A]",
    label: "text-[#F83446]",
  },
  pending: {
    container: "bg-[#FDF2DC] border-[#D79900]",
    value: "text-[#9F6402]",
    label: "text-[#B97502]",
  },
  total: {
    container: "bg-white border-[#A6A6A6]",
    value: "text-[#282828]",
    label: "text-[#282828]",
  },
};

interface StatCardProps {
  variant: StatVariant;
  value: number | string;
  label: string;
  sublabel?: string;
  className?: string;
}

export function StatCard({
  variant,
  value,
  label,
  sublabel,
  className,
}: StatCardProps) {
  const v = variants[variant];
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4 rounded-lg border p-6 shadow-[0px_4px_4px_0px_rgba(0,0,0,0.05)]",
        v.container,
        className
      )}
    >
      <p className={cn("text-[40px] font-medium leading-none tracking-[0.2px]", v.value)}>
        {value}
      </p>
      <div className={cn("text-lg font-medium leading-tight", v.label)}>
        <p>{label}</p>
        {sublabel && <p>{sublabel}</p>}
      </div>
    </div>
  );
}
