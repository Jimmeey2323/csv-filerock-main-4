
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-xl border font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 min-w-[80px] h-7",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow-sm px-3 py-1.5 text-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground shadow-sm px-3 py-1.5 text-xs",
        destructive: "border-transparent bg-destructive text-destructive-foreground shadow-sm px-3 py-1.5 text-xs",
        outline: "text-foreground shadow-sm px-3 py-1.5 text-xs",
        success: "border-transparent bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[80px] h-7",
        warning: "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[80px] h-7",
        active: "border-transparent bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[80px] h-7",
        info: "border-transparent bg-gradient-to-r from-sky-500 to-blue-600 text-white px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[80px] h-7",
        purple: "border-transparent bg-gradient-to-r from-purple-500 to-violet-600 text-white px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[80px] h-7",
        emerald: "border-transparent bg-gradient-to-r from-emerald-500 to-green-600 text-white px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[80px] h-7",
        rose: "border-transparent bg-gradient-to-r from-rose-500 to-red-600 text-white px-4 py-2 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[80px] h-7",
        premium: "border-transparent bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg backdrop-blur-sm px-4 py-2 text-xs font-bold min-w-[80px] h-7",
        conversion: "border-transparent bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-700 text-white px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[90px] h-7 flex items-center gap-1",
        retention: "border-transparent bg-gradient-to-r from-emerald-500 via-green-600 to-teal-700 text-white px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[90px] h-7 flex items-center gap-1",
        excluded: "border-transparent bg-gradient-to-r from-rose-500 via-red-600 to-red-700 text-white px-3 py-1 text-xs font-bold shadow-lg backdrop-blur-sm min-w-[90px] h-7 flex items-center gap-1",
        modern: "border border-slate-200/50 px-4 py-2 text-xs rounded-xl bg-white/90 text-slate-800 font-bold shadow-md backdrop-blur-sm min-w-[80px] h-7",
        luxury: "border border-slate-200/30 px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-white/95 to-slate-50/95 text-slate-800 font-bold shadow-lg backdrop-blur-xl min-w-[80px] h-7",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge,  }
