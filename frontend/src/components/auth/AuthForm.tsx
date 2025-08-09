import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../../store/authStore'
import LoadingSpinner from '../ui/LoadingSpinner'
import toast from 'react-hot-toast'

interface AuthFormProps {
  mode: 'login' | 'register'
  onModeChange: (mode: 'login' | 'register') => void
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onModeChange }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const { login, register, isLoading } = useAuthStore()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (mode === 'register') {
      if (!formData.username || formData.username.length < 3) {
        toast.error('Username must be at least 3 characters')
        return false
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Passwords do not match')
        return false
      }
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Please enter a valid email')
      return false
    }
    
    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      if (mode === 'login') {
        await login(formData.email, formData.password)
        toast.success('Welcome back!')
      } else {
        await register(formData.username, formData.email, formData.password)
        toast.success('Account created successfully!')
      }
    } catch (error: any) {
      // Error is handled by the store and toast is shown via API interceptor
      console.error('Auth error:', error)
    }
  }

  return (
    <motion.div
      className="w-full max-w-md mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            {mode === 'login' 
              ? 'Sign in to continue your coding journey' 
              : 'Join the collaborative coding revolution'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="input-primary w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter your username"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="input-primary w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="input-primary w-full pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="input-primary w-full pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <LoadingSpinner size="sm" className="text-white" />
            ) : (
              <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button
              onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')}
              className="ml-2 text-blue-600 hover:text-blue-500 font-medium transition-colors"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default AuthForm
