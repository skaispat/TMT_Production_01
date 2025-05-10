"use client"

import { useState, useEffect, createContext, useContext } from "react"

// Toast context
const ToastContext = createContext({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
})

// Toast component
function Toast({ id, title, description, variant = "default", onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, 5000)

    return () => clearTimeout(timer)
  }, [id, onClose])

  const variantClasses = {
    default: "bg-white border-slate-200",
    destructive: "bg-red-50 border-red-200 text-red-800",
  }

  return (
    <div className={`${variantClasses[variant]} rounded-lg border shadow-lg p-4 mb-3 flex items-start`} role="alert">
      <div className="flex-1">
        {title && <h5 className="font-medium mb-1">{title}</h5>}
        {description && <div className="text-sm text-slate-600">{description}</div>}
      </div>
      <button onClick={() => onClose(id)} className="ml-4 text-slate-400 hover:text-slate-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

// Toast provider
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const toast = ({ title, description, variant = "default" }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, title, description, variant }])
    return id
  }

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster />
    </ToastContext.Provider>
  )
}

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}

// Toaster component that displays toasts
export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-0 right-0 z-50 p-4 max-w-sm w-full">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onClose={dismiss}
        />
      ))}
    </div>
  )
}
