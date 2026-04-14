import { cn } from "@/lib/utils"
import { ReactNode } from "react"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }