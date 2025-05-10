"use client"

import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"

function ProtectedRoute({ children, adminOnly = false }) {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    // You could return a loading spinner here
    return <div>Loading...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  // Check if route requires admin access
  if (adminOnly && user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
