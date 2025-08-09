# 🧪 CodeSync Testing Guide

This guide covers how to test the CodeSync application at all levels - from unit tests to end-to-end testing.

## Testing Strategy

CodeSync uses a comprehensive testing approach:

1. **Unit Tests** - Test individual components and functions
2. **Integration Tests** - Test API endpoints and database interactions
3. **Component Tests** - Test React components in isolation
4. **End-to-End Tests** - Test complete user workflows
5. **Performance Tests** - Test real-time collaboration under load
6. **Security Tests** - Test authentication and authorization

## Quick Start

```bash
# Install all dependencies
npm run install:all

# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test suites
npm run test:frontend
npm run test:backend
npm run test:e2e
```

## Frontend Testing (React + Vitest)

### Setup

Frontend uses **Vitest** + **React Testing Library** + **jsdom**.

```bash
cd frontend
npm test              # Run all tests
npm run test:ui       # Visual test runner
npm run test:coverage # Coverage report
```

### Test Types

#### Unit Tests
- Component rendering
- User interactions
- State management
- Utility functions

#### Integration Tests
- API service calls
- Socket.io integration
- Store operations

### Example Test Files

```typescript
// src/components/__tests__/AuthForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import AuthForm from '../auth/AuthForm'

describe('AuthForm', () => {
  it('should render login form', () => {
    render(<AuthForm mode="login" onModeChange={vi.fn()} />)
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
  })

  it('should validate email format', async () => {
    render(<AuthForm mode="login" onModeChange={vi.fn()} />)
    
    const emailInput = screen.getByPlaceholderText('Enter your email')
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    
    const submitButton = screen.getByText('Sign In')
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeInTheDocument()
    })
  })
})
```

## Backend Testing (Node.js + Jest)

### Setup

Backend uses **Jest** + **Supertest** + **MongoDB Memory Server**.

```bash
cd backend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
npm run test:integration   # Integration tests only
```

### Test Types

#### Unit Tests
- Service functions
- Utility functions
- Middleware
- OT engine

#### Integration Tests
- API endpoints
- Database operations
- Authentication flows
- Socket.io events

### Example Test Files

```typescript
// src/routes/__tests__/auth.test.ts
import request from 'supertest'
import app from '../../app'
import { User } from '../../models/User'

describe('Auth Routes', () => {
  beforeEach(async () => {
    await User.deleteMany({})
  })

  describe('POST /api/auth/register', () => {
    it('should create a new user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.token).toBeDefined()
    })
  })
})
```

## End-to-End Testing (Playwright)

### Setup

E2E tests use **Playwright** for cross-browser testing.

```bash
# Install Playwright
npm run install:e2e

# Run E2E tests
npm run test:e2e

# Run in headed mode
npm run test:e2e:headed

# Run specific browser
npm run test:e2e -- --project=chromium
```

### Test Scenarios

1. **User Authentication Flow**
2. **Room Creation and Management**
3. **Real-time Collaboration**
4. **File Operations**
5. **Concurrent User Sessions**

### Example E2E Test

```typescript
// tests/e2e/collaboration.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Real-time Collaboration', () => {
  test('two users can edit the same file simultaneously', async ({ browser }) => {
    // Create two browser contexts (simulate two users)
    const context1 = await browser.newContext()
    const context2 = await browser.newContext()
    
    const page1 = await context1.newPage()
    const page2 = await context2.newPage()

    // User 1: Login and create room
    await page1.goto('http://localhost:3000')
    await page1.click('[data-testid=login-button]')
    await page1.fill('[data-testid=email]', 'user1@test.com')
    await page1.fill('[data-testid=password]', 'password123')
    await page1.click('[data-testid=submit]')
    
    await page1.click('[data-testid=create-room]')
    await page1.fill('[data-testid=room-name]', 'Test Room')
    await page1.click('[data-testid=create-button]')

    // Get room URL
    const roomUrl = page1.url()

    // User 2: Join the same room
    await page2.goto('http://localhost:3000')
    await page2.click('[data-testid=login-button]')
    await page2.fill('[data-testid=email]', 'user2@test.com')
    await page2.fill('[data-testid=password]', 'password123')
    await page2.click('[data-testid=submit]')
    
    await page2.goto(roomUrl)

    // Both users should see each other
    await expect(page1.locator('[data-testid=user-count]')).toContainText('2')
    await expect(page2.locator('[data-testid=user-count]')).toContainText('2')

    // User 1 types in editor
    await page1.click('[data-testid=monaco-editor]')
    await page1.keyboard.type('Hello from User 1')

    // User 2 should see the text
    await expect(page2.locator('[data-testid=monaco-editor]')).toContainText('Hello from User 1')

    // User 2 adds text
    await page2.click('[data-testid=monaco-editor]')
    await page2.keyboard.press('End')
    await page2.keyboard.type('\nHello from User 2')

    // User 1 should see both texts
    await expect(page1.locator('[data-testid=monaco-editor]')).toContainText('Hello from User 1')
    await expect(page1.locator('[data-testid=monaco-editor]')).toContainText('Hello from User 2')
  })
})
```

## Performance Testing

### Load Testing with Artillery

```bash
# Install Artillery
npm install -g artillery

# Run load tests
npm run test:load
```

### Socket.io Load Testing

