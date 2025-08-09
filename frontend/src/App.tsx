import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AuthPage from './pages/AuthPage'
import DashboardPage from './pages/DashboardPage'
import EditorPage from './pages/EditorPage'
import LandingPage from './pages/LandingPage'
import LoadingSpinner from './components/ui/LoadingSpinner'

function App() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/auth" 
          element={user ? <Navigate to="/dashboard" /> : <AuthPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <DashboardPage /> : <Navigate to="/auth" />} 
        />
        <Route 
          path="/editor/:roomId" 
          element={user ? <EditorPage /> : <Navigate to="/auth" />} 
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}

export default App
