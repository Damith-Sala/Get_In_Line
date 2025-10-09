import { NextRequest } from 'next/server'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'

let io: ServerIO

export async function GET(req: NextRequest) {
  if (!io) {
    const httpServer = new NetServer()
    io = new ServerIO(httpServer, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    })

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id)

      // Join queue room
      socket.on('join-queue', (queueId: string) => {
        socket.join(`queue-${queueId}`)
        console.log(`Client ${socket.id} joined queue ${queueId}`)
      })

      // Leave queue room
      socket.on('leave-queue', (queueId: string) => {
        socket.leave(`queue-${queueId}`)
        console.log(`Client ${socket.id} left queue ${queueId}`)
      })

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
  }

  return new Response('Socket.IO server running', { status: 200 })
}
