// hooks/useUserMetadata.ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/lib/auth-context"

export interface UserMetadata {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  organizationName?: string
  role?: string
  [key: string]: unknown
}

export function useUserMetadata() {
  const { isAuthenticated } = useAuth()
  const [metadata, setMetadata] = useState<UserMetadata | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetadata = useCallback(async () => {
    if (!isAuthenticated) {
      setMetadata(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/proxy?path=/iam/users/me")

      if (!response.ok) {
        throw new Error("Failed to fetch user metadata")
      }

      const data = await response.json()
      setMetadata(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch user metadata")
      setMetadata(null)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
      setTimeout(() => {
        fetchMetadata()
      }, 0)
    }, [fetchMetadata])

  const updateMetadata = useCallback(async (updates: Partial<UserMetadata>) => {
    if (!isAuthenticated) {
      throw new Error("Not authenticated")
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/proxy?path=/iam/users/me", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error("Failed to update user metadata")
      }

      const data = await response.json()
      setMetadata(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update user metadata"
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  return { metadata, loading, error, refetch: fetchMetadata, updateMetadata }
}