```yaml
# tests/load/socket-load.yml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
  socketio:
    transports: ['websocket']

scenarios:
  - name: "Real-time collaboration simulation"
    weight: 100
    engine: socketio
    flow:
      - emit:
          channel: "room:join"
          data:
            roomId: "test-room-123"
      - think: 2
      - emit:
          channel: "file:update"
          data:
            fileId: "test-file"
            content: "console.log('Hello World');"
      - think: 5
      - emit:
          channel: "cursor:update"
          data:
            fileId: "test-file"
            position: { line: 1, column: 10 }
```

## Manual Testing Checklist

### 🔐 Authentication Flow
- [ ] User registration with validation
- [ ] User login with correct credentials
- [ ] Login failure with wrong credentials
- [ ] Password visibility toggle
- [ ] JWT token persistence
- [ ] Automatic logout on token expiry

### 🏠 Dashboard Functionality
- [ ] Room list display
- [ ] Room creation with different settings
- [ ] Room search and filtering
- [ ] Room access permissions
- [ ] User statistics display

### 📝 Editor Features
- [ ] File tree navigation
- [ ] File creation (different types)
- [ ] File deletion with confirmation
- [ ] File renaming
- [ ] Monaco editor loading
- [ ] Syntax highlighting
- [ ] Code completion
- [ ] Theme switching

### 🤝 Real-time Collaboration
- [ ] Multiple users joining same room
- [ ] Live cursor tracking
- [ ] Real-time text synchronization
- [ ] Conflict resolution with OT
- [ ] User presence indicators
- [ ] Connection status display

### 📱 Responsive Design
- [ ] Mobile layout adaptation
- [ ] Tablet view optimization
- [ ] Desktop full-screen mode
- [ ] Touch interactions on mobile

### 🔧 Performance
- [ ] Fast initial load time
- [ ] Smooth real-time updates
- [ ] Efficient memory usage
- [ ] No memory leaks during long sessions

## Test Data Setup

### Seed Data for Testing

```typescript
// tests/setup/seed-data.ts
export const testUsers = [
  {
    username: 'testuser1',
    email: 'user1@test.com',
    password: 'password123'
  },
  {
    username: 'testuser2', 
    email: 'user2@test.com',
    password: 'password123'
  }
]

export const testRooms = [
  {
    name: 'JavaScript Project',
    description: 'Learning JavaScript together',
    isPublic: true,
    settings: {
      language: 'javascript',
      maxCollaborators: 5
    }
  }
]

export const testFiles = [
  {
    name: 'index.js',
    path: '/index.js',
    type: 'file',
    content: 'console.log("Hello World");',
    language: 'javascript'
  }
]
```

## Continuous Integration

### GitHub Actions Test Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm run install:all
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm run install:all
      - run: npm run build
      - run: npm run test:e2e
```

## Test Coverage Goals

### Coverage Targets
- **Overall**: > 80%
- **Critical Paths**: > 95%
  - Authentication
  - OT Engine
  - Socket events
  - File operations

### Coverage Reports

```bash
# Generate coverage reports
npm run test:coverage

# View coverage in browser
open coverage/lcov-report/index.html
```

## Debugging Tests

### Frontend Test Debugging

```typescript
// Add to test files for debugging
import { screen } from '@testing-library/react'

// Debug DOM state
screen.debug()

// Debug specific element
screen.debug(screen.getByTestId('my-component'))
```

### Backend Test Debugging

```typescript
// Add debugging to API tests
console.log('Response:', response.body)
console.log('Database state:', await User.find({}))
```

### E2E Test Debugging

```typescript
// Record video and screenshots
test('my test', async ({ page }) => {
  await page.screenshot({ path: 'screenshot.png' })
  await page.video()?.saveAs('video.webm')
})
```

## Security Testing

### Authentication Security

- [ ] JWT token validation
- [ ] Password hashing verification
- [ ] Rate limiting on auth endpoints
- [ ] SQL injection protection
- [ ] XSS prevention

### Authorization Testing

- [ ] Room access control
- [ ] File permission checks
- [ ] Admin vs user privileges
- [ ] API endpoint protection

## Best Practices

### Writing Good Tests

1. **Arrange, Act, Assert** pattern
2. **Descriptive test names**
3. **Independent tests** (no dependencies)
4. **Mock external dependencies**
5. **Test edge cases**
6. **Use data-testid attributes**

### Test Organization

```
tests/
├── unit/           # Unit tests
├── integration/    # Integration tests  
├── e2e/           # End-to-end tests
├── load/          # Performance tests
├── fixtures/      # Test data
└── utils/         # Test utilities
```

## Troubleshooting

### Common Issues

**Tests timing out:**
```typescript
// Increase timeout for slow operations
test('slow operation', async () => {
  // test code
}, 10000) // 10 second timeout
```

**Database connection issues:**
```bash
# Ensure test database is clean
beforeEach(async () => {
  await User.deleteMany({})
  await Room.deleteMany({})
})
```

**Socket.io test issues:**
```typescript
// Wait for socket connection
await new Promise(resolve => {
  socket.on('connect', resolve)
})
```

## Test Commands Reference

```bash
# All Tests
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage

# Frontend
npm run test:frontend      # React component tests
npm run test:frontend:ui   # Visual test runner

# Backend  
npm run test:backend       # API and unit tests
npm run test:integration   # Integration tests only

# E2E
npm run test:e2e          # End-to-end tests
npm run test:e2e:headed   # With browser UI

# Performance
npm run test:load         # Load testing
npm run test:performance  # Performance benchmarks

# Specific
npm test -- --grep "auth"  # Tests matching pattern
npm test -- auth.test.ts   # Specific file
```

---

This comprehensive testing setup ensures CodeSync is reliable, performant, and ready for production use! 🚀
