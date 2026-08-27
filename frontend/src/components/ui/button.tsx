import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "accent" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant="default", size="md", ...props}, ref) => {
  const variants: Record<string,string> = {
    default: "bg-[var(--theme-primary,#004E72)] text-[var(--theme-primary-fg,#ffffff)] font-medium hover:opacity-90 shadow-xs active:scale-[0.98]",
    accent: "bg-[var(--theme-accent,#FF6E42)] text-[var(--theme-accent-fg,#ffffff)] font-medium hover:opacity-90 shadow-xs active:scale-[0.98]",
    outline: "border border-[var(--theme-border,#E2E8F0)] bg-[var(--theme-card,#ffffff)] hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground",
    ghost: "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground"
  }
  const sizes: Record<string,string> = { sm: "h-8 px-3 text-sm", md: "h-10 px-4", lg: "h-11 px-8" }
  return <button ref={ref} className={cn("inline-flex items-center justify-center rounded-md font-medium transition-colors disabled:opacity-50", variants[variant], sizes[size], className)} {...props} />
})
Button.displayName="Button"
