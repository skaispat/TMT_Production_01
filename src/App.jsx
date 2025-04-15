"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminAssignTask from "./pages/admin/AssignTask"
import AllTasks from "./pages/admin/AllTasks"
import AdminLayout from "./components/layout/AdminLayout"
import "./index.css"

// Auth wrapper component to protect routes
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const username = sessionStorage.getItem('username');
  const isAdmin = username?.toLowerCase() === 'admin';
  
  // If no user is logged in, redirect to login
  if (!username) {
    return <Navigate to="/login" replace />;
  }
  
  // If this is an admin-only route and user is not admin, redirect to all tasks
  if (allowedRoles.includes('admin') && !allowedRoles.includes('user') && !isAdmin) {
    return <Navigate to="/dashboard/tasks" replace />;
  }
  
  return children;
};

function App() {
  const [darkMode, setDarkMode] = useState(false)
  
  useEffect(() => {
    // Check for user preference
    if (
      localStorage.theme === "dark" ||
      (!("theme" in localStorage) && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      setDarkMode(true)
      document.documentElement.classList.add("dark")
    } else {
      setDarkMode(false)
      document.documentElement.classList.remove("dark")
    }
  }, [])
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (darkMode) {
      document.documentElement.classList.remove("dark")
      localStorage.theme = "light"
    } else {
      document.documentElement.classList.add("dark")
      localStorage.theme = "dark"
    }
  }
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* Main dashboard route */}
        <Route path="/dashboard" element={<Navigate to="/dashboard/tasks" replace />} />
        
        {/* Admin only routes */}
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/assign-task"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                <AdminAssignTask />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* All users can access the tasks page */}
        <Route
          path="/dashboard/tasks"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user']}>
              <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
                <AllTasks />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* For backward compatibility - redirect old paths */}
        <Route path="/admin/*" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/dashboard" element={<Navigate to="/dashboard/admin" replace />} />
        <Route path="/admin/assign-task" element={<Navigate to="/dashboard/assign-task" replace />} />
        <Route path="/admin/tasks" element={<Navigate to="/dashboard/tasks" replace />} />
        <Route path="/user/*" element={<Navigate to="/dashboard/tasks" replace />} />
      </Routes>
    </Router>
  )
}

export default App