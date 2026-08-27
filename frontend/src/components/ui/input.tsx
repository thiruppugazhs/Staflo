import * as React from "react"
import { cn } from "../../lib/utils"
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props}, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900/60 px-3.5 py-2 text-sm text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition shadow-2xs", className)} {...props} />
))
Input.displayName="Input"

