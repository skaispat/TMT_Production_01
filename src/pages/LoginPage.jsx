"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const LoginPage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [masterData, setMasterData] = useState({
    userCredentials: {} // Object where keys are usernames and values are passwords
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
        
        // Create userCredentials object from the sheet data
        const userCredentials = {}
        
        // If there's data from the sheet, process it
       // Update the data extraction in fetchMasterData function
if (result.success && result.data) {
  // Log the entire response to understand its structure
  console.log("Raw data response:", result.data);
  
  const usernamesCol = result.data.C || [];
  const passwordsCol = result.data.D || [];
  
  console.log("Username column:", usernamesCol);
  console.log("Password column:", passwordsCol);
  
  // Process all rows, including the first one
  for (let i = 0; i < usernamesCol.length; i++) {
    const username = String(usernamesCol[i] || '').trim().toLowerCase();
    const password = passwordsCol[i];
    
    if (username && password !== undefined && password !== null && 
        String(password).trim() !== '') {
      userCredentials[username] = String(password).trim();
      console.log(`Added credential for: ${username}`);
    }
  }
}
    
        setMasterData({ userCredentials })
        console.log("Loaded credentials from master sheet:", Object.keys(userCredentials).length)
      } catch (error) {
        console.error("Error Fetching Master Data:", error)
        showToast(`Network error: ${error.message}. Please try again later.`, "error")
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
      console.log("Available Credentials Count:", Object.keys(masterData.userCredentials).length)
      
      // Check if the username exists in our credentials map
      if (trimmedUsername in masterData.userCredentials) {
        const correctPassword = masterData.userCredentials[trimmedUsername]
        
        console.log("Found user in credentials map")
        console.log("Password Match:", correctPassword === trimmedPassword)
        
        // Check if password matches
        if (correctPassword === trimmedPassword) {
          // Store user info in sessionStorage
          sessionStorage.setItem('username', trimmedUsername)
          
          // Determine if user is admin based on username
      // Determine if user is admin based on username
const isAdmin = trimmedUsername === 'admin'
sessionStorage.setItem('role', isAdmin ? 'admin' : 'user')
          sessionStorage.setItem('department', trimmedUsername) // Store username as department for access control
          
          // Navigate based on role
          // When admin logs in
if (isAdmin) {
  navigate("/dashboard/admin")
} else {
  // Regular users go to admin dashboard, just like admin
  navigate("/dashboard/admin")
}
          
          showToast(`Login successful. Welcome, ${trimmedUsername}!`, "success")
          return
        }
      }
      
      // If we got here, login failed
      console.error("Login Failed", {
        usernameExists: trimmedUsername in masterData.userCredentials,
        passwordMatch: (trimmedUsername in masterData.userCredentials) ? 
          "Password did not match" : 'Username not found'
      })
      showToast("Invalid username or password. Please try again.", "error")
    } catch (error) {
      console.error("Login Error:", error)
      showToast(`Login failed: ${error.message}. Please try again.`, "error")
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (message, type) => {
    setToast({ show: true, message, type })
    setTimeout(() => {
      setToast({ show: false, message: "", type: "" })
    }, 5000) // Toast duration
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="w-full max-w-md shadow-lg border border-blue-200 rounded-lg bg-white">
        <div className="space-y-1 p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-t-lg">
          <div className="flex items-center justify-center mb-2">
            <i className="fas fa-clipboard-list h-8 w-8 text-blue-600 mr-2"></i>
            <h2 className="text-2xl font-bold text-blue-700">Checklist & Delegation</h2>
          </div>
          <p className="text-center text-blue-600">Login to access your tasks and delegations</p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="username" className="flex items-center text-blue-700">
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
            <label htmlFor="password" className="flex items-center text-blue-700">
              <i className="fas fa-key h-4 w-4 mr-2"></i>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 -mx-4 -mb-4 mt-4 rounded-b-lg">
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