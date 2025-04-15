"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const LoginPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [masterData, setMasterData] = useState({
    userCredentials: {} // Changed to an object where keys are usernames and values are passwords
  })
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  })
  const [toast, setToast] = useState({ show: false, message: "", type: "" })

  // Fetch master data on component mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setIsLoading(true)
        const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAAyUM9m_Oe_6XAmWYIgO0ENNXgt9ox8vBWwnB4f87Lf883RGvBi4xOL9kxLyDq1dtqA/exec"
        
        // Using POST for better data handling
        const formData = new FormData()
        formData.append('action', 'getMasterData')
        formData.append('sheetName', 'MASTER')
        
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        console.log("Full Master Data Response:", result)
        
        if (result.success && result.data) {
          // Get raw data from columns
          const rawData = result.data
          
          console.log("Raw Data Columns:", Object.keys(rawData))
          console.log("Raw Data Contents:", rawData)

          // Ensure we have the correct columns
          const usernamesCol = rawData.C || []
          const passwordsCol = rawData.D || []
          
          console.log("Usernames Column:", usernamesCol)
          console.log("Passwords Column:", passwordsCol)

          // Directly map usernames to passwords in an object
          const userCredentials = {}
          
          // Process rows
          for (let i = 1; i < usernamesCol.length; i++) {
            const username = String(usernamesCol[i]).trim().toLowerCase()
            const password = passwordsCol[i]
            
            console.log(`Processing row ${i}:`, { username, password })
            
            // Only add credentials if both username and password are valid
            if (
              username && 
              password !== undefined && 
              password !== null && 
              String(password).trim() !== ''
            ) {
              userCredentials[username] = String(password).trim()
            }
          }

          setMasterData({ userCredentials })
          
          console.log("Processed User Credentials:", userCredentials)
          console.log("Admin Credentials:", userCredentials['admin'])
        } else {
          console.error("Invalid master data response:", result)
          showToast("Failed to load master data", "error")
        }
      } catch (error) {
        console.error("Complete Error Fetching Master Data:", error)
        showToast(`Network error: ${error.message}`, "error")
      } finally {
        setIsLoading(false)
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
      const trimmedUsername = formData.username.trim().toLowerCase()
      const trimmedPassword = formData.password.trim()

      console.log("Login Attempt Details:")
      console.log("Entered Username:", trimmedUsername)
      console.log("Entered Password:", trimmedPassword)
      console.log("Available Credentials:", Object.keys(masterData.userCredentials))
      
      // Check if the username exists in our credentials map
      if (trimmedUsername in masterData.userCredentials) {
        const correctPassword = masterData.userCredentials[trimmedUsername]
        
        console.log("Found user in credentials map")
        console.log("Expected Password:", correctPassword)
        console.log("Password Match:", correctPassword === trimmedPassword)
        
        // Check if password matches
        if (correctPassword === trimmedPassword) {
          // Store user info in sessionStorage
          sessionStorage.setItem('username', trimmedUsername)
          
          // Determine if user is admin based on username
          const isAdmin = trimmedUsername === 'admin'
          sessionStorage.setItem('role', isAdmin ? 'admin' : 'user')
          
          // Navigate based on role
          if (isAdmin) {
            navigate("/dashboard/admin")
          } else {
            navigate("/dashboard/tasks")
          }
          
          showToast(`Login successful. Welcome, ${trimmedUsername}!`, "success")
          return
        }
      }
      
      // If we got here, login failed
      console.error("Login Failed", {
        usernameExists: trimmedUsername in masterData.userCredentials,
        passwordMatch: (trimmedUsername in masterData.userCredentials) ? 
          masterData.userCredentials[trimmedUsername] === trimmedPassword : 'N/A'
      })
      showToast("Invalid username or password. Please try again.", "error")
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