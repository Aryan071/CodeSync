import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CodeBracketIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import AuthForm from '../components/auth/AuthForm'

const AuthPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
            <ArrowLeftIcon className="h-5 w-5" />
            <span>Back to home</span>
          </Link>
          
          <Link to="/" className="flex items-center space-x-2">
            <CodeBracketIcon className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CodeSync</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row items-center justify-center min-h-[calc(100vh-200px)]">
          {/* Left Side - Marketing Content */}
          <motion.div 
            className="lg:w-1/2 lg:pr-12 mb-12 lg:mb-0"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
                {authMode === 'login' ? 'Welcome Back!' : 'Join CodeSync'}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                {authMode === 'login' 
                  ? 'Continue your collaborative coding journey with your team.'
                  : 'Start collaborating with developers worldwide in real-time.'
                }
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Real-time collaborative editing</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">AI-powered code assistance</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Multi-language support</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-gray-700 dark:text-gray-300">Instant deployment</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side - Auth Form */}
          <div className="lg:w-1/2 lg:pl-12">
            <AuthForm mode={authMode} onModeChange={setAuthMode} />
          </div>
        </div>
      </main>

      {/* Background Decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
      </div>
    </div>
  )
}

export default AuthPage
