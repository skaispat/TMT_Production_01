"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/Card"
import { useTmtData } from "../contexts/TmtContext"
import { useAuth } from "../contexts/AuthContext"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Label from "../components/ui/Label"
import Textarea from "../components/ui/Textarea"
import { useToast } from "../components/ui/Toaster"
import Header from "../components/Header"
import Skeleton from "../components/ui/Skeleton"
import Badge from "../components/ui/Badge"
import { Tabs, TabsList, TabsContent, TabsTrigger } from "../components/ui/Tabs"
import { Hammer, RefreshCw, Plus, Trash2, Package } from "lucide-react"

export default function TmtProductionPage() {
  const { refreshData } = useTmtData()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [isMounted, setIsMounted] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [refreshing, setRefreshing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [pendingRecords, setPendingRecords] = useState([])
  const [completedRecords, setCompletedRecords] = useState([])

  // Popup form state
  const [showPopup, setShowPopup] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [productionForm, setProductionForm] = useState({
    timeRange: "",
    hours: "",
    breakDownTime: "",
    breakDownTimeGap: "",
    productionItems: [{ sizeOfTmt: "", pieceQty: "", mtQty: "" }],
    remark: "",
  })

  // Google Apps Script URL
  const APPS_SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyJ5saA255yPCq_yb2p8LfVJH7CX2h6hOJ4hDHQAw8TjrTqe4KpffjWlG0Sx5rA3krIDQ/exec"
  const SHEET_ID = "1TjJufd9uDojTHK9cYogTgaBQQEqfo1x8aJ9SJ9zbR6s"
  const PRODUCTION_SHEET_NAME = "PRODUCTION"
  const ACTUAL_PRODUCTION_SHEET_NAME = "Actual Production"

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

    // Fetch data when component mounts
    fetchData()
  }, [isMounted, authLoading, isAuthenticated, navigate])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch pending records from PRODUCTION sheet
      const productionUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${PRODUCTION_SHEET_NAME}`
      const productionResponse = await fetch(productionUrl)
      const productionCsvData = await productionResponse.text()

      // Fetch history records from Actual Production sheet
      const historyUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${ACTUAL_PRODUCTION_SHEET_NAME}`
      const historyResponse = await fetch(historyUrl)
      const historyCsvData = await historyResponse.text()

      // Parse CSV for pending records
      const productionRows = productionCsvData
        .split("\n")
        .map((row) => row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")))

      // Parse CSV for history records
      const historyRows = historyCsvData
        .split("\n")
        .map((row) => row.split(",").map((cell) => cell.trim().replace(/^"|"$/g, "")))

      // Debug: Log user information
      console.log("Current User:", user);
      console.log("User Type:", user?.userType);
      console.log("Is Admin:", user?.isAdmin);
      console.log("Is Full Admin:", user?.isFullAdmin);
      console.log("Is Limited Admin:", user?.isLimitedAdmin);
      console.log("Username:", user?.username);

      // Process pending records - where AJ is not null and AK is null
      const pendingData = []
      for (let i = 1; i < productionRows.length; i++) {
        const row = productionRows[i]
        if (row[35] && !row[36]) {
          // AJ is not null and AK is null
          const brandName = row[3] // Column D (Brand Name)
          
          // Filter based on user role
          let shouldInclude = false
          if (user?.isAdmin) {
            shouldInclude = true // Admin sees all records
          } else {
            // Regular user only sees records where brand name matches username
            shouldInclude = brandName && user?.username && 
                    brandName.toLowerCase() === user?.username?.toLowerCase()
          }
          
          // Debug logging
          console.log(`Pending Row ${i + 1}:`, {
            heatNo: row[1],
            brandName: brandName,
            brandNameLower: brandName?.toLowerCase(),
            userUsername: user?.username,
            userUsernameLower: user?.username?.toLowerCase(),
            userIsAdmin: user?.isAdmin,
            shouldInclude
          });
          
          if (shouldInclude) {
            // Get sizes from columns H,J,L,N,P,R,T,V,X,Z (indices 7,9,11,13,15,17,19,21,23,25)
            const sizeColumns = [7, 9, 11, 13, 15, 17, 19, 21, 23, 25]
            const sizes = sizeColumns
              .map((colIndex) => row[colIndex])
              .filter((size) => size)
              .join(", ")

            pendingData.push({
              id: `${row[1]}-${i}`,
              heatNo: row[1], // Column B
              brandName: brandName,
              sizeOfTmt: sizes,
              planningQty: row[27], // Column AB
              productionQty: row[29], // Column AD
              pendingQty: row[30], // Column AE
            })
          }
        }
      }

      // Process history records
      const historyData = []
      for (let i = 1; i < historyRows.length; i++) {
        const row = historyRows[i]
        if (row[1]) {
          // If Heat No. exists
          const brandName = row[2] // Column C (Brand Name)
          
          // Filter based on user role
          let shouldInclude = false
          if (user?.isAdmin) {
            shouldInclude = true // Admin sees all records
          } else {
            // Regular user only sees records where brand name matches username
            shouldInclude = brandName && user?.username && 
                    brandName.toLowerCase() === user?.username?.toLowerCase()
          }
          
          // Debug logging
          console.log(`History Row ${i + 1}:`, {
            heatNo: row[1],
            brandName: brandName,
            brandNameLower: brandName?.toLowerCase(),
            userUsername: user?.username,
            userUsernameLower: user?.username?.toLowerCase(),
            userIsAdmin: user?.isAdmin,
            shouldInclude
          });
          
          if (shouldInclude) {
            // Get all sizes from columns I,L,O,R,U,V,X,AA,AD,AG,AJ (indices 8,11,14,17,20,21,23,26,29,32,35)
            const sizeColumns = [8, 11, 14, 17, 20, 23, 26, 29, 32, 34]
            const sizes = sizeColumns
              .map((colIndex) => row[colIndex])
              .filter((size) => size)
              .join(", ")

            historyData.push({
              id: `history-${row[1]}-${i}`,
              heatNo: row[1], // Column B
              brandName: brandName,
              timeRange: row[4], // Column E
              hours: row[5], // Column F
              breakDownTime: row[6], // Column G
              breakDownTimeGap: row[7], // Column H
              sizeOfTmt: sizes,
            })
          }
        }
      }

      console.log("Final pending records:", pendingData);
      console.log("Final history records:", historyData);
      setPendingRecords(pendingData)
      setCompletedRecords(historyData)
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch data from Google Sheets",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchData()
    setTimeout(() => {
      setRefreshing(false)
    }, 500)
  }

  const openProductionForm = (record) => {
    setSelectedRecord(record)
    setProductionForm({
      timeRange: "",
      hours: "",
      breakDownTime: "",
      breakDownTimeGap: "",
      productionItems: [{ sizeOfTmt: "", pieceQty: "", mtQty: "" }],
      remark: "",
    })
    setShowPopup(true)
  }

  const closeProductionForm = () => {
    setShowPopup(false)
    setSelectedRecord(null)
  }

  const handleProductionFormChange = (e) => {
    const { name, value } = e.target
    setProductionForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleProductionItemChange = (index, field, value) => {
    const newItems = [...productionForm.productionItems]
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    }
    setProductionForm((prev) => ({
      ...prev,
      productionItems: newItems,
    }))
  }

  const addProductionItem = () => {
    if (productionForm.productionItems.length < 10) {
      setProductionForm((prev) => ({
        ...prev,
        productionItems: [...prev.productionItems, { sizeOfTmt: "", pieceQty: "", mtQty: "" }],
      }))
    }
  }

  const removeProductionItem = (index) => {
    if (productionForm.productionItems.length > 1) {
      const newItems = [...productionForm.productionItems]
      newItems.splice(index, 1)
      setProductionForm((prev) => ({
        ...prev,
        productionItems: newItems,
      }))
    }
  }

  const handleSubmitProduction = async (e) => {
    e.preventDefault()

    // Validate required fields
    if (!productionForm.timeRange) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Time Range is required.",
      })
      return
    }

    try {
      // Format timestamp as DD/MM/YYYY hh:mm:ss
      const now = new Date()
      const day = String(now.getDate()).padStart(2, "0")
      const month = String(now.getMonth() + 1).padStart(2, "0")
      const year = now.getFullYear()
      const hours = String(now.getHours()).padStart(2, "0")
      const minutes = String(now.getMinutes()).padStart(2, "0")
      const seconds = String(now.getSeconds()).padStart(2, "0")
      const timestamp = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`

      // Prepare row data according to column mapping for Actual Production sheet
      const rowData = Array(41).fill("") // Initialize array with 41 empty strings (columns A to AO)

      // Fill in the data according to the specified column mapping
      rowData[0] = timestamp // Column A - Timestamp
      rowData[1] = selectedRecord.heatNo // Column B - Heat No.
      rowData[2] = selectedRecord.brandName // Column C - Brand Name
      rowData[3] = productionForm.timeRange // Column D - Time Range
      rowData[4] = productionForm.hours || "" // Column E - Hours
      rowData[5] = productionForm.breakDownTime || "" // Column F - Break Down Time
      rowData[6] = productionForm.breakDownTimeGap || "" // Column G - Break Down Time Gap

      // Add production items (up to 10) with correct column mapping
      for (let i = 0; i < productionForm.productionItems.length && i < 10; i++) {
        const item = productionForm.productionItems[i]
        const baseIndex = 7 + i * 3 // Starting from column H (index 7) and each item takes 3 columns

        // Map to the correct columns based on item index
        if (i === 0) {
          rowData[7] = item.sizeOfTmt || "" // Column H - Size of TMT 1
          rowData[8] = item.pieceQty || "" // Column I - Piece Qty 1
          rowData[9] = item.mtQty || "" // Column J - MT Qty 1
        } else if (i === 1) {
          rowData[10] = item.sizeOfTmt || "" // Column K - Size of TMT 2
          rowData[11] = item.pieceQty || "" // Column L - Piece Qty 2
          rowData[12] = item.mtQty || "" // Column M - MT Qty 2
        } else if (i === 2) {
          rowData[13] = item.sizeOfTmt || "" // Column N - Size of TMT 3
          rowData[14] = item.pieceQty || "" // Column O - Piece Qty 3
          rowData[15] = item.mtQty || "" // Column P - MT Qty 3
        } else if (i === 3) {
          rowData[16] = item.sizeOfTmt || "" // Column Q - Size of TMT 4
          rowData[17] = item.pieceQty || "" // Column R - Piece Qty 4
          rowData[18] = item.mtQty || "" // Column S - MT Qty 4
        } else if (i === 4) {
          rowData[19] = item.sizeOfTmt || "" // Column T - Size of TMT 5
          rowData[20] = item.pieceQty || "" // Column U - Piece Qty 5
          rowData[21] = item.mtQty || "" // Column V - MT Qty 5
        } else if (i === 5) {
          rowData[22] = item.sizeOfTmt || "" // Column W - Size of TMT 6
          rowData[23] = item.pieceQty || "" // Column X - Piece Qty 6
          rowData[24] = item.mtQty || "" // Column Y - MT Qty 6
        } else if (i === 6) {
          rowData[25] = item.sizeOfTmt || "" // Column Z - Size of TMT 7
          rowData[26] = item.pieceQty || "" // Column AA - Piece Qty 7
          rowData[27] = item.mtQty || "" // Column AB - MT Qty 7
        } else if (i === 7) {
          rowData[28] = item.sizeOfTmt || "" // Column AC - Size of TMT 8
          rowData[29] = item.pieceQty || "" // Column AD - Piece Qty 8
          rowData[30] = item.mtQty || "" // Column AE - MT Qty 8
        } else if (i === 8) {
          rowData[31] = item.sizeOfTmt || "" // Column AF - Size of TMT 9
          rowData[32] = item.pieceQty || "" // Column AG - Piece Qty 9
          rowData[33] = item.mtQty || "" // Column AH - MT Qty 9
        } else if (i === 9) {
          rowData[34] = item.sizeOfTmt || "" // Column AI - Size of TMT 10
          rowData[35] = item.pieceQty || "" // Column AJ - Piece Qty 10
          rowData[36] = item.mtQty || "" // Column AK - MT Qty 10
        }
      }

      // Add remarks
      rowData[37] = productionForm.remark || "" // Column AL - Remarks

      // Submit to Google Apps Script for Actual Production sheet
      const formPayload = new FormData()
      formPayload.append("sheetName", ACTUAL_PRODUCTION_SHEET_NAME)
      formPayload.append("action", "insert")
      formPayload.append("rowData", JSON.stringify(rowData))

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: formPayload,
        mode: "no-cors", // Required for Google Apps Script
      })

      // Also update the timestamp in PRODUCTION sheet for the matching Heat No.
      const updateProductionPayload = new FormData()
      updateProductionPayload.append("sheetName", PRODUCTION_SHEET_NAME)
      updateProductionPayload.append("action", "updateTimestamp")
      updateProductionPayload.append("heatNo", selectedRecord.heatNo)
      updateProductionPayload.append("timestamp", timestamp)
      updateProductionPayload.append("columnIndex", "AK") // Column AK in PRODUCTION sheet

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        body: updateProductionPayload,
        mode: "no-cors", // Required for Google Apps Script
      })

      toast({
        title: "Production Record Submitted",
        description: `Production data for ${selectedRecord?.heatNo} has been submitted successfully.`,
      })

      closeProductionForm()

      // Refresh data after successful submission
      setTimeout(() => {
        fetchData()
      }, 1000)
    } catch (error) {
      console.error("Error submitting production data:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit production data. Please try again.",
      })
    }
  }

  // If not mounted yet or auth is loading, show a skeleton
  if (!isMounted || authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <Header />
        <div className="container mx-auto py-6 px-4 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <Skeleton className="h-12 w-48 mb-8" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </div>
    )
  }

  // If not authenticated, don't render anything (will redirect)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <Header />

      <div className="container mx-auto py-6 px-4 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-200 flex items-center">
              <Hammer className="mr-3 h-6 w-6 md:h-8 md:w-8" />
              TMT Production {user?.isAdmin ? "(All Brands)" : `(${user?.username || ''})`}
            </h1>
            <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-2">
              {user?.isAdmin ? 
                "Manage TMT production records for all brands" :
                "Manage your TMT production records"
              }
            </p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="flex-1 md:flex-initial border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              disabled={refreshing}
            >
              <RefreshCw className={`h-5 w-5 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-slate-100 dark:bg-slate-800 w-full md:w-auto">
            <TabsTrigger
              value="pending"
              className="flex-1 md:flex-initial data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              Pending
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="flex-1 md:flex-initial data-[state=active]:bg-slate-700 data-[state=active]:text-white"
            >
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
                <CardTitle className="text-lg md:text-xl text-slate-800 dark:text-slate-200">
                  {user?.isAdmin ? "All Pending TMT Production Records" : `My Pending TMT Production Records (${user?.username || ''})`}
                </CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  {user?.isAdmin ? 
                    "All records that are in progress" :
                    "Your records that are in progress"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 overflow-x-auto">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden">
                      {pendingRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-4 mb-4 bg-white dark:bg-slate-800">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium text-slate-800 dark:text-slate-200">{record.heatNo}</h3>
                              <p className="text-sm text-slate-600 dark:text-slate-400">{record.brandName}</p>
                            </div>
                            {/* Only show Production button for full admin */}
                            {user?.isFullAdmin && (
                              <Button
                                className="h-9 px-4 text-xs border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                variant="outline"
                                onClick={() => openProductionForm(record)}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Production
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Size</p>
                              <p className="text-sm text-slate-800 dark:text-slate-200">{record.sizeOfTmt}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Pending Qty</p>
                              <p className="text-sm text-slate-800 dark:text-slate-200">{record.pendingQty || "N/A"}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Heat No.</th>
                            <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Brand Name</th>
                            <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Size</th>
                            <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">
                              Total Planning Qty
                            </th>
                            <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">
                              Total Production Qty
                            </th>
                            <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">
                              Total Pending Qty
                            </th>
                            {/* Only show Actions column for full admin */}
                            {user?.isFullAdmin && (
                              <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {pendingRecords.map((record) => (
                            <tr
                              key={record.id}
                              className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            >
                              <td className="py-4 px-4">{record.heatNo}</td>
                              <td className="py-4 px-4">{record.brandName}</td>
                              <td className="py-4 px-4">{record.sizeOfTmt}</td>
                              <td className="py-4 px-4">{record.planningQty || "N/A"}</td>
                              <td className="py-4 px-4">{record.productionQty || "N/A"}</td>
                              <td className="py-4 px-4">{record.pendingQty || "N/A"}</td>
                              {/* Only show Actions column for full admin */}
                              {user?.isFullAdmin && (
                                <td className="py-4 px-4">
                                  <Button
                                    className="h-10 rounded-md px-4 text-sm border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                    variant="outline"
                                    onClick={() => openProductionForm(record)}
                                  >
                                    <Package className="h-5 w-5 mr-2" />
                                    Production
                                  </Button>
                                </td>
                              )}
                            </tr>
                          ))}
                          {pendingRecords.length === 0 && (
                            <tr>
                              <td colSpan={user?.isFullAdmin ? 7 : 6} className="py-4 text-center text-slate-500 dark:text-slate-400">
                                {user?.isAdmin ? 
                                  "No pending records found" : 
                                  `No pending records found for brand: ${user?.username || ''}`}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="border-slate-200 dark:border-slate-700 shadow-sm">
              <CardHeader className="bg-slate-100 dark:bg-slate-800 rounded-t-lg">
                <CardTitle className="text-lg md:text-xl text-slate-800 dark:text-slate-200">
                  {user?.isAdmin ? "All TMT Production History" : `My TMT Production History (${user?.username || ''})`}
                </CardTitle>
                <CardDescription className="text-sm text-slate-500 dark:text-slate-400">
                  {user?.isAdmin ? 
                    "All records that have been completed" :
                    "Your records that have been completed"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 overflow-x-auto">
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Mobile Card View */}
                    <div className="md:hidden">
                      {completedRecords.map((record) => (
                        <div key={record.id} className="border rounded-lg p-4 mb-4 bg-white dark:bg-slate-800">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-medium text-slate-800 dark:text-slate-200">{record.heatNo}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">{record.brandName}</p>
                          </div>
                          <Badge className={record.brandName === "JSW" ? "bg-blue-500" : "bg-purple-500"}>
                            {record.timeRange || "N/A"}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Total Size</p>
                            <p className="text-sm text-slate-800 dark:text-slate-200">{record.sizeOfTmt}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Hours</p>
                            <p className="text-sm text-slate-800 dark:text-slate-200">{record.hours || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Heat No.</th>
                          <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Brand Name</th>
                          <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Time Range</th>
                          <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Hours</th>
                          <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Break Down Time</th>
                          <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">
                            Break Down Time Gap
                          </th>
                          <th className="text-left py-4 px-4 text-slate-600 dark:text-slate-400">Total Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {completedRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          >
                            <td className="py-4 px-4">{record.heatNo}</td>
                            <td className="py-4 px-4">{record.brandName}</td>
                            <td className="py-4 px-4">{record.timeRange || "N/A"}</td>
                            <td className="py-4 px-4">{record.hours || "N/A"}</td>
                            <td className="py-4 px-4">{record.breakDownTime || "N/A"}</td>
                            <td className="py-4 px-4">{record.breakDownTimeGap || "N/A"}</td>
                            <td className="py-4 px-4">{record.sizeOfTmt}</td>
                          </tr>
                        ))}
                        {completedRecords.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-4 text-center text-slate-500 dark:text-slate-400">
                              {user?.isAdmin ? 
                                "No completed records found" : 
                                `No completed records found for brand: ${user?.username || ''}`}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>

    {/* Production Form Popup */}
    {showPopup && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop with blur */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeProductionForm}></div>

        {/* Popup Form */}
        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-[95vw] md:max-w-3xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSubmitProduction} className="p-6 md:p-10">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-200">New TMT Production</h2>
              <button
                type="button"
                onClick={closeProductionForm}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Pre-filled data */}
            <div className="mb-10">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4">Current Record Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-700 p-6 rounded-lg">
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Heat No.</Label>
                  <Input
                    value={selectedRecord?.heatNo || ""}
                    disabled
                    className="mt-1 bg-slate-100 dark:bg-slate-600 font-medium"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Brand Name</Label>
                  <Input
                    value={selectedRecord?.brandName || ""}
                    disabled
                    className="mt-1 bg-slate-100 dark:bg-slate-600 font-medium"
                  />
                </div>
                <div>
                  <Label className="text-sm text-slate-600 dark:text-slate-400">Sizes</Label>
                  <Input
                    value={selectedRecord?.sizeOfTmt || ""}
                    disabled
                    className="mt-1 bg-slate-100 dark:bg-slate-600 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* New Production Fields */}
            <div className="mb-10">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-6">Production Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <Label htmlFor="timeRange" className="text-sm font-medium">
                    Time Range <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="timeRange"
                    name="timeRange"
                    value={productionForm.timeRange}
                    onChange={handleProductionFormChange}
                    placeholder="e.g., 08:00 - 16:00"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="hours" className="text-sm font-medium">
                    Hours
                  </Label>
                  <Input
                    id="hours"
                    name="hours"
                    type="number"
                    value={productionForm.hours}
                    onChange={handleProductionFormChange}
                    placeholder="Enter total hours"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="breakDownTime" className="text-sm font-medium">
                    Break Down Time
                  </Label>
                  <Input
                    id="breakDownTime"
                    name="breakDownTime"
                    value={productionForm.breakDownTime}
                    onChange={handleProductionFormChange}
                    placeholder="e.g., 30 minutes"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="breakDownTimeGap" className="text-sm font-medium">
                    Break Down Time Gap
                  </Label>
                  <Input
                    id="breakDownTimeGap"
                    name="breakDownTimeGap"
                    value={productionForm.breakDownTimeGap}
                    onChange={handleProductionFormChange}
                    placeholder="e.g., 10 minutes"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Production Items */}
            <div className="mb-10">
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">Production Items</h3>
                <p className="text-xs text-slate-500">Add up to 10 production items</p>
              </div>
              {productionForm.productionItems.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 p-6 bg-slate-50 dark:bg-slate-700 rounded-lg"
                >
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Size of TMT {index + 1}</Label>
                    <Input
                      value={item.sizeOfTmt}
                      onChange={(e) => handleProductionItemChange(index, "sizeOfTmt", e.target.value)}
                      placeholder="Size of TMT"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">Piece Qty {index + 1}</Label>
                    <Input
                      type="number"
                      value={item.pieceQty}
                      onChange={(e) => handleProductionItemChange(index, "pieceQty", e.target.value)}
                      placeholder="Piece Qty"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-slate-600 dark:text-slate-400">MT Qty {index + 1}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.mtQty}
                      onChange={(e) => handleProductionItemChange(index, "mtQty", e.target.value)}
                      placeholder="MT Qty"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeProductionItem(index)}
                      disabled={productionForm.productionItems.length === 1}
                      className="w-full md:w-12 h-12 p-0 border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="md:hidden ml-2">Remove</span>
                    </Button>
                  </div>
                </div>
              ))}
              {/* Add button at the bottom */}
              <div className="flex justify-center mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addProductionItem}
                  disabled={productionForm.productionItems.length >= 10}
                  className="w-full md:w-auto h-10 px-5 text-sm"
                >
                  <Plus className="h-5 w-5 mr-2" /> Add Item
                </Button>
              </div>
            </div>

            {/* Remark */}
            <div className="mb-10">
              <Label htmlFor="remark" className="text-sm font-medium">
                Remarks
              </Label>
              <Textarea
                id="remark"
                name="remark"
                value={productionForm.remark}
                onChange={handleProductionFormChange}
                placeholder="Enter any additional remarks..."
                className="mt-1 min-h-[120px]"
              />
            </div>

            {/* Form Actions */}
            <div className="flex flex-col md:flex-row justify-end gap-4 border-t pt-8">
              <Button type="button" variant="outline" onClick={closeProductionForm} className="md:px-8">
                Cancel
              </Button>
              <Button type="submit" className="bg-slate-700 hover:bg-slate-800 text-white md:px-8">
                Submit Record
              </Button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
)
}