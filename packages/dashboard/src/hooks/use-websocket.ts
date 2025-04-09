"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

type WebSocketStatus = 'connecting' | 'open' | 'closed' | 'error'

interface UseWebSocketOptions {
  onOpen?: (event: WebSocketEventMap['open']) => void
  onMessage?: (event: WebSocketEventMap['message']) => void
  onClose?: (event: WebSocketEventMap['close']) => void
  onError?: (event: WebSocketEventMap['error']) => void
  reconnectInterval?: number
  reconnectAttempts?: number
  autoReconnect?: boolean
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onOpen,
    onMessage,
    onClose,
    onError,
    reconnectInterval = 3000,
    reconnectAttempts = 5,
    autoReconnect = true,
  } = options

  const [status, setStatus] = useState<WebSocketStatus>('connecting')
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<Event | null>(null)
  
  const ws = useRef<WebSocket | null>(null)
  const reconnectCount = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()

  const connect = useCallback(() => {
    // Clear any existing connection
    if (ws.current) {
      ws.current.close()
    }

    // Create new WebSocket connection
    ws.current = new WebSocket(url)
    setStatus('connecting')
    setError(null)

    // Setup event handlers
    ws.current.onopen = (event) => {
      setStatus('open')
      reconnectCount.current = 0
      if (onOpen) onOpen(event)
    }

    ws.current.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data)
        setData(parsedData)
        if (onMessage) onMessage(event)
      } catch (e) {
        setData(event.data)
        if (onMessage) onMessage(event)
      }
    }

    ws.current.onclose = (event) => {
      setStatus('closed')
      if (onClose) onClose(event)

      // Handle reconnection
      if (autoReconnect && reconnectCount.current < reconnectAttempts) {
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectCount.current += 1
          connect()
        }, reconnectInterval)
      }
    }

    ws.current.onerror = (event) => {
      setStatus('error')
      setError(event)
      if (onError) onError(event)
    }
  }, [url, onOpen, onMessage, onClose, onError, reconnectInterval, reconnectAttempts, autoReconnect])

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    if (ws.current) {
      ws.current.close()
      ws.current = null
    }
    
    setStatus('closed')
  }, [])

  const sendMessage = useCallback((message: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      if (typeof message === 'string') {
        ws.current.send(message)
      } else if (message instanceof Blob) {
        ws.current.send(message)
      } else {
        ws.current.send(message)
      }
      return true
    }
    return false
  }, [])

  const sendJsonMessage = useCallback((data: any) => {
    return sendMessage(JSON.stringify(data))
  }, [sendMessage])

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    connect()
    
    return () => {
      disconnect()
    }
  }, [connect, disconnect])

  return {
    status,
    data,
    error,
    sendMessage,
    sendJsonMessage,
    disconnect,
    reconnect: connect,
  }
}
