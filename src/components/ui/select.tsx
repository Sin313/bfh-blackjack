
"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Select = ({ children, value, onValueChange }: any) => {
    const [isOpen, setIsOpen] = React.useState(false)

    return (
        <div className="relative w-full">
            {React.Children.map(children, child => {
                if (child.type === SelectTrigger) {
                    return React.cloneElement(child, {
                        onClick: () => setIsOpen(!isOpen),
                        value
                    })
                }
                if (child.type === SelectContent && isOpen) {
                    return React.cloneElement(child, {
                        onClose: () => setIsOpen(false),
                        onValueChange,
                        selectedValue: value
                    })
                }
                return null
            })}
        </div>
    )
}

const SelectTrigger = ({ className, children, value, onClick }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50",
            className
        )}
    >
        {children}
    </button>
)

const SelectValue = ({ placeholder, value }: any) => (
    <span className="truncate">{value || placeholder}</span>
)

const SelectContent = ({ children, className, onClose, onValueChange, selectedValue }: any) => (
    <>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
            className={cn(
                "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-white/10 bg-slate-900 p-1 text-slate-200 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none animate-in fade-in zoom-in-95",
                className
            )}
        >
            {React.Children.map(children, child => {
                if (child.type === SelectItem) {
                    return React.cloneElement(child, {
                        onClick: () => {
                            onValueChange(child.props.value)
                            onClose()
                        },
                        isSelected: child.props.value === selectedValue
                    })
                }
                return child
            })}
        </div>
    </>
)

const SelectItem = ({ children, className, onClick, isSelected }: any) => (
    <div
        onClick={onClick}
        className={cn(
            "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-white/10 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
            isSelected && "bg-white/10",
            className
        )}
    >
        {isSelected && (
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
        )}
        {children}
    </div>
)

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
