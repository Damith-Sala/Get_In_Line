import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'

let io: ServerIO

export const initializeSocketServer = (httpServer: NetServer) => {
  if (!io) {
    io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log('🔌 New client connected:', socket.id)

      // Join queue room for real-time updates
      socket.on('join-queue', (queueId: string) => {
        socket.join(`queue-${queueId}`)
        console.log(`📋 Client ${socket.id} joined queue ${queueId}`)
        
        // Send confirmation
        socket.emit('joined-queue', { queueId, message: 'Successfully joined queue room' })
      })

      // Leave queue room
      socket.on('leave-queue', (queueId: string) => {
        socket.leave(`queue-${queueId}`)
        console.log(`📤 Client ${socket.id} left queue ${queueId}`)
      })

      // Handle position updates
      socket.on('position-update', (data: { queueId: string, position: number }) => {
        socket.to(`queue-${data.queueId}`).emit('position-changed', data)
        console.log(`📍 Position update broadcasted for queue ${data.queueId}`)
      })

      socket.on('disconnect', () => {
        console.log('🔌 Client disconnected:', socket.id)
      })
    })

    console.log('🚀 Socket.IO server initialized')
  }
  return io
}

export const getSocketServer = () => {
  return io
}

export const broadcastToQueue = (queueId: string, event: string, data: any) => {
  if (io) {
    io.to(`queue-${queueId}`).emit(event, data)
    console.log(`📡 Broadcasted ${event} to queue ${queueId}:`, data)
  } else {
    console.warn('⚠️ Socket.IO server not initialized')
  }
}
