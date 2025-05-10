"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { useTmtData } from "../contexts/TmtContext"
import { useAuth } from "../contexts/AuthContext"
import Button from "../components/ui/Button"
import { useToast } from "../components/ui/Toaster"
import Header from "../components/Header"
import Skeleton from "../components/ui/Skeleton"
import Badge from "../components/ui/Badge"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../components/ui/Tabs"
import { Hammer, RefreshCw, Search } from "lucide-react"
import Input from "../components/ui/Input"

export default function ProductionHistoryPage() {
  const {
    productionRecords,
    getPendingProductionRecords,
    getCompletedProductionRecords,
    refreshData,
    isLoading: dataLoading,
  } = useTmtData()

  const { isAuthenticated, isLoading: authLoading, getUserBrand, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Only render after first mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Ensure the brand filter is applied correctly
  useEffect(() => {
    // Only run this effect if we're mounted and auth is not loading
    if (!isMounted || authLoading) return

    if (!isAuthenticated) {
      navigate("/")
      return
    }

    // Refresh data when component mounts
    refreshData()
  }, [isMounted, authLoading, isAuthenticated, navigate, refreshData])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refreshData()
      toast({
        title: "Data Refreshed",
        description: "Successfully refreshed TMT production records.",
      })
    } catch (error) {
      toast({
        title: "Error Refreshing Data",
        description: error.message || "Failed to refresh TMT production records.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // If not mounted yet or auth is loading, show a skeleton
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-12 w-48 mb-6" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null
  }

  // Get user's brand filter (if any)
  const brandFilter = getUserBrand()

  // Get all records filtered by brand
  const allRecords = productionRecords.filter((r) => !brandFilter || r.brandName === brandFilter)
  const pendingRecords = getPendingProductionRecords(brandFilter)
  const completedRecords = getCompletedProductionRecords(brandFilter)

  // Filter records based on search term
  const filteredRecords = {
    all: allRecords.filter(
      (r) =>
        r.heatNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobCard.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sizeOfTmt.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    pending: pendingRecords.filter(
      (r) =>
        r.heatNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobCard.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sizeOfTmt.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
    completed: completedRecords.filter(
      (r) =>
        r.heatNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.jobCard.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sizeOfTmt.toLowerCase().includes(searchTerm.toLowerCase()),
    ),
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <Hammer
                className={`mr-2 h-6 w-6 ${user?.brand === "JSW" ? "text-blue-600" : user?.brand === "Sarthak" ? "text-purple-600" : "text-slate-600"}`}
              />
              TMT Production History
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">View and search all TMT production records</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by heat number, job card, or size..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-slate-200 focus-visible:ring-slate-500"
            />
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList
            className={`${user?.brand === "JSW" ? "bg-blue-50 dark:bg-blue-900/20" : user?.brand === "Sarthak" ? "bg-purple-50 dark:bg-purple-900/20" : "bg-slate-100 dark:bg-slate-800"}`}
          >
            <TabsTrigger
              value="all"
              className={`data-[state=active]:${user?.brand === "JSW" ? "bg-blue-600" : user?.brand === "Sarthak" ? "bg-purple-600" : "bg-slate-700"} data-[state=active]:text-white`}
            >
              All Records
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className={`data-[state=active]:${user?.brand === "JSW" ? "bg-blue-600" : user?.brand === "Sarthak" ? "bg-purple-600" : "bg-slate-700"} data-[state=active]:text-white`}
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className={`data-[state=active]:${user?.brand === "JSW" ? "bg-blue-600" : user?.brand === "Sarthak" ? "bg-purple-600" : "bg-slate-700"} data-[state=active]:text-white`}
            >
              Completed
            </TabsTrigger>
          </TabsList>

          {["all", "pending", "completed"].map((tab) => (
            <TabsContent key={tab} value={tab} className="mt-4">
              <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
                <CardHeader
                  className={`${user?.brand === "JSW" ? "bg-blue-50 dark:bg-blue-900/20" : user?.brand === "Sarthak" ? "bg-purple-50 dark:bg-purple-900/20" : "bg-slate-100 dark:bg-slate-800"} rounded-t-lg`}
                >
                  <CardTitle className="text-slate-800 dark:text-slate-200">
                    {tab === "all"
                      ? "All TMT Production Records"
                      : tab === "pending"
                        ? "Pending TMT Production Records"
                        : "Completed TMT Production Records"}
                  </CardTitle>
                  <CardDescription className="text-slate-500 dark:text-slate-400">
                    {filteredRecords[tab].length} records found
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  {dataLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Job Card</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Heat No.</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Brand Name</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Size</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">CCM Pieces</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Time Range</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Hours</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Breakdown</th>
                            <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRecords[tab].map((record) => (
                            <tr
                              key={record.id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <td className="py-3 px-2">{record.jobCard}</td>
                              <td className="py-3 px-2">{record.heatNo}</td>
                              <td className="py-3 px-2">{record.brandName}</td>
                              <td className="py-3 px-2">
                                <Badge className={record.brandName === "JSW" ? "bg-blue-500" : "bg-purple-500"}>
                                  {record.sizeOfTmt}
                                </Badge>
                              </td>
                              <td className="py-3 px-2">{record.ccmTotalPieces}</td>
                              <td className="py-3 px-2">{record.timeRange}</td>
                              <td className="py-3 px-2">{record.hrs}</td>
                              <td className="py-3 px-2">
                                {record.breakDownTime > 0
                                  ? `${record.breakDownTime}h (${record.breakDownTimeGap})`
                                  : "None"}
                              </td>
                              <td className="py-3 px-2">
                                <Badge className={record.status === "completed" ? "bg-green-500" : "bg-amber-500"}>
                                  {record.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                          {filteredRecords[tab].length === 0 && (
                            <tr>
                              <td colSpan={9} className="py-4 text-center text-slate-500 dark:text-slate-400">
                                No records found
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
