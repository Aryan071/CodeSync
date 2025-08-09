import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  SparklesIcon,
  LightBulbIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CodeBracketIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { aiService, CodeReviewResponse } from '../../services/aiService'
import { useEditorStore } from '../../store/editorStore'
import toast from 'react-hot-toast'

interface AIAssistantProps {
  isOpen: boolean
  onClose: () => void
  currentFile?: {
    id: string
    name: string
    content: string
    language: string
  }
}

type AIAction = 'explain' | 'review' | 'generate' | 'fix' | 'complete' | 'analytics'

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, currentFile }) => {
  const [activeAction, setActiveAction] = useState<AIAction | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [input, setInput] = useState('')
  const [aiStatus, setAiStatus] = useState<any>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) {
      checkAIStatus()
    }
  }, [isOpen])

  const checkAIStatus = async () => {
    const status = await aiService.getStatus()
    setAiStatus(status)
  }

  const handleExplainCode = async () => {
    if (!currentFile) {
      toast.error('No file selected')
      return
    }

    setLoading(true)
    setActiveAction('explain')
    
    try {
      const explanation = await aiService.explainCode({
        code: currentFile.content,
        language: currentFile.language
      })
      setResult({ explanation })
      toast.success('Code explained!')
    } catch (error) {
      toast.error('Failed to explain code')
    } finally {
      setLoading(false)
    }
  }

  const handleReviewCode = async () => {
    if (!currentFile) {
      toast.error('No file selected')
      return
    }

    setLoading(true)
    setActiveAction('review')
    
    try {
      const review = await aiService.reviewCode({
        code: currentFile.content,
        language: currentFile.language,
        fileName: currentFile.name
      })
      setResult(review)
      toast.success('Code reviewed!')
    } catch (error) {
      toast.error('Failed to review code')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateCode = async () => {
    if (!input.trim()) {
      toast.error('Please describe what you want to generate')
      return
    }

    setLoading(true)
    setActiveAction('generate')
    
    try {
      const code = await aiService.generateCode(input, currentFile?.language || 'javascript')
      setResult({ code })
      toast.success('Code generated!')
    } catch (error) {
      toast.error('Failed to generate code')
    } finally {
      setLoading(false)
    }
  }

  const handleGetAnalytics = async () => {
    setLoading(true)
    setActiveAction('analytics')
    
    try {
      const analytics = await aiService.getAnalytics()
      setResult(analytics)
    } catch (error) {
      toast.error('Failed to get analytics')
    } finally {
      setLoading(false)
    }
  }

  const renderResult = () => {
    if (!result) return null

    switch (activeAction) {
      case 'explain':
        return (
          <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              Code Explanation
            </h4>
            <p className="text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
              {result.explanation}
            </p>
          </div>
        )

      case 'review':
        const review = result as CodeReviewResponse
        return (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                  Code Review Score
                </h4>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  review.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                  review.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {review.overallScore}/100
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                {review.summary}
              </p>
            </div>

            {review.suggestions.length > 0 && (
              <div className="space-y-2">
                <h5 className="font-medium text-gray-800 dark:text-gray-200">
                  Suggestions
                </h5>
                {review.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      suggestion.type === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-900' :
                      suggestion.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900' :
                      suggestion.type === 'optimization' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900' :
                      'border-gray-500 bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0">
                        {suggestion.type === 'error' ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        ) : suggestion.type === 'warning' ? (
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                        ) : (
                          <LightBulbIcon className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          Line {suggestion.line}: {suggestion.message}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {suggestion.suggestion}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )

      case 'generate':
        return (
          <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Generated Code
            </h4>
            <pre className="bg-white dark:bg-gray-800 p-3 rounded border text-sm overflow-x-auto">
              <code>{result.code}</code>
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(result.code)
                toast.success('Code copied to clipboard!')
              }}
              className="mt-2 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Copy Code
            </button>
          </div>
        )

      case 'analytics':
        return (
          <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">
              AI Usage Analytics
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-purple-600 dark:text-purple-400">Total Requests:</span>
                <span className="ml-2 font-medium">{result.totalRequests}</span>
              </div>
              <div>
                <span className="text-purple-600 dark:text-purple-400">Completions:</span>
                <span className="ml-2 font-medium">{result.completionRequests}</span>
              </div>
              <div>
                <span className="text-purple-600 dark:text-purple-400">Explanations:</span>
                <span className="ml-2 font-medium">{result.explanationRequests}</span>
              </div>
              <div>
                <span className="text-purple-600 dark:text-purple-400">Reviews:</span>
                <span className="ml-2 font-medium">{result.reviewRequests}</span>
              </div>
              <div>
                <span className="text-purple-600 dark:text-purple-400">Favorite Language:</span>
                <span className="ml-2 font-medium capitalize">{result.favoriteLanguage}</span>
              </div>
              <div>
                <span className="text-purple-600 dark:text-purple-400">Avg Response:</span>
                <span className="ml-2 font-medium">{result.averageResponseTime}</span>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <SparklesIcon className="h-6 w-6 text-purple-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                AI Assistant
              </h2>
              {aiStatus && (
                <span className={`px-2 py-1 rounded-full text-xs ${
                  aiStatus.available 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {aiStatus.available ? 'Online' : 'Offline'}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="flex h-[60vh]">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4">
              <div className="space-y-2">
                <button
                  onClick={handleExplainCode}
                  disabled={loading || !currentFile || !aiStatus?.available}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <LightBulbIcon className="h-5 w-5 text-blue-500" />
                  <span>Explain Code</span>
                </button>

                <button
                  onClick={handleReviewCode}
                  disabled={loading || !currentFile || !aiStatus?.available}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span>Review Code</span>
                </button>

                <button
                  onClick={() => setActiveAction('generate')}
                  disabled={loading || !aiStatus?.available}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CodeBracketIcon className="h-5 w-5 text-purple-500" />
                  <span>Generate Code</span>
                </button>

                <button
                  onClick={handleGetAnalytics}
                  disabled={loading || !aiStatus?.available}
                  className="w-full flex items-center space-x-3 p-3 text-left rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChartBarIcon className="h-5 w-5 text-orange-500" />
                  <span>Analytics</span>
                </button>
              </div>

              {activeAction === 'generate' && (
                <div className="mt-4 space-y-3">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe what you want to generate..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    rows={4}
                  />
                  <button
                    onClick={handleGenerateCode}
                    disabled={loading || !input.trim()}
                    className="w-full bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Generating...' : 'Generate'}
                  </button>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <SparklesIcon className="h-8 w-8 text-purple-500 animate-pulse mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-300">
                      AI is thinking...
                    </p>
                  </div>
                </div>
              ) : result ? (
                renderResult()
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      AI Assistant Ready
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      Select an action from the sidebar to get started
                    </p>
                    {!aiStatus?.available && (
                      <p className="text-red-500 text-sm mt-2">
                        AI service is currently unavailable
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default AIAssistant
