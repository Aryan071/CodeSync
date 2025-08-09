import OpenAI from 'openai'
import { logger } from '../utils/logger'

interface CodeCompletionRequest {
  code: string
  language: string
  cursorPosition: number
  context?: string
}

interface CodeCompletionResponse {
  suggestions: string[]
  confidence: number
}

interface CodeExplanationRequest {
  code: string
  language: string
  lineNumber?: number
}

interface CodeReviewRequest {
  code: string
  language: string
  fileName: string
}

interface CodeReviewResponse {
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

class AIService {
  private openai: OpenAI | null = null
  private isEnabled: boolean = false

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
      })
      this.isEnabled = true
      logger.info('🤖 AI Service initialized with OpenAI')
    } else {
      logger.warn('⚠️  AI Service disabled - No OpenAI API key provided')
    }
  }

  /**
   * Generate code completions using AI
   */
  async getCodeCompletion(request: CodeCompletionRequest): Promise<CodeCompletionResponse> {
    if (!this.isEnabled || !this.openai) {
      return { suggestions: [], confidence: 0 }
    }

    try {
      const prompt = this.buildCompletionPrompt(request)
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an AI code completion assistant. Provide intelligent code completions for ${request.language}. Return only the completion suggestions, one per line, without explanations.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.3,
        n: 3 // Get 3 suggestions
      })

      const suggestions = response.choices
        .map(choice => choice.message?.content?.trim())
        .filter(Boolean) as string[]

      return {
        suggestions,
        confidence: this.calculateConfidence(suggestions)
      }
    } catch (error) {
      logger.error('AI code completion error:', error)
      return { suggestions: [], confidence: 0 }
    }
  }

  /**
   * Explain code using AI
   */
  async explainCode(request: CodeExplanationRequest): Promise<string> {
    if (!this.isEnabled || !this.openai) {
      return 'AI explanation not available'
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${request.language} developer. Explain code clearly and concisely, focusing on what it does, how it works, and any important patterns or concepts.`
          },
          {
            role: 'user',
            content: `Explain this ${request.language} code:\n\n\`\`\`${request.language}\n${request.code}\n\`\`\``
          }
        ],
        max_tokens: 300,
        temperature: 0.2
      })

      return response.choices[0]?.message?.content || 'Unable to explain code'
    } catch (error) {
      logger.error('AI code explanation error:', error)
      return 'Error generating explanation'
    }
  }

  /**
   * AI-powered code review
   */
  async reviewCode(request: CodeReviewRequest): Promise<CodeReviewResponse> {
    if (!this.isEnabled || !this.openai) {
      return {
        suggestions: [],
        overallScore: 0,
        summary: 'AI code review not available'
      }
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a senior software engineer conducting a code review. Analyze the code for:
            1. Potential bugs and errors
            2. Performance optimizations
            3. Code style and best practices
            4. Security vulnerabilities
            5. Maintainability improvements
            
            Return your response in JSON format with the following structure:
            {
              "suggestions": [
                {
                  "line": number,
                  "type": "error|warning|optimization|style",
                  "message": "Brief description",
                  "suggestion": "Specific improvement suggestion",
                  "severity": "low|medium|high"
                }
              ],
              "overallScore": number (0-100),
              "summary": "Overall assessment"
            }`
          },
          {
            role: 'user',
            content: `Review this ${request.language} code from ${request.fileName}:\n\n\`\`\`${request.language}\n${request.code}\n\`\`\``
          }
        ],
        max_tokens: 800,
        temperature: 0.1
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from AI')
      }

      // Parse JSON response
      const reviewData = JSON.parse(content) as CodeReviewResponse
      return reviewData

    } catch (error) {
      logger.error('AI code review error:', error)
      return {
        suggestions: [{
          line: 1,
          type: 'warning',
          message: 'AI review temporarily unavailable',
          suggestion: 'Please try again later',
          severity: 'low'
        }],
        overallScore: 75,
        summary: 'Unable to complete AI review at this time'
      }
    }
  }

  /**
   * Generate code suggestions for common patterns
   */
  async generateCodeSuggestion(language: string, description: string): Promise<string> {
    if (!this.isEnabled || !this.openai) {
      return '// AI code generation not available'
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} developer. Generate clean, efficient, and well-commented code based on the user's description. Follow best practices and modern patterns.`
          },
          {
            role: 'user',
            content: `Generate ${language} code for: ${description}`
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      })

      return response.choices[0]?.message?.content || '// Unable to generate code'
    } catch (error) {
      logger.error('AI code generation error:', error)
      return '// Error generating code'
    }
  }

  /**
   * Fix code errors using AI
   */
  async fixCodeError(code: string, error: string, language: string): Promise<string> {
    if (!this.isEnabled || !this.openai) {
      return code
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are an expert ${language} debugger. Fix the provided code to resolve the specified error. Return only the corrected code without explanations.`
          },
          {
            role: 'user',
            content: `Fix this ${language} code that has the error "${error}":\n\n\`\`\`${language}\n${code}\n\`\`\``
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      })

      return response.choices[0]?.message?.content?.replace(/```\w*\n?/g, '').trim() || code
    } catch (error) {
      logger.error('AI code fix error:', error)
      return code
    }
  }

  private buildCompletionPrompt(request: CodeCompletionRequest): string {
    const beforeCursor = request.code.substring(0, request.cursorPosition)
    const afterCursor = request.code.substring(request.cursorPosition)
    
    return `Complete this ${request.language} code at the cursor position (marked with <CURSOR>):

${beforeCursor}<CURSOR>${afterCursor}

${request.context ? `Context: ${request.context}` : ''}

Provide intelligent completions that make sense in this context.`
  }

  private calculateConfidence(suggestions: string[]): number {
    if (suggestions.length === 0) return 0
    if (suggestions.length === 1) return 70
    if (suggestions.length >= 2) return 85
    return 95
  }

  /**
   * Check if AI service is available
   */
  isAvailable(): boolean {
    return this.isEnabled
  }

  /**
   * Get AI service status
   */
  getStatus() {
    return {
      available: this.isEnabled,
      provider: 'OpenAI',
      model: 'gpt-3.5-turbo',
      features: [
        'Code Completion',
        'Code Explanation',
        'Code Review',
        'Code Generation',
        'Error Fixing'
      ]
    }
  }
}

export const aiService = new AIService()
export type { CodeCompletionRequest, CodeCompletionResponse, CodeExplanationRequest, CodeReviewRequest, CodeReviewResponse }
