import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '../../../test/utils'
import AuthForm from '../AuthForm'
import { useAuthStore } from '../../../store/authStore'

// Mock the auth store
vi.mock('../../../store/authStore')

const mockLogin = vi.fn()
const mockRegister = vi.fn()
const mockOnModeChange = vi.fn()

describe('AuthForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock the store
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      login: mockLogin,
      register: mockRegister,
      logout: vi.fn(),
      updateUser: vi.fn(),
    })
  })

  describe('Login Mode', () => {
    it('renders login form correctly', () => {
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      expect(screen.getByText('Welcome Back')).toBeInTheDocument()
      expect(screen.getByText('Sign in to continue your coding journey')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('does not show username field in login mode', () => {
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      expect(screen.queryByPlaceholderText('Enter your username')).not.toBeInTheDocument()
      expect(screen.queryByPlaceholderText('Confirm your password')).not.toBeInTheDocument()
    })

    it('shows sign up link', () => {
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      const signUpLink = screen.getByText('Sign up')
      expect(signUpLink).toBeInTheDocument()
      
      fireEvent.click(signUpLink)
      expect(mockOnModeChange).toHaveBeenCalledWith('register')
    })

    it('validates email format', async () => {
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.click(submitButton)

      // Should not call login with invalid email
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('validates password length', async () => {
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: '123' } })
      fireEvent.click(submitButton)

      // Should not call login with short password
      expect(mockLogin).not.toHaveBeenCalled()
    })

    it('submits login form with valid data', async () => {
      mockLogin.mockResolvedValue(undefined)
      
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const submitButton = screen.getByRole('button', { name: 'Sign In' })

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123')
      })
    })

    it('toggles password visibility', () => {
      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const toggleButton = passwordInput.parentElement?.querySelector('button')

      expect(passwordInput).toHaveAttribute('type', 'password')

      if (toggleButton) {
        fireEvent.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'text')

        fireEvent.click(toggleButton)
        expect(passwordInput).toHaveAttribute('type', 'password')
      }
    })
  })

  describe('Register Mode', () => {
    it('renders register form correctly', () => {
      render(<AuthForm mode="register" onModeChange={mockOnModeChange} />)

      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Join the collaborative coding revolution')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument()
    })

    it('shows sign in link', () => {
      render(<AuthForm mode="register" onModeChange={mockOnModeChange} />)

      const signInLink = screen.getByText('Sign in')
      expect(signInLink).toBeInTheDocument()
      
      fireEvent.click(signInLink)
      expect(mockOnModeChange).toHaveBeenCalledWith('login')
    })

    it('validates username length', async () => {
      render(<AuthForm mode="register" onModeChange={mockOnModeChange} />)

      const usernameInput = screen.getByPlaceholderText('Enter your username')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })

      fireEvent.change(usernameInput, { target: { value: 'ab' } })
      fireEvent.click(submitButton)

      // Should not call register with short username
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('validates password confirmation', async () => {
      render(<AuthForm mode="register" onModeChange={mockOnModeChange} />)

      const usernameInput = screen.getByPlaceholderText('Enter your username')
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })

      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } })
      fireEvent.click(submitButton)

      // Should not call register with mismatched passwords
      expect(mockRegister).not.toHaveBeenCalled()
    })

    it('submits register form with valid data', async () => {
      mockRegister.mockResolvedValue(undefined)
      
      render(<AuthForm mode="register" onModeChange={mockOnModeChange} />)

      const usernameInput = screen.getByPlaceholderText('Enter your username')
      const emailInput = screen.getByPlaceholderText('Enter your email')
      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
      const submitButton = screen.getByRole('button', { name: 'Create Account' })

      fireEvent.change(usernameInput, { target: { value: 'testuser' } })
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
      fireEvent.change(passwordInput, { target: { value: 'password123' } })
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } })
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('testuser', 'test@example.com', 'password123')
      })
    })

    it('toggles confirm password visibility independently', () => {
      render(<AuthForm mode="register" onModeChange={mockOnModeChange} />)

      const passwordInput = screen.getByPlaceholderText('Enter your password')
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your password')
      
      const passwordToggle = passwordInput.parentElement?.querySelector('button')
      const confirmPasswordToggle = confirmPasswordInput.parentElement?.querySelector('button')

      expect(passwordInput).toHaveAttribute('type', 'password')
      expect(confirmPasswordInput).toHaveAttribute('type', 'password')

      if (passwordToggle) {
        fireEvent.click(passwordToggle)
        expect(passwordInput).toHaveAttribute('type', 'text')
        expect(confirmPasswordInput).toHaveAttribute('type', 'password') // Should remain password
      }

      if (confirmPasswordToggle) {
        fireEvent.click(confirmPasswordToggle)
        expect(confirmPasswordInput).toHaveAttribute('type', 'text')
      }
    })
  })

  describe('Loading State', () => {
    it('shows loading spinner when submitting', () => {
      vi.mocked(useAuthStore).mockReturnValue({
        user: null,
        token: null,
        isLoading: true,
        login: mockLogin,
        register: mockRegister,
        logout: vi.fn(),
        updateUser: vi.fn(),
      })

      render(<AuthForm mode="login" onModeChange={mockOnModeChange} />)

      const submitButton = screen.getByRole('button')
      expect(submitButton).toBeDisabled()
    })
  })
})
