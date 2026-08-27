import * as React from "react"
import { cn } from "../../lib/utils"
export const Card = ({className,...props}: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("rounded-xl border bg-card text-card-foreground shadow-sm border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 backdrop-blur", className)} {...props} />
export const CardHeader = ({className,...props}: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-6 pb-2", className)} {...props} />
export const CardTitle = ({className,...props}: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
export const CardContent = ({className,...props}: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-6 pt-0", className)} {...props} />
