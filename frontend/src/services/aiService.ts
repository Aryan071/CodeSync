import api from './api'

export interface CodeCompletionRequest {
  code: string
  language: string
  cursorPosition: number
  context?: string
}

export interface CodeCompletionResponse {
  suggestions: string[]
  confidence: number
}

export interface CodeExplanationRequest {
  code: string
  language: string
  lineNumber?: number
}

export interface CodeReviewRequest {
  code: string
  language: string
  fileName: string
}

export interface CodeReviewResponse {
  suggestions: Array<{
    line: number
    type: 'error' | 'warning' | 'optimization' | 'style'
    message: string
    suggestion: string
    severity: 'low' | 'medium' | 'high'
  }>
  overallScore: number
  summary: string
}

export interface AIAnalytics {
  totalRequests: number
  completionRequests: number
  explanationRequests: number
  reviewRequests: number
  generationRequests: number
  lastUsed: string
  favoriteLanguage: string
  averageResponseTime: string
}

class AIService {
  private baseUrl = '/api/ai'

  /**
   * Get AI service status
   */
  async getStatus() {
    try {
      const response = await api.get(`${this.baseUrl}/status`)
      return response.data.status
    } catch (error) {
      console.error('Failed to get AI status:', error)
      return { available: false }
    }
  }

  /**
   * Get AI code completions
   */
  async getCodeCompletion(request: CodeCompletionRequest): Promise<CodeCompletionResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/complete`, request)
      return {
        suggestions: response.data.suggestions || [],
        confidence: response.data.confidence || 0
      }
    } catch (error) {
      console.error('AI completion error:', error)
      return { suggestions: [], confidence: 0 }
    }
  }

  /**
   * Get AI code explanation
   */
  async explainCode(request: CodeExplanationRequest): Promise<string> {
    try {
      const response = await api.post(`${this.baseUrl}/explain`, request)
      return response.data.explanation || 'Unable to explain code'
    } catch (error) {
      console.error('AI explanation error:', error)
      return 'Error getting code explanation'
    }
  }

  /**
   * Get AI code review
   */
  async reviewCode(request: CodeReviewRequest): Promise<CodeReviewResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/review`, request)
      return {
        suggestions: response.data.suggestions || [],
        overallScore: response.data.overallScore || 0,
        summary: response.data.summary || 'No review available'
      }
    } catch (error) {
      console.error('AI review error:', error)
      return {
        suggestions: [],
        overallScore: 0,
        summary: 'Error getting code review'
      }
    }
  }

  /**
   * Generate code using AI
   */
  async generateCode(description: string, language: string): Promise<string> {
    try {
      const response = await api.post(`${this.baseUrl}/generate`, {
        description,
        language
      })
      return response.data.code || '// Unable to generate code'
    } catch (error) {
      console.error('AI generation error:', error)
      return '// Error generating code'
    }
  }

  /**
   * Fix code using AI
   */
  async fixCode(code: string, error: string, language: string): Promise<string> {
    try {
      const response = await api.post(`${this.baseUrl}/fix`, {
        code,
        error,
        language
      })
      return response.data.fixedCode || code
    } catch (error) {
      console.error('AI fix error:', error)
      return code
    }
  }

  /**
   * Get AI usage analytics
   */
  async getAnalytics(): Promise<AIAnalytics | null> {
    try {
      const response = await api.get(`${this.baseUrl}/analytics`)
      return response.data.analytics
    } catch (error) {
      console.error('AI analytics error:', error)
      return null
    }
  }

  /**
   * Debounced code completion for better UX
   */
  private completionTimeouts = new Map<string, NodeJS.Timeout>()

  getDebouncedCompletion(
    request: CodeCompletionRequest,
    callback: (response: CodeCompletionResponse) => void,
    delay: number = 500
  ) {
    const key = `${request.language}-${request.cursorPosition}`
    
    // Clear existing timeout
    if (this.completionTimeouts.has(key)) {
      clearTimeout(this.completionTimeouts.get(key)!)
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      const response = await this.getCodeCompletion(request)
      callback(response)
      this.completionTimeouts.delete(key)
    }, delay)

    this.completionTimeouts.set(key, timeout)
  }

  /**
   * Cancel pending completions
   */
  cancelPendingCompletions() {
    this.completionTimeouts.forEach(timeout => clearTimeout(timeout))
    this.completionTimeouts.clear()
  }
}

export const aiService = new AIService()
export default aiService
