"use client"

import { useState, useEffect, useCallback } from "react"
import { RefreshCw } from "lucide-react"
import { useAuth } from "../../contexts/AuthContext"

export default function HistoryRecords({ showToast }) {
  const { user } = useAuth() // Get the current user from auth context
  const [completedRecords, setCompletedRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Google Sheets configuration
  const SHEET_ID = "1TjJufd9uDojTHK9cYogTgaBQQEqfo1x8aJ9SJ9zbR6s"
  const SHEET_NAME = "Composition Response"

  // Column headers mapping to display names
  const HEADERS = [
    { key: 'compositionNo', label: 'Composition No.' },
    { key: 'timestamp', label: 'Timestamp' },
    { key: 'heatNo', label: 'Heat No.' },
    { key: 'productName', label: 'Product name' },
    { key: 'costing', label: 'Costing' },
    { key: 'manufacturingCost', label: 'Manufacturing Cost' },
    { key: 'interestDays', label: 'Interest (days)' },
    { key: 'interestCost', label: 'Interest Cost' },
    { key: 'transporting', label: 'Transporting (FOR)' },
    { key: 'sellingPrice', label: 'SELLING PRICE' },
    { key: 'variableCost', label: 'VARIABLE COST' },
    { key: 'gpPercentage', label: 'GP %AGE' },
    { key: 'yield', label: 'Yield' },
    { key: 'fem', label: 'Fem' },
    { key: 'rm1', label: 'RM1' },
    { key: 'rm2', label: 'RM2' },
    { key: 'rm3', label: 'RM3' },
    { key: 'rm4', label: 'RM4' },
    { key: 'rm5', label: 'RM5' },
    { key: 'rm6', label: 'RM6' },
    { key: 'rm7', label: 'RM7' },
    { key: 'rm8', label: 'RM8' },
    { key: 'rm9', label: 'RM9' },
    { key: 'rm10', label: 'RM10' },
    { key: 'rm11', label: 'RM11' },
    { key: 'rm12', label: 'RM12' },
    { key: 'rm13', label: 'RM13' },
    { key: 'rm14', label: 'RM14' },
    { key: 'rm15', label: 'RM15' },
    { key: 'qty1', label: 'QTY1' },
    { key: 'qty2', label: 'QTY2' },
    { key: 'qty3', label: 'QTY3' },
    { key: 'qty4', label: 'QTY4' },
    { key: 'qty5', label: 'QTY5' },
    { key: 'qty6', label: 'QTY6' },
    { key: 'qty7', label: 'QTY7' },
    { key: 'qty8', label: 'QTY8' },
    { key: 'qty9', label: 'QTY9' },
    { key: 'qty10', label: 'QTY10' },
    { key: 'qty11', label: 'QTY11' },
    { key: 'qty12', label: 'QTY12' },
    { key: 'qty13', label: 'QTY13' },
    { key: 'qty14', label: 'QTY14' },
    { key: 'qty15', label: 'QTY15' }
  ]

  // Helper function to format date/timestamp
  const formatTimestamp = (dateValue) => {
    if (!dateValue) return ""

    try {
      // Check if it's a Date object-like string (e.g. "Date(2025,3,22,14,30,0)")
      if (typeof dateValue === "string" && dateValue.startsWith("Date(")) {
        // Extract the parts from Date(YYYY,MM,DD,HH,mm,ss) format
        const dateString = dateValue.substring(5, dateValue.length - 1)
        const parts = dateString.split(",").map((part) => Number.parseInt(part.trim()))
        
        // Create date object (JavaScript months are 0-indexed)
        const date = new Date(parts[0], parts[1], parts[2], parts[3] || 0, parts[4] || 0, parts[5] || 0)
        return date.toLocaleString()
      }

      // Handle other date formats
      const date = new Date(dateValue)
      if (!isNaN(date.getTime())) {
        return date.toLocaleString()
      }

      // If it's already in the correct format, return as is
      return dateValue
    } catch (error) {
      console.error("Error formatting timestamp:", error)
      return dateValue // Return the original value if formatting fails
    }
  }

  // Fetch data from Google Sheets
  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`
      const response = await fetch(url)
      const text = await response.text()
      const jsonStart = text.indexOf("{")
      const jsonEnd = text.lastIndexOf("}") + 1
      const jsonData = text.substring(jsonStart, jsonEnd)
      const data = JSON.parse(jsonData)
      
      if (data && data.table && data.table.rows) {
        const recordsData = []
        
        // Debug: Log user information
        console.log("Current User:", user);
        console.log("User Type:", user?.userType);
        console.log("Is Admin:", user?.isAdmin);
        console.log("Is Full Admin:", user?.isFullAdmin);
        console.log("Is Limited Admin:", user?.isLimitedAdmin);
        console.log("Username:", user?.username);
        
        data.table.rows.forEach((row, index) => {
          if (row.c && row.c[0]?.v) { // Check if first column has data
            const productName = row.c[3]?.v || '' // Column D - Product name
            
            const record = {
              id: index.toString(),
              compositionNo: row.c[0]?.v || '',
              timestamp: row.c[1] ? formatTimestamp(row.c[1].v) : '',
              heatNo: row.c[2]?.v || '',
              productName: productName,
              costing: row.c[4]?.v || '',
              manufacturingCost: row.c[5]?.v || '',
              interestDays: row.c[6]?.v || '',
              interestCost: row.c[7]?.v || '',
              transporting: row.c[8]?.v || '',
              sellingPrice: row.c[9]?.v || '',
              variableCost: row.c[10]?.v || '',
              gpPercentage: row.c[11]?.v || '',
              yield: row.c[12]?.v || '',
              fem: row.c[13]?.v || '',
              rm1: row.c[14]?.v || '',
              rm2: row.c[15]?.v || '',
              rm3: row.c[16]?.v || '',
              rm4: row.c[17]?.v || '',
              rm5: row.c[18]?.v || '',
              rm6: row.c[19]?.v || '',
              rm7: row.c[20]?.v || '',
              rm8: row.c[21]?.v || '',
              rm9: row.c[22]?.v || '',
              rm10: row.c[23]?.v || '',
              rm11: row.c[24]?.v || '',
              rm12: row.c[25]?.v || '',
              rm13: row.c[26]?.v || '',
              rm14: row.c[27]?.v || '',
              rm15: row.c[28]?.v || '',
              qty1: row.c[29]?.v || '',
              qty2: row.c[30]?.v || '',
              qty3: row.c[31]?.v || '',
              qty4: row.c[32]?.v || '',
              qty5: row.c[33]?.v || '',
              qty6: row.c[34]?.v || '',
              qty7: row.c[35]?.v || '',
              qty8: row.c[36]?.v || '',
              qty9: row.c[37]?.v || '',
              qty10: row.c[38]?.v || '',
              qty11: row.c[39]?.v || '',
              qty12: row.c[40]?.v || '',
              qty13: row.c[41]?.v || '',
              qty14: row.c[42]?.v || '',
              qty15: row.c[43]?.v || ''
            }
            
            // Debug: Log each potential record
            console.log(`Row ${index + 1}:`, {
              heatNo: row.c[2]?.v,
              productName: productName,
              productNameLower: productName.toLowerCase(),
              userUsername: user?.username,
              userUsernameLower: user?.username?.toLowerCase(),
              userIsAdmin: user?.isAdmin,
              userIsFullAdmin: user?.isFullAdmin,
              userIsLimitedAdmin: user?.isLimitedAdmin
            });
            
            // Add record based on user type and filter criteria
            if (user) {
              // If user is any type of admin (full or limited), show all history records
              if (user.isAdmin) {
                recordsData.push(record)
                console.log(`Admin (${user.isFullAdmin ? 'Full' : 'Limited'}) - Adding record: ${record.heatNo}`)
              } 
              // If user is regular user, show only records where product name matches username
              else {
                // Perform case-insensitive comparison
                if (productName && user.username && 
                    productName.toLowerCase() === user.username.toLowerCase()) {
                  recordsData.push(record)
                  console.log(`User - Adding record: ${record.heatNo} (Product: ${productName} matches username: ${user.username})`)
                } else {
                  console.log(`User - Skipping record: ${record.heatNo} (Product: ${productName} doesn't match username: ${user.username})`)
                }
              }
            } else {
              // If no user (fallback), show all records
              recordsData.push(record)
              console.log(`No user - Adding record: ${record.heatNo}`)
            }
          }
        })
        
        console.log("Final history records:", recordsData)
        setCompletedRecords(recordsData)
      }
    } catch (error) {
      console.error("Error fetching data:", error)
      if (showToast) {
        showToast("Error Fetching Data", error.message || "Failed to fetch history records.", "error")
      }
      setCompletedRecords([])
    } finally {
      setIsLoading(false)
    }
  }, [SHEET_ID, SHEET_NAME, showToast, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Handle refresh button
  const handleRefresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return (
    <div className="rounded-lg border border-slate-200 shadow-sm">
      <div className="bg-slate-100 rounded-t-lg px-6 py-4 flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">
            {user?.isAdmin ? "All Composition History" : `My Composition History (${user?.username || ''})`}
          </h3>
          <p className="text-sm text-slate-500">
            {user?.isFullAdmin ? 
              "Full admin access - all history records" : 
              user?.isLimitedAdmin ?
              "Admin view - all history records" :
              !user?.isAdmin ?
              "Records where product name matches your username" :
              "Records from Composition Response sheet"}
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
                  {HEADERS.map((header) => (
                    <th key={header.key} className="text-left py-3 px-2 text-slate-600 whitespace-nowrap">
                      {header.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completedRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-slate-200 hover:bg-slate-50"
                  >
                    {HEADERS.map((header) => (
                      <td key={header.key} className="py-3 px-2 whitespace-nowrap">
                        {record[header.key]}
                      </td>
                    ))}
                  </tr>
                ))}
                {completedRecords.length === 0 && (
                  <tr>
                    <td colSpan={HEADERS.length} className="py-4 text-center text-slate-500">
                      {user?.isAdmin ? 
                        "No history records found" : 
                        `No history records found for product: ${user?.username || ''}`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}