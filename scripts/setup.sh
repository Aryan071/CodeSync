#!/bin/bash

# CodeSync Setup Script
# This script sets up the development environment for CodeSync

set -e

echo "🚀 Setting up CodeSync development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Note: This project requires MongoDB and Redis for full functionality
echo "📋 Note: You'll need MongoDB and Redis installed locally for full functionality"
echo "   MongoDB: https://www.mongodb.com/try/download/community"
echo "   Redis: https://redis.io/download"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Create environment files
echo "🔧 Creating environment files..."

# Backend environment
if [ ! -f "backend/.env" ]; then
    cat > backend/.env << EOL
# Database
MONGODB_URI=mongodb://admin:password123@localhost:27017/codesync?authSource=admin
REDIS_URL=redis://:redis123@localhost:6379

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AI Services (Optional - get from OpenAI)
OPENAI_API_KEY=your-openai-api-key

# Server
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000
EOL
    echo "✅ Created backend/.env"
else
    echo "⚠️  backend/.env already exists, skipping..."
fi

# Frontend environment
if [ ! -f "frontend/.env" ]; then
    cat > frontend/.env << EOL
# API Configuration
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000

# Environment
NODE_ENV=development
EOL
    echo "✅ Created frontend/.env"
else
    echo "⚠️  frontend/.env already exists, skipping..."
fi

# Production environment template
if [ ! -f ".env.production" ]; then
    cat > .env.production << EOL
# Production Environment Variables
# Copy this file and update with your production values

# Database
MONGO_ROOT_USERNAME=your-mongo-username
MONGO_ROOT_PASSWORD=your-secure-mongo-password
REDIS_PASSWORD=your-secure-redis-password

# Authentication
JWT_SECRET=your-very-secure-jwt-secret-for-production

# AI Services
OPENAI_API_KEY=your-openai-api-key

# Frontend
FRONTEND_URL=https://your-domain.com

# Monitoring
GRAFANA_PASSWORD=your-grafana-password
EOL
    echo "✅ Created .env.production template"
fi

# Make scripts executable
chmod +x scripts/*.sh

echo ""
echo "🎉 Setup complete! Here's what you can do next:"
echo ""
echo "📋 Development Commands:"
echo "   npm run dev          - Start both frontend and backend in development mode"
echo "   npm run dev:frontend - Start only the frontend"
echo "   npm run dev:backend  - Start only the backend"
echo ""

echo "🔧 Other Commands:"
echo "   npm run build        - Build both frontend and backend for production"
echo "   npm run lint         - Run linting on both projects"
echo "   npm test             - Run tests"
echo ""
echo "📖 Next Steps:"
echo "   1. Update the environment files with your actual values"
echo "   2. Install MongoDB and Redis locally"
echo "   3. Run: npm run dev"
echo "   4. Open http://localhost:3000 in your browser"
echo ""
echo "Happy coding! 🚀"
