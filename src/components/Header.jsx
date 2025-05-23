"use client"

import { useState, useEffect } from "react"
import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { Factory, LayoutDashboard, LogOut, User, ClipboardList, Hammer, PackageOpen } from "lucide-react"

function Header() {
  const location = useLocation()
  const { isAuthenticated, user, logout, isLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Only render after first mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  // Update the navigation links based on user role
  const getNavigationLinks = () => {
    const baseLinks = [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ]

    // Add TMT Planning only for full admin (admin user with username 'admin')
    if (user?.isFullAdmin) {
      baseLinks.push({
        name: "TMT Planning",
        href: "/tmt-planning",
        icon: <ClipboardList className="h-4 w-4" />,
      })
    }

    // Add remaining links for everyone
    baseLinks.push(
      {
        name: "Full Kitting",
        href: "/full-kitting",
        icon: <PackageOpen className="h-4 w-4" />,
      },
      {
        name: "TMT Production",
        href: "/tmt-production",
        icon: <Hammer className="h-4 w-4" />,
      }
    )

    return baseLinks
  }

  // If not mounted yet or loading, don't render anything
  if (!isMounted || isLoading || !isAuthenticated) {
    return null
  }

  const navigation = getNavigationLinks()

  return (
    <header className="px-4 sm:px-6 md:px-10 lg:px-20 top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center max-w-full">
        {/* Logo and Desktop Navigation */}
        <div className="hidden md:mr-4 md:flex md:flex-shrink-0">
          <Link to="/dashboard" className="mr-4 lg:mr-6 flex items-center space-x-2">
            <Factory className="h-6 w-6 text-purple-600" />
            <span className="hidden lg:inline-block font-bold">TMT Production System</span>
          </Link>
          <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-sm font-medium">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`transition-colors hover:text-foreground/80 ${
                  isActive(item.href)
                    ? "text-foreground font-semibold text-purple-600"
                    : "text-foreground/60"
                }`}
              >
                <div className="flex items-center gap-1">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Logo */}
        <div className="md:hidden flex-shrink-0">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Factory className="h-6 w-6 text-purple-600" />
            <span className="hidden xs:inline-block font-bold text-sm">TMT System</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center ml-auto">
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)} 
            className="p-2 text-slate-600 hover:text-slate-900"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMenuOpen ? <path d="M18 6L6 18M6 6l12 12" /> : <path d="M3 12h18M3 6h18M3 18h18" />}
            </svg>
          </button>
        </div>

        {/* Desktop Right Section */}
        <div className="hidden md:flex md:flex-1 md:items-center md:justify-end md:space-x-2">
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="relative h-8 w-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200"
            >
              <User className="h-4 w-4" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-slate-200 bg-white shadow-lg">
                <div className="p-3 border-b border-slate-100">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.displayName || user?.name}</p>
                    <p className="text-xs leading-none text-slate-500">{user?.username}</p>
                    {user?.userType && (
                      <p className="text-xs leading-none text-purple-600 font-medium">Role: {user.userType}</p>
                    )}
                  </div>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-14 bg-white border-b md:hidden">
            <div className="p-4">
              <nav className="flex flex-col space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 p-3 rounded-md ${
                      isActive(item.href)
                        ? "bg-slate-100 text-purple-600 font-semibold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>

              {/* Mobile User Menu */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex flex-col space-y-2">
                  <div className="p-3 bg-slate-50 rounded-md">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.displayName || user?.name}</p>
                      <p className="text-xs leading-none text-slate-500">{user?.username}</p>
                      {user?.userType && (
                        <p className="text-xs leading-none text-purple-600 font-medium">Role: {user.userType}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout()
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center gap-2 p-3 rounded-md text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header