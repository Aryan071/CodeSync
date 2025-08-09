import { io, Socket } from 'socket.io-client'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'

class SocketService {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(roomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
      const token = useAuthStore.getState().token

      if (!token) {
        reject(new Error('No authentication token'))
        return
      }

      this.socket = io(SOCKET_URL, {
        auth: { token },
        query: { roomId },
        transports: ['websocket', 'polling'],
      })

      this.socket.on('connect', () => {
        console.log('Connected to server')
        useEditorStore.getState().setConnected(true)
        useEditorStore.getState().setRoomId(roomId)
        this.reconnectAttempts = 0
        resolve()
      })

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server:', reason)
        useEditorStore.getState().setConnected(false)
        
        if (reason === 'io server disconnect') {
          // Server disconnected, need to reconnect manually
          this.reconnect(roomId)
        }
      })

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        useEditorStore.getState().setConnected(false)
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnect(roomId)
        } else {
          toast.error('Failed to connect to server')
          reject(error)
        }
      })

      this.setupEventListeners()
    })
  }

  private reconnect(roomId: string) {
    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    setTimeout(() => {
      console.log(`Reconnection attempt ${this.reconnectAttempts}`)
      this.connect(roomId).catch(console.error)
    }, delay)
  }

  private setupEventListeners() {
    if (!this.socket) return

    // Room events
    this.socket.on('room:joined', (data) => {
      console.log('Joined room:', data)
      useEditorStore.getState().setFiles(data.files || [])
      toast.success('Joined room successfully')
    })

    this.socket.on('room:user-joined', (data) => {
      toast.success(`${data.username} joined the room`)
    })

    this.socket.on('room:user-left', (data) => {
      useEditorStore.getState().removeCursor(data.userId)
      toast.success(`${data.username} left the room`)
    })

    // File events
    this.socket.on('file:created', (file) => {
      useEditorStore.getState().addFile(file)
    })

    this.socket.on('file:updated', (data) => {
      useEditorStore.getState().updateFile(data.fileId, data.updates)
    })

    this.socket.on('file:deleted', (data) => {
      useEditorStore.getState().deleteFile(data.fileId)
    })

    // Collaboration events
    this.socket.on('cursor:update', (data) => {
      useEditorStore.getState().updateCursor(data.userId, data.cursor)
    })

    this.socket.on('operation:apply', (operation) => {
      useEditorStore.getState().addOperation(operation)
    })

    // Error events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
      toast.error(error.message || 'An error occurred')
    })
  }

  // Room methods
  joinRoom(roomId: string) {
    this.socket?.emit('room:join', { roomId })
  }

  leaveRoom() {
    this.socket?.emit('room:leave')
  }

  // File methods
  createFile(file: { name: string; type: 'file' | 'folder'; path: string }) {
    this.socket?.emit('file:create', file)
  }

  updateFile(fileId: string, content: string) {
    this.socket?.emit('file:update', { fileId, content })
  }

  deleteFile(fileId: string) {
    this.socket?.emit('file:delete', { fileId })
  }

  // Collaboration methods
  sendOperation(operation: any) {
    this.socket?.emit('operation:send', operation)
  }

  updateCursor(cursor: any) {
    this.socket?.emit('cursor:update', cursor)
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      useEditorStore.getState().setConnected(false)
      useEditorStore.getState().setRoomId(null)
    }
  }

  // Get connection status
  isConnected(): boolean {
    return this.socket?.connected || false
  }
}

export const socketService = new SocketService()
