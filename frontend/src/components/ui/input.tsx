import * as React from "react"
import { cn } from "../../lib/utils"
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props}, ref) => (
  <input ref={ref} className={cn("flex h-10 w-full rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/50 px-3 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#eab308] focus:border-[#eab308]", className)} {...props} />
))
Input.displayName="Input"
