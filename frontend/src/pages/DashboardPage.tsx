import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  PlusIcon, 
  MagnifyingGlassIcon,
  CodeBracketIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline'
import { useAuthStore } from '../store/authStore'
import RoomCard, { Room } from '../components/dashboard/RoomCard'
import CreateRoomModal from '../components/dashboard/CreateRoomModal'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import api from '../services/api'
import toast from 'react-hot-toast'

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuthStore()
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'owned' | 'collaborated'>('all')

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    filterRooms()
  }, [rooms, searchQuery, filter])

  const fetchRooms = async () => {
    try {
      setIsLoading(true)
      const response = await api.get('/rooms')
      setRooms(response.data.rooms)
    } catch (error: any) {
      console.error('Error fetching rooms:', error)
      toast.error('Failed to load rooms')
    } finally {
      setIsLoading(false)
    }
  }

  const filterRooms = () => {
    let filtered = rooms

    // Filter by ownership/collaboration
    if (filter === 'owned') {
      filtered = filtered.filter(room => room.owner.id === user?.id)
    } else if (filter === 'collaborated') {
      filtered = filtered.filter(room => 
        room.owner.id !== user?.id && 
        room.collaborators.some(c => c.user.id === user?.id)
      )
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(room =>
        room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.owner.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    setFilteredRooms(filtered)
  }

  const handleRoomCreated = (newRoom: Room) => {
    setRooms(prev => [newRoom, ...prev])
    toast.success('Room created! Opening editor...')
    // Navigate to the new room after a short delay
    setTimeout(() => {
      window.location.href = `/editor/${newRoom.id}`
    }, 1000)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const stats = {
    totalRooms: rooms.length,
    ownedRooms: rooms.filter(room => room.owner.id === user?.id).length,
    collaboratedRooms: rooms.filter(room => 
      room.owner.id !== user?.id && 
      room.collaborators.some(c => c.user.id === user?.id)
    ).length
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <CodeBracketIcon className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900 dark:text-white">CodeSync</span>
            </Link>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg transition-colors">
                <Cog6ToothIcon className="h-6 w-6" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                  {user?.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.username}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white rounded-lg transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {getGreeting()}, {user?.username}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Ready to collaborate and build something amazing?
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Rooms</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalRooms}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CodeBracketIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Owned</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.ownedRooms}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Collaborating</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.collaboratedRooms}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <UserCircleIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0"
        >
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Your Rooms
            </h2>
            
            {/* Filter Buttons */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'owned', label: 'Owned' },
                { key: 'collaborated', label: 'Collaborating' }
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    filter === key
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Create Room Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary flex items-center space-x-2"
            >
              <PlusIcon className="h-5 w-5" />
              <span>New Room</span>
            </button>
          </div>
        </motion.div>

        {/* Rooms Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {filteredRooms.length === 0 ? (
            <div className="text-center py-12">
              <CodeBracketIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchQuery ? 'No rooms found' : 'No rooms yet'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Create your first room to start collaborating'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center space-x-2 mx-auto"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Create Your First Room</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room, index) => (
                <motion.div
                  key={room.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 * index }}
                >
                  <RoomCard room={room} />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRoomCreated={handleRoomCreated}
      />
    </div>
  )
}

export default DashboardPage
