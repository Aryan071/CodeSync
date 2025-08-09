import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface FileNode {
  id: string
  name: string
  type: 'file' | 'folder'
  path: string
  content?: string
  language?: string
  children?: FileNode[]
  isOpen?: boolean
  isSelected?: boolean
  lastModified?: string
}

export interface Cursor {
  userId: string
  username: string
  position: { line: number; column: number }
  selection?: {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
  }
  color: string
}

export interface Operation {
  id: string
  type: 'insert' | 'delete' | 'retain'
  position: number
  content?: string
  length?: number
  author: string
  timestamp: number
  fileId: string
}

interface EditorState {
  // File management
  files: FileNode[]
  activeFileId: string | null
  openTabs: string[]
  
  // Collaboration
  cursors: Map<string, Cursor>
  operations: Operation[]
  isConnected: boolean
  roomId: string | null
  
  // Editor state
  theme: 'light' | 'dark'
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  
  // Actions
  setFiles: (files: FileNode[]) => void
  addFile: (file: FileNode) => void
  updateFile: (fileId: string, updates: Partial<FileNode>) => void
  deleteFile: (fileId: string) => void
  setActiveFile: (fileId: string | null) => void
  openTab: (fileId: string) => void
  closeTab: (fileId: string) => void
  
  // Collaboration actions
  updateCursor: (userId: string, cursor: Cursor) => void
  removeCursor: (userId: string) => void
  addOperation: (operation: Operation) => void
  setConnected: (connected: boolean) => void
  setRoomId: (roomId: string | null) => void
  
  // Settings actions
  setTheme: (theme: 'light' | 'dark') => void
  setFontSize: (size: number) => void
  setWordWrap: (wrap: boolean) => void
  setMinimap: (minimap: boolean) => void
}

export const useEditorStore = create<EditorState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    files: [],
    activeFileId: null,
    openTabs: [],
    cursors: new Map(),
    operations: [],
    isConnected: false,
    roomId: null,
    theme: 'dark',
    fontSize: 14,
    wordWrap: true,
    minimap: true,

    // File management
    setFiles: (files) => set({ files }),
    
    addFile: (file) => set((state) => ({
      files: [...state.files, file]
    })),
    
    updateFile: (fileId, updates) => set((state) => ({
      files: state.files.map(file => 
        file.id === fileId ? { ...file, ...updates } : file
      )
    })),
    
    deleteFile: (fileId) => set((state) => ({
      files: state.files.filter(file => file.id !== fileId),
      openTabs: state.openTabs.filter(id => id !== fileId),
      activeFileId: state.activeFileId === fileId ? null : state.activeFileId
    })),
    
    setActiveFile: (fileId) => set({ activeFileId: fileId }),
    
    openTab: (fileId) => set((state) => ({
      openTabs: state.openTabs.includes(fileId) 
        ? state.openTabs 
        : [...state.openTabs, fileId],
      activeFileId: fileId
    })),
    
    closeTab: (fileId) => set((state) => {
      const newTabs = state.openTabs.filter(id => id !== fileId)
      const newActiveFile = state.activeFileId === fileId 
        ? (newTabs.length > 0 ? newTabs[newTabs.length - 1] : null)
        : state.activeFileId
      
      return {
        openTabs: newTabs,
        activeFileId: newActiveFile
      }
    }),

    // Collaboration
    updateCursor: (userId, cursor) => set((state) => {
      const newCursors = new Map(state.cursors)
      newCursors.set(userId, cursor)
      return { cursors: newCursors }
    }),
    
    removeCursor: (userId) => set((state) => {
      const newCursors = new Map(state.cursors)
      newCursors.delete(userId)
      return { cursors: newCursors }
    }),
    
    addOperation: (operation) => set((state) => ({
      operations: [...state.operations, operation]
    })),
    
    setConnected: (connected) => set({ isConnected: connected }),
    setRoomId: (roomId) => set({ roomId }),

    // Settings
    setTheme: (theme) => set({ theme }),
    setFontSize: (fontSize) => set({ fontSize }),
    setWordWrap: (wordWrap) => set({ wordWrap }),
    setMinimap: (minimap) => set({ minimap }),
  }))
)
