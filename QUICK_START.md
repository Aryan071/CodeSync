# 🚀 Quick Start Guide - CodeSync

This guide will get you up and running with CodeSync in minutes!

## Prerequisites

- **Node.js 18+** ([Download here](https://nodejs.org/))
- **MongoDB** ([Download here](https://www.mongodb.com/try/download/community))
- **Redis** (Optional) ([Download here](https://redis.io/download))
- **Git** ([Download here](https://git-scm.com/))

---

## Method 1: Local Development 💻

### Step 1: Install Dependencies
```bash
cd CodeSync
npm run install:all
```

### Step 2: Set Up Environment
```bash
# Run the setup script (creates .env files)
chmod +x scripts/setup.sh
./scripts/setup.sh

# Or create environment files manually:
# See "Manual Environment Setup" section below
```

### Step 3: Start Services

**Option A: All services together**
```bash
npm run dev
```

**Option B: Start services separately** (for debugging)
```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend  
npm run dev:frontend

# Note: You'll need MongoDB and Redis running locally
```

---

## Method 2: Production Build 🏭

To test the production version:

```bash
# Build everything
npm run build

# Start backend
cd backend && npm start

# In another terminal, serve frontend
cd frontend && npm run preview
```

---

## Quick Commands Reference

```bash
# 🚀 DEVELOPMENT
npm run dev                # Start both frontend & backend
npm run dev:frontend       # Frontend only
npm run dev:backend        # Backend only

# 🏗️ BUILDING
npm run build              # Build both frontend & backend
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only

# 🧪 TESTING
npm test                   # Run all tests
npm run test:coverage      # Run tests with coverage
npm run test:e2e           # End-to-end tests

# 🔧 UTILITIES
npm run lint               # Check code quality
npm run setup              # Initial setup
```

---

## Access Points

After starting the project:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | Main application |
| **Backend API** | http://localhost:5000 | REST API |
| **API Health** | http://localhost:5000/health | Health check |
| **MongoDB** | localhost:27017 | Database |
| **Redis** | localhost:6379 | Cache |

---

## First Time Setup

### 1. Create Your First Account
1. Go to http://localhost:3000
2. Click "Get Started"
3. Click "Sign up" 
4. Fill in your details
5. Create account

### 2. Create Your First Room
1. After login, you'll see the dashboard
2. Click "New Room"
3. Enter room details:
   - Name: "My First Project"
   - Language: JavaScript
   - Make it public (for easy sharing)
4. Click "Create Room"

### 3. Start Coding!
1. Create a new file: `index.js`
2. Start typing code
3. Open another browser tab/window
4. Join the same room
5. Watch real-time collaboration! ✨

---

## Manual Environment Setup

If the setup script doesn't work, create these files manually:

### Backend Environment (.env)
```bash
# Create: CodeSync/backend/.env
MONGODB_URI=mongodb://admin:password123@localhost:27017/codesync?authSource=admin
REDIS_URL=redis://:redis123@localhost:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=your-openai-api-key-optional
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
```

### Frontend Environment (.env)
```bash
# Create: CodeSync/frontend/.env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
NODE_ENV=development
```

---

## Troubleshooting

### Common Issues & Solutions

#### ❌ "Port already in use"
```bash
# Kill processes on ports
npx kill-port 3000 5000

# Or use different ports
PORT=3001 npm run dev:frontend
PORT=5001 npm run dev:backend
```

#### ❌ Docker issues
```bash
# Reset Docker environment
npm run docker:down
docker system prune -f
npm run docker:dev
```

#### ❌ "Module not found"
```bash
# Reinstall dependencies
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

#### ❌ Database connection errors
```bash
# If using local MongoDB/Redis, ensure they're running
# Or use Docker method which includes databases
npm run docker:dev
```

#### ❌ Permission denied (Linux/Mac)
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

---

## Development Workflow

### Daily Development
```bash
# 1. Start development environment
npm run docker:dev

# 2. Make your changes to code

# 3. Tests run automatically, or run manually
npm test

# 4. Stop when done
npm run docker:down
```

### Adding New Features
```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Start development
npm run dev

# 3. Write tests
npm run test:watch

# 4. Build and test
npm run build
npm test

# 5. Commit and push
git add .
git commit -m "Add my feature"
git push origin feature/my-feature
```

---

## Performance Tips

### For Development
- Use Docker for consistent environment
- Use `npm run test:watch` for continuous testing
- Open dev tools to monitor network and performance

### For Production
- Build with `npm run build`
- Use production Docker compose
- Monitor with included Grafana/Prometheus setup

---

## Multi-User Testing

To test collaboration features:

### Method 1: Multiple Browser Tabs
1. Open tab 1: http://localhost:3000
2. Register as User 1
3. Create a room
4. Open tab 2 (incognito mode)
5. Register as User 2  
6. Join the same room
7. Start typing together!

### Method 2: Different Browsers
1. Chrome: Register as User 1
2. Firefox: Register as User 2
3. Both join same room
4. Test real-time collaboration

### Method 3: Different Devices
1. Desktop: http://localhost:3000
2. Mobile: http://[your-ip]:3000
3. Both users join same room

---

## What You Should See

### ✅ Successful Startup
```
🚀 CodeSync Development Environment
✅ MongoDB connected
✅ Redis connected  
✅ Backend server running on port 5000
✅ Frontend server running on port 3000
✅ WebSocket server ready
```

### ✅ Working Features
- User registration and login
- Dashboard with room management
- Real-time code editor
- File tree with create/delete operations
- Live cursor tracking
- Multi-user collaboration
- Theme switching
- Responsive design

---

## Next Steps

1. **Explore the Code**: Check out the well-structured codebase
2. **Run Tests**: `npm test` to see comprehensive test coverage
3. **Customize**: Modify the code to add your own features
4. **Deploy**: Use the deployment guides in DEPLOYMENT.md
5. **Showcase**: Add to your portfolio and resume!

---

## 🎉 You're Ready!

CodeSync is now running and ready for development, testing, or demonstration. The application showcases:

- ✅ **Modern Tech Stack** (React, Node.js, MongoDB, Redis)
- ✅ **Real-time Collaboration** (Socket.io, Operational Transformation)
- ✅ **Professional Architecture** (Clean code, proper testing)
- ✅ **Production Ready** (Docker, CI/CD, monitoring)

**Perfect for your resume and technical interviews!** 🚀

---

**Need help?** Check out:
- `TESTING.md` - Comprehensive testing guide
- `DEPLOYMENT.md` - Production deployment
- `MANUAL_TESTING.md` - Step-by-step testing checklist
