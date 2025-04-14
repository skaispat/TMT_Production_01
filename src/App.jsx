"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPage from "./pages/LoginPage"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminAssignTask from "./pages/admin/AssignTask"
import UserDashboard from "./pages/user/Dashboard"
import UserTasks from "./pages/user/Tasks"
import AdminLayout from "./components/layout/AdminLayout"
import UserLayout from "./components/layout/UserLayout"
import AllTasks from "./pages/admin/AllTasks"
import "./index.css"

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

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <Navigate to="/admin/dashboard" replace />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/assign-task"
          element={
            <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <AdminAssignTask />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/tasks"
          element={
            <AdminLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <AllTasks />
            </AdminLayout>
          }
        />

        {/* User Routes */}
        <Route
          path="/user"
          element={
            <UserLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <Navigate to="/user/dashboard" replace />
            </UserLayout>
          }
        />
        <Route
          path="/user/dashboard"
          element={
            <UserLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <UserDashboard />
            </UserLayout>
          }
        />
        <Route
          path="/user/tasks"
          element={
            <UserLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
              <UserTasks />
            </UserLayout>
          }
        />
      </Routes>
    </Router>
  )
}

export default App