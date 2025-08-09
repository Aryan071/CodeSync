import request from 'supertest'
import express from 'express'
import authRoutes from '../auth'
import { User } from '../../models/User'
import { createTestUser, expectValidationError, expectUnauthorized } from '../../test/utils'

const app = express()
app.use(express.json())
app.use('/api/auth', authRoutes)

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const userData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123'
      }

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe(userData.email)
      expect(response.body.user.username).toBe(userData.username)
      expect(response.body.user).not.toHaveProperty('password')

      // Verify user was created in database
      const dbUser = await User.findOne({ email: userData.email })
      expect(dbUser).toBeTruthy()
      expect(dbUser?.username).toBe(userData.username)
    })

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // missing username and password
        })

      expectValidationError(response, 'username')
    })

    it('should reject registration with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123'
        })

      expectValidationError(response, 'email')
    })

    it('should reject registration with short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123'
        })

      expectValidationError(response, 'password')
    })

    it('should reject registration with short username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ab',
          email: 'test@example.com',
          password: 'password123'
        })

      expectValidationError(response, 'username')
    })

    it('should reject registration with duplicate email', async () => {
      const existingUser = await createTestUser({
        email: 'existing@example.com'
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'existing@example.com',
          password: 'password123'
        })
        .expect(400)

      expect(response.body.message).toContain('Email already registered')
    })

    it('should reject registration with duplicate username', async () => {
      const existingUser = await createTestUser({
        username: 'existinguser'
      })

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existinguser',
          email: 'new@example.com',
          password: 'password123'
        })
        .expect(400)

      expect(response.body.message).toContain('Username already taken')
    })
  })

  describe('POST /api/auth/login', () => {
    let testUser: any

    beforeEach(async () => {
      testUser = await createTestUser({
        email: 'login@example.com',
        password: 'password123'
      })
    })

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        })
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body).toHaveProperty('token')
      expect(response.body.user.email).toBe('login@example.com')
      expect(response.body.user).not.toHaveProperty('password')

      // Verify user status was updated
      const updatedUser = await User.findById(testUser._id)
      expect(updatedUser?.isOnline).toBe(true)
      expect(updatedUser?.lastSeen).toBeDefined()
    })

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        })
        .expect(401)

      expect(response.body.message).toContain('Invalid email or password')
    })

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'wrongpassword'
        })
        .expect(401)

      expect(response.body.message).toContain('Invalid email or password')
    })

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com'
          // missing password
        })

      expectValidationError(response, 'password')
    })

    it('should reject login with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'password123'
        })

      expectValidationError(response, 'email')
    })
  })

  describe('GET /api/auth/me', () => {
    let testUser: any
    let authToken: string

    beforeEach(async () => {
      testUser = await createTestUser()
      
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
      
      authToken = loginResponse.body.token
    })

    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toHaveProperty('user')
      expect(response.body.user.email).toBe(testUser.email)
      expect(response.body.user).not.toHaveProperty('password')
    })

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')

      expectUnauthorized(response)
    })

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')

      expectUnauthorized(response)
    })

    it('should reject request with malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'invalid-format')

      expectUnauthorized(response)
    })
  })

  describe('POST /api/auth/logout', () => {
    let testUser: any
    let authToken: string

    beforeEach(async () => {
      testUser = await createTestUser()
      
      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'password123'
        })
      
      authToken = loginResponse.body.token
    })

    it('should logout user and update status', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.message).toContain('Logout successful')

      // Verify user status was updated
      const updatedUser = await User.findById(testUser._id)
      expect(updatedUser?.isOnline).toBe(false)
      expect(updatedUser?.lastSeen).toBeDefined()
    })

    it('should reject logout without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')

      expectUnauthorized(response)
    })
  })
})
