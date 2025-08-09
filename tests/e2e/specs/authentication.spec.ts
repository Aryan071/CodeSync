import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display landing page correctly', async ({ page }) => {
    await expect(page).toHaveTitle(/CodeSync/)
    await expect(page.locator('h1')).toContainText('Code Together')
    await expect(page.getByText('Get Started')).toBeVisible()
  })

  test('should navigate to auth page', async ({ page }) => {
    await page.click('text=Get Started')
    await expect(page).toHaveURL('/auth')
    await expect(page.locator('h2')).toContainText('Welcome Back')
  })

  test('should register a new user', async ({ page }) => {
    // Navigate to registration
    await page.goto('/auth')
    await page.click('text=Sign up')
    
    // Fill registration form
    await page.fill('[data-testid=username]', 'e2euser')
    await page.fill('[data-testid=email]', `e2euser+${Date.now()}@example.com`)
    await page.fill('[data-testid=password]', 'password123')
    await page.fill('[data-testid=confirm-password]', 'password123')
    
    // Submit form
    await page.click('[data-testid=submit-button]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Good')
  })

  test('should login with existing user', async ({ page }) => {
    // First register a user
    await page.goto('/auth')
    await page.click('text=Sign up')
    
    const email = `loginuser+${Date.now()}@example.com`
    await page.fill('[data-testid=username]', 'loginuser')
    await page.fill('[data-testid=email]', email)
    await page.fill('[data-testid=password]', 'password123')
    await page.fill('[data-testid=confirm-password]', 'password123')
    await page.click('[data-testid=submit-button]')
    
    // Logout
    await page.click('[data-testid=user-menu]')
    await page.click('text=Logout')
    
    // Now login
    await page.goto('/auth')
    await page.fill('[data-testid=email]', email)
    await page.fill('[data-testid=password]', 'password123')
    await page.click('[data-testid=submit-button]')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/auth')
    
    // Try to submit empty form
    await page.click('[data-testid=submit-button]')
    
    // Should show validation errors
    await expect(page.locator('text=Please enter a valid email')).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/auth')
    
    const passwordInput = page.locator('[data-testid=password]')
    const toggleButton = page.locator('[data-testid=password-toggle]')
    
    // Initially should be password type
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click again to hide
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should handle login errors', async ({ page }) => {
    await page.goto('/auth')
    
    // Try invalid credentials
    await page.fill('[data-testid=email]', 'nonexistent@example.com')
    await page.fill('[data-testid=password]', 'wrongpassword')
    await page.click('[data-testid=submit-button]')
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
  })

  test('should redirect authenticated users away from auth page', async ({ page }) => {
    // First login
    await page.goto('/auth')
    await page.click('text=Sign up')
    
    const email = `redirectuser+${Date.now()}@example.com`
    await page.fill('[data-testid=username]', 'redirectuser')
    await page.fill('[data-testid=email]', email)
    await page.fill('[data-testid=password]', 'password123')
    await page.fill('[data-testid=confirm-password]', 'password123')
    await page.click('[data-testid=submit-button]')
    
    // Now try to go back to auth page
    await page.goto('/auth')
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
  })
})
