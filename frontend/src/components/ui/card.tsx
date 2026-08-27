import * as React from "react"
import { cn } from "../../lib/utils"
export const Card = ({className,...props}: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("rounded-2xl border bg-white dark:bg-stone-900/80 text-card-foreground shadow-xs border-stone-200/80 dark:border-stone-800 backdrop-blur transition-all", className)} {...props} />
export const CardHeader = ({className,...props}: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-6 pb-3", className)} {...props} />
export const CardTitle = ({className,...props}: React.HTMLAttributes<HTMLHeadingElement>) => <h3 className={cn("font-bold text-base tracking-tight text-stone-900 dark:text-stone-100", className)} {...props} />
export const CardContent = ({className,...props}: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("p-6 pt-2", className)} {...props} />

