"use client"

import { createContext, useState, useContext, useEffect } from "react"

// Create the authentication context with default values
export const AuthContext = createContext({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Google Sheets configuration for authentication
  const SHEET_ID = "1TjJufd9uDojTHK9cYogTgaBQQEqfo1x8aJ9SJ9zbR6s"
  const LOGIN_SHEET_NAME = "Login" // Sheet containing user credentials

  // Check if user is already logged in from localStorage on component mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    console.log("Checking localStorage for user:", storedUser);
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log("Parsed user from localStorage:", parsedUser);
        setUser(parsedUser)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        // Clear invalid data
        localStorage.removeItem("user")
      }
    }
    setIsLoading(false)
  }, [])

  // Login function that verifies against Google Sheets
  const login = async (username, password) => {
    setIsLoading(true)
    console.log("Attempting login with username:", username);
    
    try {
      // Fetch the Login sheet data
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${LOGIN_SHEET_NAME}`
      
      const response = await fetch(url)
      const text = await response.text()
      
      // Extract the JSON part from the response
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}") + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      
      const data = JSON.parse(jsonData)
      console.log("Login sheet data:", data);
      
      if (data && data.table && data.table.rows) {
        // Search for matching username and password
        for (const row of data.table.rows) {
          if (row.c &&
              row.c[0] && row.c[0].v === username && // Column A - Username
              row.c[1] && row.c[1].v === password) { // Column B - Password
            
            // Get user type from Column C
            const userType = row.c[2] ? row.c[2].v : 'user'
            
            // User found and password matches
            const userData = {
              username,
              userType: userType.toLowerCase(),
              displayName: row.c[3] ? row.c[3].v : username,
              isAdmin: userType.toLowerCase() === 'admin',
              // New properties for different admin levels
              isFullAdmin: userType.toLowerCase() === 'admin' && username.toLowerCase() === 'admin',
              isLimitedAdmin: userType.toLowerCase() === 'admin' && username.toLowerCase() !== 'admin'
            }
            
            console.log("User authenticated successfully:", userData);
            
            // Store in state
            setUser(userData)
            setIsAuthenticated(true)
            
            // Store in localStorage for persistence
            localStorage.setItem("user", JSON.stringify(userData))
            console.log("User stored in localStorage");
            
            setIsLoading(false)
            return true
          }
        }
      }
      
      // If we get here, authentication failed
      console.log("Authentication failed - invalid credentials");
      setIsLoading(false)
      return false
      
    } catch (error) {
      console.error("Login error:", error)
      setIsLoading(false)
      throw error
    }
  }

  // Logout function
  const logout = () => {
    console.log("Logging out user");
    setUser(null)
    setIsAuthenticated(false)
    localStorage.removeItem("user")
  }

  // Create the context value
  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  }

  console.log("AuthContext current state:", {
    user,
    isLoading,
    isAuthenticated
  });

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook for using the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}