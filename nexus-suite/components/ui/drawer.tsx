"use client"

import * as React from "react"
import { cn } from "cn"
import { Drawer as DrawerPrimitive } from "@base-ui/react/drawer"

// Legacy vaul `direction` (where the drawer docks) -> Base UI `swipeDirection`
// (which way you swipe to dismiss). `swipeDirection` wins when both are given.
type DrawerDirection = "top" | "bottom" | "left" | "right"

const directionToSwipeDirection = {
  top: "up",
  bottom: "down",
  left: "left",
  right: "right",
} as const

function Drawer({
  direction,
  swipeDirection,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & {
  direction?: DrawerDirection
}) {
  const resolvedSwipeDirection =
    swipeDirection ??
    (direction ? directionToSwipeDirection[direction] : undefined) ??
    "down"
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      swipeDirection={resolvedSwipeDirection}
      {...props}
    />
  )
}

function DrawerTrigger({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger> & {
  asChild?: boolean
}) {
  if (asChild && React.isValidElement(children)) {
    return (
      <DrawerPrimitive.Trigger
        data-slot="drawer-trigger"
        render={children}
        {...props}
      />
    )
  }
  return (
    <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props}>
      {children}
    </DrawerPrimitive.Trigger>
  )
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  asChild,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close> & {
  asChild?: boolean
}) {
  if (asChild && React.isValidElement(children)) {
    return (
      <DrawerPrimitive.Close
        data-slot="drawer-close"
        render={children}
        {...props}
      />
    )
  }
  return (
    <DrawerPrimitive.Close data-slot="drawer-close" {...props}>
      {children}
    </DrawerPrimitive.Close>
  )
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Backdrop>) {
  return (
    <DrawerPrimitive.Backdrop
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Popup>) {
  return (
    <DrawerPortal data-slot="drawer-portal">
      <DrawerOverlay />
      <DrawerPrimitive.Viewport
        data-slot="drawer-viewport"
        className="pointer-events-none fixed inset-0 z-50 flex"
      >
        <DrawerPrimitive.Popup
          data-slot="drawer-content"
          className={cn(
            "group/drawer-content pointer-events-auto fixed z-50 flex h-auto flex-col bg-background transition-transform duration-300 ease-out data-[swiping]:transition-none",
            // Live drag position follows the finger
            "[transform:translate(var(--drawer-swipe-movement-x,0px),var(--drawer-swipe-movement-y,0px))]",
            // Bottom sheet (swipe down to dismiss)
            "data-[swipe-direction=down]:inset-x-0 data-[swipe-direction=down]:bottom-0 data-[swipe-direction=down]:mt-24 data-[swipe-direction=down]:max-h-[80vh] data-[swipe-direction=down]:rounded-t-lg data-[swipe-direction=down]:border-t data-[swipe-direction=down]:data-[ending-style]:translate-y-full data-[swipe-direction=down]:data-[starting-style]:translate-y-full",
            // Top sheet (swipe up to dismiss)
            "data-[swipe-direction=up]:inset-x-0 data-[swipe-direction=up]:top-0 data-[swipe-direction=up]:mb-24 data-[swipe-direction=up]:max-h-[80vh] data-[swipe-direction=up]:rounded-b-lg data-[swipe-direction=up]:border-b data-[swipe-direction=up]:data-[ending-style]:-translate-y-full data-[swipe-direction=up]:data-[starting-style]:-translate-y-full",
            // Right drawer (swipe right to dismiss)
            "data-[swipe-direction=right]:inset-y-0 data-[swipe-direction=right]:right-0 data-[swipe-direction=right]:w-3/4 data-[swipe-direction=right]:border-l data-[swipe-direction=right]:sm:max-w-sm data-[swipe-direction=right]:data-[ending-style]:translate-x-full data-[swipe-direction=right]:data-[starting-style]:translate-x-full",
            // Left drawer (swipe left to dismiss)
            "data-[swipe-direction=left]:inset-y-0 data-[swipe-direction=left]:left-0 data-[swipe-direction=left]:w-3/4 data-[swipe-direction=left]:border-r data-[swipe-direction=left]:sm:max-w-sm data-[swipe-direction=left]:data-[ending-style]:-translate-x-full data-[swipe-direction=left]:data-[starting-style]:-translate-x-full",
            className
          )}
          {...props}
        >
          <div className="mx-auto mt-4 hidden h-2 w-[100px] shrink-0 rounded-full bg-muted group-data-[swipe-direction=down]/drawer-content:block group-data-[swipe-direction=up]/drawer-content:block" />
          <DrawerPrimitive.Content className="flex h-full min-h-0 flex-col">
            {children}
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Popup>
      </DrawerPrimitive.Viewport>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 p-4 group-data-[swipe-direction=down]/drawer-content:text-center group-data-[swipe-direction=up]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
