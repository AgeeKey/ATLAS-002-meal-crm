import { Link } from "@tanstack/react-router"
import { UtensilsCrossed } from "lucide-react"

import { cn } from "@/lib/utils"

interface LogoProps {
  variant?: "full" | "icon" | "responsive"
  className?: string
  asLink?: boolean
}

export function Logo({
  variant = "full",
  className,
  asLink = true,
}: LogoProps) {
  const iconElement = (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
      <UtensilsCrossed className="size-4" />
    </div>
  )

  const textElement = (
    <div className="flex flex-col text-left leading-tight">
      <span className="text-sm font-bold tracking-tight text-foreground">
        Atlas Meal
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        CRM • Питание
      </span>
    </div>
  )

  const content = (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      {iconElement}
      {variant === "icon" ? null : (
        <div
          className={cn(
            variant === "responsive" &&
              "group-data-[collapsible=icon]:hidden transition-opacity",
          )}
        >
          {textElement}
        </div>
      )}
    </div>
  )

  if (!asLink) {
    return content
  }

  return (
    <Link
      to="/"
      aria-label="Atlas Meal CRM — На главную"
      className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {content}
    </Link>
  )
}
