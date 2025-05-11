"use client"

import { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { useAuth } from "../contexts/AuthContext"
import Button from "../components/ui/Button"
import {
  RefreshCw,
  ClipboardList,
  Hammer,
  BarChart3,
  TrendingUp,
  Calendar,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import Badge from "../components/ui/Badge"
import Header from "../components/Header"
import Skeleton from "../components/ui/Skeleton"
import Progress from "../components/ui/Progress"

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const navigate = useNavigate()
  
  // State for storing dashboard data
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [dashboardData, setDashboardData] = useState({
    totalPlanningQty: 0,
    pendingPlanningRecords: 0,
    totalProductionQty: 0,
    completedProductionRecords: 0,
    totalPendingQty: 0,
    pendingPlanningCount: 0,
    pendingProductionCount: 0,
    brandDistribution: { JSW: 0, Sarthak: 0 },
    planningVsProduction: { planning: 0, production: 0 },
    topSizes: [],
    recentRecords: []
  })

  // Google Sheets configuration
  const SHEET_ID = "1TjJufd9uDojTHK9cYogTgaBQQEqfo1x8aJ9SJ9zbR6s"
  const SHEET_NAME = "PRODUCTION"

  // Only render after first mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const formatDate = (dateValue) => {
    if (!dateValue) return ""

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,4,16)")
      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        // Extract the parts from Date(YYYY,MM,DD) format
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const [year, month, day] = dateString.split(",").map((part) => Number.parseInt(part.trim()))

        // JavaScript months are 0-indexed, but we need to display them as 1-indexed
        return `${day.toString().padStart(2, "0")}/${(month + 1).toString().padStart(2, "0")}/${year}`
      }

      // Handle other date formats if needed
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`
      }

      // If it's already in the correct format, return as is
      return dateValue
    } catch (error) {
      console.error("Error formatting date:", error)
      return dateValue // Return the original value if formatting fails
    }
  }

  // Fetch data from Google Sheets
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`
      const response = await fetch(url)
      const text = await response.text()
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}") + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      const data = JSON.parse(jsonData)
      
      if (data && data.table && data.table.rows) {
        let totalPlanningQty = 0
        let pendingPlanningRecords = 0
        let totalProductionQty = 0
        let completedProductionRecords = 0
        let totalPendingQty = 0
        let pendingPlanningCount = 0
        let pendingProductionCount = 0
        const brandDistribution = { JSW: 0, Sarthak: 0 }
        const sizeDistribution = {}
        const recentRecords = []
        
        data.table.rows.forEach((row, index) => {
          if (row.c && row.c[1]?.v) { // Check if Heat No exists (Column B)
            const brandName = row.c[3]?.v || '' // Column D - Brand Name
            
            // Apply user filter
            let shouldInclude = true
            if (!user?.isAdmin) {
              // Regular user - only show records where brand name matches username
              shouldInclude = brandName.toLowerCase() === (user?.username || '').toLowerCase()
            }
            
            if (shouldInclude) {
              // Total Planning Qty - Column AB
              const planningQty = parseInt(row.c[27]?.v || 0) // Column AB is index 27
              totalPlanningQty += planningQty
              
              // Pending Planning Records - Column AG not null and Column AH is null
              const columnAG = row.c[32]?.v
              const columnAH = row.c[33]?.v
              const isPendingPlanning = columnAG !== null && columnAG !== "" && 
                                      (columnAH === null || columnAH === "")
              if (isPendingPlanning) {
                pendingPlanningRecords++
              }
              
              // Total Production Qty - Column AD
              const productionQty = parseInt(row.c[29]?.v || 0) // Column AD is index 29
              totalProductionQty += productionQty
              
              // Completed Production Records - Column AJ and AK not null
              const columnAJ = row.c[35]?.v // Column AJ is index 35
              const columnAK = row.c[36]?.v // Column AK is index 36
              const isCompletedProduction = columnAJ !== null && columnAJ !== "" && 
                                          columnAK !== null && columnAK !== ""
              if (isCompletedProduction) {
                completedProductionRecords++
              }
              
              // Total Pending Qty - Column AE
              const pendingQty = parseInt(row.c[30]?.v || 0) // Column AE is index 30
              totalPendingQty += pendingQty
              
              // Pending Planning Count - Column AJ not null and AH is null
              const isPendingPlanningCount = columnAJ !== null && columnAJ !== "" && 
                                           (columnAH === null || columnAH === "")
              if (isPendingPlanningCount) {
                pendingPlanningCount++
              }
              
              // Pending Production Count - Column AJ not null and AK is null
              const isPendingProductionCount = columnAJ !== null && columnAJ !== "" && 
                                             (columnAK === null || columnAK === "")
              if (isPendingProductionCount) {
                pendingProductionCount++
              }
              
              // Brand Distribution
              if (brandName === "JSW") {
                brandDistribution.JSW++
              } else if (brandName === "Sarthak") {
                brandDistribution.Sarthak++
              }
              
              // Collect sizes (Columns H,J,L,N,P,R,T,V,X,Z)
              const sizeColumns = [7,9,11,13,15,17,19,21,23,25] // These are the indices for columns H,J,L,N,P,R,T,V,X,Z
              sizeColumns.forEach(colIndex => {
                const size = row.c[colIndex]?.v
                if (size) {
                  sizeDistribution[size] = (sizeDistribution[size] || 0) + 1
                }
              })
              
              // Collect recent records
              const record = {
                id: index.toString(),
                heatNo: row.c[1]?.v || '', // Column B
                personName: row.c[2]?.v || '', // Column C
                brandName: brandName, // Column D
                supervisorName: row.c[4]?.v || '', // Column E
                dateOfProduction: formatDate(row.c[5]?.v) || '', // Column F
                remarks: row.c[6]?.v || '', // Column G
                sizes: [],
                totalQty: planningQty,
                productionQty: productionQty,
                pendingQty: pendingQty,
                status: isCompletedProduction ? "Completed" : isPendingProductionCount ? "Pending" : "In Progress"
              }
              
              // Add sizes to record
              sizeColumns.forEach(colIndex => {
                const size = row.c[colIndex]?.v
                if (size) {
                  record.sizes.push(size)
                }
              })
              
              recentRecords.push(record)
            }
          }
        })
        
        // Calculate completion rate
        const completionRate = totalPlanningQty > 0 ? (totalProductionQty / totalPlanningQty) * 100 : 0
        
        // Get top sizes
        const topSizes = Object.entries(sizeDistribution)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
        
        // Sort recent records by date and get latest 5
        const sortedRecentRecords = recentRecords
          .sort((a, b) => new Date(b.dateOfProduction).getTime() - new Date(a.dateOfProduction).getTime())
          .slice(0, 5)
        
        setDashboardData({
          totalPlanningQty,
          pendingPlanningRecords,
          totalProductionQty,
          completedProductionRecords,
          totalPendingQty,
          pendingPlanningCount,
          pendingProductionCount,
          completionRate,
          brandDistribution,
          planningVsProduction: {
            planning: totalPlanningQty,
            production: totalProductionQty
          },
          topSizes,
          recentRecords: sortedRecentRecords
        })
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [SHEET_ID, SHEET_NAME, user])

  useEffect(() => {
    // Only run this effect if we're mounted and auth is not loading
    if (!isMounted || authLoading) return

    if (!isAuthenticated) {
      navigate("/")
      return
    }

    fetchDashboardData()
  }, [isMounted, authLoading, isAuthenticated, navigate, fetchDashboardData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardData()
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }

  // If not mounted yet or auth is loading, show a skeleton
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header />
        <div className="container mx-auto py-6 px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-80 w-full" />
            <Skeleton className="h-80 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null
  }

  const canAccessAllBrands = user?.isAdmin
  const { 
    totalPlanningQty, 
    pendingPlanningRecords, 
    totalProductionQty, 
    completedProductionRecords,
    totalPendingQty,
    pendingPlanningCount,
    pendingProductionCount,
    completionRate,
    brandDistribution,
    planningVsProduction,
    topSizes,
    recentRecords
  } = dashboardData

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">TMT Production Dashboard</h1>
            <p className="text-slate-600 mt-1">
              {user?.isAdmin ? "All Brands" : `${user?.username || ''} Brand`} - Monitor and analyze your TMT production records
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-slate-200 text-slate-700 hover:bg-slate-100"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Planning Qty</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <div className="text-2xl font-bold text-slate-800">{totalPlanningQty}</div>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-slate-100">
                  <ClipboardList className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                <TrendingUp className="inline h-4 w-4 mr-1 text-green-500" />
                <span className="text-green-500 font-medium">{pendingPlanningRecords}</span> pending records
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Total Production</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <div className="text-2xl font-bold text-slate-800">{totalProductionQty}</div>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-slate-100">
                  <Hammer className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-500">
                <CheckCircle2 className="inline h-4 w-4 mr-1 text-green-500" />
                <span className="text-green-500 font-medium">{completedProductionRecords}</span> completed records
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <div className="text-2xl font-bold text-slate-800">
                      {completionRate?.toFixed(1)}%
                    </div>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-slate-100">
                  <BarChart3 className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-2">
                <Progress
                  value={completionRate}
                  className="h-2 bg-slate-100 "
                  indicatorClassName="bg-green-500"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200  shadow-sm">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500 ">Total Pending Qty</p>
                  {isLoading ? (
                    <Skeleton className="h-8 w-24 mt-1" />
                  ) : (
                    <div className="text-2xl font-bold text-slate-800 ">{totalPendingQty}</div>
                  )}
                </div>
                <div className="p-2 rounded-lg bg-slate-100 ">
                  <AlertCircle className="h-6 w-6 text-slate-600 " />
                </div>
              </div>
              <div className="mt-2 text-sm text-slate-500 ">
                <Calendar className="inline h-4 w-4 mr-1 text-amber-500" />
                <span className="text-amber-500 font-medium">{pendingPlanningCount}</span> planning,
                <span className="text-amber-500 font-medium ml-1">{pendingProductionCount}</span> production
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Section */}
        <Card className="border-slate-200  shadow-sm mb-6">
          <CardHeader className="bg-slate-100  rounded-t-lg">
            <CardTitle className="text-slate-800 ">Production Analytics</CardTitle>
            <CardDescription className="text-slate-500 ">
              Overview of production metrics and performance
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Show brand distribution for admin only */}
              {canAccessAllBrands && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500  mb-2">Brand Distribution</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">JSW</span>
                        <span className="text-sm font-medium">{brandDistribution.JSW}</span>
                      </div>
                      <Progress
                        value={(brandDistribution.JSW + brandDistribution.Sarthak) > 0 ? 
                              (brandDistribution.JSW / (brandDistribution.JSW + brandDistribution.Sarthak)) * 100 : 0}
                        className="h-2 bg-slate-100 "
                        indicatorClassName="bg-blue-500"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium">Sarthak</span>
                        <span className="text-sm font-medium">{brandDistribution.Sarthak}</span>
                      </div>
                      <Progress
                        value={(brandDistribution.JSW + brandDistribution.Sarthak) > 0 ? 
                              (brandDistribution.Sarthak / (brandDistribution.JSW + brandDistribution.Sarthak)) * 100 : 0}
                        className="h-2 bg-slate-100 "
                        indicatorClassName="bg-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-slate-500  mb-2">Planning vs Production</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Planning</span>
                      <span className="text-sm font-medium">{planningVsProduction.planning}</span>
                    </div>
                    <Progress
                      value={100}
                      className="h-2 bg-slate-100 "
                      indicatorClassName="bg-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Production</span>
                      <span className="text-sm font-medium">{planningVsProduction.production}</span>
                    </div>
                    <Progress
                      value={planningVsProduction.planning > 0 ? 
                            (planningVsProduction.production / planningVsProduction.planning) * 100 : 0}
                      className="h-2 bg-slate-100 "
                      indicatorClassName="bg-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500  mb-2">Top Sizes by Quantity</h3>
                <div className="space-y-2">
                  {topSizes.map(([size, quantity], index) => (
                    <div key={size} className="flex items-center gap-2">
                      <Badge className={index === 0 ? "bg-slate-500" : index === 1 ? "bg-slate-400" : "bg-slate-300"}>
                        {size}
                      </Badge>
                      <Progress
                        value={100}
                        className="h-2 flex-1 bg-slate-100 "
                        indicatorClassName={index === 0 ? "bg-slate-500" : index === 1 ? "bg-slate-400" : "bg-slate-300"}
                      />
                      <span className="text-sm font-medium">{quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Production Data Table */}
        <Card className="border-slate-200  shadow-sm mt-6">
          <CardHeader className="bg-slate-100  rounded-t-lg">
            <CardTitle className="text-slate-800 ">Production Data</CardTitle>
            <CardDescription className="text-slate-500 ">
              Comprehensive view of planning and production data
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 ">
                      <th className="text-left py-3 px-2 text-slate-600 ">Heat No.</th>
                      <th className="text-left py-3 px-2 text-slate-600 ">Brand Name</th>
                      <th className="text-left py-3 px-2 text-slate-600 ">Sizes</th>
                      <th className="text-left py-3 px-2 text-slate-600 ">Total Planning Qty</th>
                      <th className="text-left py-3 px-2 text-slate-600 ">Total Production Qty</th>
                      <th className="text-left py-3 px-2 text-slate-600 ">Total Pending Qty</th>
                      <th className="text-left py-3 px-2 text-slate-600 ">Date</th>
                      <th className="text-left py-3 px-2 text-slate-600 ">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecords.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-slate-200  hover:bg-slate-50"
                      >
                        <td className="py-3 px-2">{record.heatNo}</td>
                        <td className="py-3 px-2">{record.brandName}</td>
                        <td className="py-3 px-2">
                          <div className="flex flex-wrap gap-1">
                            {record.sizes.map((size, index) => (
                              <Badge
                                key={index}
                                className={record.brandName === "JSW" ? "bg-blue-500" : "bg-purple-500"}
                              >
                                {size}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-2">{record.totalQty}</td>
                        <td className="py-3 px-2">{record.productionQty}</td>
                        <td className="py-3 px-2">{record.pendingQty}</td>
                        <td className="py-3 px-2">{record.dateOfProduction}</td>
                        <td className="py-3 px-2">
                          <Badge 
                            className={
                              record.status === "Completed" ? "bg-green-500" : 
                              record.status === "Pending" ? "bg-amber-500" : 
                              "bg-blue-500"
                            }
                          >
                            {record.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {recentRecords.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-slate-500 ">
                          No production data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}