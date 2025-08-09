import React, { useState, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronRightIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  DocumentIcon,
  PlusIcon,
  EllipsisHorizontalIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { useEditorStore, FileNode } from '../../store/editorStore'
import { socketService } from '../../services/socket'
import clsx from 'clsx'
import toast from 'react-hot-toast'

interface FileTreeProps {
  className?: string
}

interface FileTreeItemProps {
  node: FileNode
  level: number
  onCreateFile: (parentPath: string, type: 'file' | 'folder') => void
  onRename: (nodeId: string, newName: string) => void
  onDelete: (nodeId: string) => void
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({ 
  node, 
  level, 
  onCreateFile, 
  onRename, 
  onDelete 
}) => {
  const [isExpanded, setIsExpanded] = useState(node.isOpen || false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [newName, setNewName] = useState(node.name)
  const { activeFileId, setActiveFile, openTab } = useEditorStore()

  const isActive = activeFileId === node.id
  const hasChildren = node.children && node.children.length > 0

  const getFileIcon = (fileName: string, isFolder: boolean = false) => {
    if (isFolder) {
      return isExpanded ? (
        <FolderOpenIcon className="h-4 w-4 text-blue-500" />
      ) : (
        <FolderIcon className="h-4 w-4 text-blue-500" />
      )
    }

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
      gitignore: '🚫'
    }

    return (
      <span className="text-sm">{icons[extension || ''] || '📄'}</span>
    )
  }

  const handleClick = () => {
    if (node.type === 'folder') {
      setIsExpanded(!isExpanded)
    } else {
      setActiveFile(node.id)
      openTab(node.id)
    }
  }

  const handleRename = () => {
    if (newName.trim() && newName !== node.name) {
      onRename(node.id, newName.trim())
    }
    setIsRenaming(false)
    setNewName(node.name)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setIsRenaming(false)
      setNewName(node.name)
    }
  }

  return (
    <div>
      <div
        className={clsx(
          'flex items-center py-1 px-2 rounded-md cursor-pointer group hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors',
          {
            'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200': isActive,
            'text-gray-700 dark:text-gray-300': !isActive
          }
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {/* Expand/Collapse Toggle */}
        {node.type === 'folder' && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-3 w-3" />
            ) : (
              <ChevronRightIcon className="h-3 w-3" />
            )}
          </button>
        )}

        {/* Icon */}
        <div className="flex items-center justify-center w-5 h-5 ml-1">
          {getFileIcon(node.name, node.type === 'folder')}
        </div>

        {/* Name */}
        <div className="flex-1 ml-2 min-w-0" onClick={handleClick}>
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="w-full px-1 py-0 text-sm bg-white dark:bg-gray-700 border border-blue-500 rounded"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm font-medium truncate block">
              {node.name}
            </span>
          )}
        </div>

        {/* Context Menu */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Menu as="div" className="relative">
            <Menu.Button
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <EllipsisHorizontalIcon className="h-3 w-3" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 top-full mt-1 w-48 origin-top-right divide-y divide-gray-100 dark:divide-gray-600 rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="px-1 py-1">
                  {node.type === 'folder' && (
                    <>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={clsx(
                              'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                              active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-100'
                            )}
                            onClick={() => onCreateFile(node.path, 'file')}
                          >
                            <DocumentIcon className="mr-2 h-4 w-4" />
                            New File
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={clsx(
                              'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                              active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-100'
                            )}
                            onClick={() => onCreateFile(node.path, 'folder')}
                          >
                            <FolderIcon className="mr-2 h-4 w-4" />
                            New Folder
                          </button>
                        )}
                      </Menu.Item>
                    </>
                  )}
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                          active ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-100'
                        )}
                        onClick={() => setIsRenaming(true)}
                      >
                        <PencilIcon className="mr-2 h-4 w-4" />
                        Rename
                      </button>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        className={clsx(
                          'group flex w-full items-center rounded-md px-2 py-2 text-sm',
                          active ? 'bg-red-500 text-white' : 'text-red-600 dark:text-red-400'
                        )}
                        onClick={() => onDelete(node.id)}
                      >
                        <TrashIcon className="mr-2 h-4 w-4" />
                        Delete
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>

      {/* Children */}
      <AnimatePresence>
        {node.type === 'folder' && isExpanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {node.children!.map((child) => (
              <FileTreeItem
                key={child.id}
                node={child}
                level={level + 1}
                onCreateFile={onCreateFile}
                onRename={onRename}
                onDelete={onDelete}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const FileTree: React.FC<FileTreeProps> = ({ className }) => {
  const { files, addFile, updateFile, deleteFile } = useEditorStore()
  const [showNewFileInput, setShowNewFileInput] = useState(false)
  const [newFileName, setNewFileName] = useState('')
  const [newFileType, setNewFileType] = useState<'file' | 'folder'>('file')
  const [newFileParent, setNewFileParent] = useState('/')

  // Build tree structure from flat files array
  const buildTree = (files: FileNode[]): FileNode[] => {
    const tree: FileNode[] = []
    const pathMap: { [key: string]: FileNode } = {}

    // Sort files by path
    const sortedFiles = [...files].sort((a, b) => a.path.localeCompare(b.path))

    sortedFiles.forEach(file => {
      pathMap[file.path] = { ...file, children: [] }
    })

    sortedFiles.forEach(file => {
      const pathParts = file.path.split('/').filter(Boolean)
      if (pathParts.length === 1) {
        // Root level file/folder
        tree.push(pathMap[file.path])
      } else {
        // Nested file/folder
        const parentPath = '/' + pathParts.slice(0, -1).join('/')
        const parent = pathMap[parentPath]
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(pathMap[file.path])
        }
      }
    })

    // Sort children: folders first, then files
    const sortChildren = (nodes: FileNode[]): FileNode[] => {
      return nodes.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })
    }

    const sortRecursively = (nodes: FileNode[]): FileNode[] => {
      const sorted = sortChildren(nodes)
      sorted.forEach(node => {
        if (node.children) {
          node.children = sortRecursively(node.children)
        }
      })
      return sorted
    }

    return sortRecursively(tree)
  }

  const handleCreateFile = (parentPath: string, type: 'file' | 'folder') => {
    setNewFileParent(parentPath)
    setNewFileType(type)
    setShowNewFileInput(true)
  }

  const handleNewFileSubmit = () => {
    if (!newFileName.trim()) {
      toast.error('File name cannot be empty')
      return
    }

    const path = newFileParent === '/' ? `/${newFileName}` : `${newFileParent}/${newFileName}`
    
    // Check if file already exists
    if (files.some(f => f.path === path)) {
      toast.error('File already exists')
      return
    }

    // Create new file via socket
    socketService.createFile({
      name: newFileName,
      type: newFileType,
      path,
      content: newFileType === 'file' ? '' : undefined
    })

    setShowNewFileInput(false)
    setNewFileName('')
    setNewFileParent('/')
    setNewFileType('file')
  }

  const handleNewFileCancel = () => {
    setShowNewFileInput(false)
    setNewFileName('')
    setNewFileParent('/')
    setNewFileType('file')
  }

  const handleRename = (nodeId: string, newName: string) => {
    const file = files.find(f => f.id === nodeId)
    if (!file) return

    const pathParts = file.path.split('/')
    pathParts[pathParts.length - 1] = newName
    const newPath = pathParts.join('/')

    updateFile(nodeId, { name: newName, path: newPath })
    toast.success('File renamed successfully')
  }

  const handleDelete = (nodeId: string) => {
    const file = files.find(f => f.id === nodeId)
    if (!file) return

    if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
      socketService.deleteFile(nodeId)
      toast.success('File deleted successfully')
    }
  }

  const tree = buildTree(files)

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Explorer
        </h3>
        <button
          onClick={() => handleCreateFile('/', 'file')}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="New File"
        >
          <PlusIcon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        </button>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {showNewFileInput && (
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-md">
            <div className="flex items-center space-x-2 mb-2">
              <select
                value={newFileType}
                onChange={(e) => setNewFileType(e.target.value as 'file' | 'folder')}
                className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="file">File</option>
                <option value="folder">Folder</option>
              </select>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                in {newFileParent}
              </span>
            </div>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder={`New ${newFileType} name`}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNewFileSubmit()
                if (e.key === 'Escape') handleNewFileCancel()
              }}
            />
            <div className="flex justify-end space-x-2 mt-2">
              <button
                onClick={handleNewFileCancel}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleNewFileSubmit}
                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {tree.length === 0 ? (
          <div className="text-center py-8">
            <DocumentIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No files yet</p>
            <button
              onClick={() => handleCreateFile('/', 'file')}
              className="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Create your first file
            </button>
          </div>
        ) : (
          tree.map((node) => (
            <FileTreeItem
              key={node.id}
              node={node}
              level={0}
              onCreateFile={handleCreateFile}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default FileTree
