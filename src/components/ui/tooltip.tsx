
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const TooltipProvider = ({ children }: { children: React.ReactNode }) => children

const Tooltip = ({ children }: { children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {React.Children.map(children, child => {
                if ((child as any).type === TooltipTrigger) return child
                if ((child as any).type === TooltipContent && isOpen) return child
                return null
            })}
        </div>
    )
}

const TooltipTrigger = ({ children, asChild }: any) => {
    return <div className="inline-block cursor-help">{children}</div>
}

const TooltipContent = ({ children, className }: any) => (
    <div
        className={cn(
            "absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 rounded-md bg-slate-900 border border-white/10 px-3 py-1.5 text-xs text-slate-200 shadow-xl animate-in fade-in zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
    >
        {children}
    </div>
)

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
