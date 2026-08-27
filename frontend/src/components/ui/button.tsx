import * as React from "react"
import { cn } from "../../lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "danger" | "secondary"
  size?: "sm" | "md" | "lg"
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant="default", size="md", ...props}, ref) => {
  const variants: Record<string,string> = {
    default: "bg-amber-500 text-stone-950 hover:bg-amber-600 font-semibold shadow-xs transition-all active:scale-[0.98] dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-stone-950",
    secondary: "bg-stone-100 text-stone-900 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 font-medium",
    outline: "border border-stone-300 bg-white hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium shadow-2xs",
    ghost: "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium",
    danger: "bg-rose-600 text-white hover:bg-rose-700 font-semibold shadow-xs dark:bg-rose-600 dark:hover:bg-rose-700"
  }
  const sizes: Record<string,string> = {
    sm: "h-8 px-3 text-xs rounded-xl",
    md: "h-10 px-4 text-sm rounded-xl",
    lg: "h-11 px-6 text-sm font-semibold rounded-2xl"
  }
  return <button ref={ref} className={cn("inline-flex items-center justify-center font-sans transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed", variants[variant], sizes[size], className)} {...props} />
})
Button.displayName="Button"
