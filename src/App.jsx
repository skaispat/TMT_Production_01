import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "../src/contexts/AuthContext"
import { TmtDataProvider } from "./contexts/TmtContext"
import LoginPage from "./pages/LoginPage"
import Dashboard from "./pages/Dashboard"
import TmtPlanningPage from "./pages/TmtPlanningPage"
import TmtProductionPage from "./pages/TmtProductionPage"
import PlanningHistoryPage from "./pages/PlanningHistoryPage"
import ProtectedRoute from "./components/ProtectedRoute"
import { Toaster } from "./components/ui/Toaster"
import "./index.css"
import KittingPending from "./pages/Fullkitting/Page"

function App() {
  return (
    <Router>
      <AuthProvider> {/* Ensure this wraps everything */}
        <TmtDataProvider>
          <div className="flex flex-col min-h-screen">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tmt-planning"
                  element={
                    <ProtectedRoute>
                      <TmtPlanningPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/full-kitting"
                  element={
                    <ProtectedRoute>
                      <KittingPending />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tmt-production"
                  element={
                    <ProtectedRoute>
                      <TmtProductionPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/planning-history"
                  element={
                    <ProtectedRoute>
                      <PlanningHistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Footer />
            <Toaster />
          </div>
        </TmtDataProvider>
      </AuthProvider>
    </Router>
  )
}

function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-700 py-4 bg-slate-50 dark:bg-slate-900">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Powered by -{" "}
          <a
            href="https://www.botivate.in/"
            target="_blank"
            rel="noreferrer"
            className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
          >
            Botivate
          </a>
        </p>
      </div>
    </footer>
  )
}

export default App