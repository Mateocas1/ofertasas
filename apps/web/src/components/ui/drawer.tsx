"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface DrawerProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Drawer({ open, onOpenChange, children }: DrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange?.(false)}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-lg">
        {children}
      </div>
    </div>
  )
}

function DrawerContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col overflow-y-auto", className)} {...props}>
      {children}
    </div>
  )
}

function DrawerHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-2 p-4 border-b", className)} {...props}>
      {children}
    </div>
  )
}

function DrawerTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h3>
  )
}

function DrawerDescription({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props}>
      {children}
    </p>
  )
}

function DrawerFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col gap-2 p-4 border-t", className)} {...props}>
      {children}
    </div>
  )
}

function DrawerClose({ children, asChild, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>
}

export { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose }