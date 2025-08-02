"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  username: string
  full_name: string
  deaf_identity: string
  preferred_sign_language: string
  biometric_enrolled: boolean
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginBiometric: (videoData: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem("pinksync_token")
    if (token) {
      verifyToken(token)
    } else {
      setIsLoading(false)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      } else {
        localStorage.removeItem("pinksync_token")
      }
    } catch (error) {
      console.error("Token verification failed:", error)
      localStorage.removeItem("pinksync_token")
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Login failed")
      }

      const data = await response.json()

      localStorage.setItem("pinksync_token", data.access_token)
      setUser(data.user)

      router.push("/dashboard")
    } catch (error) {
      throw error
    }
  }

  const loginBiometric = async (videoData: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/biometric-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ video_data: videoData }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Biometric login failed")
      }

      const data = await response.json()

      localStorage.setItem("pinksync_token", data.access_token)
      setUser(data.user)

      router.push("/dashboard")
    } catch (error) {
      throw error
    }
  }

  const register = async (userData: any) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || "Registration failed")
      }

      // After successful registration, log the user in
      await login(userData.email, userData.password)
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem("pinksync_token")
    setUser(null)
    router.push("/")
  }

  const refreshToken = async () => {
    try {
      const token = localStorage.getItem("pinksync_token")
      if (!token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem("pinksync_token", data.access_token)
      }
    } catch (error) {
      console.error("Token refresh failed:", error)
      logout()
    }
  }

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    loginBiometric,
    register,
    logout,
    refreshToken,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
