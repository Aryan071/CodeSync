# 🚀 CodeSync - Real-time Collaborative Code Editor

> A powerful, modern collaborative code editor that enables multiple developers to code together in real-time, similar to Google Docs but for programming.

## 🌟 Key Features

- **Real-time Collaboration**: Multiple users can edit the same file simultaneously
- **Live Cursor Tracking**: See where other users are typing in real-time  
- **Conflict Resolution**: Intelligent merging using Operational Transformation
- **Multi-language Support**: Syntax highlighting for 15+ programming languages
- **File Management**: Complete project structure navigation
- **AI Code Assistance**: Intelligent code completion and suggestions

## 🛠️ Tech Stack

**Frontend:**
- React 18 + TypeScript
- Monaco Editor (VS Code's editor)
- Socket.io Client
- Tailwind CSS + Framer Motion
- Zustand (State Management)

**Backend:**
- Node.js + Express + TypeScript
- Socket.io (Real-time communication)
- MongoDB + Mongoose
- Redis (Caching)
- JWT Authentication

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/yourusername/codesync.git
cd codesync
npm run install:all

# Create environment files
# Backend: Create backend/.env with MongoDB URI
# Frontend: Create frontend/.env with API URLs

# Start development
npm run dev

# Open http://localhost:3000
```

## 📋 Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (optional, has fallback)

## 🎯 What Makes This Special

- **Real-time Sync**: Uses WebSocket + Operational Transformation
- **Conflict-free**: Multiple users can edit same location simultaneously  
- **Production Ready**: Comprehensive testing, error handling
- **Modern Architecture**: Clean code, proper separation of concerns
- **Resume Worthy**: Demonstrates advanced full-stack skills

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:coverage # With coverage report
npm run test:e2e     # End-to-end tests
```

## 📖 Documentation

- [🏗️ Architecture](./docs/ARCHITECTURE.md)
- [🔧 Tech Stack Details](./docs/TECH_STACK.md) 
- [🧪 Testing Guide](./TESTING.md)
- [🚀 Quick Start](./QUICK_START.md)

---

**Perfect for portfolios and technical interviews!** 🎯
