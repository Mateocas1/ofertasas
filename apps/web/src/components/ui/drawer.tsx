"use client"

import { cn } from "@/lib/utils"
import { useImperativeHandle } from "react"
import { Drawer as DrawerPrimitive } from "react-drawer"
import { type DrawerProps } from "react-drawer"

const Drawer = ({ children, ...props }: DrawerProps) => {
  return (
    <DrawerPrimitive
      className={cn("fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col")}
      {...props}
    >
      {children}
    </DrawerPrimitive>
  )
}

export { Drawer }