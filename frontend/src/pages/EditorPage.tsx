import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CodeBracketIcon,
  UsersIcon,
  ShareIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { useAuthStore } from '../store/authStore'
import { useEditorStore } from '../store/editorStore'
import { socketService } from '../services/socket'
import FileTree from '../components/editor/FileTree'
import EditorTabs from '../components/editor/EditorTabs'
import MonacoEditor from '../components/editor/MonacoEditor'
import AIAssistant from '../components/editor/AIAssistant'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import api from '../services/api'
import toast from 'react-hot-toast'

const EditorPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { 
    files, 
    activeFileId, 
    isConnected, 
    setFiles, 
    setConnected,
    theme,
    setTheme
  } = useEditorStore()

  const [isLoading, setIsLoading] = useState(true)
  const [room, setRoom] = useState<any>(null)
  const [connectedUsers, setConnectedUsers] = useState<any[]>([])
  const [showUserList, setShowUserList] = useState(false)
  const [showAIAssistant, setShowAIAssistant] = useState(false)

  useEffect(() => {
    if (!roomId) {
      navigate('/dashboard')
      return
    }

    initializeRoom()

    return () => {
      socketService.disconnect()
    }
  }, [roomId])

  const initializeRoom = async () => {
    try {
      setIsLoading(true)

      // Fetch room data
      const response = await api.get(`/rooms/${roomId}`)
      setRoom(response.data.room)
      setFiles(response.data.files || [])

      // Connect to socket
      await socketService.connect(roomId!)

      // Join the room
      socketService.joinRoom(roomId!)

      setIsLoading(false)
    } catch (error: any) {
      console.error('Error initializing room:', error)
      toast.error('Failed to load room')
      navigate('/dashboard')
    }
  }

  const activeFile = files.find(f => f.id === activeFileId)

  const handleFileContentChange = (content: string) => {
    if (activeFileId) {
      // Update local state immediately for responsiveness
      useEditorStore.getState().updateFile(activeFileId, { content })
    }
  }

  const handleBackToDashboard = () => {
    navigate('/dashboard')
  }

  const handleShareRoom = () => {
    const shareUrl = `${window.location.origin}/editor/${roomId}`
    navigator.clipboard.writeText(shareUrl)
    toast.success('Room link copied to clipboard!')
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading editor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="hidden md:block">Dashboard</span>
          </button>

          <div className="flex items-center space-x-2">
            <CodeBracketIcon className="h-6 w-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {room?.name || 'Untitled Room'}
              </h1>
              {room?.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 hidden md:block">
                  {room.description}
                </p>
              )}
            </div>
          </div>

          {/* Connection status */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-600 dark:text-gray-300 hidden md:block">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Connected users */}
          <div className="relative">
            <button
              onClick={() => setShowUserList(!showUserList)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <UsersIcon className="h-5 w-5" />
              <span className="text-sm font-medium">{connectedUsers.length + 1}</span>
            </button>

            {/* User list dropdown */}
            {showUserList && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
                <div className="p-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                    Collaborators
                  </h3>
                  <div className="space-y-2">
                    {/* Current user */}
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {user?.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">
                        {user?.username} (You)
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                    
                    {/* Other users */}
                    {connectedUsers.map((connectedUser, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {connectedUser.username?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm text-gray-900 dark:text-white">
                          {connectedUser.username}
                        </span>
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Share button */}
          <button
            onClick={handleShareRoom}
            className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Share room"
          >
            <ShareIcon className="h-5 w-5" />
            <span className="hidden md:block text-sm">Share</span>
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* AI Assistant */}
          <button
            onClick={() => setShowAIAssistant(true)}
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="AI Assistant"
          >
            <SparklesIcon className="h-5 w-5" />
          </button>

          {/* Settings */}
          <button
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Editor Layout */}
      <div className="flex-1 overflow-hidden">
        <PanelGroup direction="horizontal">
          {/* File Explorer */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <div className="h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
              <FileTree />
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" />

          {/* Editor Area */}
          <Panel defaultSize={80}>
            <div className="h-full flex flex-col bg-white dark:bg-gray-800">
              {/* Editor Tabs */}
              <EditorTabs />

              {/* Editor Content */}
              <div className="flex-1 relative">
                {activeFile ? (
                  <MonacoEditor
                    key={activeFile.id}
                    fileId={activeFile.id}
                    content={activeFile.content || ''}
                    language={activeFile.language || 'javascript'}
                    onContentChange={handleFileContentChange}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <CodeBracketIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Welcome to CodeSync
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        Select a file from the explorer to start coding
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Or create a new file to get started
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Panel>
        </PanelGroup>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistant
        isOpen={showAIAssistant}
        onClose={() => setShowAIAssistant(false)}
        currentFile={activeFile ? {
          id: activeFile.id,
          name: activeFile.name,
          content: activeFile.content || '',
          language: activeFile.language || 'javascript'
        } : undefined}
      />

      {/* Click outside to close user list */}
      {showUserList && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowUserList(false)}
        />
      )}
    </div>
  )
}

export default EditorPage
