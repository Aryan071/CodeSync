import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  CodeBracketIcon, 
  UsersIcon, 
  LightBulbIcon,
  RocketLaunchIcon,
  SparklesIcon,
  EyeIcon
} from '@heroicons/react/24/outline'

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CodeBracketIcon className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">CodeSync</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              to="/auth" 
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              to="/auth" 
              className="btn-primary"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <motion.h1 
            className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Code Together, 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Create Together
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            A powerful real-time collaborative code editor that brings developers together. 
            Write, edit, and debug code simultaneously with your team, anywhere in the world.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Link 
              to="/auth" 
              className="btn-primary text-lg px-8 py-3 flex items-center space-x-2"
            >
              <RocketLaunchIcon className="h-5 w-5" />
              <span>Start Coding Now</span>
            </Link>
            <button className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white flex items-center space-x-2 transition-colors">
              <EyeIcon className="h-5 w-5" />
              <span>Watch Demo</span>
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Everything you need for collaborative coding
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Powerful features designed for modern development teams
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 dark:bg-blue-700">
        <div className="container mx-auto px-6 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to revolutionize your coding workflow?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already collaborating seamlessly with CodeSync.
            </p>
            <Link 
              to="/auth" 
              className="bg-white text-blue-600 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center space-x-2"
            >
              <SparklesIcon className="h-5 w-5" />
              <span>Get Started Free</span>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center space-x-2 mb-8">
            <CodeBracketIcon className="h-8 w-8 text-blue-400" />
            <span className="text-2xl font-bold">CodeSync</span>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; 2024 CodeSync. Built with ❤️ for developers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    title: 'Real-time Collaboration',
    description: 'See changes instantly as your team types. No refresh needed, no conflicts.',
    icon: UsersIcon,
  },
  {
    title: 'Smart Code Intelligence',
    description: 'AI-powered code completion, error detection, and intelligent suggestions.',
    icon: LightBulbIcon,
  },
  {
    title: 'Multi-language Support',
    description: 'Syntax highlighting and IntelliSense for 50+ programming languages.',
    icon: CodeBracketIcon,
  },
  {
    title: 'Live Cursor Tracking',
    description: 'See exactly where your teammates are working in real-time.',
    icon: EyeIcon,
  },
  {
    title: 'Instant Deployment',
    description: 'Deploy your collaborative projects with one click to the cloud.',
    icon: RocketLaunchIcon,
  },
  {
    title: 'Version History',
    description: 'Complete change history with the ability to revert to any previous version.',
    icon: SparklesIcon,
  },
]

export default LandingPage
