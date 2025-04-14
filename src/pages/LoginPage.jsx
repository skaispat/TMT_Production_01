"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const LoginPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [masterData, setMasterData] = useState({
    usernames: [],
    passwords: [],
    roles: []
  })
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  // Hardcoded admin credentials as a fallback
  const ADMIN_USERNAME = 'admin'
  const ADMIN_PASSWORD = 'admin123'

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAAyUM9m_Oe_6XAmWYIgO0ENNXgt9ox8vBWwnB4f87Lf883RGvBi4xOL9kxLyDq1dtqA/exec"
        const response = await fetch(`${SCRIPT_URL}?action=getMasterData&sheetName=MASTER`)
        
        const result = await response.json()
        
        console.log("Full Master Data Response:", result)
        
        if (result.success && result.data) {
          // Safely extract usernames, passwords, and roles
          const usernames = Array.isArray(result.data.C) ? result.data.C.slice(1) : []
          const passwords = Array.isArray(result.data.D) ? result.data.D.slice(1) : []
          const roles = Array.isArray(result.data.E) ? result.data.E.slice(1) : []

          // Ensure arrays have matching lengths
          const minLength = Math.min(usernames.length, passwords.length, roles.length)
          
          const processedUsernames = usernames.slice(0, minLength).map(u => 
            typeof u === 'string' ? u.trim().toLowerCase() : ''
          )
          const processedPasswords = passwords.slice(0, minLength).map(p => 
            typeof p === 'string' ? p.trim() : ''
          )
          const processedRoles = roles.slice(0, minLength).map(r => 
            typeof r === 'string' ? r.trim().toLowerCase() : ''
          )

          setMasterData({
            usernames: processedUsernames,
            passwords: processedPasswords,
            roles: processedRoles
          })

          console.log("Processed Usernames:", processedUsernames)
          console.log("Processed Passwords:", processedPasswords)
          console.log("Processed Roles:", processedRoles)
        } else {
          console.error("Invalid master data response:", result)
          showToast("Failed to load master data", "error")
        }
      } catch (error) {
        console.error("Complete Error Fetching Master Data:", error)
        showToast(`Network error: ${error.message}`, "error")
      }
    }

    fetchMasterData()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Trim and convert to lowercase for case-insensitive comparison
      const trimmedUsername = formData.username.trim().toLowerCase()
      const trimmedPassword = formData.password.trim()

      console.log("Login Attempt Details:")
      console.log("Entered Username:", trimmedUsername)
      console.log("Entered Password:", trimmedPassword)
      console.log("Available Usernames:", masterData.usernames)
      console.log("Available Passwords:", masterData.passwords)

      // Special admin login
      if (
        trimmedUsername === ADMIN_USERNAME.toLowerCase() && 
        trimmedPassword === ADMIN_PASSWORD
      ) {
        sessionStorage.setItem('username', ADMIN_USERNAME)
        navigate("/admin/dashboard")
        showToast(`Login successful. Welcome, ${ADMIN_USERNAME}!`, "success")
        return
      }

      // Find the index of the username in the master data
      const userIndex = masterData.usernames.findIndex(
        username => username === trimmedUsername
      )

      console.log("User Index Found:", userIndex)

      // Enhanced null and undefined checks
      const matchedPassword = userIndex !== -1 ? 
        (masterData.passwords[userIndex] || '').trim() : 
        ''

      // Check if username exists and password matches
      if (
        userIndex !== -1 && 
        matchedPassword === trimmedPassword
      ) {
        // Store user info in sessionStorage
        sessionStorage.setItem('username', formData.username)
        
        // Determine route based on role (if roles are available)
        const userRole = (masterData.roles[userIndex] || '').trim().toLowerCase()

        console.log("User Role:", userRole)

        // Navigate to user dashboard
        navigate("/user/dashboard")
        
        showToast(`Login successful. Welcome, ${formData.username}!`, "success")
      } else {
        console.error("Login Failed", {
          usernameMatch: userIndex !== -1,
          passwordMatch: userIndex !== -1 ? matchedPassword === trimmedPassword : 'N/A'
        })
        showToast("Invalid username or password. Please try again.", "error")
      }
    } catch (error) {
      console.error("Complete Login Error:", error)
      showToast(`Login failed: ${error.message}. Please try again.`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000) // Increased toast duration for better readability
  }

  // Rest of the component remains the same as previous implementation
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-950 p-4">
      <div className="w-full max-w-md shadow-lg border border-blue-200 dark:border-purple-800 rounded-lg bg-white dark:bg-gray-800">
        <div className="space-y-1 p-4 bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-clipboard-list h-8 w-8 text-blue-600 dark:text-blue-400 mr-2"></i>
            <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">Checklist & Delegation</h2>
          </div>
          <p className="text-center text-blue-600 dark:text-blue-400">Login to access your tasks and delegations</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="flex items-center text-blue-700 dark:text-blue-300">
              <i className="fas fa-user h-4 w-4 mr-2"></i>
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              required
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="flex items-center text-blue-700 dark:text-blue-300">
              <i className="fas fa-key h-4 w-4 mr-2"></i>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 -mx-4 -mb-4 mt-4 rounded-b-lg">
            <button
              type="submit"
              className="w-full py-2 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-md font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          toast.type === "success"
            ? "bg-green-100 text-green-800 border-l-4 border-green-500"
            : "bg-red-100 text-red-800 border-l-4 border-red-500"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default LoginPage