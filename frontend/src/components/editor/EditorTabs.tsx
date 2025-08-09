import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEditorStore, FileNode } from '../../store/editorStore'
import clsx from 'clsx'

const EditorTabs: React.FC = () => {
  const { 
    files, 
    openTabs, 
    activeFileId, 
    setActiveFile, 
    closeTab,
    updateFile
  } = useEditorStore()

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    const icons: { [key: string]: string } = {
      js: '🟨',
      jsx: '⚛️',
      ts: '🔷',
      tsx: '⚛️',
      py: '🐍',
      java: '☕',
      cpp: '⚡',
      c: '⚡',
      rs: '🦀',
      go: '🔷',
      php: '🐘',
      rb: '💎',
      swift: '🦉',
      kt: '🔸',
      dart: '🎯',
      html: '🌐',
      css: '🎨',
      scss: '🎨',
      sass: '🎨',
      json: '📋',
      xml: '📄',
      md: '📝',
      txt: '📄',
      yml: '⚙️',
      yaml: '⚙️',
      dockerfile: '🐳',
      gitignore: '🚫',
      readme: '📖'
    }
    return icons[extension || ''] || '📄'
  }

  const getOpenFiles = (): FileNode[] => {
    return openTabs
      .map(tabId => files.find(file => file.id === tabId))
      .filter((file): file is FileNode => file !== undefined)
  }

  const handleTabClick = (fileId: string) => {
    setActiveFile(fileId)
  }

  const handleCloseTab = (e: React.MouseEvent, fileId: string) => {
    e.stopPropagation()
    closeTab(fileId)
  }

  const isFileModified = (file: FileNode) => {
    // In a real implementation, you'd track if the file has unsaved changes
    return false
  }

  const openFiles = getOpenFiles()

  if (openFiles.length === 0) {
    return null
  }

  return (
    <div className="flex bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      <AnimatePresence>
        {openFiles.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className={clsx(
              'flex items-center space-x-2 px-4 py-3 border-r border-gray-200 dark:border-gray-700 cursor-pointer min-w-0 max-w-xs group relative',
              {
                'bg-white dark:bg-gray-900 text-gray-900 dark:text-white': file.id === activeFileId,
                'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700': file.id !== activeFileId
              }
            )}
            onClick={() => handleTabClick(file.id)}
          >
            {/* Active tab indicator */}
            {file.id === activeFileId && (
              <motion.div
                layoutId="activeTab"
                className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}

            {/* File icon */}
            <span className="text-sm flex-shrink-0">
              {getFileIcon(file.name)}
            </span>

            {/* File name */}
            <span className="text-sm font-medium truncate">
              {file.name}
              {isFileModified(file) && (
                <span className="ml-1 text-orange-500">•</span>
              )}
            </span>

            {/* Close button */}
            <button
              onClick={(e) => handleCloseTab(e, file.id)}
              className={clsx(
                'flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors',
                {
                  'opacity-0 group-hover:opacity-100': file.id !== activeFileId,
                  'opacity-100': file.id === activeFileId
                }
              )}
            >
              <XMarkIcon className="h-3 w-3" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add some padding at the end */}
      <div className="flex-1 min-w-4"></div>
    </div>
  )
}

export default EditorTabs
