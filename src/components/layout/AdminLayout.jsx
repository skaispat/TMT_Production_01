"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

const AdminLayout = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [username, setUsername] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  // Check authentication on component mount
  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username')
    
    if (!storedUsername) {
      // Redirect to login if not logged in
      navigate('/login')
      return
    }

    setUsername(storedUsername)
    
    // Check if user is admin
    setIsAdmin(storedUsername.toLowerCase() === 'admin')
  }, [navigate])

  // Logout handler
  const handleLogout = () => {
    sessionStorage.removeItem('username')
    sessionStorage.removeItem('role')
    navigate('/login')
  }

  // Define routes based on user role
  let routes = [
    { href: "/dashboard/tasks", label: "All Tasks", icon: "clipboard-list" },
  ]

  // Add admin-only routes
  if (isAdmin) {
    routes = [
      { href: "/dashboard/admin", label: "Dashboard", icon: "home" },
      { href: "/dashboard/assign-task", label: "Assign Task", icon: "check-square" },
      ...routes,
    ]
  }

  const getIcon = (iconName) => {
    switch (iconName) {
      case "home":
        return <i className="fas fa-home w-4 h-4"></i>
      case "clipboard-list":
        return <i className="fas fa-clipboard-list w-4 h-4"></i>
      case "check-square":
        return <i className="fas fa-check-square w-4 h-4"></i>
      default:
        return <i className="fas fa-circle w-4 h-4"></i>
    }
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-800 antialiased">
      {/* Sidebar */}
      <aside className="w-64 hidden md:flex flex-col bg-white border-r border-gray-100 shadow-sm">
        <div className="h-16 px-6 flex items-center font-bold text-xl text-blue-600 border-b border-gray-100 bg-blue-50">
          <i className="fas fa-clipboard-list mr-3 text-blue-500"></i> 
          <span className="tracking-tight">Task Management</span>
        </div>
        <nav className="flex-1 px-3 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {routes.map((route) => (
              <li key={route.href}>
                <Link
                  to={route.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition-all ${
                    location.pathname === route.href 
                      ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-500 pl-3" 
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  {getIcon(route.icon)}
                  <span className="text-sm tracking-wide">{route.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t border-gray-100 p-4 flex items-center justify-between bg-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
              {username ? username.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-800">{isAdmin ? 'Admin' : 'User'}</p>
              <p className="text-xs text-gray-500">{username}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-500 text-lg transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </aside>

      {/* Mobile menu backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-white border-r border-gray-100 z-50 transform ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out md:hidden`}
      >
        <div className="h-16 px-6 flex items-center justify-between border-b border-gray-100 bg-blue-50">
          <span className="text-xl font-bold text-blue-600 tracking-tight">Task Management</span>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <nav className="px-3 py-6">
          <ul className="space-y-1">
            {routes.map((route) => (
              <li key={route.href}>
                <Link
                  to={route.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg font-medium hover:bg-blue-50 transition-all ${
                    location.pathname === route.href 
                      ? "bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-500 pl-3" 
                      : "text-gray-700 hover:text-blue-600"
                  }`}
                >
                  {getIcon(route.icon)}
                  <span className="text-sm tracking-wide">{route.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 px-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <button
            className="md:hidden text-blue-500 hover:text-blue-600 text-xl transition-colors"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <i className="fas fa-bars"></i>
          </button>
          <h1 className="text-base font-bold text-gray-800 bg-blue-50 px-4 py-2 rounded-lg tracking-wide">
            Welcome back, <span className="text-blue-600">{username}</span>
          </h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout