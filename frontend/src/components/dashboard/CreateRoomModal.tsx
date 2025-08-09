import React, { useState, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import api from '../../services/api'
import toast from 'react-hot-toast'
import LoadingSpinner from '../ui/LoadingSpinner'

interface CreateRoomModalProps {
  isOpen: boolean
  onClose: () => void
  onRoomCreated: (room: any) => void
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPublic: false,
    language: 'javascript',
    maxCollaborators: 10,
    allowGuests: false
  })
  const [isLoading, setIsLoading] = useState(false)

  const languages = [
    { value: 'javascript', label: 'JavaScript', icon: '🟨' },
    { value: 'typescript', label: 'TypeScript', icon: '🔷' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'java', label: 'Java', icon: '☕' },
    { value: 'cpp', label: 'C++', icon: '⚡' },
    { value: 'rust', label: 'Rust', icon: '🦀' },
    { value: 'go', label: 'Go', icon: '🔷' },
    { value: 'php', label: 'PHP', icon: '🐘' },
    { value: 'ruby', label: 'Ruby', icon: '💎' },
    { value: 'swift', label: 'Swift', icon: '🦉' },
    { value: 'kotlin', label: 'Kotlin', icon: '🔸' },
    { value: 'dart', label: 'Dart', icon: '🎯' }
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Room name is required')
      return
    }

    setIsLoading(true)
    try {
      const response = await api.post('/rooms', {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isPublic: formData.isPublic,
        settings: {
          language: formData.language,
          maxCollaborators: formData.maxCollaborators,
          allowGuests: formData.allowGuests
        }
      })

      toast.success('Room created successfully!')
      onRoomCreated(response.data.room)
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        isPublic: false,
        language: 'javascript',
        maxCollaborators: 10,
        allowGuests: false
      })
    } catch (error: any) {
      console.error('Error creating room:', error)
      toast.error(error.response?.data?.message || 'Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title className="text-lg font-semibold text-gray-900 dark:text-white">
                    Create New Room
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Room Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Room Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="input-primary w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="My Awesome Project"
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      className="input-primary w-full h-20 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      placeholder="Describe what you're building..."
                    />
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Primary Language
                    </label>
                    <select
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className="input-primary w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      {languages.map(lang => (
                        <option key={lang.value} value={lang.value}>
                          {lang.icon} {lang.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Max Collaborators */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Max Collaborators
                    </label>
                    <input
                      type="number"
                      name="maxCollaborators"
                      value={formData.maxCollaborators}
                      onChange={handleInputChange}
                      min="1"
                      max="50"
                      className="input-primary w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>

                  {/* Settings */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isPublic"
                        name="isPublic"
                        checked={formData.isPublic}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Make room public
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="allowGuests"
                        name="allowGuests"
                        checked={formData.allowGuests}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="allowGuests" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Allow guest access
                      </label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={onClose}
                      className="btn-secondary"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex items-center space-x-2"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <LoadingSpinner size="sm" className="text-white" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <span>Create Room</span>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default CreateRoomModal
