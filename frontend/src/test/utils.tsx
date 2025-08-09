import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Test providers wrapper
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
      <Toaster />
    </BrowserRouter>
  )
}

// Custom render function with providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'user-123',
  username: 'testuser',
  email: 'test@example.com',
  avatar: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const createMockRoom = (overrides = {}) => ({
  id: 'room-123',
  name: 'Test Room',
  description: 'A test room',
  owner: createMockUser(),
  collaborators: [
    {
      user: createMockUser(),
      role: 'owner' as const,
      joinedAt: '2024-01-01T00:00:00.000Z',
    },
  ],
  isPublic: false,
  settings: {
    allowGuests: false,
    maxCollaborators: 10,
    language: 'javascript',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

export const createMockFile = (overrides = {}) => ({
  id: 'file-123',
  name: 'test.js',
  path: '/test.js',
  type: 'file' as const,
  content: 'console.log("Hello World");',
  language: 'javascript',
  lastModified: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

// Mock API responses
export const mockApiResponse = (data: any, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {},
})

// Wait for async operations
export const waitForAsyncUpdate = () => new Promise(resolve => setTimeout(resolve, 0))

// Mock localStorage
export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {}
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key])
    },
  }
}

// Mock timers helper
export const mockTimers = () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })
}
