import '@testing-library/jest-dom'
import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test case
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
  },
})

// Mock Socket.io
vi.mock('../services/socket', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    createFile: vi.fn(),
    updateFile: vi.fn(),
    deleteFile: vi.fn(),
    updateCursor: vi.fn(),
    isConnected: vi.fn(() => true),
  },
}))

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ onMount, onChange, value }) => {
    // Simulate monaco editor behavior
    const mockEditor = {
      getValue: () => value,
      setValue: vi.fn(),
      getPosition: () => ({ lineNumber: 1, column: 1 }),
      setPosition: vi.fn(),
      getSelection: () => null,
      updateOptions: vi.fn(),
      getModel: () => ({
        setValue: vi.fn(),
      }),
      deltaDecorations: vi.fn(),
      onDidChangeCursorPosition: vi.fn(),
      addCommand: vi.fn(),
    }

    if (onMount) {
      onMount(mockEditor, {})
    }

    return <div data-testid="monaco-editor">{value}</div>
  }),
}))

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ roomId: 'test-room-id' }),
    useLocation: () => ({ pathname: '/test' }),
  }
})
