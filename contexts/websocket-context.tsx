"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import { io, type Socket } from "socket.io-client"
import { useAuth } from "./auth-context"

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (type: string, data: any) => void
  onMessage: (callback: (message: any) => void) => void
  offMessage: (callback: (message: any) => void) => void
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined)

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, isAuthenticated } = useAuth()
  const messageCallbacks = useRef<Set<(message: any) => void>>(new Set())

  useEffect(() => {
    if (isAuthenticated && user) {
      // Initialize WebSocket connection
      const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}`, {
        auth: {
          userId: user.id,
        },
        transports: ["websocket"],
      })

      newSocket.on("connect", () => {
        console.log("Connected to PinkSync WebSocket")
        setIsConnected(true)
      })

      newSocket.on("disconnect", () => {
        console.log("Disconnected from PinkSync WebSocket")
        setIsConnected(false)
      })

      newSocket.on("message", (message) => {
        messageCallbacks.current.forEach((callback) => callback(message))
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
        setSocket(null)
        setIsConnected(false)
      }
    }
  }, [isAuthenticated, user])

  const sendMessage = (type: string, data: any) => {
    if (socket && isConnected) {
      socket.emit("message", { type, data })
    }
  }

  const onMessage = (callback: (message: any) => void) => {
    messageCallbacks.current.add(callback)
  }

  const offMessage = (callback: (message: any) => void) => {
    messageCallbacks.current.delete(callback)
  }

  const value = {
    socket,
    isConnected,
    sendMessage,
    onMessage,
    offMessage,
  }

  return <WebSocketContext.Provider value={value}>{children}</WebSocketContext.Provider>
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (context === undefined) {
    throw new Error("useWebSocket must be used within a WebSocketProvider")
  }
  return context
}
