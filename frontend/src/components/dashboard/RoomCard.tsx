import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  UsersIcon, 
  CalendarIcon, 
  CodeBracketIcon,
  LockClosedIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

export interface Room {
  id: string
  name: string
  description?: string
  owner: {
    id: string
    username: string
    email: string
    avatar?: string
  }
  collaborators: Array<{
    user: {
      id: string
      username: string
      email: string
      avatar?: string
    }
    role: 'owner' | 'editor' | 'viewer'
    joinedAt: string
  }>
  isPublic: boolean
  settings: {
    allowGuests: boolean
    maxCollaborators: number
    language: string
  }
  createdAt: string
  updatedAt: string
}

interface RoomCardProps {
  room: Room
  onJoin?: (roomId: string) => void
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getLanguageIcon = (language: string) => {
    const icons: { [key: string]: string } = {
      javascript: '🟨',
      typescript: '🔷',
      python: '🐍',
      java: '☕',
      cpp: '⚡',
      rust: '🦀',
      go: '🔷',
      php: '🐘',
      ruby: '💎',
      swift: '🦉',
      kotlin: '🔸',
      dart: '🎯',
    }
    return icons[language.toLowerCase()] || '📄'
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              {getLanguageIcon(room.settings.language)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {room.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                by {room.owner.username}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {room.isPublic ? (
              <GlobeAltIcon className="h-5 w-5 text-green-500" title="Public Room" />
            ) : (
              <LockClosedIcon className="h-5 w-5 text-gray-400" title="Private Room" />
            )}
          </div>
        </div>

        {/* Description */}
        {room.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {room.description}
          </p>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <UsersIcon className="h-4 w-4" />
              <span>{room.collaborators.length}/{room.settings.maxCollaborators}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CodeBracketIcon className="h-4 w-4" />
              <span className="capitalize">{room.settings.language}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <CalendarIcon className="h-4 w-4" />
            <span>{formatDate(room.updatedAt)}</span>
          </div>
        </div>

        {/* Collaborators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex -space-x-2">
              {room.collaborators.slice(0, 3).map((collaborator, index) => (
                <div
                  key={collaborator.user.id}
                  className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                  title={collaborator.user.username}
                  style={{ zIndex: 10 - index }}
                >
                  {collaborator.user.username.charAt(0).toUpperCase()}
                </div>
              ))}
              {room.collaborators.length > 3 && (
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 text-xs font-medium border-2 border-white dark:border-gray-800">
                  +{room.collaborators.length - 3}
                </div>
              )}
            </div>
          </div>

          <Link
            to={`/editor/${room.id}`}
            className="btn-primary px-4 py-2 text-sm"
          >
            Open
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default RoomCard
