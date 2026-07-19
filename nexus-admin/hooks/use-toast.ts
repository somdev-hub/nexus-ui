"use client"

import { useCallback } from "react"
import { toast as sonnerToast } from "sonner"

interface ToastOptions {
  title?: string
  description?: string
  variant?: "default" | "destructive" | "warning" | "info" | "success"
}

export function useToast() {
  const toast = useCallback(
    ({ title, description, variant = "default" }: ToastOptions) => {
      if (variant === "destructive") {
        sonnerToast.error(title || description || "Error", {
          description: title ? description : undefined,
        })
      } else if (variant === "warning") {
        sonnerToast.warning(title || description || "Warning", {
          description: title ? description : undefined,
        })
      } else if (variant === "info") {
        sonnerToast.info(title || description || "Info", {
          description: title ? description : undefined,
        })
      } else {
        sonnerToast.success(title || description || "Success", {
          description: title ? description : undefined,
        })
      }
    },
    []
  )

  return { toast }
}