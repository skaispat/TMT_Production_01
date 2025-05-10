import { useState, useEffect, useCallback } from "react"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../../components/ui/tabs"
import { PackageOpen, RefreshCw } from 'lucide-react'
import PendingRecords from "./Pending"
import HistoryRecords from "./History"
import Header from "../../components/Header"

export default function FullKittingPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [refreshing, setRefreshing] = useState(false)
  const [toastMessage, setToastMessage] = useState(null)

  // Simple toast function
  const showToast = (title, message, type = "success") => {
    setToastMessage({ title, message, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // Mock functions - replace with your actual data fetching logic
  const refreshData = useCallback(async () => {
    setRefreshing(true)
    try {
      // Replace with your actual data refresh logic
      await new Promise((resolve) => setTimeout(resolve, 1000))
      showToast("Data Refreshed", "Successfully refreshed TMT planning records.")
    } catch (error) {
      showToast("Error Refreshing Data", error.message || "Failed to refresh TMT planning records.", "error")
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Only render after first mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Ensure the brand filter is applied correctly
  useEffect(() => {
    // Only run this effect if we're mounted
    if (!isMounted) return

    // Refresh data when component mounts
    refreshData()
  }, [isMounted, refreshData])

  // If not mounted yet, show a loading state
  if (!isMounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header/>
      {/* Simple toast notification */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-md shadow-md ${
          toastMessage.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          <h4 className="font-bold">{toastMessage.title}</h4>
          <p>{toastMessage.message}</p>
        </div>
      )}

      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <PackageOpen className="mr-2 h-6 w-6" />
              Full Kitting Section
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Manage TMT planning records and sync them to Google Sheets
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 h-10 px-4 py-2"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-100 dark:bg-slate-800">
            <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Pending
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            <PendingRecords showToast={showToast} />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <HistoryRecords />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
