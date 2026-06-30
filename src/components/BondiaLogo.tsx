import { cn } from "@/lib/utils"

interface BondiaLogoProps {
  className?: string
  logoUrl?: string | null
  /** Variante en cabecera oscura (sidebar) o en paneles claros (ajustes). */
  variant?: "header" | "panel"
}

export function BondiaLogo({
  className,
  logoUrl,
  variant = "header",
}: BondiaLogoProps) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt="Bondia"
        className={cn("h-8 w-auto max-w-[160px] object-contain object-left", className)}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label="Bondia"
      className={cn(
        "text-lg font-semibold tracking-tight",
        variant === "header"
          ? "text-sidebar-primary-foreground"
          : "text-foreground",
        className
      )}
    >
      Bondia
    </span>
  )
}
