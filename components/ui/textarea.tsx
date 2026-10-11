import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentPropsWithoutRef<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-[#DDDDDD] bg-white px-3 py-2 text-sm text-[#282828] placeholder:text-[#868686] focus-visible:border-[#66A689] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#006A3B]/20 disabled:cursor-not-allowed disabled:bg-[#F4F7F6] disabled:text-[#868686]",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
