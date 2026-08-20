import { cn } from "@/lib/utils"
import logoSrc from "@/assets/aerodeals-logo.png"

// The client's original logo asset (see src/assets/aerodeals-logo.png).
// Single source of truth for the logo so every screen that shows the
// client's branding renders the exact same file, aspect ratio preserved.
interface LogoProps {
  className?: string
  /** Tailwind height class, e.g. "h-8". Width follows automatically to keep aspect ratio. */
  heightClassName?: string
}

export function Logo({ className, heightClassName = "h-8" }: LogoProps) {
  return (
    <img
      src={logoSrc}
      alt="Aerodeals"
      className={cn("w-auto object-contain", heightClassName, className)}
    />
  )
}
