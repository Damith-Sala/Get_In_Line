'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      path: '/api/socketio',
      addTrailingSlash: false,
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  return { socket, isConnected }
}

export const useQueueSocket = (queueId: string) => {
  const { socket, isConnected } = useSocket()
  const [position, setPosition] = useState<number | null>(null)
  const [queueStatus, setQueueStatus] = useState<any>(null)
  const [currentServing, setCurrentServing] = useState<number | null>(null)

  useEffect(() => {
    if (socket && queueId) {
      // Join queue room
      socket.emit('join-queue', queueId)

      // Listen for position updates
      socket.on('position-changed', (data: { queueId: string, position: number }) => {
        if (data.queueId === queueId) {
          setPosition(data.position)
        }
      })

      // Listen for queue status updates
      socket.on('queue-updated', (data: any) => {
        if (data.queueId === queueId) {
          setQueueStatus(data)
        }
      })

      // Listen for "next" calls
      socket.on('next-called', (data: { queueId: string, position: number, message: string }) => {
        if (data.queueId === queueId) {
          setCurrentServing(data.position)
          console.log(`Position ${data.position} is now being served!`)
        }
      })

      return () => {
        socket.emit('leave-queue', queueId)
        socket.off('position-changed')
        socket.off('queue-updated')
        socket.off('next-called')
      }
    }
  }, [socket, queueId])

  return {
    socket,
    isConnected,
    position,
    queueStatus,
    currentServing,
    joinQueue: (queueId: string) => socket?.emit('join-queue', queueId),
    leaveQueue: (queueId: string) => socket?.emit('leave-queue', queueId),
  }
}
