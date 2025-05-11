"use client"

import { useState, useEffect, useCallback } from "react"
import { Upload, RefreshCw } from "lucide-react"
import { FullKittingModal } from "./full-kitting-modal"
import { useAuth } from "../../contexts/AuthContext"

export default function PendingRecords({ showToast }) {
  const { user } = useAuth() // Get the current user from auth context
  const [syncingId, setSyncingId] = useState(null)
  const [pendingRecords, setPendingRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  // State for the Full Kitting modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState(null)

  // Google Sheets configuration
  const SHEET_ID = "1TjJufd9uDojTHK9cYogTgaBQQEqfo1x8aJ9SJ9zbR6s"
  const SHEET_NAME = "PRODUCTION"
  const APP_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyJ5saA255yPCq_yb2p8LfVJH7CX2h6hOJ4hDHQAw8TjrTqe4KpffjWlG0Sx5rA3krIDQ/exec"

  // Helper function to format date
  const formatDate = (dateValue) => {
    if (!dateValue) return ""

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,3,22)")
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
  const fetchData = useCallback(async () => {
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
        const pendingRecordsData = []
        
        // Debug: Log user information
        console.log("Current User:", user);
        console.log("User Type:", user?.userType);
        console.log("Is Admin:", user?.isAdmin);
        console.log("Is Full Admin:", user?.isFullAdmin);
        console.log("Is Limited Admin:", user?.isLimitedAdmin);
        console.log("Username:", user?.username);
        
        data.table.rows.forEach((row, index) => {
          if (row.c) {
            const hasData = row.c[1]?.v // Column B - Heat No
            const columnAGNotNull = row.c[32]?.v !== null && row.c[32]?.v !== ""
            const columnAHIsNull = !row.c[33] || row.c[33].v === null || row.c[33].v === ""
            
            // Check if this row has data and meets the pending criteria
            if (hasData && columnAGNotNull && columnAHIsNull) {
              const brandName = row.c[3]?.v || '' // Column D - Brand Name
              
              // Create the record first
              const record = {
                id: index.toString(),
                heatNo: row.c[1]?.v || '',
                personName: row.c[2]?.v || '',  
                brandName: brandName,
                supervisorName: row.c[4]?.v || '',
                dateOfProduction: row.c[5] ? formatDate(row.c[5].v) : '',
                remarks: row.c[6]?.v || '',
                status: "Pending",
                syncedToSheet: false,
                rowIndex: index + 1 // Adjusted to match actual row number
              }
              
              // Debug: Log each potential record
              console.log(`Row ${index + 1}:`, {
                heatNo: row.c[1]?.v,
                brandName: brandName,
                brandNameLower: brandName.toLowerCase(),
                userUsername: user?.username,
                userUsernameLower: user?.username?.toLowerCase(),
                userIsAdmin: user?.isAdmin,
                userIsFullAdmin: user?.isFullAdmin,
                userIsLimitedAdmin: user?.isLimitedAdmin
              });
              
              // Add record based on user type and filter criteria
              if (user) {
                // If user is any type of admin (full or limited), show all pending records
                if (user.isAdmin) {
                  pendingRecordsData.push(record)
                  console.log(`Admin (${user.isFullAdmin ? 'Full' : 'Limited'}) - Adding record: ${record.heatNo}`)
                } 
                // If user is regular user, show only records where brand name matches username
                else {
                  // Perform case-insensitive comparison
                  if (brandName && user.username && 
                      brandName.toLowerCase() === user.username.toLowerCase()) {
                    pendingRecordsData.push(record)
                    console.log(`User - Adding record: ${record.heatNo} (Brand: ${brandName} matches username: ${user.username})`)
                  } else {
                    console.log(`User - Skipping record: ${record.heatNo} (Brand: ${brandName} doesn't match username: ${user.username})`)
                  }
                }
              } else {
                // If no user (fallback), show all pending records
                pendingRecordsData.push(record)
                console.log(`No user - Adding record: ${record.heatNo}`)
              }
            }
          }
        })
        
        console.log("Final pending records:", pendingRecordsData);
        setPendingRecords(pendingRecordsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      showToast("Error Fetching Data", error.message || "Failed to fetch pending records.", "error")
      setPendingRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [SHEET_ID, SHEET_NAME, showToast, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle opening the Full Kitting modal
  const handleOpenKittingModal = useCallback((record) => {
    // Pass record with brandName as productName for the modal
    const recordForModal = {
      ...record,
      productName: record.brandName
    }
    setSelectedRecord(recordForModal)
    setIsModalOpen(true)
  }, [])

  // Handle closing the Full Kitting modal
  const handleCloseKittingModal = useCallback(() => {
    setIsModalOpen(false)
    setSelectedRecord(null)
  }, [])

  // Handle syncing to sheet - mark record as processed
  const handleSyncToSheet = useCallback(
    async (recordId) => {
      setSyncingId(recordId)
      const recordToSync = pendingRecords.find(record => record.id === recordId)
      
      if (!recordToSync) {
        showToast("Error", "Record not found", "error")
        setSyncingId(null)
        return
      }
      
      try {
        // Create form data for POST request to Apps Script
        const formData = new FormData()
        formData.append('action', 'update')
        formData.append('sheetName', SHEET_NAME)
        formData.append('rowIndex', recordToSync.rowIndex)
        formData.append('rowData', JSON.stringify([
          // Add your fields here to mark as processed
          recordToSync.dateOfProduction,
          recordToSync.heatNo,
          recordToSync.personName,
          recordToSync.brandName,
          recordToSync.supervisorName,
          '', // Column F
          recordToSync.remarks,
          '', // Update appropriate columns to mark as processed
          'Processed' // Mark as processed in appropriate column
        ]))
        
        const response = await fetch(APP_SCRIPT_URL, {
          method: 'POST',
          body: formData
        })
        
        if (!response.ok) {
          throw new Error(`Failed to sync: ${response.status}`)
        }
        
        const result = await response.json()
        
        if (result.success) {
          // Update local state to reflect the sync
          setPendingRecords(prev => 
            prev.filter(record => record.id !== recordId)
          )
          
          showToast("Synced to Google Sheet", "Successfully marked record as processed.")
        } else {
          throw new Error(result.message || "Unknown error occurred")
        }
      } catch (error) {
        console.error("Error syncing:", error)
        showToast("Error Syncing to Google Sheet", error.message || "Failed to sync record to Google Sheet.", "error")
      } finally {
        setSyncingId(null)
      }
    },
    [APP_SCRIPT_URL, SHEET_NAME, pendingRecords, showToast]
  )

  // Handle refresh button
  const handleRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return (
    <>
      <div className="rounded-lg border border-slate-200 shadow-sm">
        <div className="bg-slate-100 rounded-t-lg px-6 py-4 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              {user?.isAdmin ? "All Pending TMT Records" : `My Pending TMT Records (${user?.username || ''})`}
            </h3>
            <p className="text-sm text-slate-500">
              {user?.isFullAdmin ? 
                "Full admin access - all records and actions available" : 
                user?.isLimitedAdmin ?
                "Admin view - all records visible (actions restricted)" :
                !user?.isAdmin ?
                "Records where brand name matches your username" :
                ""}
            </p>
          </div>
          <button 
            onClick={handleRefresh}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 text-slate-700 hover:bg-slate-100 h-9 rounded-md px-3"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="h-40 w-full bg-slate-200 animate-pulse rounded-md"></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-2 text-slate-600">Heat No.</th>
                    <th className="text-left py-3 px-2 text-slate-600">Person Name</th>
                    <th className="text-left py-3 px-2 text-slate-600">Brand Name</th>
                    <th className="text-left py-3 px-2 text-slate-600">Supervisor Name</th>
                    <th className="text-left py-3 px-2 text-slate-600">Date Of Production</th>
                    <th className="text-left py-3 px-2 text-slate-600">Remarks</th>
                    <th className="text-left py-3 px-2 text-slate-600">Status</th>
                    {/* Only show Actions column for full admin */}
                    {user?.isFullAdmin && (
                      <th className="text-left py-3 px-2 text-slate-600">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pendingRecords.map((record) => (
                    <tr key={record.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="py-3 px-2">{record.heatNo}</td>
                      <td className="py-3 px-2">{record.personName}</td>
                      <td className="py-3 px-2">{record.brandName}</td>
                      <td className="py-3 px-2">{record.supervisorName}</td>
                      <td className="py-3 px-2">{record.dateOfProduction}</td>
                      <td className="py-3 px-2">{record.remarks}</td>
                      <td className="py-3 px-2">
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus-offset-2 border-transparent bg-amber-500 text-white">
                          {record.status}
                        </span>
                      </td>
                      {/* Only show Actions column for full admin */}
                      {user?.isFullAdmin && (
                        <td className="py-3 px-2">
                          <div className="flex space-x-2">
                            <button
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-slate-200 text-slate-700 hover:bg-slate-100 h-9 rounded-md px-3 text-xs"
                              onClick={() => handleOpenKittingModal(record)}
                              disabled={syncingId === record.id}
                            >
                              {syncingId === record.id ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4 mr-1" />
                              )}
                              {syncingId === record.id ? "Processing..." : "Full Kitting"}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {pendingRecords.length === 0 && (
                    <tr>
                      <td colSpan={user?.isFullAdmin ? 8 : 7} className="py-4 text-center text-slate-500">
                        {user?.isAdmin ? 
                          "No pending records found" : 
                          `No pending records found for brand: ${user?.username || ''}`}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <FullKittingModal 
          isOpen={isModalOpen} 
          onClose={handleCloseKittingModal} 
          recordData={selectedRecord}
          onProcessed={(recordId) => handleSyncToSheet(recordId)}
        />
      )}
    </>
  )
}